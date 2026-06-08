/**
 * Security Audit Logging Middleware.
 * Logs sensitive access and operational events to the database.
 */

export function logAudit(action, resource) {
  return async (req, res, next) => {
    const db = req.app.locals.db;
    const userId = req.user?.id || null;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    
    // We capture resource_id from route parameters if present (e.g. :id)
    const resourceId = req.params?.id || req.body?.id || null;

    // Proceed with the request first to ensure we log what happens
    next();

    // Perform database logging asynchronously
    try {
      await db.run(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, trace_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, resource, resourceId ? String(resourceId) : null, ip, userAgent, req.traceId || null]
      );
    } catch (err) {
      console.error('[AUDIT] Failed to write audit log:', err.message);
    }
  };
}
