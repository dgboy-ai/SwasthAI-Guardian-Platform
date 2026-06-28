import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, PhoneCall, AlertTriangle, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import api from '../services/api';

export default function Ambulance() {
  const [loading, setLoading] = useState(false);
  const [loadingNormal, setLoadingNormal] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const requestAmbulance = async (priority = 'Normal') => {
    if (priority === 'Critical') setLoading(true);
    else setLoadingNormal(true);
    setError('');
    setStatus(null);
    try {
      const res = await api.post('/ambulance', {
        location: 'Village Sector C, near Primary School',
        priority
      });
      setStatus(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Service unavailable. Call 108.';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingNormal(false);
    }
  };

  const isDispatching = loading || loadingNormal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-6 md:p-10 rounded-[50px] shadow-2xl border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden"
    >
      <div className="absolute right-[-40px] bottom-[-40px] w-80 h-80 bg-rose-50 rounded-full blur-3xl transition-all duration-700" />
      
      <div className="inline-flex p-5 bg-rose-50 text-rose-600 rounded-[30px] mb-8 relative z-10">
        <Truck className="w-12 h-12" />
      </div>

      <div className="relative z-10 mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Emergency Rescue</h2>
        <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed max-w-md mx-auto">
          Need an ambulance or health responder? Click below. Your location is automatically shared.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 relative z-10">
        <button 
          onClick={() => requestAmbulance('Critical')}
          disabled={isDispatching}
          className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[32px] text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Dispatching...</>
          ) : 'Request Emergency Team'}
          <AlertTriangle className="w-6 h-6 text-white" />
        </button>

        <button 
          onClick={() => requestAmbulance('Normal')}
          disabled={isDispatching}
          className="w-full py-5 bg-slate-100 text-slate-600 rounded-[32px] font-black uppercase tracking-[0.1em] hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loadingNormal ? (
            <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /> Dispatching...</>
          ) : 'Non-Critical Medical Transport'}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-5 bg-amber-50 border border-amber-300 rounded-[32px] relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-black text-amber-900">{error}</p>
          </div>
          <a href="tel:108" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
            <PhoneCall className="w-4 h-4" /> Call 108 — Free Ambulance
          </a>
        </div>
      )}

      {status && !error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 p-8 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-[40px] relative z-10"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
             <CheckCircle className="w-6 h-6 text-emerald-500" />
             <h4 className="text-xl font-black italic">RESCUE DISPATCHED</h4>
          </div>
          <p className="text-sm font-bold opacity-75">ETA: 14 Minutes · Vehicle: UP-65-AMB-102</p>
          <div className="mt-6 flex items-center justify-center gap-4">
             <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors">
                <PhoneCall className="w-4 h-4" /> Call Driver
             </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
