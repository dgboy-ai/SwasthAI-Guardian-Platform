import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Per-language offline/online messages ─────────────────────────────────────
// Written in the simplest possible words a rural villager would understand
const OFFLINE_MSGS = {
  hi: {
    offline_title: 'इंटरनेट नहीं है',
    offline_body:  'घबराएं नहीं — लक्षण जांच और फ़ोटो स्कैन अभी भी काम करेगा',
    online_title:  'इंटरनेट वापस आ गया ✅',
    online_body:   'सब कुछ फिर से काम कर रहा है',
    works_label:   'बिना इंटरनेट के काम करेगा:',
    needs_label:   'इंटरनेट चाहिए:',
    works: ['✅ लक्षण चुनें', '✅ त्वचा फ़ोटो जांच', '✅ रिपोर्ट डाउनलोड'],
    needs: ['❌ आवाज़ माइक', '❌ AI बीमारी का नाम', '❌ एम्बुलेंस', '❌ सखी AI चैट'],
  },
  en: {
    offline_title: 'No Internet',
    offline_body:  "Don't worry — Symptom Check & Skin Scan still work",
    online_title:  'Back Online ✅',
    online_body:   'Everything is working again',
    works_label:   'Works without internet:',
    needs_label:   'Needs internet:',
    works: ['✅ Tick symptoms', '✅ Skin photo scan', '✅ Download report'],
    needs: ['❌ Voice mic', '❌ AI disease name', '❌ Ambulance', '❌ Sakhi AI chat'],
  },
  ta: {
    offline_title: 'இணையம் இல்லை',
    offline_body:  'கவலைப்படாதீர்கள் — அறிகுறி சோதனை & தோல் ஸ்கேன் வேலை செய்யும்',
    online_title:  'இணையம் திரும்பி வந்தது ✅',
    online_body:   'எல்லாம் மீண்டும் வேலை செய்கிறது',
    works_label:   'இணையம் இல்லாமல் வேலை செய்யும்:',
    needs_label:   'இணையம் தேவை:',
    works: ['✅ அறிகுறிகளை தேர்ந்தெடுக்கவும்', '✅ தோல் புகைப்பட ஸ்கேன்', '✅ அறிக்கை பதிவிறக்கம்'],
    needs: ['❌ குரல் மைக்', '❌ AI நோய் பெயர்', '❌ ஆம்புலன்ஸ்', '❌ சகி AI சாட்'],
  },
  te: {
    offline_title: 'ఇంటర్నెట్ లేదు',
    offline_body:  'భయపడకండి — లక్షణాల తనిఖీ & చర్మ స్కాన్ పని చేస్తాయి',
    online_title:  'ఇంటర్నెట్ తిరిగి వచ్చింది ✅',
    online_body:   'అన్నీ మళ్ళీ పని చేస్తున్నాయి',
    works_label:   'ఇంటర్నెట్ లేకుండా పని చేస్తుంది:',
    needs_label:   'ఇంటర్నెట్ అవసరం:',
    works: ['✅ లక్షణాలు ఎంచుకోండి', '✅ చర్మ ఫోటో స్కాన్', '✅ నివేదిక డౌన్‌లోడ్'],
    needs: ['❌ వాయిస్ మైక్', '❌ AI వ్యాధి పేరు', '❌ యాంబులెన్స్', '❌ సఖి AI చాట్'],
  },
  mr: {
    offline_title: 'इंटरनेट नाही',
    offline_body:  'काळजी करू नका — लक्षण तपासणी आणि त्वचा स्कॅन काम करेल',
    online_title:  'इंटरनेट परत आले ✅',
    online_body:   'सर्व काही पुन्हा काम करत आहे',
    works_label:   'इंटरनेटशिवाय काम होईल:',
    needs_label:   'इंटरनेट लागेल:',
    works: ['✅ लक्षणे निवडा', '✅ त्वचा फोटो स्कॅन', '✅ अहवाल डाउनलोड'],
    needs: ['❌ आवाज मायक', '❌ AI रोगाचे नाव', '❌ रुग्णवाहिका', '❌ सखी AI चॅट'],
  },
  bn: {
    offline_title: 'ইন্টারনেট নেই',
    offline_body:  'চিন্তা করবেন না — লক্ষণ পরীক্ষা ও ত্বক স্ক্যান এখনও কাজ করবে',
    online_title:  'ইন্টারনেট ফিরে এসেছে ✅',
    online_body:   'সব কিছু আবার কাজ করছে',
    works_label:   'ইন্টারনেট ছাড়াই কাজ করবে:',
    needs_label:   'ইন্টারনেট দরকার:',
    works: ['✅ লক্ষণ নির্বাচন', '✅ ত্বক ফটো স্ক্যান', '✅ রিপোর্ট ডাউনলোড'],
    needs: ['❌ ভয়েস মাইক', '❌ AI রোগের নাম', '❌ অ্যাম্বুলেন্স', '❌ সখী AI চ্যাট'],
  },
};

const FALLBACK_LANG = 'hi'; // Default: Hindi

export default function OfflineToast() {
  const { lang } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toastType, setToastType] = useState(null); // 'offline' | 'online' | null
  const [expanded, setExpanded] = useState(false);
  const wasOnlineRef = useRef(navigator.onLine);
  const onlineTimerRef = useRef(null);

  const m = OFFLINE_MSGS[lang] || OFFLINE_MSGS[FALLBACK_LANG];

  useEffect(() => {
    const handleOffline = () => {
      clearTimeout(onlineTimerRef.current);
      setIsOnline(false);
      setToastType('offline');
      setExpanded(false);
      wasOnlineRef.current = false;
    };

    const handleOnline = () => {
      setIsOnline(true);
      // Show "Back Online" briefly only if we were previously offline
      if (!wasOnlineRef.current) {
        setToastType('online');
        setExpanded(false);
        // Auto-dismiss the "back online" toast after 4 seconds
        onlineTimerRef.current = setTimeout(() => {
          setToastType(null);
        }, 4000);
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
  }, []);

  return (
    <AnimatePresence>
      {toastType && (
        <motion.div
          key={toastType}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-4 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
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
                {/* Expand button — only for offline toast */}
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

            {/* ── Expanded Detail Panel — what works vs what needs internet ── */}
            <AnimatePresence>
              {toastType === 'offline' && expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    {/* Works offline */}
                    <div>
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">
                        {m.works_label}
                      </p>
                      {m.works.map((item, i) => (
                        <p key={i} className="text-[10px] text-slate-300 font-medium leading-loose">{item}</p>
                      ))}
                    </div>
                    {/* Needs internet */}
                    <div>
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1.5">
                        {m.needs_label}
                      </p>
                      {m.needs.map((item, i) => (
                        <p key={i} className="text-[10px] text-slate-400 font-medium leading-loose">{item}</p>
                      ))}
                    </div>
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
