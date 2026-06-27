/**
 * liveTelemetry.js
 * Browser WebSocket client for real-time ambulance tracking.
 * Connects to the backend websocket gateway on `/api/telemetry`
 * and registers callbacks for location updates.
 */

let ws = null;
const listeners = new Set();
const statusListeners = new Set();
let reconnectTimer = null;
let retryCount = 0;

function getWsUrl() {
  const loc = window.location;
  // On Vercel, connect WebSocket directly to Render (Vercel free plan doesn't proxy WS)
  if (loc.hostname.endsWith('.vercel.app')) {
    return 'wss://swasthai-guardian-platform-0jsb.onrender.com/api/telemetry';
  }
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = loc.port === '5173' || loc.port === '5174' ? `${loc.hostname}:5000` : loc.host;
  return `${protocol}//${host}/api/telemetry`;
}

function broadcastStatus(online) {
  statusListeners.forEach(cb => {
    try { cb(online); } catch (e) { console.error('[WS status callback error]', e); }
  });
}

export function connectTelemetry() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return ws;
  }

  const url = getWsUrl();
  ws = new WebSocket(url);

  ws.onopen = () => {
    retryCount = 0;
    broadcastStatus(true);
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
    broadcastStatus(false);
    ws = null;
    if (!reconnectTimer) {
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      retryCount++;
      if (retryCount > 10) {
        console.warn('[WS] Max reconnect attempts reached. Giving up.');
        broadcastStatus(false);
        return;
      }
      reconnectTimer = setTimeout(connectTelemetry, delay);
    }
  };

  ws.onerror = () => {
    ws.close();
  };

  return ws;
}

export function subscribeTelemetry(callback, onStatusChange) {
  listeners.add(callback);
  if (onStatusChange) {
    statusListeners.add(onStatusChange);
  }
  connectTelemetry();
  return () => {
    listeners.delete(callback);
    if (onStatusChange) {
      statusListeners.delete(onStatusChange);
    }
  };
}

export default {
  connectTelemetry,
  subscribeTelemetry
};
