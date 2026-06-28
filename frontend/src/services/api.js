import axios from 'axios';

// Default /api — Vite dev proxy and unified Render deploy both forward to the backend.
// Override with VITE_API_URL only for split deploy (e.g. Vercel frontend + Render API).
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://swasthai-guardian-platform-0jsb.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: BASE_URL,
  // Rural India 2G optimization: 15s timeout prevents indefinite hangs on poor networks.
  // All components have offline fallbacks that trigger immediately on timeout/network errors.
  // 15s handles Render cold-starts while still failing fast on truly dead connections.
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {

  if (!config.headers['x-trace-id']) {
    config.headers['x-trace-id'] = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  const token = localStorage.getItem('token');
  if (token && token !== 'offline-mock-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Simulated network state for evaluation and demo tours
  const simState = localStorage.getItem('simulated_network_state');
  if (simState === 'offline') {
    const err = new Error('Simulated Offline Mode');
    err.isSimulatedOffline = true;
    throw err;
  }
  if (simState === 'slow') {
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  return config;
});

// Track data provenance per endpoint pattern
export const provenanceCache = {};
function emitProvenance() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('provenance-update', { detail: { ...provenanceCache } }));
  }
}
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && response.data._db) {
      const path = response.config.url || '';
      if (path.includes('/outbreaks') || path.includes('/dynamo') || path.includes('/dynamodb')) {
        provenanceCache['outbreak_telemetry'] = response.data._db;
      } else if (path.includes('/vaccination')) {
        provenanceCache['vaccination'] = response.data._db;
      } else if (path.includes('/api-keys') || path.includes('/health') || path.includes('/agent-scans')) {
        // Skip
      } else {
        provenanceCache['default'] = response.data._db;
      }
      emitProvenance();
    }
    return response;
  },
  (error) => {
    if (error.isSimulatedOffline || error.message?.includes('Simulated Offline')) {
      error.message = 'No internet connection. Offline mode active.';
      delete error.response;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout — likely 2G/poor connectivity
      error.message = 'Network too slow. Using offline mode.';
    } else if (!error.response) {
      error.message = navigator.onLine
        ? 'Could not reach server. Check that the backend is running.'
        : 'No internet connection. Offline mode active.';
    }
    // Ensure error.response.data.error is always a string (prevents React #31 crashes)
    if (error.response?.data?.error && typeof error.response.data.error !== 'string') {
      error.response.data.error = error.response.data.error.message || 'Request failed.';
    }
    return Promise.reject(error);
  }
);

export default api;
