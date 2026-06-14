import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, RefreshCw, Send } from 'lucide-react';
import { speak } from '../utils/tts';

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
