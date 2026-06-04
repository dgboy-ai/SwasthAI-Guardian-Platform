import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, ShieldCheck, Loader, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function PadRequestForm() {
  const { t } = useLanguage();
  const [village, setVillage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locStatus, setLocStatus] = useState('idle'); // idle | loading | success | error
  const [gpsCoords, setGpsCoords] = useState(null);

  // Nominatim Reverse Geocoding via secure, open openstreetmap client API
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SwasthAIGuardian/1.0 (rural-health)' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const parts = [
        addr.village || addr.hamlet || addr.suburb || addr.town || addr.city,
        addr.county || addr.state_district,
        addr.state,
      ].filter(Boolean);
      return parts.length ? parts.join(', ') : `${lat}, ${lng}`;
    } catch {
      return `${lat}, ${lng}`; // fallback to raw coordinates
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported by this device. Please type your location manually.');
      return;
    }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        const humanAddress = await reverseGeocode(lat, lng);
        setGpsCoords({ lat, lng });
        setVillage(humanAddress);
        setLocStatus('success');
      },
      () => {
        setLocStatus('error');
        alert('Could not get GPS location. Please enable Location permissions and try again, or type your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/villager/pad-request', { village });
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;

      if (status === 401) {
        setError('Session expired. Please log in again and retry.');
        localStorage.removeItem('token');
      } else if (serverMsg) {
        setError(serverMsg);
      } else if (localStorage.getItem('simulated_network_state') === 'offline') {
        setError('Demo offline mode is on (Monitoring Dashboard). Turn it off, or tell your ASHA worker directly.');
      } else if (!navigator.onLine) {
        setError(t.menstrual?.offline_pad_help || 'No Internet? Please tell your ASHA worker directly if you need pads immediately.');
      } else {
        setError(
          'Could not reach the server. Ensure the backend is running (npm run dev), then try again. '
          + 'Or tell your ASHA worker directly if you need pads immediately.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center text-center py-12">
      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.request_sent || 'Request Sent!'}</h3>
      <p className="text-slate-500 font-medium mb-6 max-w-sm">{t.menstrual?.request_sent_desc || 'Your ASHA worker has been notified and will contact you shortly. Your request is completely private.'}</p>
      <button onClick={() => { setSuccess(false); setVillage(''); setGpsCoords(null); setLocStatus('idle'); }}
        className="px-6 py-3 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-colors">
        {t.menstrual?.send_another || 'Send Another Request'}
      </button>
    </motion.div>
  );

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.request_pads_title || 'Request Sanitary Pads'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.request_pads_desc || 'Your ASHA worker will deliver pads privately to your location. This request is completely confidential.'}</p>
      </div>
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 flex items-start gap-3 animate-pulse">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-emerald-800">{t.menstrual?.private_note || '100% Private — Only your assigned ASHA worker can see this request. No one else will know.'}</p>
      </div>
      {error && <p className="mb-4 text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GPS Capture Button */}
        <button
          type="button"
          onClick={captureGPS}
          className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 transition-all font-bold text-xs uppercase tracking-wider ${
            locStatus === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : locStatus === 'loading'
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : locStatus === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-rose-50 border-rose-400 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {locStatus === 'idle'    && <><Navigation className="w-3.5 h-3.5" /> Locate Me via GPS</>}
          {locStatus === 'loading' && <><Loader className="w-3.5 h-3.5 animate-spin" /> Detecting Location...</>}
          {locStatus === 'success' && <><CheckCircle className="w-3.5 h-3.5" /> GPS Location Captured!</>}
          {locStatus === 'error'   && <><AlertCircle className="w-3.5 h-3.5" /> GPS Failed — Retry</>}
        </button>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.menstrual?.your_village || 'Your Village / Area'}</label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
            <input value={village} onChange={e => { setVillage(e.target.value); setGpsCoords(null); setLocStatus('idle'); }} required
              placeholder={t.menstrual?.village_placeholder || 'e.g. Rampur, Sector 4'}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all placeholder:text-slate-300" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> {t.services.analyzing}</> : <><Package className="w-4 h-4" /> {t.menstrual?.request_btn || 'Request Pads from ASHA Worker'}</>}
        </button>
      </form>
    </div>
  );
}
