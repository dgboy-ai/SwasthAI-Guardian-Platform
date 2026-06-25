/**
 * liveTelemetry.js
 * Browser WebSocket client for real-time ambulance tracking.
 * Connects to the backend websocket gateway on `/api/telemetry`
 * and registers callbacks for location updates.
 */

let ws = null;
const listeners = new Set();
let reconnectTimer = null;

function getWsUrl() {
  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  // Fallback for local development if Vite runs on 5173 but backend on 3001
  const host = loc.port === '5173' || loc.port === '5174' ? `${loc.hostname}:5000` : loc.host;
  return `${protocol}//${host}/api/telemetry`;
}

export function connectTelemetry() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return ws;
  }

  const url = getWsUrl();
  console.log(`[WS] Connecting to telemetry socket: ${url}`);
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WS] Connected to live telemetry gateway.');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (cbErr) {
          console.error('[WS Callback error]', cbErr);
        }
      });
    } catch (err) {
      console.warn('[WS Message parse error]', err.message);
    }
  };

  ws.onclose = () => {
    console.debug('[WS] Telemetry socket closed. Reconnecting in 5s...');
    ws = null;
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(connectTelemetry, 5000);
    }
  };

  ws.onerror = (err) => {
    console.error('[WS] Telemetry socket error:', err);
    ws.close();
  };

  return ws;
}

/**
 * Subscribe to real-time telemetry updates.
 * @param {Function} callback (data) => void
 * @returns {Function} unsubscribe function
 */
export function subscribeTelemetry(callback) {
  listeners.add(callback);
  
  // Ensure connection is active
  connectTelemetry();

  return () => {
    listeners.delete(callback);
  };
}

export default {
  connectTelemetry,
  subscribeTelemetry
};
