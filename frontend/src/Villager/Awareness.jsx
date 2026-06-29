import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, BookOpen, Heart, Activity, AlertTriangle, Droplets,
  Baby, Zap, ChevronRight, X, Calendar, Phone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TIPS = [
  {
    id: 'maternal',
    icon: Heart,
    color: 'rose',
    en: { title: 'Maternal Nutrition', body: 'Take Iron & Folic Acid tablets daily in the 3rd trimester. Eat green vegetables, lentils, and dairy to support your baby\'s growth. Visit ASHA worker every month for BP and weight check.' },
    hi: { title: 'माँ का पोषण', body: 'तीसरी तिमाही में प्रतिदिन आयरन और फोलिक एसिड की गोली लें। हरी सब्जी, दाल और दूध खाएं। हर महीने ASHA कार्यकर्ता से BP और वजन जांचें।' },
    mr: { title: 'माता पोषण', body: 'तिसऱ्या तिमाहीत दररोज आयर्न व फॉलिक अॅसिडच्या गोळ्या घ्या. हिरव्या भाज्या, डाळी आणि दुग्धजन्य पदार्थ खा. दरमहा ASHA कार्यकर्त्याकडे BP व वजन तपासा.' },
    ta: { title: 'தாய் ஊட்டச்சத்து', body: 'மூன்றாவது மூன்று மாதங்களில் தினமும் இரும்பு & ஃபோலிக் அமிலம் மாத்திரை எடுக்கவும். பச்சை காய்கறிகள், பருப்பு சாப்பிடவும். மாதம் ஒரு முறை ASHA ஊழியரிடம் BP பரிசோதிக்கவும்.' },
    te: { title: 'మాతృ పోషణ', body: 'మూడవ త్రైమాసికంలో ప్రతిరోజూ ఐరన్ & ఫోలిక్ యాసిడ్ మాత్రలు వేసుకోండి. ఆకుకూరలు, పప్పు తినండి. నెలకు ఒకసారి ASHA కార్యకర్తను BP తనిఖీకి కలవండి.' },
    bn: { title: 'মাতৃ পুষ্টি', body: 'তৃতীয় ত্রৈমাসিকে প্রতিদিন আয়রন ও ফলিক অ্যাসিড ট্যাবলেট নিন। সবুজ শাকসবজি, ডাল এবং দুধ খান। মাসে একবার ASHA কর্মীর কাছে BP এবং ওজন পরীক্ষা করান।' },
  },
  {
    id: 'water',
    icon: Droplets,
    color: 'blue',
    en: { title: 'Safe Drinking Water', body: 'Always boil water for at least 5 minutes before drinking. Use ORS if anyone has diarrhea. Wash hands with soap before eating and after using the toilet.' },
    hi: { title: 'सुरक्षित पेयजल', body: 'पीने से पहले पानी को कम से कम 5 मिनट उबालें। दस्त होने पर ORS घोल दें। खाने से पहले और शौचालय के बाद साबुन से हाथ धोएं।' },
    mr: { title: 'सुरक्षित पिण्याचे पाणी', body: 'पिण्यापूर्वी पाणी कमीतकमी 5 मिनिटे उकळा. जुलाब झाल्यास ORS द्रावण द्या. जेवणापूर्वी व शौचालयानंतर साबणाने हात धुवा.' },
    ta: { title: 'பாதுகாப்பான குடிநீர்', body: 'குடிப்பதற்கு முன் குறைந்தது 5 நிமிடம் தண்ணீரை கொதிக்க வைக்கவும். வயிற்றுப்போக்கு இருந்தால் ORS கரைசல் கொடுக்கவும். சாப்பிடுவதற்கு முன் சோப்பால் கைகளை கழுவி.' },
    te: { title: 'సురక్షిత త్రాగునీరు', body: 'తాగే ముందు నీటిని కనీసం 5 నిమిషాలు మరిగించండి. విరేచనాలు అయితే ORS ద్రావణం ఇవ్వండి. తినే ముందు మరియు మరుగుదొడ్డి తర్వాత సోప్‌తో చేతులు కడగండి.' },
    bn: { title: 'নিরাপদ পানীয় জল', body: 'পান করার আগে কমপক্ষে ৫ মিনিট পানি ফুটান। ডায়রিয়া হলে ORS দিন। খাওয়ার আগে এবং টয়লেটের পরে সাবান দিয়ে হাত ধুন।' },
  },
  {
    id: 'vaccination',
    icon: Shield,
    color: 'emerald',
    en: { title: 'Child Vaccination', body: 'Children under 5 must complete Polio, BCG, DPT, and Measles vaccines. Free vaccines at the nearest PHC. ASHA worker will remind you of the schedule.' },
    hi: { title: 'बाल टीकाकरण', body: '5 वर्ष से कम बच्चों को पोलियो, BCG, DPT और खसरे का टीका जरूर लगवाएं। नजदीकी PHC में मुफ्त टीकाकरण होता है। ASHA कार्यकर्ता समय पर याद दिलाएगी।' },
    mr: { title: 'बाल लसीकरण', body: '5 वर्षाखालील मुलांना पोलिओ, BCG, DPT व गोवर लस आवश्यक. जवळच्या PHC मध्ये मोफत लसीकरण. ASHA कार्यकर्त्या वेळापत्रकाची आठवण करून देतील.' },
    ta: { title: 'குழந்தை தடுப்பூசி', body: '5 வயதுக்குட்பட்ட குழந்தைகளுக்கு போலியோ, BCG, DPT மற்றும் தட்டம்மை தடுப்பூசி அவசியம். அருகிலுள்ள PHC-ல் இலவச தடுப்பூசி. ASHA ஊழியர் அட்டவணையை நினைவூட்டுவார்கள்.' },
    te: { title: 'పిల్లల టీకాలు', body: '5 సంవత్సరాల కంటే తక్కువ పిల్లలకు పోలియో, BCG, DPT మరియు మీజిల్స్ టీకాలు తప్పనిసరి. సమీప PHCలో ఉచిత టీకాలు. ASHA కార్యకర్త షెడ్యూల్ గుర్తు చేస్తారు.' },
    bn: { title: 'শিশু টিকাদান', body: '৫ বছরের কম শিশুদের পোলিও, BCG, DPT এবং হাম টিকা নেওয়া আবশ্যক। নিকটতম PHC-তে বিনামূল্যে টিকা। ASHA কর্মী সময়সূচি মনে করিয়ে দেবেন।' },
  },
  {
    id: 'malaria',
    icon: Activity,
    color: 'amber',
    en: { title: 'Malaria Prevention', body: 'Sleep under a mosquito net every night. Drain stagnant water near your home. If you have fever + chills for more than 2 days, go to PHC for a free malaria blood test.' },
    hi: { title: 'मलेरिया बचाव', body: 'हर रात मच्छरदानी में सोएं। घर के पास खड़े पानी को हटाएं। 2 दिन से ज्यादा बुखार + ठंड हो तो PHC जाकर मुफ्त मलेरिया रक्त जांच करवाएं।' },
    mr: { title: 'मलेरिया प्रतिबंध', body: 'दररोज रात्री मच्छरदाणीखाली झोपा. घराजवळील साचलेले पाणी काढा. 2 दिवसांपेक्षा जास्त ताप + थंडी असल्यास PHC मध्ये मोफत मलेरिया रक्त तपासणी करा.' },
    ta: { title: 'மலேரியா தடுப்பு', body: 'ஒவ்வொரு இரவும் கொசு வலைக்கு அடியில் தூங்குங்கள். வீட்டின் அருகில் தேங்கிய நீரை அகற்றுங்கள். 2 நாட்களுக்கு மேல் காய்ச்சல் + குளிர் இருந்தால் PHC-ல் இலவச மலேரியா பரிசோதனை.' },
    te: { title: 'మలేరియా నివారణ', body: 'ప్రతి రాత్రి దోమ తెర కింద నిద్రించండి. ఇంటి దగ్గర నిలిచిన నీటిని తొలగించండి. 2 రోజులకు మించి జ్వరం + చలి ఉంటే PHCకి వెళ్ళి ఉచిత మలేరియా రక్త పరీక్ష చేయించండి.' },
    bn: { title: 'ম্যালেরিয়া প্রতিরোধ', body: 'প্রতি রাতে মশারির নিচে ঘুমান। বাড়ির কাছে জমে থাকা পানি সরান। ২ দিনের বেশি জ্বর + কাঁপুনি হলে PHC-তে বিনামূল্যে ম্যালেরিয়া রক্ত পরীক্ষা করুন।' },
  },
  {
    id: 'nutrition',
    icon: Baby,
    color: 'purple',
    en: { title: 'Child Nutrition (SAM/MAM)', body: 'If your child\'s arm (MUAC) is less than 11.5cm or they look very thin, visit an ASHA worker immediately. Free therapeutic food (RUTF) is available at Anganwadi centers.' },
    hi: { title: 'बच्चे का पोषण (SAM/MAM)', body: 'अगर बच्चे की बांह (MUAC) 11.5 सेमी से कम है या बच्चा बहुत दुबला दिखता है, तुरंत ASHA कार्यकर्ता को बताएं। आंगनवाड़ी केंद्र में मुफ्त RUTF फूड मिलता है।' },
    mr: { title: 'बाल पोषण (SAM/MAM)', body: 'मुलाचा दंड (MUAC) 11.5 सेमीपेक्षा कमी असल्यास किंवा खूप अशक्त दिसत असल्यास ASHA कार्यकर्त्याला त्वरित भेटा. अंगणवाडी केंद्रात मोफत RUTF अन्न मिळते.' },
    ta: { title: 'குழந்தை ஊட்டச்சத்து', body: 'குழந்தையின் கை (MUAC) 11.5செமீக்கும் குறைவாக இருந்தால் ASHA ஊழியரை உடனே சந்திக்கவும். அங்கன்வாடி மையத்தில் இலவச RUTF உணவு கிடைக்கும்.' },
    te: { title: 'పిల్లల పోషణ (SAM/MAM)', body: 'పిల్లల చేయి (MUAC) 11.5 సెంమీ కంటే తక్కువ ఉంటే వెంటనే ASHA కార్యకర్తను కలవండి. అంగన్‌వాడీ కేంద్రంలో ఉచిత RUTF ఆహారం లభిస్తుంది.' },
    bn: { title: 'শিশু পুষ্টি (SAM/MAM)', body: 'শিশুর বাহু (MUAC) ১১.৫ সেমির কম হলে বা খুব রোগা দেখালে সাথে সাথে ASHA কর্মীকে জানান। অঙ্গনওয়াড়ি কেন্দ্রে বিনামূল্যে RUTF খাবার পাওয়া যায়।' },
  },
  {
    id: 'hygiene',
    icon: Zap,
    color: 'teal',
    en: { title: 'Sanitation & Hygiene', body: 'Use toilet — open defecation spreads disease. Dispose garbage away from water sources. Wash fruits & vegetables before eating. Keep animals away from food and water.' },
    hi: { title: 'स्वच्छता और सफाई', body: 'शौचालय का उपयोग करें — खुले में शौच से बीमारी फैलती है। कचरा जल स्रोतों से दूर फेंकें। खाने से पहले फल-सब्जी धोएं। भोजन और पानी से जानवरों को दूर रखें।' },
    mr: { title: 'स्वच्छता', body: 'शौचालय वापरा — उघड्यावर शौच करण्याने रोग पसरतात. कचरा पाण्याच्या स्रोतांपासून दूर फेका. खाण्यापूर्वी फळे-भाज्या धुवा. प्राण्यांना अन्न व पाण्यापासून दूर ठेवा.' },
    ta: { title: 'சுகாதாரம்', body: 'கழிப்பறையை பயன்படுத்துங்கள் — திறந்தவெளி மலம் கழித்தல் நோயை பரப்பும். குப்பையை நீர் ஆதாரங்களிலிருந்து தூரமாக போடுங்கள். சாப்பிடுவதற்கு முன் பழங்கள் கழுவுங்கள்.' },
    te: { title: 'పరిశుభ్రత', body: 'మరుగుదొడ్డి వాడండి — బహిరంగ మలవిసర్జన వ్యాధిని వ్యాప్తి చేస్తుంది. చెత్తను నీటి వనరులకు దూరంగా పారవేయండి. తినే ముందు పండ్లు కూరగాయలు కడగండి.' },
    bn: { title: 'স্বাস্থ্যবিধি', body: 'টয়লেট ব্যবহার করুন — খোলামেলা মলত্যাগে রোগ ছড়ায়। পানির উৎস থেকে দূরে আবর্জনা ফেলুন। খাওয়ার আগে ফল ও সবজি ধুয়ে নিন। খাদ্য ও পানি থেকে পশু দূরে রাখুন।' },
  },
];

const COLOR_STYLES = {
  rose:    { icon: 'bg-rose-50 text-rose-600',    badge: 'bg-rose-100 text-rose-700',    border: 'border-rose-100',    hover: 'hover:border-rose-200' },
  blue:    { icon: 'bg-blue-50 text-blue-600',    badge: 'bg-blue-100 text-blue-700',    border: 'border-blue-100',    hover: 'hover:border-blue-200' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100', hover: 'hover:border-emerald-200' },
  amber:   { icon: 'bg-amber-50 text-amber-600',  badge: 'bg-amber-100 text-amber-700',  border: 'border-amber-100',  hover: 'hover:border-amber-200' },
  purple:  { icon: 'bg-purple-50 text-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-100', hover: 'hover:border-purple-200' },
  teal:    { icon: 'bg-teal-50 text-teal-600',    badge: 'bg-teal-100 text-teal-700',    border: 'border-teal-100',    hover: 'hover:border-teal-200' },
};

const LANG_LABELS = {
  en: 'Read More', hi: 'और पढ़ें', mr: 'अधिक वाचा', ta: 'மேலும் படிக்க', te: 'మరింత చదవండి', bn: 'আরও পড়ুন'
};

const ASHA_SCHEDULE = [
  { date: 'Jul 14', event: 'Polio Vaccination Drive — Village Square', icon: Shield },
  { date: 'Jul 21', event: 'Antenatal Checkup Camp — PHC Rampur', icon: Heart },
  { date: 'Aug 3',  event: 'Child Growth Monitoring — Anganwadi', icon: Baby },
  { date: 'Aug 12', event: 'Malaria Awareness + Blood Testing', icon: Activity },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardAnim  = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } } };

export default function Awareness() {
  const { lang } = useLanguage();
  const [openTip, setOpenTip] = useState(null);

  const l = lang || 'en';
  const readLabel = LANG_LABELS[l] || LANG_LABELS.en;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-[10px] mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Health Awareness Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {l === 'hi' ? 'स्वास्थ्य जागरूकता केंद्र'
              : l === 'mr' ? 'आरोग्य जागृती केंद्र'
              : l === 'ta' ? 'சுகாதார விழிப்புணர்வு மையம்'
              : l === 'te' ? 'ఆరోగ్య అవగాహన కేంద్రం'
              : l === 'bn' ? 'স্বাস্থ্য সচেতনতা কেন্দ্র'
              : 'Village Health Awareness'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            {l === 'hi' ? 'आपके और आपके परिवार के लिए सरल स्वास्थ्य सलाह।'
              : l === 'mr' ? 'तुमच्यासाठी सोपी आरोग्य माहिती.'
              : l === 'ta' ? 'உங்களுக்காக எளிய சுகாதார ஆலோசனை.'
              : l === 'te' ? 'మీ కోసం సులభమైన ఆరోగ్య సలహా.'
              : l === 'bn' ? 'আপনার জন্য সহজ স্বাস্থ্য পরামর্শ।'
              : 'Simple, actionable health tips for you and your family.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 space-y-10">

        {/* Tip Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {TIPS.map((tip) => {
            const styles = COLOR_STYLES[tip.color] || COLOR_STYLES.emerald;
            const content = tip[l] || tip.en;
            return (
              <motion.div
                key={tip.id}
                variants={cardAnim}
                whileHover={{ y: -3 }}
                onClick={() => setOpenTip(tip)}
                className={`bg-white border ${styles.border} ${styles.hover} rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${styles.icon}`}>
                  <tip.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2 leading-tight">{content.title}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">{content.body}</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider" style={{ color: tip.color === 'blue' ? '#2563EB' : tip.color === 'rose' ? '#E11D48' : tip.color === 'emerald' ? '#059669' : tip.color === 'amber' ? '#D97706' : tip.color === 'purple' ? '#7C3AED' : '#0D9488' }}>
                  {readLabel} <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ASHA Visit Schedule */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 bg-emerald-50">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
              {l === 'hi' ? 'ASHA दौरा अनुसूची'
                : l === 'mr' ? 'ASHA भेट वेळापत्रक'
                : l === 'ta' ? 'ASHA வருகை அட்டவணை'
                : l === 'te' ? 'ASHA సందర్శన సమయపట్టిక'
                : l === 'bn' ? 'ASHA পরিদর্শন সময়সূচি'
                : 'Upcoming ASHA Visits & Health Camps'}
            </h3>
            <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Rampur Village</span>
          </div>
          <div className="divide-y divide-slate-50">
            {ASHA_SCHEDULE.map((ev, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-14 text-center shrink-0">
                  <p className="text-[10px] font-black text-emerald-600 uppercase">{ev.date}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <ev.icon className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight">{ev.event}</p>
                <button className="ml-auto text-[9px] font-black text-emerald-600 uppercase px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors shrink-0">
                  {l === 'hi' ? 'याद दिलाएं' : l === 'mr' ? 'आठवण' : 'Remind'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Callout */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-black text-rose-900">
              {l === 'hi' ? 'आपातकाल में तुरंत 108 डायल करें' : l === 'mr' ? 'आणीबाणीत लगेच 108 डायल करा' : 'In Emergency — Call 108 Immediately'}
            </h4>
            <p className="text-xs text-rose-700 font-semibold mt-0.5">
              {l === 'hi' ? 'मुफ्त एम्बुलेंस — 24/7 उपलब्ध' : 'Free Ambulance Service — Available 24/7'}
            </p>
          </div>
          <a href="tel:108" className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-rose-700 transition-colors shrink-0">
            <Phone className="w-4 h-4" /> 108
          </a>
        </div>
      </div>

      {/* Tip Detail Modal */}
      {openTip && (() => {
        const styles = COLOR_STYLES[openTip.color] || COLOR_STYLES.emerald;
        const content = openTip[l] || openTip.en;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpenTip(null)}>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.icon}`}>
                  <openTip.icon className="w-5 h-5" />
                </div>
                <button onClick={() => setOpenTip(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-base font-black text-slate-900 mb-3">{content.title}</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">{content.body}</p>
              <div className={`mt-4 text-[10px] font-black uppercase px-3 py-1.5 rounded-full inline-flex ${styles.badge}`}>
                {l === 'hi' ? 'स्वास्थ्य सुझाव' : l === 'mr' ? 'आरोग्य सल्ला' : l === 'ta' ? 'சுகாதார குறிப்பு' : l === 'te' ? 'ఆరోగ్య చిట్కా' : l === 'bn' ? 'স্বাস্থ্য পরামর্শ' : 'Health Tip'}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
