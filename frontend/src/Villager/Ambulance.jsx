import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, PhoneCall, AlertTriangle, CheckCircle, AlertCircle, Navigation, Clock } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LABELS = {
  en: {
    title: 'Emergency Rescue',
    subtitle: 'Need an ambulance or health responder? Tap below — your GPS location is auto-shared with dispatch.',
    critical: 'Request Emergency Ambulance',
    normal: 'Non-Critical Medical Transport',
    dispatching: 'Dispatching...',
    dispatched: 'RESCUE DISPATCHED',
    callDriver: 'Call Driver',
    locating: 'Getting your location...',
    locationGranted: 'Location shared with dispatch',
    locationDenied: 'Location unavailable — address used instead',
    fallback: 'Service unavailable. Call 108 — Free Ambulance',
    callFree: 'Call 108 — Free Ambulance',
    eta: 'ETA',
    vehicle: 'Vehicle',
    minutes: 'Minutes',
  },
  hi: {
    title: 'आपातकालीन सहायता',
    subtitle: 'एम्बुलेंस चाहिए? नीचे दबाएं — आपकी GPS लोकेशन अपने आप भेज दी जाएगी।',
    critical: 'आपातकालीन एम्बुलेंस बुलाएं',
    normal: 'सामान्य चिकित्सा परिवहन',
    dispatching: 'भेज रहे हैं...',
    dispatched: 'रेस्क्यू भेजा गया',
    callDriver: 'ड्राइवर से बात करें',
    locating: 'आपकी लोकेशन मिल रही है...',
    locationGranted: 'लोकेशन डिस्पैच को भेजी गई',
    locationDenied: 'लोकेशन उपलब्ध नहीं — पते से भेजा गया',
    fallback: 'सेवा उपलब्ध नहीं। 108 पर कॉल करें — मुफ्त एम्बुलेंस',
    callFree: '108 — मुफ्त एम्बुलेंस',
    eta: 'अनुमानित समय',
    vehicle: 'वाहन',
    minutes: 'मिनट',
  },
  mr: {
    title: 'आपत्कालीन सहाय्य',
    subtitle: 'रुग्णवाहिका हवी आहे? खाली दाबा — तुमचे GPS स्थान आपोआप पाठवले जाईल.',
    critical: 'आपत्कालीन रुग्णवाहिका बोलवा',
    normal: 'सामान्य वैद्यकीय वाहतूक',
    dispatching: 'पाठवत आहे...',
    dispatched: 'रेस्क्यू पाठवले',
    callDriver: 'चालकाशी बोला',
    locating: 'तुमचे स्थान शोधत आहे...',
    locationGranted: 'स्थान डिस्पॅचला पाठवले',
    locationDenied: 'स्थान उपलब्ध नाही — पत्त्याने पाठवले',
    fallback: 'सेवा उपलब्ध नाही. 108 वर कॉल करा — मोफत रुग्णवाहिका',
    callFree: '108 — मोफत रुग्णवाहिका',
    eta: 'अंदाजे वेळ',
    vehicle: 'वाहन',
    minutes: 'मिनिटे',
  },
  ta: {
    title: 'அவசர மீட்பு',
    subtitle: 'ஆம்புலன்ஸ் தேவையா? கீழே தட்டவும் — உங்கள் GPS இருப்பிடம் தானாக அனுப்பப்படும்.',
    critical: 'அவசர ஆம்புலன்ஸ் கோரு',
    normal: 'சாதாரண மருத்துவ போக்குவரத்து',
    dispatching: 'அனுப்புகிறோம்...',
    dispatched: 'மீட்பு அனுப்பப்பட்டது',
    callDriver: 'ஓட்டுநரை அழைக்கவும்',
    locating: 'உங்கள் இருப்பிடம் கண்டறியப்படுகிறது...',
    locationGranted: 'இருப்பிடம் அனுப்பப்பட்டது',
    locationDenied: 'இருப்பிடம் இல்லை — முகவரி பயன்படுத்தப்பட்டது',
    fallback: 'சேவை இல்லை. 108 அழைக்கவும் — இலவச ஆம்புலன்ஸ்',
    callFree: '108 — இலவச ஆம்புலன்ஸ்',
    eta: 'வருகை நேரம்',
    vehicle: 'வாகனம்',
    minutes: 'நிமிடங்கள்',
  },
  te: {
    title: 'అత్యవసర సహాయం',
    subtitle: 'యాంబులెన్స్ కావాలా? దిగువన నొక్కండి — మీ GPS లొకేషన్ స్వయంచాలకంగా పంపబడుతుంది.',
    critical: 'అత్యవసర యాంబులెన్స్ పిలవండి',
    normal: 'సాధారణ వైద్య రవాణా',
    dispatching: 'పంపుతున్నాం...',
    dispatched: 'రెస్క్యూ పంపబడింది',
    callDriver: 'డ్రైవర్‌ని పిలవండి',
    locating: 'మీ లొకేషన్ కనుగొంటున్నారు...',
    locationGranted: 'లొకేషన్ డిస్పాచ్‌కు పంపబడింది',
    locationDenied: 'లొకేషన్ అందుబాటులో లేదు — చిరునామా ఉపయోగించబడింది',
    fallback: 'సేవ అందుబాటులో లేదు. 108 కి కాల్ చేయండి — ఉచిత యాంబులెన్స్',
    callFree: '108 — ఉచిత యాంబులెన్స్',
    eta: 'అంచనా సమయం',
    vehicle: 'వాహనం',
    minutes: 'నిమిషాలు',
  },
  bn: {
    title: 'জরুরি উদ্ধার',
    subtitle: 'অ্যাম্বুলেন্স দরকার? নিচে ক্লিক করুন — আপনার GPS অবস্থান স্বয়ংক্রিয়ভাবে পাঠানো হবে।',
    critical: 'জরুরি অ্যাম্বুলেন্স ডাকুন',
    normal: 'সাধারণ চিকিৎসা পরিবহন',
    dispatching: 'পাঠাচ্ছি...',
    dispatched: 'রেসকিউ পাঠানো হয়েছে',
    callDriver: 'ড্রাইভারকে কল করুন',
    locating: 'আপনার অবস্থান খোঁজা হচ্ছে...',
    locationGranted: 'অবস্থান ডিসপ্যাচে পাঠানো হয়েছে',
    locationDenied: 'অবস্থান পাওয়া যাচ্ছে না — ঠিকানা ব্যবহার করা হয়েছে',
    fallback: 'সেবা পাওয়া যাচ্ছে না। 108 এ কল করুন — বিনামূল্যে অ্যাম্বুলেন্স',
    callFree: '108 — বিনামূল্যে অ্যাম্বুলেন্স',
    eta: 'আনুমানিক সময়',
    vehicle: 'যানবাহন',
    minutes: 'মিনিট',
  },
};

export default function Ambulance() {
  const { lang } = useLanguage();
  const l = lang || 'en';
  const T = LABELS[l] || LABELS.en;

  const [loading, setLoading] = useState(false);
  const [loadingNormal, setLoadingNormal] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | locating | granted | denied
  const [locationStr, setLocationStr] = useState('Village Sector C, Rampur, UP');

  // Try to get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationStr(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsStatus('granted');
      },
      () => {
        setGpsStatus('denied');
      },
      { timeout: 6000 }
    );
  }, []);

  const requestAmbulance = async (priority = 'Normal') => {
    if (priority === 'Critical') setLoading(true);
    else setLoadingNormal(true);
    setError('');
    setStatus(null);
    try {
      const res = await api.post('/ambulance', { location: locationStr, priority });
      setStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || T.fallback);
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
      <div className="absolute right-[-40px] bottom-[-40px] w-80 h-80 bg-rose-50 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-5 bg-rose-50 text-rose-600 rounded-[30px] mb-6 relative z-10">
        <Truck className="w-12 h-12" />
      </div>

      <div className="relative z-10 mb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{T.title}</h2>
        <p className="text-slate-500 mt-2 text-sm font-semibold leading-relaxed max-w-md mx-auto">
          {T.subtitle}
        </p>
      </div>

      {/* GPS status chip */}
      <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
        {gpsStatus === 'locating' && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
            <Navigation className="w-3 h-3 animate-pulse" /> {T.locating}
          </span>
        )}
        {gpsStatus === 'granted' && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <MapPin className="w-3 h-3" /> {T.locationGranted}
          </span>
        )}
        {gpsStatus === 'denied' && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> {T.locationDenied}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        <button
          onClick={() => requestAmbulance('Critical')}
          disabled={isDispatching}
          className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[28px] text-base font-black uppercase tracking-[0.15em] shadow-2xl shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {T.dispatching}</>
          ) : (
            <><AlertTriangle className="w-5 h-5" /> {T.critical}</>
          )}
        </button>

        <button
          onClick={() => requestAmbulance('Normal')}
          disabled={isDispatching}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-[28px] font-black uppercase tracking-[0.08em] text-sm hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loadingNormal ? (
            <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /> {T.dispatching}</>
          ) : T.normal}
        </button>
      </div>

      {/* 108 fallback always visible */}
      <div className="mt-5 relative z-10">
        <a
          href="tel:108"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-rose-300 hover:text-rose-600 transition-all shadow-sm"
        >
          <PhoneCall className="w-4 h-4" /> {T.callFree}
        </a>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl relative z-10 text-left flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-7 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-[32px] relative z-10"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              <h4 className="text-lg font-black">{T.dispatched}</h4>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-emerald-700 mb-5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {T.eta}: {status.eta || '14'} {T.minutes}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                {T.vehicle}: {status.vehicle || 'UP-65-AMB-102'}
              </span>
            </div>
            <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-emerald-700 transition-colors">
              <PhoneCall className="w-4 h-4" /> {T.callDriver}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
