import axios from 'axios';

// Default /api — Vite dev proxy and unified Render deploy both forward to the backend.
// Override with VITE_API_URL only for split deploy (e.g. Vercel frontend + Render API).
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://swasthai-guardian-platform-0jsb.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: BASE_URL,
  // 🌐 Rural India 2G optimization: 5s timeout prevents indefinite hangs on poor networks.
  // All components have offline fallbacks that trigger immediately on timeout/network errors.
  // Reduced from 8s → 5s: Render.com cold-starts are handled by the offline LocalSymptomNet fallback.
  timeout: 5000,
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

// Global response interceptor: surface network errors consistently
api.interceptors.response.use(
  (response) => response,
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
    return Promise.reject(error);
  }
);

export default api;
