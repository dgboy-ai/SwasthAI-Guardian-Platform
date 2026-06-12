/**
 * offlineSyncQueue.js — Robust client-side IndexedDB Write Queue
 *
 * Provides a local-first queue for offline records (maternal vitals, child nutrition metrics,
 * ambulance SOS dispatches, and symptom checks). Uses IndexedDB for async, non-blocking
 * bulk storage (up to gigabytes) instead of localStorage.
 *
 * Listens for network reconnect events and automatically triggers a background queue replay
 * to synchronize all offline-written data with the AWS Aurora / DynamoDB backend, firing 
 * event dispatcher updates.
 */

const DB_NAME = 'swasthai_sync_queue';
const DB_VERSION = 1;
const STORES = {
  maternal:  'maternal_queue',
  child:     'child_queue',
  ambulance: 'ambulance_queue',
  symptoms:  'symptom_queue'
};

let dbPromise = null;

function makeRequestId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function withClientRequestId(prefix, record) {
  const clientRequestId = record.clientRequestId || makeRequestId(prefix);
  return {
    id: clientRequestId,
    clientRequestId,
    ...record,
    ts: record.ts || Date.now()
  };
}

function getQueueDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => {
      console.warn('[OfflineSyncQueue] IndexedDB blocked/unavailable:', err);
      resolve(null);
    };
  });
  return dbPromise;
}

// ── Generic IDB helper operations ───────────────────────────────────────────
async function getAllFromStore(storeName) {
  const db = await getQueueDB();
  if (!db) {
    // Fallback: try reading from localStorage
    try {
      return JSON.parse(localStorage.getItem(`swasthai_fallback_${storeName}`) || '[]');
    } catch (_) { return []; }
  }
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function addToStore(storeName, record) {
  const db = await getQueueDB();
  if (!db) {
    // Fallback: append to localStorage list
    try {
      const curr = JSON.parse(localStorage.getItem(`swasthai_fallback_${storeName}`) || '[]');
      curr.push(record);
      localStorage.setItem(`swasthai_fallback_${storeName}`, JSON.stringify(curr));
    } catch (_) {}
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
  });
}

async function deleteFromStore(storeName, id) {
  const db = await getQueueDB();
  if (!db) {
    try {
      const curr = JSON.parse(localStorage.getItem(`swasthai_fallback_${storeName}`) || '[]');
      const filtered = curr.filter(r => r.id !== id);
      localStorage.setItem(`swasthai_fallback_${storeName}`, JSON.stringify(filtered));
    } catch (_) {}
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
  });
}

// ── Public Queue Actions ──────────────────────────────────────────────────────

export async function queueMaternalRecord(record) {
  const item = withClientRequestId('mat', record);
  await addToStore(STORES.maternal, item);
  triggerQueueUpdateEvent();
  return item;
}

export async function queueChildRecord(record) {
  const item = withClientRequestId('chld', record);
  await addToStore(STORES.child, item);
  triggerQueueUpdateEvent();
  return item;
}

export async function queueAmbulanceRequest(request) {
  const item = withClientRequestId('amb', request);
  await addToStore(STORES.ambulance, item);
  triggerQueueUpdateEvent();
  return item;
}

export async function queueSymptomCheck(check) {
  const item = withClientRequestId('sym', check);
  await addToStore(STORES.symptoms, item);
  triggerQueueUpdateEvent();
  return item;
}

// ── Queue Fetchers ────────────────────────────────────────────────────────────

export async function getPendingMaternal() { return getAllFromStore(STORES.maternal); }
export async function getPendingChild() { return getAllFromStore(STORES.child); }
export async function getPendingAmbulance() { return getAllFromStore(STORES.ambulance); }
export async function getPendingSymptoms() { return getAllFromStore(STORES.symptoms); }

export async function getQueueStats() {
  const [mat, chld, amb, sym] = await Promise.all([
    getPendingMaternal(),
    getPendingChild(),
    getPendingAmbulance(),
    getPendingSymptoms()
  ]);
  return {
    maternalCount: mat.length,
    childCount: chld.length,
    ambulanceCount: amb.length,
    symptomCount: sym.length,
    totalPending: mat.length + chld.length + amb.length + sym.length
  };
}

// Custom event to notify React components when the write queue length changes
function triggerQueueUpdateEvent() {
  getQueueStats().then(stats => {
    const ev = new CustomEvent('swasthai_queue_updated', { detail: stats });
    window.dispatchEvent(ev);
  });
}

// ── Queue Synchronization & Replay Engine ─────────────────────────────────────

import api from '../services/api';
import { showToast } from './toast';

let isSyncing = false;

export async function syncAllQueues() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const statsBefore = await getQueueStats();
  if (statsBefore.totalPending === 0) return;

  showToast('Syncing to Aurora + DynamoDB...', 'info');

  isSyncing = true;
  console.log('🔄 [OfflineSyncQueue] Commencing background replay...');
  
  const startTime = Date.now();
  const syncBatchId = makeRequestId('sync');
  let syncCount = 0;
  const syncedClientRequestIds = [];

  try {
    // 1. Replay SOS Ambulance Requests
    const ambulances = await getPendingAmbulance();
    for (const r of ambulances) {
      try {
        await api.post('/ambulance', {
          name: r.name,
          location: r.location,
          priority: r.priority,
          symptoms: r.symptoms,
          clientRequestId: r.clientRequestId || r.id,
          syncBatchId
        });
        await deleteFromStore(STORES.ambulance, r.id);
        syncCount++;
        syncedClientRequestIds.push(r.clientRequestId || r.id);
      } catch (err) {
        console.error('[SyncQueue] Failed to replay ambulance SOS:', err.message);
        // Retain in queue for next replay attempt unless validation error
        if (err.response?.status === 400) await deleteFromStore(STORES.ambulance, r.id);
      }
    }

    // 2. Replay Symptoms Check Ins
    const symptoms = await getPendingSymptoms();
    for (const s of symptoms) {
      try {
        await api.post('/symptoms', {
          symptoms: s.symptoms,
          villageId: s.villageId,
          clientRequestId: s.clientRequestId || s.id,
          syncBatchId
        });
        await deleteFromStore(STORES.symptoms, s.id);
        syncCount++;
        syncedClientRequestIds.push(s.clientRequestId || s.id);
      } catch (err) {
        console.error('[SyncQueue] Failed to replay symptom check:', err.message);
        if (err.response?.status === 400) await deleteFromStore(STORES.symptoms, s.id);
      }
    }

    // 3. Replay Maternal Vitals
    const maternal = await getPendingMaternal();
    for (const m of maternal) {
      try {
        await api.post('/ngo/maternal', {
          name: m.name,
          age: m.age,
          trimester: m.trimester,
          dueDate: m.dueDate,
          vitals: m.vitals,
          clientRequestId: m.clientRequestId || m.id,
          clientUpdatedAt: m.ts || Date.now(),
          syncBatchId
        });
        await deleteFromStore(STORES.maternal, m.id);
        syncCount++;
        syncedClientRequestIds.push(m.clientRequestId || m.id);
      } catch (err) {
        console.error('[SyncQueue] Failed to replay maternal record:', err.message);
        if (err.response?.status === 400) await deleteFromStore(STORES.maternal, m.id);
      }
    }

    // 4. Replay Child Growth Metrics
    const children = await getPendingChild();
    for (const c of children) {
      try {
        await api.post('/ngo/malnutrition', {
          name: c.childName || c.name,
          age: c.ageMonths || c.age,
          weight: c.weight,
          height: c.height,
          clientRequestId: c.clientRequestId || c.id,
          clientUpdatedAt: c.ts || Date.now(),
          syncBatchId
        });
        await deleteFromStore(STORES.child, c.id);
        syncCount++;
        syncedClientRequestIds.push(c.clientRequestId || c.id);
      } catch (err) {
        console.error('[SyncQueue] Failed to replay child nutrition:', err.message);
        if (err.response?.status === 400) await deleteFromStore(STORES.child, c.id);
      }
    }

    // 5. Fire Back-End event dispatcher notification for successful recovery
    if (syncCount > 0) {
      const durationMs = Date.now() - startTime;
      const stats = await getQueueStats();
      const pendingCount = stats.totalPending;
      console.log(`✅ [OfflineSyncQueue] Synergetic restoration success! Replayed ${syncCount} records in ${durationMs}ms. Remaining pending: ${pendingCount}`);
      
      try {
        await api.post('/villager/sync-health', {
          recordCount: syncCount,
          durationMs,
          syncBatchId,
          clientRequestIds: syncedClientRequestIds,
          pendingCount
        });
      } catch (syncLogErr) {
        console.warn('Could not post sync metrics to event dispatcher:', syncLogErr.message);
      }
    }
  } catch (err) {
    console.error('[SyncQueue] Replay error:', err);
  } finally {
    isSyncing = false;
    triggerQueueUpdateEvent();
    if (syncCount > 0) {
      showToast('Saved to AWS ✓', 'success');
    }
  }
}

// ── Reconnect Listener ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('📡 [OfflineSyncQueue] Internet connection restored. Launching auto-sync...');
    syncAllQueues().catch(console.error);
  });

  // Attempt sync immediately on load in case we started online with leftovers
  window.addEventListener('load', () => {
    if (navigator.onLine) {
      syncAllQueues().catch(console.error);
    }
  });
}

export default {
  queueMaternalRecord,
  queueChildRecord,
  queueAmbulanceRequest,
  queueSymptomCheck,
  getPendingMaternal,
  getPendingChild,
  getPendingAmbulance,
  getPendingSymptoms,
  getQueueStats,
  syncAllQueues
};
