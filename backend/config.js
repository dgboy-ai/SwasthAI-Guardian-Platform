/**
 * Centralized secrets and environment helpers.
 * Production requires explicit secrets; development may use documented dev-only fallbacks.
 */

import os from 'os';

const isProduction = process.env.NODE_ENV === 'production';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'dev-only-swasthai-jwt-not-for-production';
}

export function getAgentSecret() {
  const secret = process.env.AGENT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error('AGENT_SECRET is required in production');
  }
  return 'dev-only-agent-secret';
}

export function getAadhaarSalt() {
  const salt = process.env.AADHAAR_SALT;
  if (salt) return salt;
  if (isProduction) {
    throw new Error('AADHAAR_SALT is required in production');
  }
  return 'dev-only-aadhaar-salt-not-for-production';
}

export function isDemoOtpAllowed(otp) {
  if (otp !== '1234') return false;
  return !isProduction || process.env.ALLOW_DEMO_OTP === 'true';
}

export function getClusterWorkerCount() {
  const configured = parseInt(process.env.NODE_CLUSTER_WORKERS || '', 10);
  if (!Number.isNaN(configured) && configured > 0) return configured;
  if (isProduction) return 1;
  return Math.max(1, os.cpus().length - 1);
}
