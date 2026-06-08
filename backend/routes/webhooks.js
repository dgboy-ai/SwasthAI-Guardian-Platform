/**
 * POST /api/webhooks/twilio
 *
 * Receives SMS delivery-status callbacks from Twilio.
 * Validates the X-Twilio-Signature HMAC to prove the request genuinely
 * came from Twilio (not a spoofed POST). Persists every receipt to the
 * twilio_receipts table so we have a full OTP delivery audit trail.
 *
 * Twilio docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Required env vars:
 *   TWILIO_AUTH_TOKEN   — used to verify HMAC signature
 *   TWILIO_WEBHOOK_URL  — the full public URL of this endpoint
 *                         (e.g. https://api.swasthai.in/api/webhooks/twilio)
 *                         Must match the URL Twilio signs the request with.
 */

import express from 'express';
import crypto  from 'crypto';

const router = express.Router();

// ── Structured error helper ────────────────────────────────────────────────────
const sendError = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

// ── Twilio HMAC-SHA1 signature validator ──────────────────────────────────────
// https://www.twilio.com/docs/usage/webhooks/webhooks-security#validating-signatures-from-twilio
function validateTwilioSignature(authToken, webhookUrl, params, twilioSig) {
  if (!authToken || !twilioSig) return false;

  // Sort POST params alphabetically and concatenate key+value pairs to URL
  const sortedKeys  = Object.keys(params).sort();
  const paramString = sortedKeys.reduce((acc, key) => acc + key + params[key], '');
  const fullUrl     = webhookUrl + paramString;

  const hmac     = crypto.createHmac('sha1', authToken);
  const expected = hmac.update(Buffer.from(fullUrl, 'utf-8')).digest('base64');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'base64'),
      Buffer.from(twilioSig, 'base64')
    );
  } catch (_) {
    return false;
  }
}

/**
 * POST /api/webhooks/twilio
 *
 * Twilio sends application/x-www-form-urlencoded bodies.
 * We parse them with express.urlencoded() mounted only on this route.
 *
 * Expected Twilio fields (subset):
 *   MessageSid, To, MessageStatus, ErrorCode, ErrorMessage
 */
router.post(
  '/twilio',
  express.urlencoded({ extended: false, limit: '8kb' }),
  async (req, res) => {
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
    const twilioSig  = req.headers['x-twilio-signature'];
    const db         = req.app.locals.db;

    // ── 1. Signature validation (skip in dev/test if token not set) ───────────
    if (authToken) {
      if (!webhookUrl) {
        console.warn('[TWILIO] TWILIO_WEBHOOK_URL is not set — skipping signature validation (set it in production!)');
      } else {
        const valid = validateTwilioSignature(authToken, webhookUrl, req.body || {}, twilioSig);
        if (!valid) {
          console.warn('[TWILIO] ⚠️  Invalid signature — possible spoofed request', {
            ip: req.socket.remoteAddress,
            sig: twilioSig?.slice(0, 10) + '...',
          });
          return sendError(res, 403, 'INVALID_TWILIO_SIGNATURE', 'Request signature does not match');
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Hard-fail in production if auth token missing
      console.error('[TWILIO] FATAL: TWILIO_AUTH_TOKEN not set in production — rejecting all webhook calls');
      return sendError(res, 503, 'WEBHOOK_MISCONFIGURED', 'Webhook not properly configured');
    }

    // ── 2. Extract fields from Twilio payload ─────────────────────────────────
    const {
      MessageSid:     messageSid,
      To:             toPhone,
      MessageStatus:  status,
      ErrorCode:      errorCode,
      ErrorMessage:   errorMessage,
    } = req.body;

    if (!messageSid) {
      return sendError(res, 400, 'MISSING_MESSAGE_SID', 'MessageSid is required');
    }

    const receiptStatus = status || 'unknown';
    console.log(`[TWILIO] Receipt — SID: ${messageSid} | To: ${toPhone} | Status: ${receiptStatus}${errorCode ? ` | Error: ${errorCode}` : ''}`);

    // ── 3. Persist to twilio_receipts ─────────────────────────────────────────
    try {
      await db.run(
        `INSERT INTO twilio_receipts (message_sid, to_phone, status, error_code, error_message)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(message_sid) DO UPDATE SET
           status        = EXCLUDED.status,
           error_code    = EXCLUDED.error_code,
           error_message = EXCLUDED.error_message`,
        [messageSid, toPhone || null, receiptStatus, errorCode || null, errorMessage || null]
      );
    } catch (err) {
      // Non-fatal — log but still return 200 to Twilio so it doesn't retry
      console.error('[TWILIO] DB persist error:', err.message);
    }

    // ── 4. Optionally broadcast failed deliveries to admin SSE ────────────────
    if (['failed', 'undelivered'].includes(receiptStatus)) {
      try {
        if (typeof req.app.locals.broadcastToAdmins === 'function') {
          req.app.locals.broadcastToAdmins('sms_failure', {
            messageSid,
            toPhone,
            status:       receiptStatus,
            errorCode:    errorCode || null,
            errorMessage: errorMessage || null,
            timestamp:    new Date().toISOString(),
            traceId:      req.traceId
          });
        }
      } catch (_) { /* SSE broadcast is best-effort */ }
    }

    // Twilio expects a 204 (no content) or 200 TwiML response. Return 204.
    res.sendStatus(204);
  }
);

/**
 * GET /api/webhooks/twilio/receipts
 * Internal endpoint for admins to view SMS delivery history.
 * Gated by X-Agent-Secret (internal agents) or JWT admin token.
 */
router.get('/twilio/receipts', async (req, res) => {
  const db         = req.app.locals.db;
  const agentSec   = req.headers['x-agent-secret'];
  const isAgent    = agentSec && agentSec === process.env.AGENT_SECRET;

  // Allow JWT-authed admins too
  let isAdmin = false;
  if (!isAgent) {
    try {
      const { default: jwt } = await import('jsonwebtoken');
      const token   = (req.headers.authorization || '').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      isAdmin = decoded.role === 'admin';
    } catch (_) {}
  }

  if (!isAgent && !isAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Admin token or agent secret required');
  }

  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const lastId = parseInt(req.query.lastId) || null;
    let rows;
    if (lastId) {
      rows = await db.all('SELECT * FROM twilio_receipts WHERE id < ? ORDER BY id DESC LIMIT ?', [lastId, limit]);
    } else {
      rows = await db.all('SELECT * FROM twilio_receipts ORDER BY id DESC LIMIT ?', [limit]);
    }
    res.json({
      receipts:   rows,
      count:      rows.length,
      nextLastId: rows.length === limit ? rows[rows.length - 1]?.id : null,
    });
  } catch (err) {
    sendError(res, 500, 'RECEIPTS_FETCH_FAILED', err.message);
  }
});

export default router;
