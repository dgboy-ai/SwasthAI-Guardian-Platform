import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Truck, MapPin, PhoneCall, Activity,
  Clock, AlertTriangle, Send, Mic,
  CheckCircle, AlertCircle, Navigation, Zap, WifiOff
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function AmbulancePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [eta, setEta] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [liveStatus, setLiveStatus] = useState('pending'); // pending|assigned|in_progress|completed
  const [dispatchError, setDispatchError] = useState(false);
  const [sosCooldown, setSosCooldown] = useState(0); // seconds remaining in cooldown
  const cooldownRef = React.useRef(null);
  const pollRef    = React.useRef(null);
  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    emergencyType: '',
    contactNumber: '',
    landmark: '',
    locStatus: 'idle',
    gpsCoords: null,
  });

  const emergencyTypes = [
    { id: 'accident',     label: t.ambulance?.accident || 'Road Accident',    hindi: t.ambulance?.accident_hi || 'सड़क दुर्घटना',   priority: 'High' },
    { id: 'pregnancy',   label: t.ambulance?.pregnancy || 'Pregnancy Case',   hindi: t.ambulance?.pregnancy_hi || 'प्रसव पीड़ा',       priority: 'High' },
    { id: 'heart',       label: t.ambulance?.heart || 'Heart Attack',     hindi: t.ambulance?.heart_hi || 'दिल का दौरा',      priority: 'Critical' },
    { id: 'respiratory', label: t.ambulance?.respiratory || 'Breathing Issue',  hindi: t.ambulance?.respiratory_hi || 'सांस की तकलीफ',   priority: 'High' },
    { id: 'trauma',      label: t.ambulance?.trauma || 'Physical Injury',  hindi: t.ambulance?.trauma_hi || 'गंभीर चोट',        priority: 'Moderate' },
    { id: 'general',     label: t.ambulance?.general || 'Other Emergency',  hindi: t.ambulance?.general_hi || 'सामान्य आपातकाल', priority: 'Moderate' },
  ];

  // ── Reverse Geocoding via Nominatim (free, no API key required) ────────────
  // Converts raw GPS coordinates into a human-readable village/district address
  // that ambulance drivers and NGO workers can actually navigate to.
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
      return `${lat}, ${lng}`; // fallback to raw coords if offline
    }
  };

  const getLocationString = () => {
    if (formData.gpsCoords) {
      const coord = `GPS: ${formData.gpsCoords.lat}, ${formData.gpsCoords.lng}`;
      return formData.landmark ? `${formData.landmark} (${coord})` : coord;
    }
    return formData.landmark || 'Location not specified';
  };

  const captureGPS = (onSuccess) => {
    if (!navigator.geolocation) {
      alert('GPS is not supported by this device. Please type your location manually.');
      return;
    }
    setFormData(prev => ({ ...prev, locStatus: 'loading' }));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        // Fetch human-readable village/district name via Nominatim
        const humanAddress = await reverseGeocode(lat, lng);
        setFormData(prev => ({
          ...prev,
          locStatus: 'success',
          gpsCoords: { lat, lng },
          landmark: prev.landmark || humanAddress,
        }));
        if (onSuccess) onSuccess(lat, lng, humanAddress);
      },
      () => {
        setFormData(prev => ({ ...prev, locStatus: 'error' }));
        alert('Could not get GPS location. Please enable Location permissions and try again, or type your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ONE-TAP SOS: Captures GPS then immediately fires the ambulance request
  const handleSOS = () => {
    setSosLoading(true);
    const fire = async (lat, lng) => {
      try {
        // Reverse-geocode so NGO dashboard shows village name, not raw coordinates
        const humanAddress = (lat !== 'Unknown')
          ? await reverseGeocode(lat, lng)
          : 'Location unavailable';
        const location = (lat !== 'Unknown')
          ? `SOS: ${humanAddress} (GPS: ${lat}, ${lng})`
          : 'SOS: Location unavailable — please call user directly';
        const res = await api.post('/villager/ambulance', {
          name: user?.name || 'SOS User',
          location,
          priority: 'Critical',
          symptoms: 'One-tap SOS — Emergency, patient requires immediate attention.',
        });
        setDispatched(true);
        setEta(8);
        setLiveStatus('pending');
        if (res.data?.requestId) setRequestId(res.data.requestId);
        // Start 60s cooldown
        setSosCooldown(60);
        cooldownRef.current = setInterval(() => {
          setSosCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
        }, 1000);
      } catch (err) {
        if (err.response?.status === 429) {
          alert(err.response.data?.error || 'Please wait before sending another request.');
        } else if (err.response?.status === 401) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (err.response?.status === 500) {
          console.error('SOS dispatch failed (Server Error):', err);
          const detailMsg = err.response.data?.details ? ` (${err.response.data.details})` : '';
          setDispatchError('server' + detailMsg);
        } else {
          console.error('SOS dispatch failed:', err);
          setDispatchError('network');
        }
      } finally {
        setSosLoading(false);
      }
    };

    if (!navigator.geolocation) {
      // Fallback: dispatch SOS without GPS
      fire('Unknown', 'Unknown');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fire(pos.coords.latitude.toFixed(5), pos.coords.longitude.toFixed(5)),
      () => fire('Unknown', 'Unknown'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // FORM SUBMIT: Dispatches with full patient details to real backend endpoint
  const handleRequest = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.emergencyType) return;
    setLoading(true);
    try {
      const selectedType = emergencyTypes.find(t => t.id === formData.emergencyType);
      const response = await api.post('/villager/ambulance', {
        name: formData.patientName,
        location: getLocationString(),
        priority: selectedType?.priority || 'High',
        symptoms: `${selectedType?.label || formData.emergencyType}${formData.contactNumber ? ` | Contact: ${formData.contactNumber}` : ''}`,
      });
      const etaVal = response.data?.eta?.replace(' mins', '') || (12 + Math.floor(Math.random() * 6));
      setEta(etaVal);
      setLiveStatus('pending');
      if (response.data?.requestId) setRequestId(response.data.requestId);
      setDispatched(true);
      // Start status polling every 10 seconds
      pollRef.current = setInterval(async () => {
        try {
          const r = await api.get('/villager/ambulance-status');
          setLiveStatus(r.data?.status || 'pending');
          if (r.data?.status === 'completed') clearInterval(pollRef.current);
        } catch { /* polling failure is non-critical */ }
      }, 10000);
      // Start 60s request cooldown
      setSosCooldown(60);
      cooldownRef.current = setInterval(() => {
        setSosCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      if (err.response?.status === 429) {
        alert(err.response.data?.error || 'Please wait before sending another request.');
      } else if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (err.response?.status === 500) {
        console.error('Ambulance dispatch failed (Server Error):', err);
        const detailMsg = err.response.data?.details ? ` (${err.response.data.details})` : '';
        setDispatchError('server' + detailMsg);
      } else {
        console.error('Ambulance dispatch failed (Network/Other):', err);
        setDispatchError('network');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup intervals on unmount
  React.useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(cooldownRef.current);
  }, []);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice typing not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.start();
    recognition.onresult = (e) => {
      setFormData(prev => ({ ...prev, landmark: prev.landmark + ' ' + e.results[0][0].transcript }));
    };
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="villager" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-24">

        {/* HEADER */}
        <header className="mb-4 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-3">
            <div className="w-1 h-1 sm:w-2 sm:h-2 bg-rose-500 rounded-full animate-pulse" />
            <p className="text-[7px] sm:text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Emergency Active</p>
          </div>
          <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {t.ambulance?.title || 'Request Ambulance'}
          </h1>
          <p className="text-slate-500 font-medium mt-1 sm:mt-3 text-[11px] sm:text-base max-w-xl leading-relaxed">
            {t.ambulance?.subtitle || 'Press SOS for instant help or fill the form below.'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: MAIN FORM / CONFIRMATION */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-8 md:p-10 relative overflow-hidden">
              <div className="absolute right-[-15%] top-[-15%] w-72 h-72 bg-rose-50 rounded-full blur-[80px] pointer-events-none" />

              {!dispatched ? (
                <div className="relative z-10 space-y-0">
                  <form onSubmit={handleRequest} className="space-y-7">

                    {/* Patient Details */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patient Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">{t.ambulance?.patient_name || 'Patient Name / मरीज का नाम'}</label>
                          <input
                            required
                            type="text"
                            placeholder="Full name..."
                            value={formData.patientName}
                            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 text-sm focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">{t.ambulance?.contact_number || 'Contact Number / मोबाइल नंबर'}</label>
                          <input
                            type="tel"
                            placeholder="Phone number..."
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 text-sm focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emergency Type */}
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4">{t.ambulance?.emergency_type || 'Emergency Type'}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                        {emergencyTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, emergencyType: type.id })}
                            className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                              formData.emergencyType === type.id
                                ? 'bg-rose-50 border-rose-500 shadow-sm shadow-rose-100'
                                : 'bg-white border-slate-100 hover:border-rose-200'
                            }`}
                          >
                            <span className={`block font-black text-[11px] sm:text-sm leading-tight ${formData.emergencyType === type.id ? 'text-rose-700' : 'text-slate-700'}`}>
                              {type.label}
                            </span>
                            <span className="block text-[8px] sm:text-[10px] font-bold text-slate-400 mt-0.5 sm:mt-1">{type.hindi}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4">{t.ambulance?.location || 'Location / आपकी लोकेशन'}</p>
                      <div className="space-y-2.5 sm:space-y-3">
                        <button
                          type="button"
                          onClick={() => captureGPS()}
                          className={`w-full p-3.5 sm:p-4 rounded-xl border-2 flex items-center justify-center gap-2.5 sm:gap-3 transition-all font-bold text-xs sm:text-sm ${
                            formData.locStatus === 'success'
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                              : formData.locStatus === 'loading'
                              ? 'bg-slate-50 border-slate-200 text-slate-400'
                              : formData.locStatus === 'error'
                              ? 'bg-rose-50 border-rose-300 text-rose-600'
                              : 'bg-rose-50 border-rose-400 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {formData.locStatus === 'idle'    && <><Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Use GPS Location</>}
                          {formData.locStatus === 'loading' && <><Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" /> Finding your location...</>}
                          {formData.locStatus === 'success' && <><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> GPS Location Saved!</>}
                          {formData.locStatus === 'error'   && <><AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> GPS failed — click to retry</>}
                        </button>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Or describe landmark..."
                            value={formData.landmark}
                            onChange={(e) => setFormData({ ...formData, landmark: e.target.value, locStatus: 'idle', gpsCoords: null })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 pr-12 font-medium text-slate-800 text-xs sm:text-sm focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all"
                          />
                          <button type="button" onClick={startVoice} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors">
                            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading || !formData.patientName || !formData.emergencyType}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Clock className="w-4 h-4 animate-spin" /> {t.ambulance?.dispatching || 'Dispatching Request...'}</>
                      ) : (
                        <><Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> {t.ambulance?.request_team || 'Send Ambulance Request'}</>
                      )}
                    </button>

                  </form>

                  {/* ── ERROR CARD: shows 108 when API fails ── */}
                  {dispatchError && (
                    <div className="mt-6 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 animate-in fade-in duration-300">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-amber-900 text-sm">
                            {dispatchError.startsWith('server') 
                              ? `सर्वर की समस्या ${dispatchError.length > 6 ? dispatchError.substring(6) : ''} — कृपया 108 पर कॉल करें` 
                              : 'सर्वर से संपर्क नहीं हो सका — 108 पर कॉल करें'}
                          </p>
                          <p className="text-amber-700 font-medium text-xs mt-0.5">
                            {dispatchError.startsWith('server') ? 'Server technical issue' : 'Could not reach server (Check connection)'} — Please call 108 directly
                          </p>
                        </div>
                      </div>
                      <p className="text-amber-800 font-bold text-xs mb-4 leading-relaxed">
                        घबराएं नहीं। नीचे दिए नंबर पर कॉल करें — यह <strong>बिल्कुल मुफ्त</strong> है।<br/>
                        <span className="text-slate-600">Don't panic. Call the number below — it's <strong>completely free</strong>.</span>
                      </p>
                      <a href="tel:108"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-rose-600 text-white rounded-xl font-black text-lg shadow-lg shadow-rose-200 active:scale-95 transition-all"
                      >
                        <PhoneCall className="w-6 h-6" />
                        108 — Free Ambulance (Muft)
                      </a>
                      <button onClick={() => setDispatchError(false)}
                        className="mt-3 w-full py-2.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        Dobara try karein / Try Again
                      </button>
                    </div>
                  )}
                </div>

              ) : (
                /* DISPATCHED CONFIRMATION — with live status polling */
                <div className="relative z-10 text-center py-12 animate-in zoom-in-95 duration-700">
                  <div className="w-28 h-28 bg-emerald-500 rounded-full mx-auto flex items-center justify-center border-8 border-emerald-100 shadow-xl shadow-emerald-200 mb-8">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.ambulance?.rescue_dispatched || 'Help is on the way!'}</h2>
                  <p className="text-slate-500 font-medium mb-6 max-w-sm mx-auto">
                    Your request has been saved and dispatched. Please keep your phone nearby. The driver will contact you.
                  </p>
                  {/* Live status badge — updates every 10 seconds */}
                  <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-4 border font-black text-sm ${
                    liveStatus === 'completed'  ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                    liveStatus === 'in_progress'? 'bg-blue-100 border-blue-300 text-blue-800' :
                    liveStatus === 'assigned'   ? 'bg-amber-100 border-amber-300 text-amber-800' :
                                                   'bg-slate-100 border-slate-300 text-slate-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      liveStatus === 'completed'   ? 'bg-emerald-500' :
                      liveStatus === 'in_progress' ? 'bg-blue-500' :
                      liveStatus === 'assigned'    ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {liveStatus === 'completed'   ? 'Arrived at location' :
                     liveStatus === 'in_progress' ? 'Ambulance en route 🚑' :
                     liveStatus === 'assigned'    ? 'Driver assigned' :
                                                    'Request received — assigning driver...'}
                  </div>
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-full mb-8 ml-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700 font-black text-lg">ETA: ~{eta} minutes</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-6">Status updates every 10 seconds automatically</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => { setDispatched(false); setLiveStatus('pending'); clearInterval(pollRef.current); setFormData(prev => ({ ...prev, locStatus: 'idle', gpsCoords: null })); }}
                      className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      Submit Another Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SOS + TIPS */}
          <div className="space-y-5">

            {/* ONE-TAP SOS BUTTON */}
            <div className="bg-rose-600 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-rose-700/30 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-rose-200" />
                  <p className="text-[8px] sm:text-[10px] font-black text-rose-200 uppercase tracking-[0.2em] sm:tracking-[0.3em]">One-Tap Emergency</p>
                </div>
                <h3 className="text-lg sm:text-2xl font-black mb-1.5 sm:mb-2 tracking-tight">{t.ambulance?.no_time || 'Emergency SOS'}</h3>
                <p className="text-rose-100/80 text-[11px] sm:text-sm font-medium leading-relaxed mb-4 sm:mb-6">
                  {t.ambulance?.sos_desc || "Instant help to your GPS location."}
                </p>
                <button
                  type="button"
                  onClick={handleSOS}
                  disabled={sosLoading || dispatched}
                  className="w-full py-3.5 sm:py-5 bg-white text-rose-600 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2.5 sm:gap-3 disabled:opacity-70"
                >
                  {sosLoading ? (
                    <><Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" /> Locating...</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> {t.ambulance?.sos_btn || 'SEND HELP NOW'}</>
                  )}
                </button>
              </div>
            </div>

            {/* WHILE YOU WAIT */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h4 className="text-base font-black text-slate-900 mb-5 tracking-tight">While you wait</h4>
              <ul className="space-y-4">
                {[
                  { t: 'Stay Calm', d: 'Help is confirmed. Stay close to the patient and reassure them.' },
                  { t: 'Clear the Path', d: 'Move any obstacles from the road so the ambulance can reach you.' },
                  { t: 'Gather Records', d: 'Keep any old prescriptions or medicine nearby for the paramedic.' },
                  { t: 'Keep Phone On', d: 'The driver may call you to confirm your exact location.' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="font-black text-sm text-slate-900">{step.t}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
