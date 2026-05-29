import { useState } from 'react';
import { Truck, MapPin, PhoneCall, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function Ambulance() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const requestAmbulance = async (priority = 'Normal') => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/ambulance', {
        location: 'Village Sector C, near Primary School',
        priority
      });
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[50px] shadow-2xl border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden group">
      <div className="absolute right-[-40px] bottom-[-40px] w-80 h-80 bg-rose-50 rounded-full blur-3xl group-hover:bg-rose-100 transition-all duration-700" />
      
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
          disabled={loading}
          className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[32px] text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
        >
          {loading ? 'Dispatching...' : 'Request Emergency Team'}
          <AlertTriangle className="w-6 h-6 text-white group-hover:animate-pulse" />
        </button>

        <button 
          onClick={() => requestAmbulance('Normal')}
          className="w-full py-5 bg-slate-100 text-slate-600 rounded-[32px] font-black uppercase tracking-[0.1em] hover:bg-slate-200 transition-all"
        >
          Non-Critical Medical Transport
        </button>
      </div>

      {status && (
        <div className="mt-10 p-8 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-[40px] relative z-10 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center gap-3 mb-3">
             <CheckCircle className="w-6 h-6 text-emerald-500" />
             <h4 className="text-xl font-black italic">RESCUE DISPATCHED</h4>
          </div>
          <p className="text-sm font-bold opacity-75">ETA: 14 Minutes · Vehicle: UP-65-AMB-102</p>
          <div className="mt-6 flex items-center justify-center gap-4">
             <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <PhoneCall className="w-4 h-4" /> Call Driver
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
