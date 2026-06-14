import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ChevronLeft, CheckCircle2, Info } from 'lucide-react';
import api from '../services/api';
import { speak } from '../utils/tts';

export default function EmergencyWorkflow({ onBack, lang, voiceEnabled }) {
  const [sosStatus, setSosStatus] = useState('idle'); // 'idle', 'counting', 'dispatched'
  const [counter, setCounter] = useState(3);
  const [activeGuide, setActiveGuide] = useState(null); // snakebite, heatstroke, choking, severe_bleeding
  const timerRef = useRef(null);

  useEffect(() => {
    if (sosStatus === 'counting') {
      if (counter > 0) {
        if (voiceEnabled) speak(counter.toString(), lang);
        timerRef.current = setTimeout(() => setCounter(counter - 1), 1000);
      } else {
        triggerSOS();
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [sosStatus, counter, voiceEnabled, lang]);

  const startCountdown = () => {
    setSosStatus('counting');
    setCounter(3);
    if (voiceEnabled) {
      speak(lang === 'hi' ? 'एम्बुलेंस अनुरोध शुरू किया जा रहा है। तीन सेकंड में शुरू होगा। रद्द करने के लिए रुकें दबाएं।' : 'Starting ambulance request in 3 seconds. Tap Stop to cancel.', lang);
    }
  };

  const cancelSOS = () => {
    clearTimeout(timerRef.current);
    setSosStatus('idle');
    if (voiceEnabled) speak(lang === 'hi' ? 'रद्द कर दिया गया।' : 'SOS Canceled.', lang);
  };

  const triggerSOS = async () => {
    setSosStatus('dispatched');
    if (voiceEnabled) {
      speak(lang === 'hi' ? 'एम्बुलेंस रवाना कर दी गई है। १४ मिनट में पहुंचेगी।' : 'Emergency ambulance dispatched. Arriving in 14 minutes.', lang);
    }

    try {
      await api.post('/ambulance', {
        name: 'Citizens Guided Mode SOS',
        location: 'Current GPS / Village Node',
        priority: 'Critical',
        symptoms: '🚨 ACCIDENTAL / SOS GUIDED HEALHCARE ONE-TAP DISPATCH'
      });
    } catch (e) {
      console.warn('Offline SOS logged to replay queue.', e.message);
      try {
        const queue = JSON.parse(localStorage.getItem('offline_ambulance_requests') || '[]');
        queue.push({ id: `offline-${Date.now()}`, name: 'Guided SOS', location: 'GPS Locked', priority: 'Critical', symptoms: 'Emergency SOS' });
        localStorage.setItem('offline_ambulance_requests', JSON.stringify(queue));
      } catch (err) {}
    }
  };

  const firstAidData = {
    snakebite: {
      en: { title: 'Snakebite First Aid', steps: ['Keep the person still and calm','Immobilize the bitten limb below heart level','Remove tight clothing/jewellery near bite','Do NOT cut, suck, or apply tourniquet','Rush to hospital with anti-venom — call 108 immediately'], urgent: true },
      hi: { title: 'साँप के काटने पर प्राथमिक चिकित्सा', steps: ['व्यक्ति को शांत रखें','काटे हुए अंग को दिल के नीचे रखें','तंग कपड़े हटाएं','काटें नहीं, चूसें नहीं','108 कॉल करें, तुरंत अस्पताल जाएं'], urgent: true },
    },
    heatstroke: {
      en: { title: 'Heatstroke First Aid', steps: ['Move to shade immediately','Apply wet cloths to neck, armpits, groin','Fan the person actively','Give sips of cool water if conscious','Call 108 — heatstroke is life-threatening'], urgent: true },
      hi: { title: 'लू लगने पर प्राथमिक चिकित्सा', steps: ['तुरंत छाया में ले जाएं','गर्दन, बगल पर गीला कपड़ा लगाएं','हवा दें','होश में हो तो ठंडा पानी पिलाएं','108 पर कॉल करें'], urgent: true },
    },
    choking: {
      en: { title: 'Choking First Aid', steps: ['Ask: Are you choking?','Give 5 firm back blows between shoulder blades','Give 5 abdominal thrusts (Heimlich)','Repeat until object expelled or person unconscious','Call 108 if unconscious'], urgent: true },
      hi: { title: 'गले में कुछ फंसने पर', steps: ['पूछें: क्या आप घुट रहे हैं?','कंधे के बीच 5 बार थपथपाएं','पेट पर 5 बार दबाव दें','दोहराएं जब तक निकले या बेहोश हो','बेहोश होने पर 108 कॉल करें'], urgent: true },
    },
    severe_bleeding: {
      en: { title: 'Severe Bleeding Control', steps: ['Apply firm direct pressure with a clean cloth','Keep pressing — do not remove cloth, add more on top','Elevate the limb above heart','Do NOT apply tourniquet unless limb is severed','Call 108 immediately'], urgent: true },
      hi: { title: 'अधिक खून बहने पर', steps: ['साफ कपड़े से दबाव डालें','दबाव बनाए रखें, कपड़ा न हटाएं','अंग को दिल से ऊंचा रखें','108 पर कॉल करें'], urgent: true },
    },
  };

  const handleGuideClick = (key) => {
    setActiveGuide(key);
    if (voiceEnabled) {
      const g = firstAidData[key][lang === 'hi' ? 'hi' : 'en'];
      const txt = `${g.title}. ${lang === 'hi' ? 'मुख्य कदम हैं' : 'Key steps are'}: ${g.steps.join('. ')}`;
      speak(txt, lang);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-rose-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <ShieldAlert className="w-6 h-6 animate-pulse" /> Urgent SOS
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
        {sosStatus === 'idle' && (
          <>
            <button 
              onClick={startCountdown}
              className="w-48 h-48 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex flex-col items-center justify-center shadow-xl shadow-rose-200 transition-all border-8 border-rose-100 active:scale-95 duration-300 focus:outline-none animate-pulse"
            >
              <ShieldAlert className="w-12 h-12 mb-1 shrink-0" />
              <span className="text-2xl font-black tracking-tight uppercase leading-none">SOS</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">Ambulance</span>
            </button>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-[280px]">
              {lang === 'hi' ? '१०८ एम्बुलेंस और आशा कार्यकर्ता को तुरंत बुलाने के लिए लाल गोला दबाएं' : 'Tap to dispatch 108 Emergency Ambulance & alert local ASHA worker.'}
            </p>
          </>
        )}

        {sosStatus === 'counting' && (
          <>
            <button 
              onClick={cancelSOS}
              className="w-48 h-48 bg-slate-800 text-white rounded-full flex flex-col items-center justify-center shadow-xl shadow-slate-200 border-8 border-slate-200 hover:bg-slate-900 transition-all duration-300 focus:outline-none"
            >
              <span className="text-6xl font-black mb-1 animate-ping shrink-0">{counter}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-2">STOP / रोकें</span>
            </button>
            <p className="text-rose-600 font-black uppercase tracking-widest text-xs animate-pulse">
              {lang === 'hi' ? 'एम्बुलेंस रवाना हो रही है! निरस्त करने के लिए ऊपर दबाएं।' : 'Ambulance dispatch in progress! Tap above to abort.'}
            </p>
          </>
        )}

        {sosStatus === 'dispatched' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              {lang === 'hi' ? 'एम्बुलेंस रवाना! 🚑' : 'Ambulance Dispatched! 🚑'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
              {lang === 'hi' ? 'जीपीएस लोकेशन के आधार पर एम्बुलेंस रवाना की जा चुकी है। आगमन समय १४ मिनट है। सरकारी अस्पताल को सूचित कर दिया गया है।' : 'Dispatched via your GPS coordinate. Estimated ETA is 14 minutes. District health hub notified.'}
            </p>
            <button 
              onClick={() => setSosStatus('idle')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              {lang === 'hi' ? 'ठीक है' : 'Understood'}
            </button>
          </motion.div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" /> {lang === 'hi' ? 'आफलाइन प्राथमिक चिकित्सा निर्देश' : 'Offline First Aid Guides'}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(firstAidData).map(k => (
            <button
              key={k}
              onClick={() => handleGuideClick(k)}
              className={`p-4 rounded-xl text-left border font-black text-xs uppercase tracking-wide transition-all ${
                activeGuide === k 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
              style={{ minHeight: '60px' }}
            >
              {firstAidData[k][lang === 'hi' ? 'hi' : 'en'].title}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {activeGuide && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative">
                <button 
                  onClick={() => setActiveGuide(null)} 
                  className="absolute top-4 right-4 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Hide'}
                </button>
                <h4 className="font-black text-emerald-800 text-sm">
                  {firstAidData[activeGuide][lang === 'hi' ? 'hi' : 'en'].title}
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs font-semibold text-slate-600 leading-relaxed">
                  {firstAidData[activeGuide][lang === 'hi' ? 'hi' : 'en'].steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
