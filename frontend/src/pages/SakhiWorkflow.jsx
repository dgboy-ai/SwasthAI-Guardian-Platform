import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, RefreshCw, Send } from 'lucide-react';

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

export default function SakhiWorkflow({ onBack, lang, voiceEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      hi: 'गर्भावस्था में क्या खाएं? 🍏',
      en: 'What to eat during pregnancy? 🍏',
      voiceHi: 'गर्भावस्था में क्या खाना चाहिए?',
      voiceEn: 'What is the best nutrition during pregnancy?',
      replyHi: 'गर्भावस्था में हरी पत्तेदार सब्जियां, दालें, फल, दूध और आयरन-फोलिक एसिड की गोलियां नियमित रूप से लें। बाहर के खाने से बचें।',
      replyEn: 'Eat a balanced diet with green leafy vegetables, lentils, fresh fruits, calcium-rich milk, and make sure to take your iron-folic acid tablets daily.'
    },
    {
      hi: 'उल्टी और जी मिचलाना कैसे रोकें? 🤢',
      en: 'How to manage morning sickness? 🤢',
      voiceHi: 'गर्भावस्था में उल्टी कैसे रोकें?',
      voiceEn: 'How can I stop morning sickness?',
      replyHi: 'सुबह उठकर सूखा नाश्ता जैसे टोस्ट या बिस्कुट लें। दिन में थोड़ा-थोड़ा करके ४-५ बार खाएं। अधिक पानी पिएं।',
      replyEn: 'Eat dry crackers or toast first thing in the morning. Consume small, frequent meals rather than large ones. Stay well-hydrated.'
    },
    {
      hi: 'मासिक धर्म स्वच्छता के नियम 🩸',
      en: 'Menstrual hygiene tips 🩸',
      voiceHi: 'मासिक धर्म के दौरान स्वच्छता कैसे रखें?',
      voiceEn: 'What are menstrual hygiene rules?',
      replyHi: 'हर ४-६ घंटे में पैड बदलें, निजी अंगों को साफ पानी से धोएं, सूती अंतर्वस्त्र पहनें और प्रयुक्त पैड को कागज में लपेटकर कचरे में डालें।',
      replyEn: 'Change sanitary pads every 4-6 hours, wash private areas with clean water, wear dry cotton underwear, and discard wrapped pads in dustbin.'
    }
  ];

  useEffect(() => {
    const greet = lang === 'hi' 
      ? 'नमस्ते! मैं सखी हूँ, आपकी स्वास्थ्य सहेली। महिलाओं के स्वास्थ्य, गर्भावस्था या बच्चों की देखभाल पर कोई भी प्रश्न पूछें या नीचे दिए गए विकल्पों को दबाएं।'
      : 'Hello! I am Sakhi, your personal health companion. Ask me any question about women\'s health, pregnancy, or baby care, or tap one of the common questions below.';
    setMessages([{ sender: 'sakhi', text: greet }]);
    if (voiceEnabled) speak(greet, lang);
  }, [lang]);

  const handleSendPreset = (p) => {
    const qText = lang === 'hi' ? p.hi : p.en;
    const ansText = lang === 'hi' ? p.replyHi : p.replyEn;
    
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: qText },
      { sender: 'sakhi', text: ansText }
    ]);

    if (voiceEnabled) {
      speak(ansText, lang);
    }
  };

  const handleCustomSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQ = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setLoading(true);

    try {
      setTimeout(() => {
        let matchedReply = lang === 'hi' 
          ? 'आपके लक्षण सुनने के बाद सलाह दी जाती है कि आराम करें, गुनगुना पानी पिएं और यदि समस्या बनी रहे तो आशा बहन से मिलें।'
          : 'Thank you for asking. We recommend keeping hydrated, taking adequate rest, and reporting persistent symptoms to your local Anganwadi/ASHA worker.';
        
        const clean = userQ.toLowerCase();
        if (clean.includes('fever') || clean.includes('bukhar') || clean.includes('बुखार')) {
          matchedReply = lang === 'hi' ? 'बुखार में पानी की कमी न होने दें। हर ५ घंटे पर थर्मामीटर से तापमान नापें और आशा बहन को बताएं।' : 'In case of fever, keep drinking water and track temperature every 5 hours. Inform ASHA.';
        } else if (clean.includes('pain') || clean.includes('dard') || clean.includes('दर्द')) {
          matchedReply = lang === 'hi' ? 'दर्द में आराम करें। दर्द वाली जगह पर गर्म या ठंडी सिकाई करें। यदि तीव्र हो तो तुरंत पीएचसी जाएं।' : 'Rest the painful area. Use warm or cold compress. Visit the PHC if pain is acute.';
        }

        setMessages(prev => [...prev, { sender: 'sakhi', text: matchedReply }]);
        if (voiceEnabled) speak(matchedReply, lang);
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-4 sm:p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 max-w-xl mx-auto flex flex-col h-[520px]">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
        <h2 className="text-xl sm:text-2xl font-black text-purple-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <Sparkles className="w-6 h-6 animate-pulse" /> Sakhi Chat
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0 py-2 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm border ${
              m.sender === 'user' 
                ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none' 
                : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'
            }`}>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'सखी सोच रही है...' : 'Sakhi is typing...'}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5 shrink-0">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Tapping Questions / सामान्य सवाल</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPreset(p)}
              className="px-4 py-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-all"
              style={{ minHeight: '44px' }}
            >
              {lang === 'hi' ? p.hi : p.en}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCustomSend} className="flex gap-2 shrink-0 pt-2 border-t border-slate-50">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={lang === 'hi' ? 'यहाँ अपना प्रश्न लिखें...' : 'Ask Sakhi a question...'}
          className="flex-1 h-14 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
        />
        <button
          type="submit"
          className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center hover:bg-purple-700 transition-colors shadow-md shadow-purple-100 shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}
