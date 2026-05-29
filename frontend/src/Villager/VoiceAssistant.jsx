import { useState } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LANG_MAP = { hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', ta: 'ta-IN', bn: 'bn-IN' };

const SPEAK_MSG = {
  'hi-IN': (p) => `आपको ${p} का खतरा हो सकता है। कृपया पास के स्वास्थ्य कार्यकर्ता से मिलें।`,
  'en-IN': (p) => `You may have symptoms of ${p}. Please consult a nearby health worker.`,
  'mr-IN': (p) => `तुम्हाला ${p} ची शक्यता आहे. कृपया जवळच्या आरोग्य कार्यकर्त्याला भेटा.`,
  'ta-IN': (p) => `உங்களுக்கு ${p} இருக்கலாம். அருகிலுள்ள சுகாதார ஊழியரை அணுகவும்.`,
  'bn-IN': (p) => `আপনার ${p} হতে পারে। অনুগ্রহ করে নিকটবর্তী স্বাস্থ্যকর্মীর সাথে যোগাযোগ করুন।`,
};

export default function VoiceAssistant({ onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const { language } = useLanguage();

  const speechLang = LANG_MAP[language] || 'hi-IN';

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input not supported. Please use Chrome or Edge.');
      return;
    }
    setError('');
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      handleVoiceSubmit(text);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'no-speech') setError('No speech detected. Please try again.');
      else if (event.error === 'not-allowed') setError('Microphone access denied. Please allow microphone.');
      else setError(`Voice error: ${event.error}. Please type instead.`);
    };

    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  const handleVoiceSubmit = async (text) => {
    try {
      const res = await api.post('/villager/symptoms', { symptoms: text });
      const prediction = res.data.prediction;
      if (onResult) onResult({ text, prediction });
      speak(prediction);
    } catch (err) {
      console.error('AI Service Error:', err);
      setError('Could not analyze symptoms. Please check your connection.');
    }
  };

  const speak = (prediction) => {
    if (!window.speechSynthesis) return;
    const msgFn = SPEAK_MSG[speechLang] || SPEAK_MSG['en-IN'];
    const utterance = new SpeechSynthesisUtterance(msgFn(prediction));
    utterance.lang = speechLang;
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for female voice simulation

    // Dynamically select a premium female voice (Microsoft Neerja, Google Hindi Female, Swara, Heera, etc.)
    const voices = window.speechSynthesis.getVoices();
    const l = speechLang.toLowerCase().split('-')[0];
    
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
    window.speechSynthesis.speak(utterance);
  };

  const label = {
    listening: { hi: 'सुन रहा हूँ...', en: 'Listening...', mr: 'ऐकत आहे...', ta: 'கேட்கிறேன்...', bn: 'শুনছি...' },
    speak: { hi: 'अपनी समस्या बोलें', en: 'Speak your symptoms', mr: 'तुमची समस्या सांगा', ta: 'உங்கள் அறிகுறிகளை சொல்லுங்கள்', bn: 'আপনার সমস্যা বলুন' },
    message: { hi: 'आपका संदेश:', en: 'Your message:', mr: 'तुमचा संदेश:', ta: 'உங்கள் செய்தி:', bn: 'আপনার বার্তা:' },
    speaking: { hi: 'AI बोल रहा है', en: 'AI Speaking', mr: 'AI बोलत आहे', ta: 'AI பேசுகிறது', bn: 'AI বলছে' },
  };
  const lang = language || 'en';

  return (
    <div className="flex flex-col items-center gap-6 p-6 md:p-10 bg-white/40 backdrop-blur-3xl rounded-[40px] border border-white/40 shadow-2xl">
      <div className="relative">
        <button
          onClick={isListening ? undefined : startListening}
          disabled={isListening}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl relative z-10 ${
            isListening
              ? 'bg-rose-500 animate-pulse ring-8 ring-rose-200 cursor-not-allowed'
              : 'bg-gradient-to-br from-indigo-600 to-indigo-700'
          }`}
        >
          {isListening ? <MicOff className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-white" />}
        </button>
        {isListening && <div className="absolute inset-0 rounded-full bg-rose-400 opacity-20 blur-xl animate-ping" />}
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {isListening ? label.listening[lang] : label.speak[lang]}
        </h3>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{speechLang}</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 py-3 px-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl w-full max-w-md">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {transcript && (
        <div className="mt-4 p-6 bg-slate-900/90 text-white rounded-3xl w-full max-w-md shadow-inner">
          <p className="text-xs uppercase tracking-widest font-black text-indigo-400 mb-2">{label.message[lang]}</p>
          <p className="text-xl font-bold leading-relaxed">{transcript}</p>
        </div>
      )}

      {isSpeaking && (
        <div className="flex items-center gap-3 py-3 px-6 bg-emerald-100 text-emerald-800 rounded-full animate-bounce">
          <Volume2 className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-widest">{label.speaking[lang]}</span>
        </div>
      )}
    </div>
  );
}
