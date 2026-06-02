import axios from 'axios';

// Uses VITE_API_URL in production (set in Vercel dashboard), falls back to localhost for local dev
// Use relative path in production to work with unified deployment, fallback to localhost for dev
const BASE_URL = import.meta.env.MODE === 'production' 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: BASE_URL,
  // 🌐 Rural India 2G optimization: 8s timeout prevents indefinite hangs on poor networks.
  // All components have offline fallbacks that trigger immediately on timeout/network errors.
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'offline-mock-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Simulated network state for judges evaluation
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
      // No network
      error.message = 'No internet connection. Offline mode active.';
    }
    return Promise.reject(error);
  }
);

export default api;
