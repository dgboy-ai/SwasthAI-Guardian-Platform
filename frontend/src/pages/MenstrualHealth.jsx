import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
  Package, MessageCircle, HeartPulse, BookOpen,
  Mic, AlertTriangle, CheckCircle, Send, X,
  Droplets, Zap, PhoneCall, MapPin, ShieldCheck,
  Bot, User, Loader, WifiOff, BookMarked, CheckCircle2, Calendar,
  Navigation, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

/* ── Pad Request ── */
function PadRequest() {
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

    // Format location to be strictly text-based as requested (no coordinates)
    try {
      await api.post('/villager/pad-request', { village });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'No Internet? Please tell your ASHA worker directly if you need pads immediately.');
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

/* ── Groq RAG-Grounded Health Assistant ──────────────────────────────────── */
// IEEE Tristha Track: Grounded Q&A — every reply shows clinical source citations
const OFFLINE_TIPS_BY_LANG = {
  en: [
    { q: 'Heavy bleeding?', a: 'Change pad every hour → Go to hospital now.', src: 'FOGSI Guidelines 2020', urgency: 'P1' },
    { q: 'Severe period pain?', a: 'Take paracetamol or use a hot water bag. If pain is unbearable, see a doctor.', src: 'WHO Reproductive Health', urgency: 'P3' },
    { q: 'How often change pads?', a: 'Every 4-6 hours. Even if flow is light, change regularly to prevent infections.', src: 'MoHFW MHM Scheme 2023', urgency: 'P4' },
    { q: 'Iron-rich foods?', a: 'Jaggery (gur), spinach (palak), lentils, dates, and sesame seeds to replenish lost blood.', src: 'ICMR Dietary Guidelines', urgency: 'P4' },
    { q: 'Prevent rashes & itch?', a: 'Keep genital area clean and dry. Avoid scented soaps; use mild clean water only.', src: 'UNICEF Hygiene Guidelines', urgency: 'P4' },
    { q: 'Irregular/missed periods?', a: 'Common causes include stress, poor diet, or thyroid issues. Track for 3 cycles and visit nearest clinic.', src: 'FOGSI Guidelines 2021', urgency: 'P4' },
    { q: 'Using cloth instead of pads?', a: 'Wash cloth with soap and clean water. Always dry it in direct sunlight to kill bacteria.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'Foul smell or unusual discharge?', a: 'This could be an infection. Do not ignore it. See a doctor or ASHA worker immediately.', src: 'MoHFW Guidelines', urgency: 'P2' },
    { q: 'Can I take a bath during periods?', a: 'Yes! Daily bathing with warm water reduces cramps and keeps you clean and healthy.', src: 'WHO Hygiene Guidelines', urgency: 'P4' },
    { q: 'Can I eat sour food or enter the kitchen?', a: 'These are myths! You can eat all regular healthy foods (curd, pickles) and do all normal activities.', src: 'FOGSI Fact Check', urgency: 'P4' },
  ],
  hi: [
    { q: 'बहुत भारी रक्तस्राव (Heavy bleeding)?', a: 'यदि हर घंटे पैड बदलना पड़े → तुरंत अस्पताल जाएं।', src: 'FOGSI गाइडलाइंस 2020', urgency: 'P1' },
    { q: 'पीरियड्स में तेज दर्द?', a: 'गर्म पानी की थैली से सिकाई करें या पैरासिटामोल लें। दर्द असहनीय हो तो डॉक्टर से मिलें।', src: 'WHO रीप्रोडक्टिव हेल्थ', urgency: 'P3' },
    { q: 'पैड कितनी बार बदलना चाहिए?', a: 'हर 4-6 घंटे में। भले ही खून का बहाव कम हो, इन्फेक्शन से बचने के लिए पैड बदलें।', src: 'स्वास्थ्य मंत्रालय MHM योजना 2023', urgency: 'P4' },
    { q: 'आयरन से भरपूर खाद्य पदार्थ?', a: 'शरीर में खून बढ़ाने के लिए गुड़, पालक, दालें, खजूर और तिल खाएं।', src: 'ICMR आहार दिशानिर्देश', urgency: 'P4' },
    { q: 'खुजली और रैशेज से कैसे बचें?', a: 'प्राइवेट अंगों को साफ और सूखा रखें। खुशबूदार साबुन का प्रयोग न करें, केवल साफ पानी का उपयोग करें।', src: 'यूनिसेफ स्वच्छता गाइडलाइंस', urgency: 'P4' },
    { q: 'अनियमित या छूटे हुए पीरियड्स?', a: 'तनाव, खराब खानपान या थायराइड इसके कारण हो सकते हैं। 3 महीनों तक ट्रैक करें और डॉक्टर से सलाह लें।', src: 'FOGSI गाइडलाइंस 2021', urgency: 'P4' },
    { q: 'पैड की जगह कपड़े का उपयोग?', a: 'कपड़े को साबुन और साफ पानी से धोएं। कीटाणुओं को मारने के लिए इसे हमेशा सीधी धूप में सुखाएं।', src: 'यूनिसेफ MHM 2019', urgency: 'P4' },
    { q: 'दुर्गंध या असामान्य सफेद पानी?', a: 'यह इन्फेक्शन हो सकता है। इसे नजरअंदाज न करें। तुरंत डॉक्टर या आशा कार्यकर्ता से मिलें।', src: 'स्वास्थ्य मंत्रालय गाइडलाइंस', urgency: 'P2' },
    { q: 'क्या पीरियड्स में नहाना चाहिए?', a: 'हाँ! रोजाना गुनगुने पानी से नहाने से दर्द कम होता है और शरीर साफ व स्वस्थ रहता है।', src: 'WHO स्वच्छता गाइडलाइंस', urgency: 'P4' },
    { q: 'खट्टी चीजें खाना या रसोई में जाना?', a: 'यह केवल अंधविश्वास है! आप सभी सामान्य पौष्टिक भोजन (दही, अचार) खा सकती हैं और रोजमर्रा के काम कर सकती हैं।', src: 'FOGSI फैक्ट चेक', urgency: 'P4' },
  ],
  mr: [
    { q: 'अति रक्तस्राव (Heavy bleeding)?', a: 'दर तासाला पॅड बदलावे लागत असल्यास → ताबडतोब रुग्णालयात जा.', src: 'FOGSI मार्गदर्शक तत्वे 2020', urgency: 'P1' },
    { q: 'मासिक पाळीचा तीव्र त्रास / पोटदुखी?', a: 'कोमट पाण्याचा शेक घ्या किंवा पॅरासिटामॉल घ्या. जास्त त्रास असल्यास डॉक्टरांना दाखवा.', src: 'WHO पुनरुत्पादक आरोग्य', urgency: 'P3' },
    { q: 'पॅड किती वेळाने बदलावे?', a: 'दर ४ ते ६ तासांनी. रक्तस्राव कमी असला तरी संसर्ग टाळण्यासाठी नियमित पॅड बदला.', src: 'आरोग्य मंत्रालय MHM योजना 2023', urgency: 'P4' },
    { q: 'लोहयुक्त (Iron) अन्नपदार्थ कोणते?', a: 'रक्ताची कमतरता भरून काढण्यासाठी गूळ, पालक, डाळी, खजूर आणि तीळ खा.', src: 'ICMR आहार नियमावली', urgency: 'P4' },
    { q: 'रॅशेस आणि खाज कशी टाळावी?', a: 'गुप्तभाग स्वच्छ आणि कोरडा ठेवा. सुगंधी साबण वापरू नका, फक्त स्वच्छ पाण्याचा वापर करा.', src: 'युनिसेफ स्वच्छता मार्गदर्शक', urgency: 'P4' },
    { q: 'अनियमित मासिक पाळी?', a: 'ताणतणाव, अपुरा आहार किंवा थायरॉईडमुळे पाळी अनियमित होऊ शकते. ३ महिने निरीक्षण करा आणि डॉक्टरांचा सल्ला घ्या.', src: 'FOGSI मार्गदर्शक तत्वे 2021', urgency: 'P4' },
    { q: 'पॅडऐवजी कापड वापरताय?', a: 'कापड साबण आणि स्वच्छ पाण्याने धुवा. जंतू नष्ट करण्यासाठी ते नेहमी थेट उन्हात वाळवा.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'दुर्गंधी किंवा असामान्य पांढरा स्राव?', a: 'हा संसर्ग (इन्फेक्शन) असू शकतो. याकडे दुर्लक्ष करू नका. ताबडतोब डॉक्टर किंवा आशा सेविकेला भेटा.', src: 'आरोग्य मंत्रालय मार्गदर्शक तत्वे', urgency: 'P2' },
    { q: 'मासिक पाळीत आंघोळ करावी का?', a: 'होय! रोज कोमट पाण्याने आंघोळ केल्याने वेदना कमी होतात आणि शरीर स्वच्छ व निरोगी राहते.', src: 'WHO स्वच्छता मार्गदर्शक', urgency: 'P4' },
    { q: 'आंबट पदार्थ खाणे किंवा स्वयंपाकघरात जाणे?', a: 'हा फक्त गैरसमज आहे! तुम्ही सर्व सामान्य पौष्टिक आहार (दही, लोणचे) खाऊ शकता आणि रोजची कामे करू शकता.', src: 'FOGSI फॅक्ट चेक', urgency: 'P4' },
  ],
  ta: [
    { q: 'அதிக இரத்தப்போக்கு?', a: 'ஒவ்வொரு மணி நேரமும் பேட் மாற்ற நேர்ந்தால் → உடனடியாக மருத்துவமனைக்குச் செல்லவும்.', src: 'FOGSI வழிகாட்டுதல்கள் 2020', urgency: 'P1' },
    { q: 'கடுமையான மாதவிடாய் வலி?', a: 'வெந்நீர் ஒத்தடம் கொடுக்கவும் அல்லது பாராசிட்டமால் உட்கொள்ளவும். வலி தாங்க முடியாவிட்டால் மருத்துவரை அணுகவும்.', src: 'WHO இனப்பெருக்க ஆரோக்கியம்', urgency: 'P3' },
    { q: 'எவ்வளவு நேரத்திற்கு ஒருமுறை பேட் மாற்ற வேண்டும்?', a: 'ஒவ்வொரு 4-6 மணி நேரத்திற்கு ஒருமுறை. இரத்தம் குறைவாக இருந்தாலும் தொற்றைத் தவிர்க்க மாற்றவும்.', src: 'சுகாதார அமைச்சகம் MHM திட்டம் 2023', urgency: 'P4' },
    { q: 'இரும்புச்சத்து நிறைந்த உணவுகள்?', a: 'இரத்த சோகையைத் தடுக்க வெல்லம், கீரை, பருப்பு வகைகள், பேரீச்சம்பழம் மற்றும் எள் சாப்பிடவும்.', src: 'ICMR உணவு வழிகாட்டி', urgency: 'P4' },
    { q: 'அரிப்பு மற்றும் தடிப்புகளைத் தடுப்பது எப்படி?', a: 'உறுப்புகளை சுத்தமாகவும் உலர்ந்ததாகவும் வைத்திருங்கள். வாசனை சோப்புகளைத் தவிர்த்து, சுத்தமான தண்ணீரை மட்டும் பயன்படுத்தவும்.', src: 'யுனிசெப் சுகாதார வழிகாட்டுதல்கள்', urgency: 'P4' },
    { q: 'முறையற்ற மாதவிடாய் சுழற்சி?', a: 'மன அழுத்தம், ஊட்டச்சத்து குறைபாடு அல்லது தைராய்டு இதற்கு காரணமாக இருக்கலாம். 3 மாதங்கள் கண்காணித்து மருத்துவரை அணுகவும்.', src: 'FOGSI வழிகாட்டுதல்கள் 2021', urgency: 'P4' },
    { q: 'பேட்-க்கு பதிலாக துணி பயன்படுத்துகிறீர்களா?', a: 'துணியை சோப்பு மற்றும் சுத்தமான தண்ணீரால் கழுவவும். கிருமிகளை அழிக்க எப்போதும் நேரடி சூரிய ஒளியில் காயவைக்கவும்.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'துர்நாற்றம் அல்லது அசாதாரண வெள்ளைப்படுதல்?', a: 'இது தொற்றாக இருக்கலாம். இதை புறக்கணிக்காதீர்கள். உடனடியாக மருத்துவர் அல்லது ஆஷா பணியாளரை அணுகவும்.', src: 'சுகாதார அமைச்சகம் வழிகாட்டுதல்கள்', urgency: 'P2' },
    { q: 'மாதவிடாய் காலத்தில் குளிக்கலாமா?', a: 'ஆம்! தினமும் வெதுவெதுப்பான நீரில் குளிப்பது வலியைக் குறைத்து, உங்களை சுத்தமாகவும் ஆரோக்கியமாகவும் வைத்திருக்கும்.', src: 'WHO சுகாதார வழிகாட்டுதல்கள்', urgency: 'P4' },
    { q: 'புளிப்பான உணவுகள் சாப்பிடலாமா அல்லது சமையலறைக்குச் செல்லலாமா?', a: 'இவை மூடநம்பிக்கைகள்! நீங்கள் அனைத்து சாதாரண சத்தான உணவுகளையும் (தயிர், ஊறகாய்) சாப்பிடலாம் மற்றும் வழக்கமான வேலைகளை செய்யலாம்.', src: 'FOGSI உண்மை சோதனை', urgency: 'P4' },
  ],
  te: [
    { q: 'అధిక రక్తస్రావం (Heavy bleeding)?', a: 'ప్రతి గంటకూ ప్యాడ్ మార్చాల్సి వస్తే → వెంటనే ఆసుపత్రికి వెళ్ళండి.', src: 'FOGSI నిబంధనలు 2020', urgency: 'P1' },
    { q: 'తీవ్రమైన పీరియడ్స్ నొప్పి?', a: 'వేడి నీటి సంచితో కాపడం పెట్టండి లేదా పారాసిటమాల్ వాడండి. నొప్పి భరించలేకపోతే డాక్టర్‌ను సంప్రదించండి.', src: 'WHO ప్రత్యుత్పత్తి ఆరోగ్యం', urgency: 'P3' },
    { q: 'ప్యాడ్ ఎన్ని గంటలకు ఒకసారి మార్చాలి?', a: 'ప్రతి 4-6 గంటలకు.రక్తస్రావం తక్కువగా ఉన్నా ఇన్ఫెక్షన్లు రాకుండా క్రమంతప్పకుండా మార్చాలి.', src: 'ఆరోగ్య శాఖ MHM పథకం 2023', urgency: 'P4' },
    { q: 'ఐరన్ (ఇనుము) ఎక్కువగా ఉండే ఆహారాలు?', a: 'రక్తాన్ని పెంచడానికి బెల్లం, పాలకూర, పప్పుధాన్యాలు, ఖర్జూరం మరియు నువ్వులు తీసుకోండి.', src: 'ICMR డైటరీ గైడ్‌లైన్స్', urgency: 'P4' },
    { q: 'దురద మరియు రాషెస్ రాకుండా ఏం చేయాలి?', a: 'రహస్య భాగాలను శుభ్రంగా, పొడిగా ఉంచుకోండి. వాసన గల సబ్బులను వాడకండి, కేవలం శుభ్రమైన నీటితో కడగాలి.', src: 'యునిసెఫ్ పరిశుభ్రత నిబంధనలు', urgency: 'P4' },
    { q: 'క్రమం లేని బహిష్టు సమస్య?', a: 'మానసిక ఒత్తిడి, సరిపడా ఆహారం తీసుకోకపోవడం లేదా థైరాయిడ్ వల్ల కావచ్చు. 3 నెలలు గమనించి డాక్టర్‌ను సంప్రదించండి.', src: 'FOGSI నిబంధనలు 2021', urgency: 'P4' },
    { q: 'ప్యాడ్‌కు బదులుగా వస్త్రం వాడుతున్నారా?', a: 'వస్త్రాన్ని సబ్బు మరియు శుభ్రమైన నీటితో కడగాలి. సూక్ష్మక్రిములను చంపడానికి ఎల్లప్పుడూ ప్రత్యక్ష సూర్యకాంతిలో ఆరబెట్టండి.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'దుర్వాసన లేదా అసాధారణ ఉత్సర్గ?', a: 'ఇది ఇన్ఫెక్షన్ కావచ్చు. దీనిని విస్మరించవద్దు. వెంటనే డాక్టర్ లేదా ఆశా కార్యకర్తను సంప్రదించండి.', src: 'ఆరోగ్య శాఖ నిబంధనలు', urgency: 'P2' },
    { q: 'పీరియడ్స్ సమయంలో స్నానం చేయవచ్చా?', a: 'అవును! రోజూ గోరువెచ్చని నీటితో స్నానం చేయడం వల్ల నొప్పి తగ్గుతుంది మరియు మీరు శుభ్రంగా, ఆరోగ్యంగా ఉంటారు.', src: 'WHO పరిశుభ్రత నిబంధనలు', urgency: 'P4' },
    { q: 'పుల్లటి ఆహారం తినవచ్చా లేదా వంటగదిలోకి వెళ్లవచ్చా?', a: 'ఇవి కేవలం అపోహలు! మీరు అన్ని సాధారణ పౌష్టిక ఆహారాలు (పెరుగు, పచ్చళ్లు) తినవచ్చు మరియు రోజువారీ పనులు చేసుకోవచ్చు.', src: 'FOGSI ఫాక్ట్ చెక్', urgency: 'P4' },
  ],
  bn: [
    { q: 'অতিরিক্ত রক্তপাত (Heavy bleeding)?', a: 'প্রতি ঘন্টায় প্যাড পরিবর্তন করতে হলে → অবিলম্বে হাসপাতালে যান।', src: 'FOGSI গাইডলাইন্স ২০২০', urgency: 'P1' },
    { q: 'মাসিকের তীব্র ব্যথা?', a: 'গরম জলের ব্যাগ দিয়ে সেঁক দিন অথবা প্যারাসিটামল নিন। ব্যথা সহ্য না হলে ডাক্তার দেখান।', src: 'WHO প্রজনন স্বাস্থ্য', urgency: 'P3' },
    { q: 'কতক্ষণ পর পর প্যাড পরিবর্তন করা উচিত?', a: 'প্রতি ৪-৬ ঘন্টা পর পর। রক্তপাত কম হলেও ইনফেকশন এড়াতে নিয়মিত প্যাড পরিবর্তন করুন।', src: 'স্বাস্থ্য মন্ত্রক MHM স্কিম ২০২৩', urgency: 'P4' },
    { q: 'আয়রন সমৃদ্ধ খাবার?', a: 'রক্তের ঘাটতি পূরণ করতে গুড়, পালং শাক, ডাল, খেজুর এবং তিল খান।', src: 'ICMR খাদ্য নির্দেশিকা', urgency: 'P4' },
    { q: 'চুলকানি ও র‍্যাশ কীভাবে প্রতিরোধ করবেন?', a: 'প্রাইভেট অঙ্গ পরিষ্কার ও শুকনো রাখুন। সুগন্ধি সাবান এড়িয়ে চলুন, শুধুমাত্র পরিষ্কার জল ব্যবহার করুন।', src: 'ইউনিসেফ স্বাস্থ্যবিধি গাইডলাইন্স', urgency: 'P4' },
    { q: 'অনিয়মিত বা বন্ধ মাসিক?', a: 'মানসিক চাপ, অপুষ্টি বা থাইরয়েড এর কারণ হতে পারে। ৩ মাস ট্র্যাক করুন এবং চিকিৎসকের পরামর্শ নিন।', src: 'FOGSI গাইডলাইন্স ২০২১', urgency: 'P4' },
    { q: 'প্যাডের পরিবর্তে কাপড় ব্যবহার করছেন?', a: 'কাপড় সাবান এবং পরিষ্কার জল দিয়ে ধুয়ে নিন। জীবাণু ধ্বংস করতে সর্বদা সরাসরি সূর্যের আলোতে শুকান।', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'দুর্গন্ধ বা অস্বাভাবিক সাদা স্রাব?', a: 'এটি ইনফেকশন হতে পারে। এটিকে অবহেলা করবেন না। অবিলম্বে ডাক্তার বা আশা কর্মীর সাথে দেখা করুন।', src: 'স্বাস্থ্য মন্ত্রক গাইডলাইন্স', urgency: 'P2' },
    { q: 'মাসিকের সময় কি স্নান করা উচিত?', a: 'হ্যাঁ! প্রতিদিন হালকা গরম জলে স্নান করলে ব্যথা কমে এবং শরীর পরিষ্কার ও সুস্থ থাকে।', src: 'WHO স্বাস্থ্যবিধি গাইডলাইন্স', urgency: 'P4' },
    { q: 'টক খাবার খাওয়া বা রান্নাঘরে যাওয়া?', a: 'এগুলো কেবল কুসংস্কার! আপনি সমস্ত সাধারণ পুষ্টিকর খাবার (দই, আচার) খেতে পারেন এবং দৈনন্দিন কাজ করতে পারেন।', src: 'FOGSI ফ্যাক্ট চেক', urgency: 'P4' },
  ],
};

const OFFLINE_FALLBACK_CHAT_REPLIES = {
  en: "Hello! I am Sakhi. You are currently offline, so I cannot search for a detailed reply. Please check the verified offline tips above or contact your ASHA worker.",
  hi: "नमस्ते! मैं सखी हूँ। अभी आपका इंटरनेट ऑफलाइन है, इसलिए मैं पूरा जवाब नहीं खोज पा रही हूँ। कृपया ऊपर दिए गए वेरिफाइड टिप्स को देखें या अपनी आशा कार्यकर्ता से संपर्क करें।",
  mr: "नमस्ते! मी सखी आहे. सध्या तुमचे इंटरनेट बंद (offline) आहे, त्यामुळे मी सविस्तर उत्तर शोधू शकत नाही. कृपया वरील पडताळलेले सल्ले पहा किंवा तुमच्या आशा सेविकेशी संपर्क साधा.",
  ta: "வணக்கம்! நான் சகி. நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள், எனவே என்னால் விரிவான பதிலைத் தேட முடியவில்லை. தயవుசெய்து மேலே உள்ள சரிபார்க்கப்பட்ட ஆஃப்லைன் உதவிக்குறிப்புகளைப் பார்க்கவும் அல்லது உங்கள் ஆষা பணியாளரைத் தொடர்பு கொள்ளவும்.",
  te: "నమస్తే! నేను సఖిని. ప్రస్తుతం మీ ఇంటర్నెట్ ఆఫ్‌లైన్‌లో ఉంది, కాబట్టి నేను పూర్తి సమాధానాన్ని శోధించలేకపోతున్నాను. దయచేసి పైన పేర్కొన్న ధృవీకరించబడిన చిట్కాలను చూడండి లేదా మీ ఆశా కార్యకర్తను సంప్రదించండి.",
  bn: "নমস্কার! আমি সখী। আপনার ইন্টারনেট বর্তমানে অফলাইন রয়েছে, তাই আমি বিস্তারিত উত্তর খুঁজতে পারছি না। অনুগ্রহ করে উপরের যাচাইকৃত অফলাইন টিপসগুলি দেখুন বা আপনার আশা কর্মীর সাথে যোগাযোগ করুন।"
};

const URGENCY_COLORS = {
  P1: 'bg-red-50 border-red-200 text-red-700',
  P2: 'bg-orange-50 border-orange-200 text-orange-700',
  P3: 'bg-amber-50 border-amber-200 text-amber-700',
  P4: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const OFFLINE_KNOWLEDGE_HEADERS = {
  en: {
    title: 'No Internet — Using Offline Knowledge Base',
    subtitle: 'Verified WHO/MoHFW guidelines loaded on your device'
  },
  hi: {
    title: 'इंटरनेट नहीं है — ऑफलाइन ज्ञानकोश का उपयोग',
    subtitle: 'आपके डिवाइस पर लोड किए गए वेरिफाइड WHO/MoHFW दिशानिर्देश'
  },
  mr: {
    title: 'इंटरनेट नाही — ऑफलाइन ज्ञानकोश वापरत आहे',
    subtitle: 'तुमच्या उपकरणावर लोड केलेली अधिकृत WHO/MoHFW मार्गदर्शक तत्वे'
  },
  ta: {
    title: 'இணையம் இல்லை — ஆஃப்லைன் அறிவுத் தளத்தைப் பயன்படுத்துதல்',
    subtitle: 'உங்கள் சாதனத்தில் சரிபார்க்கப்பட்ட WHO/MoHFW வழிகாட்டுதல்கள்'
  },
  te: {
    title: 'ఇంటర్నెట్ లేదు — ఆఫ్‌లైన్ నాలెض్ బేస్ ఉపయోగించబడుతోంది',
    subtitle: 'మీ పరికరంలో లోడ్ చేయబడిన ధృవీకరించబడిన WHO/MoHFW మార్గదర్శకాలు'
  },
  bn: {
    title: 'ইন্টারনেট নেই — অফলাইন জ্ঞানকোষ ব্যবহার করা হচ্ছে',
    subtitle: 'আপনার ডিভাইসে লোড করা যাচাইকৃত WHO/MoHFW নির্দেশাবলী'
  }
};


function HealthAssistant() {
  const { lang, t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState([
    { role: 'ai', text: t.menstrual?.sakhi_welcome || "Hello! I'm Sakhi, your Women's Health Assistant. I'm here to answer any questions about menstrual health, hygiene, pain, or when to see a doctor. Everything you share is completely private. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sakhi speaks back! Voice response for rural low-literacy users.
  const speakResponse = (text, lang = 'hi-IN') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 300)); // Limit to 300 chars
    utterance.lang = lang;
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for female voice simulation

    // Dynamically select a premium female voice (Microsoft Neerja, Google Hindi Female, Swara, Heera, etc.)
    const voices = window.speechSynthesis.getVoices();
    const l = lang.toLowerCase().split('-')[0];
    
    // 1. Search specifically for "neerja" first for Hindi
    let femaleVoice = null;
    if (l === 'hi') {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith('hi') && 
        v.name.toLowerCase().includes('neerja')
      );
    }
    
    // 2. If not found, look for general premium female Hindi/regional voices
    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith(l) && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('swara') || 
         v.name.toLowerCase().includes('heera') || 
         v.name.toLowerCase().includes('kalpana') || 
         v.name.toLowerCase().includes('google') ||
         (v.name.toLowerCase().includes('microsoft') && 
          !v.name.toLowerCase().includes('david') && 
          !v.name.toLowerCase().includes('ravi') && 
          !v.name.toLowerCase().includes('karan') && 
          !v.name.toLowerCase().includes('hemant'))) // Exclude male Hemant voice
      );
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(l));
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('hazel') || 
        v.name.toLowerCase().includes('samantha')
      );
    }

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const userMsg = (overrideText || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // ── Local Offline Match Fallback ──────────────────────────────────
    const langVoiceMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
    const speakLang = langVoiceMap[lang] || 'hi-IN';
    const offlineTips = OFFLINE_TIPS_BY_LANG[lang] || OFFLINE_TIPS_BY_LANG['hi'];

    if (!isOnline) {
      setTimeout(() => {
        const cleanMsg = userMsg.toLowerCase();
        let matchedTip = null;
        
        if (cleanMsg.includes('pain') || cleanMsg.includes('dard') || cleanMsg.includes('cramp') || cleanMsg.includes('pet') || cleanMsg.includes('peth') || cleanMsg.includes('வலி') || cleanMsg.includes('నొప్పి') || cleanMsg.includes('ব্যথা') || cleanMsg.includes('पोटदुखी')) {
          matchedTip = offlineTips[1];
        } else if (cleanMsg.includes('heavy') || cleanMsg.includes('bleed') || cleanMsg.includes('khoon') || cleanMsg.includes('bahaw') || cleanMsg.includes('रक्त') || cleanMsg.includes('இரத்த') || cleanMsg.includes('రక్త') || cleanMsg.includes('রক্ত')) {
          matchedTip = offlineTips[0];
        } else if (cleanMsg.includes('often') || cleanMsg.includes('change') || cleanMsg.includes('pad') || cleanMsg.includes('hours') || cleanMsg.includes('ghante') || cleanMsg.includes('पॅड') || cleanMsg.includes('பேட்') || cleanMsg.includes('ప్యాడ్') || cleanMsg.includes('প্যাড')) {
          matchedTip = offlineTips[2];
        } else if (cleanMsg.includes('food') || cleanMsg.includes('iron') || cleanMsg.includes('eat') || cleanMsg.includes('diet') || cleanMsg.includes('nutrition') || cleanMsg.includes('पालक') || cleanMsg.includes('गुड़') || cleanMsg.includes('गूळ') || cleanMsg.includes('உணவு') || cleanMsg.includes('ఆహారం') || cleanMsg.includes('খাবার')) {
          matchedTip = offlineTips[3];
        } else if (cleanMsg.includes('rash') || cleanMsg.includes('itch') || cleanMsg.includes('clean') || cleanMsg.includes('khujli') || cleanMsg.includes('खुजली') || cleanMsg.includes('खाज') || cleanMsg.includes('அரிப்பு') || cleanMsg.includes('దురద') || cleanMsg.includes('চুলকানি')) {
          matchedTip = offlineTips[4];
        } else if (cleanMsg.includes('miss') || cleanMsg.includes('late') || cleanMsg.includes('irregular') || cleanMsg.includes('cycle') || cleanMsg.includes('deeri') || cleanMsg.includes('चक्र') || cleanMsg.includes('முறையற்ற') || cleanMsg.includes('క్రమం') || cleanMsg.includes('অনিয়মিত')) {
          matchedTip = offlineTips[5];
        } else if (cleanMsg.includes('cloth') || cleanMsg.includes('wash') || cleanMsg.includes('dry') || cleanMsg.includes('sun') || cleanMsg.includes('kapd') || cleanMsg.includes('dho') || cleanMsg.includes('sukha') || cleanMsg.includes('कापड') || cleanMsg.includes('துணி') || cleanMsg.includes('వస్త్రం') || cleanMsg.includes('কাপড়')) {
          matchedTip = offlineTips[6];
        } else if (cleanMsg.includes('smell') || cleanMsg.includes('foul') || cleanMsg.includes('white') || cleanMsg.includes('discharge') || cleanMsg.includes('infection') || cleanMsg.includes('badbu') || cleanMsg.includes('gandh') || cleanMsg.includes('safed') || cleanMsg.includes('pani') || cleanMsg.includes('दुर्गंध') || cleanMsg.includes('துர்நாற்றம்') || cleanMsg.includes('వాసన') || cleanMsg.includes('গন্ধ')) {
          matchedTip = offlineTips[7];
        } else if (cleanMsg.includes('bath') || cleanMsg.includes('bathe') || cleanMsg.includes('nahana') || cleanMsg.includes('snan') || cleanMsg.includes('आंघोळ') || cleanMsg.includes('குளிக்க') || cleanMsg.includes('స్నానం') || cleanMsg.includes('স্নান')) {
          matchedTip = offlineTips[8];
        } else if (cleanMsg.includes('sour') || cleanMsg.includes('pickle') || cleanMsg.includes('curd') || cleanMsg.includes('kitchen') || cleanMsg.includes('achar') || cleanMsg.includes('khatta') || cleanMsg.includes('rasoi') || cleanMsg.includes('myth') || cleanMsg.includes('अंधविश्वास') || cleanMsg.includes('लोणचे') || cleanMsg.includes('ஊறகாய்') || cleanMsg.includes('పుల్లటి') || cleanMsg.includes('আচার')) {
          matchedTip = offlineTips[9];
        }

        if (matchedTip) {
          setMessages(prev => [...prev, {
            role:    'ai',
            text:    `[Offline Mode] ${matchedTip.a}`,
            sources: [matchedTip.src],
            urgency: matchedTip.urgency,
          }]);
          if (matchedTip.urgency === 'P1' || matchedTip.urgency === 'P2' || matchedTip.urgency === 'P3') {
            speakResponse(matchedTip.a, speakLang);
          }
        } else {
          const fallbackText = OFFLINE_FALLBACK_CHAT_REPLIES[lang] || OFFLINE_FALLBACK_CHAT_REPLIES['hi'];
          setMessages(prev => [...prev, {
            role:    'ai',
            text:    fallbackText,
            sources: ["Sakhi Local Memory (Offline)"],
            urgency: "P4",
          }]);
          speakResponse(fallbackText, speakLang);
        }
        setLoading(false);
      }, 600);
      return;
    }

    try {
      // ── Call the grounded RAG endpoint ──────────────────────────────────
      const res = await api.post('/health-assistant', { message: userMsg });
      setMessages(prev => [...prev, {
        role:    'ai',
        text:    res.data.reply,
        sources: res.data.sources  || [],
        urgency: res.data.urgency  || 'P4',
      }]);
      // Auto-speak high-urgency responses (P1 and P2 are emergencies)
      if (res.data.urgency === 'P1' || res.data.urgency === 'P2') {
        speakResponse(res.data.reply, speakLang);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      // Try local fallback on network error/timeout
      const cleanMsg = userMsg.toLowerCase();
      let matchedTip = null;
      if (cleanMsg.includes('pain') || cleanMsg.includes('dard') || cleanMsg.includes('cramp') || cleanMsg.includes('pet') || cleanMsg.includes('peth') || cleanMsg.includes('வலி') || cleanMsg.includes('నొప్పి') || cleanMsg.includes('ব্যথা') || cleanMsg.includes('पोटदुखी')) {
        matchedTip = offlineTips[1];
      } else if (cleanMsg.includes('heavy') || cleanMsg.includes('bleed') || cleanMsg.includes('khoon') || cleanMsg.includes('bahaw') || cleanMsg.includes('रक्त') || cleanMsg.includes('இரத்த') || cleanMsg.includes('రక్త') || cleanMsg.includes('রক্ত')) {
        matchedTip = offlineTips[0];
      } else if (cleanMsg.includes('often') || cleanMsg.includes('change') || cleanMsg.includes('pad') || cleanMsg.includes('hours') || cleanMsg.includes('ghante') || cleanMsg.includes('पॅड') || cleanMsg.includes('பேட்') || cleanMsg.includes('ప్యాడ్') || cleanMsg.includes('প্যাড')) {
        matchedTip = offlineTips[2];
      } else if (cleanMsg.includes('food') || cleanMsg.includes('iron') || cleanMsg.includes('eat') || cleanMsg.includes('diet') || cleanMsg.includes('nutrition') || cleanMsg.includes('पालक') || cleanMsg.includes('गुड़') || cleanMsg.includes('गूळ') || cleanMsg.includes('உணவு') || cleanMsg.includes('ఆహారం') || cleanMsg.includes('খাবার')) {
        matchedTip = offlineTips[3];
      } else if (cleanMsg.includes('rash') || cleanMsg.includes('itch') || cleanMsg.includes('clean') || cleanMsg.includes('khujli') || cleanMsg.includes('खुजली') || cleanMsg.includes('खाज') || cleanMsg.includes('அரிப்பு') || cleanMsg.includes('దురద') || cleanMsg.includes('চুলকানি')) {
        matchedTip = offlineTips[4];
      } else if (cleanMsg.includes('miss') || cleanMsg.includes('late') || cleanMsg.includes('irregular') || cleanMsg.includes('cycle') || cleanMsg.includes('deeri') || cleanMsg.includes('चक्र') || cleanMsg.includes('முறையற்ற') || cleanMsg.includes('క్రమం') || cleanMsg.includes('অনিয়মিত')) {
        matchedTip = offlineTips[5];
      } else if (cleanMsg.includes('cloth') || cleanMsg.includes('wash') || cleanMsg.includes('dry') || cleanMsg.includes('sun') || cleanMsg.includes('kapd') || cleanMsg.includes('dho') || cleanMsg.includes('sukha') || cleanMsg.includes('कापड') || cleanMsg.includes('துணி') || cleanMsg.includes('వస్త్రం') || cleanMsg.includes('কাপড়')) {
        matchedTip = offlineTips[6];
      } else if (cleanMsg.includes('smell') || cleanMsg.includes('foul') || cleanMsg.includes('white') || cleanMsg.includes('discharge') || cleanMsg.includes('infection') || cleanMsg.includes('badbu') || cleanMsg.includes('gandh') || cleanMsg.includes('safed') || cleanMsg.includes('pani') || cleanMsg.includes('दुर्गंध') || cleanMsg.includes('துர்நாற்றம்') || cleanMsg.includes('వాసన') || cleanMsg.includes('গন্ধ')) {
        matchedTip = offlineTips[7];
      } else if (cleanMsg.includes('bath') || cleanMsg.includes('bathe') || cleanMsg.includes('nahana') || cleanMsg.includes('snan') || cleanMsg.includes('आंघोळ') || cleanMsg.includes('குளிக்க') || cleanMsg.includes('స్నానం') || cleanMsg.includes('স্নান')) {
        matchedTip = offlineTips[8];
      } else if (cleanMsg.includes('sour') || cleanMsg.includes('pickle') || cleanMsg.includes('curd') || cleanMsg.includes('kitchen') || cleanMsg.includes('achar') || cleanMsg.includes('khatta') || cleanMsg.includes('rasoi') || cleanMsg.includes('myth') || cleanMsg.includes('अंधविश्वास') || cleanMsg.includes('लोणचे') || cleanMsg.includes('ஊறகாய்') || cleanMsg.includes('పుల్లటి') || cleanMsg.includes('আচার')) {
        matchedTip = offlineTips[9];
      }

      if (matchedTip) {
        setMessages(prev => [...prev, {
          role:    'ai',
          text:    `[Connection Slow - Local Fallback] ${matchedTip.a}`,
          sources: [matchedTip.src],
          urgency: matchedTip.urgency,
        }]);
        speakResponse(matchedTip.a, speakLang);
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: t.menstrual?.sakhi_error || 'I could not process your question right now. Please try again, or contact your ASHA worker for immediate help.',
          isError: true,
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Voice input is not supported on this device. Please use Chrome or Edge.', isError: true }]);
      return;
    }

    try {
      const rec = new SR();
      const LANG_MAP = { hi: 'hi-IN', en: 'en-IN', ta: 'ta-IN', mr: 'mr-IN', te: 'te-IN', bn: 'bn-IN' };
      rec.lang = LANG_MAP[lang] || 'hi-IN';
      
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => { 
        const text = e.results[0][0].transcript;
        setInput(text); 
        setIsListening(false); 
        // Auto-send for a better "Assistant" experience
        if (text.trim()) {
          handleSend(text);
        }
      };
      rec.onerror = (e) => {
        console.error('[Sakhi Voice Error]', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setMessages(prev => [...prev, { role: 'ai', text: 'Microphone access denied. Please enable microphone permissions in your browser settings.', isError: true }]);
        }
      };
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch (err) {
      console.error('[Sakhi Start Error]', err);
      setIsListening(false);
    }
  };

  const suggestions = t.menstrual?.sakhi_suggestions || ['How do I manage period pain?', 'What is heavy bleeding?', 'How often should I change pads?', 'My periods are irregular'];

  return (
    <div className="flex flex-col">

      {/* ── OFFLINE FALLBACK KNOWLEDGE CARD ──────────────────────────────── */}
      {/* Shows verified WHO/MoHFW tips even with zero internet */}
      {!isOnline && (() => {
        const headerText = OFFLINE_KNOWLEDGE_HEADERS[lang] || OFFLINE_KNOWLEDGE_HEADERS['hi'];
        const activeOfflineTips = OFFLINE_TIPS_BY_LANG[lang] || OFFLINE_TIPS_BY_LANG['hi'];
        return (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-800">{headerText.title}</p>
                <p className="text-[10px] text-amber-500 font-medium">{headerText.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-amber-100">
              {activeOfflineTips.map((tip, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-black text-amber-900 mb-0.5">{tip.q}</p>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">{tip.a}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <BookMarked className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">📚 {tip.src}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

        {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="mb-4 p-2.5 sm:p-3 bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-rose-900 text-[10px] sm:text-xs uppercase tracking-widest leading-none sm:leading-normal">Sakhi-AI · Health Assistant</p>
          <p className="text-[8px] sm:text-[9px] text-rose-400 font-medium leading-none sm:leading-normal mt-0.5 sm:mt-0">Verified WHO/MoHFW guidelines</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {isSpeaking && (
            <button onClick={() => window.speechSynthesis.cancel()}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest animate-pulse">
              🔊 Speaking
            </button>
          )}
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span className={`text-[8px] sm:text-[10px] font-black uppercase ${isOnline ? 'text-emerald-700' : 'text-amber-600'}`}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── MESSAGES ─────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[420px] min-h-[250px]">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md shadow-rose-100">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="max-w-[85%] sm:max-w-[80%] space-y-1.5">
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[12px] sm:text-[13px] font-medium leading-relaxed relative ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-sm'
                  : m.isError
                  ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                  : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-sm'
              }`}>
                {m.text}
                {m.role === 'ai' && !m.isError && (
                  <div className="absolute -right-1.5 -top-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                )}
              </div>
              {/* ── CITATION CHIPS (Tristha Grounded Q&A) ───────────────────────── */}
              {m.role === 'ai' && !m.isError && (
                <div className="flex flex-wrap gap-1.5 pl-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-100">
                    Grounded Protocol Match
                  </span>
                  {m.urgency && m.urgency !== 'P4' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      URGENCY_COLORS[m.urgency] || URGENCY_COLORS.P4
                    }`}>
                      <Zap className="w-2 h-2" />{m.urgency}
                    </span>
                  )}
                  {(m.sources || []).map((src, si) => (
                    <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[8px] font-bold text-slate-400">
                      📚 {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
            )}
            {/* Speaker button for AI messages — rural voice accessibility */}
            {m.role === 'ai' && !m.isError && (
              <button
                onClick={() => speakResponse(m.text)}
                title="Listen to this response"
                className="w-6 h-6 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center shrink-0 mt-1 hover:bg-rose-100 transition-colors opacity-60 hover:opacity-100"
              >
                <span className="text-[10px]">🔊</span>
              </button>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
              <p className="text-[9px] text-slate-300 font-medium mt-1">Searching verified guidelines...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-100 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 p-2 bg-white border-2 border-slate-100 rounded-2xl focus-within:border-rose-300 transition-all relative z-10">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startVoice();
          }}
          className={`p-3 rounded-xl transition-all active:scale-90 relative z-20 ${
            isListening 
              ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-200' 
              : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
          }`}
          title="Speak now"
        >
          <Mic className="w-5 h-5" />
        </button>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={isOnline ? 'Ask me anything about your health...' : 'Ask Sakhi (Offline local memory active)...'}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 h-11" 
        />
        <button 
          type="button"
          onClick={() => handleSend()} 
          disabled={loading || !input.trim()}
          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

}

/* ── Symptom Checkup ── */

function MenstrualCheckup() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const questions = [
    { id: 'heavy',     label: 'Very heavy bleeding',            sub: 'Changing pad every 1-2 hours',     severe: true  },
    { id: 'pain',      label: 'Severe abdominal pain',          sub: 'Pain that stops daily activities',  severe: false },
    { id: 'dizzy',     label: 'Dizziness or fainting',          sub: 'Feeling lightheaded or weak',       severe: true  },
    { id: 'fever',     label: 'Fever with periods',             sub: 'Temperature above 38°C',            severe: true  },
    { id: 'irregular', label: 'Irregular or missed periods',    sub: 'Cycle shorter than 21 or longer than 35 days', severe: false },
    { id: 'clots',     label: 'Large blood clots',              sub: 'Clots larger than a coin',          severe: true  },
  ];

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const analyze = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const hasSevere = selected.some(id => questions.find(q => q.id === id)?.severe);
      if (hasSevere) setResult({ 
        type: 'danger', 
        title: 'Immediate Action Needed', 
        msg: 'These symptoms could be serious. Please call 108 (Free Ambulance) or find your ASHA worker immediately.',
        show108: true 
      });
      else if (selected.length > 0) setResult({ type: 'warning', title: 'Seek Advice', msg: 'These symptoms should be discussed with your ASHA worker today.' });
      else setResult({ type: 'safe', title: 'Doing Well', msg: 'No urgent symptoms. Remember to rest and drink plenty of water.' });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.symptom_title || 'Symptom Check'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.symptom_desc || 'Select any symptoms you are currently experiencing. This is not a diagnosis - always consult a doctor for medical advice.'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map(q => (
          <button key={q.id} onClick={() => toggle(q.id)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${selected.includes(q.id) ? 'bg-rose-50 border-rose-400' : 'bg-white border-slate-100 hover:border-rose-200'}`}>
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selected.includes(q.id) ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
              {selected.includes(q.id) && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-black leading-tight ${selected.includes(q.id) ? 'text-rose-900' : 'text-slate-700'}`}>{q.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{q.sub}</p>
            </div>
          </button>
        ))}
      </div>
      <button onClick={analyze} disabled={loading || selected.length === 0}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2">
        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : (t.menstrual?.check_btn || 'Check My Symptoms')}
      </button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border-2 ${result.type === 'danger' ? 'bg-red-50 border-red-200' : result.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              {result.type === 'danger' ? <AlertTriangle className="w-6 h-6 text-red-600" /> : result.type === 'warning' ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : <CheckCircle className="w-6 h-6 text-emerald-600" />}
              <h3 className={`font-black text-lg ${result.type === 'danger' ? 'text-red-900' : result.type === 'warning' ? 'text-amber-900' : 'text-emerald-900'}`}>{result.title}</h3>
            </div>
            <p className={`font-medium text-sm leading-relaxed ${result.type === 'danger' ? 'text-red-700' : result.type === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>{result.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Health Tips ── */
function HealthTips() {
  const { t } = useLanguage();
  const tips = [
    { icon: Droplets, color: 'bg-rose-50 text-rose-600', title: 'Change Pads Regularly', desc: 'Change your sanitary pad every 4–6 hours to prevent infections and odor, even if flow is light.' },
    { icon: HeartPulse, color: 'bg-emerald-50 text-emerald-600', title: 'Eat Iron-Rich Foods', desc: 'Include jaggery (gur), spinach, lentils, and dates in your diet to replenish iron lost during periods.' },
    { icon: Zap, color: 'bg-amber-50 text-amber-600', title: 'Stay Active & Rest', desc: 'Light walks can ease cramps. Rest is equally important — listen to your body and take breaks.' },
    { icon: ShieldCheck, color: 'bg-blue-50 text-blue-600', title: 'Wash Hands Often', desc: 'Always wash your hands with soap before and after changing pads to prevent bacterial infections.' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.tips_title || 'Health Tips'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.tips_desc || 'Simple, proven advice for your health and wellbeing during your period.'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map(t => (
          <div key={t.title} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center mb-4`}>
              <t.icon className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm mb-1">{t.title}</h3>
            <p className="text-slate-400 font-medium text-xs leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Subcomponent: Period Cycle Tracker ── */
function PeriodTracker() {
  const { t } = useLanguage();
  const [lastPeriod, setLastPeriod] = useState(localStorage.getItem('swasthai_last_period') || '');
  const [cycleLength] = useState(28); // defaulting to 28 days for rural simplicity

  const calculateNext = () => {
    if (!lastPeriod) return null;
    const date = new Date(lastPeriod);
    date.setDate(date.getDate() + cycleLength);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleSave = (e) => {
    const val = e.target.value;
    setLastPeriod(val);
    localStorage.setItem('swasthai_last_period', val);
  };

  const nextPeriod = calculateNext();

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.cycle_tracker || 'Cycle Tracker'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.cycle_desc || 'Track your periods to know when your next one is coming so you can be prepared.'}</p>
      </div>

      <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 text-center">
        <label className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-3">
          First day of your last period
        </label>
        <input 
          type="date" 
          value={lastPeriod} 
          onChange={handleSave}
          className="w-full max-w-xs mx-auto px-4 py-3 rounded-xl border border-rose-200 bg-white text-slate-700 font-bold focus:ring-4 focus:ring-rose-500/20 outline-none transition-all shadow-sm block"
        />
        
        {nextPeriod && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-200/50 border border-rose-100 mb-4">
              <Calendar className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">Expected Next Period</p>
            <p className="text-3xl font-black text-rose-900">{nextPeriod}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-rose-500 text-sm font-medium">
              <span className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
              <span>Based on a standard 28-day cycle</span>
            </div>
          </div>
        )}

        {!nextPeriod && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl border border-rose-100/50">
            <p className="text-rose-800/60 font-semibold text-sm">Select a date above to see your next expected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MenstrualHealth() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('assistant');
  const [showEmergency, setShowEmergency] = useState(false);

  const tabs = [
    { id: 'assistant', label: t.menstrual?.ai_assistant || 'AI Assistant',    icon: MessageCircle },
    { id: 'tracker',   label: t.menstrual?.cycle_tracker || 'Cycle Tracker',   icon: Calendar      },
    { id: 'checkup',   label: t.menstrual?.symptom_check || 'Symptom Check',   icon: HeartPulse    },
    { id: 'pads',      label: t.menstrual?.request_pads || 'Request Pads',    icon: Package       },
    { id: 'tips',      label: t.menstrual?.health_tips || 'Health Tips',     icon: BookOpen      },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="villager" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">

        {/* Header */}
        <header className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{t.menstrual?.safe_private || 'Safe & Private'}</p>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {t.menstrual?.title || "Women's Health"}
              </h1>
              <p className="text-slate-500 font-medium mt-1.5 sm:mt-2 text-xs sm:text-sm max-w-md leading-relaxed">
                {t.menstrual?.subtitle || 'AI health guidance, symptom checking, and free pad access - private and confidential.'}
              </p>
            </div>
            <button onClick={() => setShowEmergency(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 bg-rose-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all shrink-0">
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.menstrual?.emergency_help || 'Emergency Help'}
            </button>
          </div>
        </header>

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6 p-1 sm:p-1.5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-sm w-full sm:w-fit overflow-x-auto sm:overflow-x-visible no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
              <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-8 md:p-10 min-h-[350px] md:min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === 'assistant' && <HealthAssistant />}
              {activeTab === 'tracker'   && <PeriodTracker />}
              {activeTab === 'checkup'   && <MenstrualCheckup />}
              {activeTab === 'pads'      && <PadRequest />}
              {activeTab === 'tips'      && <HealthTips />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Emergency Modal — extracted to EmergencyModal component below */}
      <AnimatePresence>
        {showEmergency && (
          <EmergencyModal onClose={() => setShowEmergency(false)} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Emergency Modal (real ASHA alert — replaces fake window.alert) ─────────── */
function EmergencyModal({ onClose, t }) {
  const [alertState, setAlertState] = useState('idle'); // idle | sending | sent | error
  const [errorMsg,   setErrorMsg]   = useState('');

  const handleAlert = async () => {
    setAlertState('sending');
    setErrorMsg('');
    try {
      await api.post('/villager/emergency-alert', {
        alertType: 'menstrual_emergency',
        message:   "Villager pressed Emergency Help button in Women's Health section.",
      });
      setAlertState('sent');
      // Auto-close after 4 seconds on success
      setTimeout(() => { onClose(); setAlertState('idle'); }, 4000);
    } catch (err) {
      console.error('ASHA alert failed:', err);
      setAlertState('error');
      setErrorMsg(
        err.response?.data?.error ||
        'Could not reach server. Please call 108 directly — it is free.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-2xl">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">{t.menstrual?.emergency_title || 'Emergency Help'}</h3>
              <p className="text-xs text-slate-400 font-medium">Your ASHA worker will be notified immediately</p>
            </div>
          </div>
          {alertState !== 'sending' && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* SUCCESS STATE */}
        {alertState === 'sent' ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h4 className="font-black text-slate-900 text-xl mb-2">Alert Sent! ✅</h4>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4">
              Your ASHA worker has been notified and will contact you shortly. Stay calm — help is coming.
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest">Closing automatically...</span>
            </div>
          </motion.div>
        ) : (
          <>
            {/* ASHA Worker Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ASHA Worker</p>
                  <p className="font-black text-slate-900 text-sm">Your Village ASHA</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase">On Call</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              {t.menstrual?.emergency_desc || 'Press the button below to immediately alert your ASHA worker. She will call you and come to help.'}
            </p>

            {/* ERROR BANNER — shown when API fails */}
            {alertState === 'error' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-900 font-black text-sm">Alert Failed</p>
                  <p className="text-amber-700 font-medium text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* PRIMARY: Real backend ASHA alert */}
              <button
                onClick={handleAlert}
                disabled={alertState === 'sending'}
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {alertState === 'sending' ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Sending Alert...</>
                ) : (
                  <>{t.menstrual?.alert_asha || 'Alert My ASHA Worker Now'}</>
                )}
              </button>

              {/* SECONDARY: 108 direct call — always visible as safety net */}
              <a
                href="tel:108"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                <PhoneCall className="w-4 h-4" /> {t.menstrual?.call_ambulance || 'Call 108 — Free Ambulance'}
              </a>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
