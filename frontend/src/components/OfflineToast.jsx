import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, CheckCircle, AlertCircle, Clock, HardDrive, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { syncAllQueues, getQueueStats } from '../utils/offlineSyncQueue';

// ── Offline capability map: what truly works offline per role ──────────────
const ROLE_CAPABILITIES = {
  villager: {
    worksOffline: [
      { key: 'symptoms', label: 'Symptom Checker', note: 'Local ML inference' },
      { key: 'skin', label: 'Skin Photo Scan', note: 'Fallback assessment' },
      { key: 'ambulance', label: 'Ambulance SOS', note: 'Queues on device' },
      { key: 'schemes', label: 'Govt Schemes', note: 'Cached 6h' },
      { key: 'menstrual', label: 'Menstrual Health', note: 'Fully offline' },
    ],
    needsInternet: [
      { key: 'sakhi', label: 'Sakhi AI Chat', note: 'API required' },
      { key: 'voice', label: 'Voice Input', note: 'AI processing' },
      { key: 'profile_sync', label: 'Profile Sync', note: 'Local edits ok' },
      { key: 'pads', label: 'Pad Request', note: 'API required' },
    ],
  },
  ngo: {
    worksOffline: [
      { key: 'maternal', label: 'Maternal Records', note: 'Queues on device' },
      { key: 'child', label: 'Child Nutrition', note: 'Queues + WHO calc' },
    ],
    needsInternet: [
      { key: 'alerts', label: 'Health Alerts', note: 'API required' },
      { key: 'patients', label: 'Patient Registry', note: 'API required' },
      { key: 'outbreaks', label: 'Outbreak Data', note: 'API required' },
      { key: 'ambulance_tracking', label: 'Ambulance Feed', note: 'API required' },
    ],
  },
  admin: {
    worksOffline: [
      { key: 'dashboard_cache', label: 'Dashboard Cache', note: 'Stale data shown' },
    ],
    needsInternet: [
      { key: 'live', label: 'Live Telemetry', note: 'SSE required' },
      { key: 'analytics', label: 'Analytics', note: 'API required' },
      { key: 'outbreak_sim', label: 'Outbreak Sim', note: 'API required' },
      { key: 'b2b', label: 'B2B Dashboard', note: 'API required' },
    ],
  },
};

// ── Route-to-capability mapping (expanded detail) ─────────────────────────
const ROUTE_FEATURES = {
  '/villager':         { works: ['symptoms', 'skin', 'ambulance', 'schemes', 'menstrual'], needs: ['sakhi', 'voice'] },
  '/symptoms':         { works: ['symptoms'], needs: ['voice'] },
  '/skin-disease':     { works: ['skin'], needs: [] },
  '/ambulance':        { works: ['ambulance'], needs: [] },
  '/schemes':          { works: ['schemes'], needs: [] },
  '/menstrual-health': { works: ['menstrual'], needs: ['pads'] },
  '/profile':          { works: [], needs: ['profile_sync'] },
  '/ngo':              { works: ['maternal', 'child'], needs: ['alerts', 'patients'] },
  '/ngo/maternal':     { works: ['maternal'], needs: [] },
  '/ngo/child-nutrition': { works: ['child'], needs: [] },
  '/admin':            { works: ['dashboard_cache'], needs: ['live', 'analytics', 'outbreak_sim', 'b2b'] },
};

// ── Per-language messages ─────────────────────────────────────────────────
const OFFLINE_MSGS = {
  hi: {
    offline_title: 'इंटरनेट नहीं है',
    offline_body:  'कुछ फीचर्स अभी भी काम करेंगे — विस्तार से देखें',
    online_title:  'इंटरनेट वापस आ गया',
    online_body:   'सब कुछ फिर से काम कर रहा है',
    pending_label: 'लंबित सिंक',
    last_sync:     'अंतिम सिंक',
    sync_now:      'अभी सिंक करें',
    works_label:   'ऑफ़लाइन काम करेगा',
    needs_label:   'इंटरनेट चाहिए',
    syncing:       'सिंक हो रहा है...',
    cached:        'कैश किया हुआ',
  },
  en: {
    offline_title: 'No Internet',
    offline_body:  'Some features still work — tap Details',
    online_title:  'Back Online',
    online_body:   'Everything is working again',
    pending_label: 'Pending Sync',
    last_sync:     'Last sync',
    sync_now:      'Sync Now',
    works_label:   'Works offline',
    needs_label:   'Needs internet',
    syncing:       'Syncing...',
    cached:        'Cached',
  },
  ta: {
    offline_title: 'இணையம் இல்லை',
    offline_body:  'சில அம்சங்கள் இன்னும் வேலை செய்யும் — விவரங்களைப் பார்க்கவும்',
    online_title:  'இணையம் திரும்பி வந்தது',
    online_body:   'எல்லாம் மீண்டும் வேலை செய்கிறது',
    pending_label: 'நிலுவையில் உள்ள ஒத்திசைவு',
    last_sync:     'கடைசி ஒத்திசைவு',
    sync_now:      'இப்போது ஒத்திசைக்கவும்',
    works_label:   'ஆஃப்லைனில் வேலை செய்யும்',
    needs_label:   'இணையம் தேவை',
    syncing:       'ஒத்திசைக்கிறது...',
    cached:        'தற்காலிக சேமிப்பு',
  },
  te: {
    offline_title: 'ఇంటర్నెట్ లేదు',
    offline_body:  'కొన్ని ఫీచర్లు ఇప్పటికీ పని చేస్తాయి — వివరాలను చూడండి',
    online_title:  'ఇంటర్నెట్ తిరిగి వచ్చింది',
    online_body:   'అన్నీ మళ్ళీ పని చేస్తున్నాయి',
    pending_label: 'పెండింగ్ సింక్',
    last_sync:     'చివరి సింక్',
    sync_now:      'ఇప్పుడు సింక్ చేయండి',
    works_label:   'ఆఫ్‌లైన్‌లో పని చేస్తుంది',
    needs_label:   'ఇంటర్నెట్ అవసరం',
    syncing:       'సింక్ చేస్తోంది...',
    cached:        'కాష్ చేయబడింది',
  },
  mr: {
    offline_title: 'इंटरनेट नाही',
    offline_body:  'काही फीचर्स अजूनही काम करतील — तपशील पहा',
    online_title:  'इंटरनेट परत आले',
    online_body:   'सर्व काही पुन्हा काम करत आहे',
    pending_label: 'प्रलंबित सिंक',
    last_sync:     'शेवटचे सिंक',
    sync_now:      'आता सिंक करा',
    works_label:   'ऑफलाइन काम करेल',
    needs_label:   'इंटरनेट लागेल',
    syncing:       'सिंक होत आहे...',
    cached:        'कॅश केलेले',
  },
  bn: {
    offline_title: 'ইন্টারনেট নেই',
    offline_body:  'কিছু ফিচার এখনও কাজ করবে — বিস্তারিত দেখুন',
    online_title:  'ইন্টারনেট ফিরে এসেছে',
    online_body:   'সব কিছু আবার কাজ করছে',
    pending_label: 'অপেক্ষমাণ সিঙ্ক',
    last_sync:     'সর্বশেষ সিঙ্ক',
    sync_now:      'এখন সিঙ্ক করুন',
    works_label:   'অফলাইনে কাজ করবে',
    needs_label:   'ইন্টারনেট প্রয়োজন',
    syncing:       'সিঙ্ক হচ্ছে...',
    cached:        'ক্যাশে করা',
  },
};

const FALLBACK_LANG = 'en';

export default function OfflineToast() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const getNetworkState = () => {
    const simulated = localStorage.getItem('simulated_network_state');
    if (simulated === 'offline') return false;
    if (simulated === 'online') return true;
    return navigator.onLine;
  };

  const [isOnline, setIsOnline] = useState(getNetworkState);
  const [toastType, setToastType] = useState(() => getNetworkState() ? null : 'offline');
  const [expanded, setExpanded] = useState(false);
  const [queueStats, setQueueStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const wasOnlineRef = useRef(getNetworkState());
  const onlineTimerRef = useRef(null);

  const m = OFFLINE_MSGS[lang] || OFFLINE_MSGS[FALLBACK_LANG];
  const role = user?.role || 'guest';
  const capabilities = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES.villager;
  const currentRoute = Object.keys(ROUTE_FEATURES).find(r => location.pathname === r || location.pathname.startsWith(r + '/') || (r === '/villager' && location.pathname === '/villager')) || '/villager';
  const routeFeatures = ROUTE_FEATURES[currentRoute] || ROUTE_FEATURES['/villager'];

  const capabilityForRoute = (list) => list.filter(f => routeFeatures.works.includes(f.key) || routeFeatures.needs.includes(f.key));

  const refreshQueueStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setQueueStats(stats);
    } catch { /* silent */ }
  }, []);

  // Load queue stats on mount and on queue update events
  useEffect(() => {
    refreshQueueStats();
    const handler = () => refreshQueueStats();
    window.addEventListener('swasthai_queue_updated', handler);
    const interval = setInterval(refreshQueueStats, 15000);
    return () => {
      window.removeEventListener('swasthai_queue_updated', handler);
      clearInterval(interval);
    };
  }, [refreshQueueStats]);

  useEffect(() => {
    const handleOffline = () => {
      clearTimeout(onlineTimerRef.current);
      setIsOnline(false);
      setToastType('offline');
      setExpanded(false);
      wasOnlineRef.current = false;
      refreshQueueStats();
    };

    const handleOnline = () => {
      const simulated = localStorage.getItem('simulated_network_state');
      if (simulated === 'offline') return;
      setIsOnline(true);
      if (!wasOnlineRef.current) {
        setToastType('online');
        setExpanded(false);
        syncAllQueues().catch(() => {}).finally(() => {
          setLastSyncTime(Date.now());
          refreshQueueStats();
        });
        onlineTimerRef.current = setTimeout(() => setToastType(null), 4000);
      }
      wasOnlineRef.current = true;
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(onlineTimerRef.current);
    };
  }, [refreshQueueStats]);

  const handleManualSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncAllQueues();
      setLastSyncTime(Date.now());
    } catch { /* silent */ }
    setIsSyncing(false);
    refreshQueueStats();
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const currentWorks = capabilityForRoute(capabilities.worksOffline);
  const currentNeeds = capabilityForRoute(capabilities.needsInternet);

  const queueItems = queueStats ? [
    queueStats.ambulanceCount > 0 && `🚑 ${queueStats.ambulanceCount}`,
    queueStats.maternalCount > 0 && `👶 ${queueStats.maternalCount}`,
    queueStats.childCount > 0 && `🍼 ${queueStats.childCount}`,
    queueStats.symptomCount > 0 && `🩺 ${queueStats.symptomCount}`,
  ].filter(Boolean) : [];

  return (
    <AnimatePresence>
      {toastType && (
        <motion.div
          key={toastType}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-4 left-0 right-0 z-[9998] flex justify-center px-4 pointer-events-none"
        >
          <div className={`pointer-events-auto w-full max-w-sm rounded-[1.5rem] shadow-2xl overflow-hidden border ${
            toastType === 'offline'
              ? 'bg-slate-900 border-amber-500/30'
              : 'bg-emerald-700 border-emerald-500/40'
          }`}>

            {/* ── Top Row ── */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toastType === 'offline' ? 'bg-amber-500/20' : 'bg-white/20'
              }`}>
                {toastType === 'offline'
                  ? <WifiOff className="w-4 h-4 text-amber-400" />
                  : <Wifi className="w-4 h-4 text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black leading-tight ${
                  toastType === 'offline' ? 'text-amber-300' : 'text-white'
                }`}>
                  {toastType === 'offline' ? m.offline_title : m.online_title}
                </p>
                <p className={`text-[10px] font-medium leading-tight mt-0.5 ${
                  toastType === 'offline' ? 'text-slate-400' : 'text-emerald-200'
                }`}>
                  {toastType === 'offline' ? m.offline_body : m.online_body}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {toastType === 'offline' && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="text-[9px] font-black text-amber-400 uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {expanded ? 'Less' : 'Details'}
                  </button>
                )}
                <button
                  onClick={() => setToastType(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* ── Queue Status Bar (pending items + sync button) ── */}
            {toastType === 'offline' && queueStats && queueStats.totalPending > 0 && (
              <div className="px-4 py-2 bg-amber-500/10 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-bold text-amber-300">
                    {m.pending_label}: {queueStats.totalPending}
                  </span>
                </div>
                {currentWorks.length === 0 && navigator.onLine && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? m.syncing : m.sync_now}
                  </button>
                )}
              </div>
            )}

            {/* ── Expanded Detail Panel ── */}
            <AnimatePresence>
              {toastType === 'offline' && expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="px-4 py-3 space-y-3">

                    {/* Role context */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        {role === 'villager' ? 'Villager Mode' : role === 'ngo' ? 'ASHA Worker Mode' : role === 'admin' ? 'Admin Mode' : 'Guest'}
                      </span>
                      {queueStats && queueStats.totalPending > 0 && (
                        <span className="text-[8px] font-bold text-amber-400/80">{m.pending_label}: {queueStats.totalPending}</span>
                      )}
                      {lastSyncTime && (
                        <span className="text-[8px] font-bold text-slate-500">{m.last_sync}: {formatTime(lastSyncTime)}</span>
                      )}
                    </div>

                    {/* Works offline — filtered to this route */}
                    {currentWorks.length > 0 && (
                      <div>
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <CheckCircle className="w-2.5 h-2.5" /> {m.works_label}
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {currentWorks.map(f => (
                            <div key={f.key} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                              <span>{f.label}</span>
                              <span className="text-[7px] text-slate-500 ml-auto">{f.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Needs internet — filtered to this route */}
                    {currentNeeds.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-2.5 h-2.5" /> {m.needs_label}
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {currentNeeds.map(f => (
                            <div key={f.key} className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <AlertCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                              <span>{f.label}</span>
                              <span className="text-[7px] text-slate-500 ml-auto">{f.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending queue detail */}
                    {queueStats && queueStats.totalPending > 0 && (
                      <div className="pt-1 border-t border-white/5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          <HardDrive className="w-2.5 h-2.5 inline-block mr-1" />{m.pending_label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {queueStats.ambulanceCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded text-[8px] font-bold">
                              🚑 Ambulance ×{queueStats.ambulanceCount}
                            </span>
                          )}
                          {queueStats.maternalCount > 0 && (
                            <span className="px-2 py-0.5 bg-sky-500/15 text-sky-300 rounded text-[8px] font-bold">
                              👶 Maternal ×{queueStats.maternalCount}
                            </span>
                          )}
                          {queueStats.childCount > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-300 rounded text-[8px] font-bold">
                              🍼 Child ×{queueStats.childCount}
                            </span>
                          )}
                          {queueStats.symptomCount > 0 && (
                            <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 rounded text-[8px] font-bold">
                              🩺 Symptoms ×{queueStats.symptomCount}
                            </span>
                          )}
                        </div>
                        {navigator.onLine && (
                          <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="mt-2 w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? m.syncing : m.sync_now}
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
