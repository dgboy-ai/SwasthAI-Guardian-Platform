import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, HeartPulse, Activity, AlertTriangle, Baby, ChevronLeft, 
  Volume2, VolumeX, ShieldAlert, Sparkles, User, RefreshCw, Send, CheckCircle2,
  Trash2, Plus, Info, Check, HelpCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

// Code-split modular workflows imported here
import FeverWorkflow from './FeverWorkflow';
import PregnancyWorkflow from './PregnancyWorkflow';
import EmergencyWorkflow from './EmergencyWorkflow';
import SakhiWorkflow from './SakhiWorkflow';
import ChildWorkflow from './ChildWorkflow';

const speak = (text, lang = 'hi') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    // Aligned bilingual translations for Guided Care workflows
    const translationMap = {
      "Welcome to Guided Healthcare Mode. Tap any option to start checking your health.": "मार्गदर्शित स्वास्थ्य सेवा में आपका स्वागत है। जांच के लिए किसी भी विकल्प को दबाएं।",
      "Fever and viral check. Please answer the simple questions.": "बुखार और सर्दी जांच। कृपया सरल सवालों का जवाब दें।",
      "Pregnancy tracking. Monitor your blood pressure and blood sugar.": "गर्द्योगिकी और मातृत्व देखभाल। अपने रक्तचाप और शुगर की जांच करें।",
      "Emergency support. Tap the red button to call an ambulance.": "आपातकालीन सहायता। एम्बुलेंस बुलाने के लिए लाल बटन दबाएं।",
      "Speak to Sakhi. Ask your health queries.": "sikh-e-chat से बात करें। अपना सवाल पूछें।",
      "Child growth monitor. Enter child weight and height.": "बाल पोषण जांच। बच्चे का वजन और लंबाई दर्ज करें।",
      "Fever check. Press Next to start.": "बुखार जांच। शुरू करने के लिए अगला दबाएं।",
      "Do you have high fever, above 101 degrees?": "क्या आपको तेज़ बुखार है, एक सौ एक डिग्री से ऊपर?",
      "Are you shivering or feeling very cold?": "क्या आपको कंपकंपी लग रही है या बहुत ठंड लग रही है?",
      "Do you have severe joint pain or pain behind your eyes?": "क्या आपके जोड़ों में तेज़ दर्द है या आँखों के पीछे दर्द है?",
      "Do you have red spots or skin rashes?": "क्या आपके शरीर पर लाल चकत्ते या दाने हैं?",
      "Yes": "हाँ",
      "No": "नहीं",
      "Assessment complete.": "जांच पूरी हो चुकी है।"
    };

    const doSpeak = (availableVoices) => {
      const findHindiVoice = (list) => {
        return list.find(v => v.lang.includes('hi-IN') && v.name.toLowerCase().includes('neerja'))
            || list.find(v => v.lang.includes('hi-IN') && v.name.toLowerCase().includes('google'))
            || list.find(v => v.lang.includes('hi-IN'))
            || list.find(v => v.name.toLowerCase().includes('hindi'));
      };
      
      const hiVoice = findHindiVoice(availableVoices);
      const utterance = new SpeechSynthesisUtterance();
      
      if (hiVoice) {
        let speechText = text;
        if (translationMap[text]) {
          speechText = translationMap[text];
        } else {
          speechText = speechText
            .replace(/Potential condition:\s*Malaria/i, "संभावित बीमारी मलेरिया है")
            .replace(/Potential condition:\s*Dengue/i, "संभावित बीमारी डेंगू है")
            .replace(/Potential condition:\s*Chickenpox/i, "संभावित बीमारी चेचक है")
            .replace(/Potential condition:\s*Viral Fever & Cold/i, "संभावित बीमारी सामान्य वायरल बुखार है")
            .replace(/Advice:\s*/i, "सलाह: ")
            .replace(/Assessment complete\.\s*Risk:\s*High Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: अत्यंत उच्च।")
            .replace(/Assessment complete\.\s*Risk:\s*Medium Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: मध्यम।")
            .replace(/Assessment complete\.\s*Risk:\s*Low Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: सामान्य और सुरक्षित।")
            .replace(/ALERT:\s*Severe high blood pressure/i, "चेतावनी: आपका ब्लड प्रेशर बहुत अधिक है")
            .replace(/Warning:\s*Slightly high vitals/i, "सावधानी: आपके वाइटल्स थोड़े बढ़े हुए हैं")
            .replace(/Congratulations! Your pregnancy vitals are in the normal range/i, "बधाई हो, आपके वाइटल्स बिल्कुल सामान्य हैं");
        }
        utterance.text = speechText;
        utterance.voice = hiVoice;
        utterance.lang = 'hi-IN';
        utterance.rate = 0.85;
      } else {
        // Fallback to English voice and original English text
        utterance.text = text;
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
      }
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        doSpeak(window.speechSynthesis.getVoices());
      };
    }
  }
};

export default function GuidedHealthcareMode() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'fever', 'pregnancy', 'emergency', 'sakhi', 'child'
  const [voiceEnabled, setVoiceEnabled] = useState(false); // OFF by default — user must tap to enable

  // Fallback bilingual aligned text dictionary
  const dict = {
    title: lang === 'hi' ? 'मार्गदर्शित स्वास्थ्य सेवा मोड' : 'Guided Healthcare Mode',
    sub: lang === 'hi' ? 'सरल, बड़ी बटन, आवाज सहायता और पूर्ण रूप से ऑफलाइन सक्षम स्वास्थ्य सेवा' : 'Simple, large buttons, voice help & fully offline-capable healthcare',
    voiceOn: lang === 'hi' ? 'आवाज सहायता चालू' : 'Voice Help ON',
    voiceOff: lang === 'hi' ? 'आवाज सहायता बंद' : 'Voice Help OFF',
    back: lang === 'hi' ? 'वापस जाएं' : 'Go Back',
    feverTitle: lang === 'hi' ? 'बुखार / सर्दी' : 'Fever / Cold',
    feverDesc: lang === 'hi' ? 'तेज बुखार, मलेरिया या डेंगू की जांच करें' : 'Check for high fever, malaria, or dengue',
    pregTitle: lang === 'hi' ? 'गर्भावस्था देखभाल' : 'Pregnancy Tracker',
    pregDesc: lang === 'hi' ? 'ब्लड प्रेशर और जोखिम जांच (एएनसी)' : 'Blood pressure & risk screening (ANC)',
    emergTitle: lang === 'hi' ? 'आपातकालीन (SOS)' : 'Emergency (SOS)',
    emergDesc: lang === 'hi' ? 'एक-टैप एम्बुलेंस और प्राथमिक चिकित्सा' : 'One-tap Ambulance & first aid guide',
    sakhiTitle: lang === 'hi' ? 'सखी स्वास्थ चैट' : 'Sakhi Health Chat',
    sakhiDesc: lang === 'hi' ? 'आवाज से बीमारी और महिलाओं के स्वास्थ्य पर पूछें' : 'Voice-guided women\'s health companion',
    childTitle: lang === 'hi' ? 'बाल स्वास्थ्य जांच' : 'Child Growth Check',
    childDesc: lang === 'hi' ? 'वजन, लंबाई और पोषण स्तर जांचें' : 'Check child\'s nutrition & weight z-score'
  };

  useEffect(() => {
    if (voiceEnabled) {
      if (activeTab === 'menu') {
        speak(
          lang === 'hi' 
            ? 'मार्गदर्शित स्वास्थ्य सेवा में आपका स्वागत है। जांच के लिए किसी भी विकल्प को दबाएं।'
            : 'Welcome to Guided Healthcare Mode. Tap any option to start checking your health.',
          lang
        );
      }
    }
  }, [activeTab, voiceEnabled, lang]);

  const handleBackToMenu = () => {
    setActiveTab('menu');
  };

  const handleCardClick = (mode) => {
    setActiveTab(mode);
    if (voiceEnabled) {
      let phrase = '';
      if (mode === 'fever') phrase = lang === 'hi' ? 'बुखार और सर्दी जांच। कृपया सरल सवालों का जवाब दें।' : 'Fever and viral check. Please answer the simple questions.';
      if (mode === 'pregnancy') phrase = lang === 'hi' ? 'गर्भावस्था देखभाल। अपने बीपी और शुगर की जांच करें।' : 'Pregnancy tracking. Monitor your blood pressure and blood sugar.';
      if (mode === 'emergency') phrase = lang === 'hi' ? 'आपातकालीन सहायता। एम्बुलेंस बुलाने के लिए लाल बटन दबाएं।' : 'Emergency support. Tap the red button to call an ambulance.';
      if (mode === 'sakhi') phrase = lang === 'hi' ? 'सखी से बात करें। अपना सवाल पूछें।' : 'Speak to Sakhi. Ask your health queries.';
      if (mode === 'child') phrase = lang === 'hi' ? 'बाल पोषण जांच। बच्चे का वजन और लंबाई दर्ज करें।' : 'Child growth monitor. Enter child weight and height.';
      speak(phrase, lang);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-inter antialiased pb-24 text-slate-800">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" /> Easy Guided Mode
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {activeTab === 'menu' ? dict.title : dict[`${activeTab}Title`]}
            </h1>
            <p className="text-slate-400 font-bold text-xs sm:text-sm mt-2">
              {activeTab === 'menu' ? dict.sub : dict[`${activeTab}Desc`]}
            </p>
          </div>
          
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              speak(voiceEnabled ? 'Voice guide turned off.' : 'आवाज गाइड चालू हो गई है।', lang);
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 ${
              voiceEnabled 
                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
            }`}
            style={{ minHeight: '60px' }} // Big touch target
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            {voiceEnabled ? dict.voiceOn : dict.voiceOff}
          </button>
        </div>

        {/* WORKFLOW DISPATCHER */}
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div 
              key="menu" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Card 1: Fever */}
              <button 
                onClick={() => handleCardClick('fever')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-emerald-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-emerald-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-100 transition-colors" />
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.feverTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.feverDesc}</p>
                </div>
              </button>

              {/* Card 2: Pregnancy */}
              <button 
                onClick={() => handleCardClick('pregnancy')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-rose-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-rose-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-100 transition-colors" />
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Baby className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.pregTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.pregDesc}</p>
                </div>
              </button>

              {/* Card 3: Emergency */}
              <button 
                onClick={() => handleCardClick('emergency')}
                className="p-8 bg-rose-600 border border-rose-500 rounded-[2.5rem] shadow-lg shadow-rose-200 hover:shadow-2xl hover:shadow-rose-300 transition-all flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px] text-white"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-rose-500 rounded-full blur-[40px] pointer-events-none opacity-40 group-hover:scale-110 transition-transform" />
                <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-white/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black mb-1">{dict.emergTitle}</h2>
                  <p className="text-sm font-medium text-rose-50 leading-snug opacity-95">{dict.emergDesc}</p>
                </div>
              </button>

              {/* Card 4: Sakhi Chat */}
              <button 
                onClick={() => handleCardClick('sakhi')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-purple-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-purple-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-100 transition-colors" />
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.sakhiTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.sakhiDesc}</p>
                </div>
              </button>

              {/* Card 5: Child nutrition */}
              <button 
                onClick={() => handleCardClick('child')}
                className="md:col-span-2 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-blue-200 flex flex-row items-center justify-between text-left active:scale-[0.98] group relative overflow-hidden min-h-[140px]"
              >
                <div className="absolute right-[-5%] top-[-5%] w-60 h-60 bg-blue-50 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-100 transition-colors animate-pulse" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <HeartPulse className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.childTitle}</h2>
                    <p className="text-sm font-medium text-slate-500 leading-snug">{dict.childDesc}</p>
                  </div>
                </div>
                <div className="text-blue-600 font-black text-sm uppercase tracking-wider hidden sm:block shrink-0 px-6 py-3 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                  Open →
                </div>
              </button>
            </motion.div>
          )}

          {activeTab === 'fever' && (
            <FeverWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'pregnancy' && (
            <PregnancyWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'emergency' && (
            <EmergencyWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'sakhi' && (
            <SakhiWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'child' && (
            <ChildWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
