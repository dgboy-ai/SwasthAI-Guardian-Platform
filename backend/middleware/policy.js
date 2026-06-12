// Centralized Authorization and IDOR Policy Module

/**
 * Validates that the logged-in user has one of the allowed roles.
 */
export const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
    });
  }
  next();
};

/**
 * Enforces that a non-admin user can only query/manipulate resources for their own villageId.
 * Checks request parameters, query string, and body for 'villageId' or 'village'.
 */
export const enforceVillageScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  // Admins have global access
  if (req.user.role === 'admin') {
    return next();
  }

  const userVillageId = req.user.villageId;
  if (!userVillageId) {
    return res.status(403).json({
      success: false,
      error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
    });
  }

  // Check body, query, parameters for villageId or village
  const requestedVillageId = req.body?.villageId || req.query?.villageId || req.params?.villageId ||
                             req.body?.village || req.query?.village || req.params?.village;

  if (requestedVillageId && requestedVillageId !== userVillageId) {
    return res.status(403).json({
      success: false,
      error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
    });
  }

  // Enforce the user's village ID onto the request object or query where necessary
  next();
};

/**
 * Verifies ownership or location scope for specific resources (e.g. referrals) in the DB
 * to prevent IDOR attacks on updates/deletions.
 */
export const enforceReferralAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const db = req.app.locals.db;
  const referralId = req.params.id;
  const userVillageId = req.user.villageId;

  if (!referralId) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Referral ID is required.' } });
  }

  try {
    const referral = await db.get('SELECT "villageId" FROM referrals WHERE id = ?', [referralId]);
    if (!referral) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Referral not found.' } });
    }

    if (referral.villageId !== userVillageId) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
      });
    }

    next();
  } catch (err) {
    console.error('[POLICY ENFORCEMENT ERROR]', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify resource ownership.' } });
  }
};

/**
 * Verifies ownership or location scope for ambulance requests in the DB
 * to prevent IDOR attacks.
 */
export const enforceAmbulanceAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const db = req.app.locals.db;
  const requestId = req.params.id;
  const userVillageId = req.user.villageId;

  if (!requestId) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Request ID is required.' } });
  }

  try {
    const request = await db.get('SELECT user_id, location FROM ambulance_requests WHERE id = ?', [requestId]);
    if (!request) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found.' } });
    }

    // Villagers can only access their own requests
    if (req.user.role === 'villager' && request.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
      });
    }

    // NGOs can only access requests belonging to their village
    if (req.user.role === 'ngo' && request.location !== userVillageId) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access Denied.' }
      });
    }

    next();
  } catch (err) {
    console.error('[POLICY ENFORCEMENT ERROR]', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify request ownership.' } });
  }
};
