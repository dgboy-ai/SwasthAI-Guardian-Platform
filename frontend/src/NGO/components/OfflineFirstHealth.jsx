import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, RefreshCw, HardDrive, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getQueueStats, syncAllQueues } from '../../utils/offlineSyncQueue';
import { showToast } from '../../utils/toast';

export default function OfflineFirstHealth({ isOffline, lastSync, onSync }) {
  const [queueStats, setQueueStats] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkDBStatus();
    loadQueueStats();
    const interval = setInterval(loadQueueStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkDBStatus = async () => {
    try {
      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open('swasthai_sync_queue', 1);
        req.onsuccess = () => setDbStatus('connected');
        req.onerror = () => setDbStatus('unavailable');
        setTimeout(() => setDbStatus('connected'), 500);
      } else {
        setDbStatus('unavailable');
      }
    } catch {
      setDbStatus('unavailable');
    }
  };

  const loadQueueStats = async () => {
    try {
      const stats = await getQueueStats();
      setQueueStats(stats);
    } catch {
      setQueueStats(null);
    }
  };

  const handleRetrySync = async () => {
    setSyncing(true);
    try {
      await syncAllQueues();
      await loadQueueStats();
      showToast('Sync completed successfully', 'success');
      if (onSync) onSync();
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#059669]" />
          Offline-First Healthcare
        </h3>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${
            isOffline ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {isOffline ? 'Offline' : 'Online'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
          <p className="text-lg font-black text-slate-900">{queueStats?.maternalCount || 0}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Maternal</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
          <p className="text-lg font-black text-slate-900">{queueStats?.childCount || 0}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Child</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
          <p className="text-lg font-black text-slate-900">{queueStats?.ambulanceCount || 0}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Ambulance</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
          <p className="text-lg font-black text-slate-900">{queueStats?.symptomCount || 0}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Symptoms</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#059669]" />
            <span className="text-xs font-bold text-slate-700">Local IndexedDB Status</span>
          </div>
          <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
            dbStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {dbStatus === 'connected' ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
            {dbStatus === 'connected' ? 'Connected' : 'Unavailable'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold">Sync Queue</span>
          <span className="text-[10px] font-bold text-slate-800">{queueStats?.totalPending || 0} pending records</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold">Last Sync</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-800">{lastSync}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleRetrySync}
        disabled={syncing || isOffline}
        className="mt-3 w-full py-2.5 bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : isOffline ? 'Offline - Cannot Sync' : 'Retry Sync'}
      </button>
    </div>
  );
}
