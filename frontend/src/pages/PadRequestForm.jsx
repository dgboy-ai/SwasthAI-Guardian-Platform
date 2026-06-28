import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, ShieldCheck, Loader, Navigation, AlertCircle, CheckCircle, ChevronLeft, Heart, User } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PadRequestForm() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [village, setVillage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locStatus, setLocStatus] = useState('idle');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [ageError, setAgeError] = useState('');

  const isMinor = age && parseInt(age) < 18;

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
      return `${lat}, ${lng}`;
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setError('GPS is not supported by this device. Please type your location manually.');
      return;
    }
    setError('');
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
        setError('Could not get GPS location. Please enable Location permissions and try again, or type your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validateAge = (value) => {
    setAge(value);
    if (value && parseInt(value) < 10) {
      setAgeError('Must be at least 10 years old');
    } else {
      setAgeError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender) { setError('Please select your gender.'); return; }
    if (gender !== 'female') { setError('Sanitary pad requests are available for women and girls.'); return; }
    if (!age || parseInt(age) < 10) { setError('Please enter your age.'); return; }
    if (ageError) { setError(ageError); return; }

    setLoading(true);
    setError('');

    const payload = { village, gender, age: parseInt(age), gpsCoords };

    try {
      await api.post('/villager/pad-request', payload);
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;

      if (status === 401) {
        setError('Session expired. Please log in again and retry.');
        localStorage.removeItem('token');
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        const offlineMsg = 'No Internet — your request will be saved and sent when connection restores.';
        try {
          const { queueAmbulanceRequest } = await import('../utils/offlineSyncQueue');
          await queueAmbulanceRequest({ ...payload, type: 'pad_request' });
          setSuccess(true);
        } catch {
          setError(offlineMsg + ' If offline storage is full, please tell your ASHA worker directly.');
        }
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
      <div className="flex items-center gap-3">
        <button onClick={() => { setSuccess(false); setVillage(''); setGpsCoords(null); setLocStatus('idle'); setGender(''); setAge(''); setAgeError(''); }}
          className="px-6 py-3 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-colors">
          {t.menstrual?.send_another || 'Send Another Request'}
        </button>
        <button onClick={() => navigate('/menstrual-health')}
          className="px-6 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors">
          {t.common?.back || 'Back'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <button onClick={() => navigate('/menstrual-health')}
          className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors mb-3">
          <ChevronLeft className="w-3 h-3" /> {t.common?.back || 'Back'}
        </button>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.request_pads_title || 'Request Sanitary Pads'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.request_pads_desc || 'Your ASHA worker will deliver pads privately to your location. This request is completely confidential.'}</p>
      </div>
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-emerald-800">{t.menstrual?.private_note || '100% Private — Only your assigned ASHA worker can see this request. No one else will know.'}</p>
      </div>
      {error && <p className="mb-4 text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Gender Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.menstrual?.gender || 'Gender'}</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setGender('female')}
              className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all ${
                gender === 'female'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-rose-300'
              }`}>
              <Heart className="w-4 h-4" /> {t.menstrual?.female || 'Female'}
            </button>
            <button type="button" onClick={() => setGender('male')}
              className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all ${
                gender === 'male'
                  ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300'
              }`}>
              <User className="w-4 h-4" /> {t.menstrual?.male || 'Male'}
            </button>
          </div>
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.menstrual?.age || 'Your Age'}</label>
          <input type="number" min={10} max={120} value={age} onChange={e => validateAge(e.target.value)}
            placeholder="e.g. 28"
            className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl font-bold text-slate-800 text-sm outline-none transition-all placeholder:text-slate-300 ${
              ageError ? 'border-rose-400 ring-4 ring-rose-500/5' : 'border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5'
            }`} />
          {ageError && <p className="text-[10px] font-bold text-rose-500 ml-1">{ageError}</p>}
        </div>

        {/* Minor Guardian Notice */}
        {isMinor && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-amber-800">{t.menstrual?.minor_notice || 'If you are under 18, your ASHA worker may contact a parent or guardian to ensure your safety.'}</p>
          </div>
        )}

        {/* GPS Capture Button */}
        <button type="button" onClick={captureGPS}
          className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 transition-all font-bold text-xs uppercase tracking-wider ${
            locStatus === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : locStatus === 'loading'
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : locStatus === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-rose-50 border-rose-400 text-rose-700 hover:bg-rose-100'
          }`}>
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

        <button type="submit" disabled={loading || !gender || !age || !!ageError}
          className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> {t.menstrual?.submitting || 'Submitting...'}</> : <><Package className="w-4 h-4" /> {t.menstrual?.request_btn || 'Request Pads from ASHA Worker'}</>}
        </button>
      </form>
    </div>
  );
}
