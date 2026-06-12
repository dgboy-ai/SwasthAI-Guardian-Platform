import dynamoHelper from '../dynamodb.js';

export function logAudit(action, resource) {
  return async (req, res, next) => {
    const db = req.app.locals.db;
    const userId = req.user?.id || null;
    const username = req.user?.username || req.user?.email || req.user?.phone || 'anonymous';
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    
    // We capture resource_id from route parameters if present (e.g. :id)
    const resourceId = req.params?.id || req.body?.id || null;

    // Proceed with the request first to ensure we log what happens
    next();

    // Perform database logging asynchronously
    try {
      const timestamp = new Date().toISOString();

      // 1. Log to relational database (SQLite)
      await db.run(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, trace_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, resource, resourceId ? String(resourceId) : null, ip, userAgent, req.traceId || null]
      );

      // 2. Stream to DynamoDB (security_audit_logs table)
      const auditItem = {
        actor: String(username),
        timestamp: timestamp,
        userId: userId ? String(userId) : 'anonymous',
        action: action,
        resource: resource,
        resourceId: resourceId ? String(resourceId) : 'N/A',
        ipAddress: ip || 'unknown',
        userAgent: userAgent || 'unknown',
        traceId: req.traceId || 'none'
      };

      await dynamoHelper.put('security_audit_logs', auditItem);
      console.log(`[AUDIT-LEDGER] Logged security event to DynamoDB: ${action} on ${resource} by ${username}`);
    } catch (err) {
      console.error('[AUDIT] Failed to write audit log:', err.message);
    }
  };
}
