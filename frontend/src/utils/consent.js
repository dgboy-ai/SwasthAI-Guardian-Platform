const STORAGE_KEY = 'swasthai_disha_consent_v1';

export function useConsentGiven() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markConsentGiven() {
  localStorage.setItem(STORAGE_KEY, 'true');
}
