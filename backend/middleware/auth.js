import jwt from 'jsonwebtoken';

export const auth = async (req, res, next) => {
  const db = req.app.locals.db;
  if (!db) return res.status(503).send({ error: 'Database initializing. Please try again in a few seconds.' });
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send({ error: 'Auth Required' });

    // Check access token blacklist revocation mechanism
    const blacklisted = await db.get('SELECT token FROM revoked_tokens WHERE token = ?', [token]);
    if (blacklisted) return res.status(401).send({ error: 'Token Revoked (Logged out)' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) { 
    res.status(401).send({ error: 'Invalid Token' }); 
  }
};

export const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).send({ error: 'Access Denied: Insufficient Permissions' });
  }
  next();
};
