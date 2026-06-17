import React, { useState, useCallback } from 'react';
import { Mic, X, Languages, Check, Loader2, Bot, MessageSquare } from 'lucide-react';
import { showToast } from '../../utils/toast';

const LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'en-IN', label: 'English', native: 'English' },
];

const VOICE_ACTIONS = [
  { id: 'symptom', label: 'Symptom Entry', emoji: '🩺' },
  { id: 'pregnancy', label: 'Pregnancy Update', emoji: '🤰' },
  { id: 'nutrition', label: 'Nutrition Record', emoji: '👶' },
];

const DEMO_COMMANDS = [
  { text: 'Register pregnancy for Sunita Devi, 7 months, high BP', action: 'pregnancy', lang: 'hi-IN' },
  { text: 'Log symptoms: cough and fever for Raju Kumar', action: 'symptom', lang: 'hi-IN' },
  { text: 'Record nutrition: Baby Geeta, weight 8.2kg, MUAC 11.5', action: 'nutrition', lang: 'en-IN' },
  { text: 'गीता देवी के लिए गर्भावस्था पंजीकरण, 8 महीने', action: 'pregnancy', lang: 'hi-IN' },
  { text: 'राजू के लिए लक्षण: खांसी और बुखार, 3 दिन से', action: 'symptom', lang: 'hi-IN' },
];

const AI_RESPONSES = {
  pregnancy: 'Pregnancy record created. High BP flagged — referral recommended. Next visit scheduled in 7 days.',
  symptom: 'Symptoms logged. Fever + cough pattern detected — monitoring advised. Alert triggered if persists >48hrs.',
  nutrition: 'Nutrition record saved. MUAC indicates moderate risk — supplement delivery scheduled.',
};

export default function VoiceAssistantFAB({ onVoiceResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [transcript, setTranscript] = useState('');
  const [selectedAction, setSelectedAction] = useState('symptom');
  const [recognition, setRecognition] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoResponse, setDemoResponse] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const speechSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowDemo(true);
      showToast('Speech recognition not available — using demo mode', 'info');
      return;
    }

    if (recognition) recognition.stop();

    const recog = new SpeechRecognition();
    recog.lang = selectedLang;
    recog.continuous = false;
    recog.interimResults = true;

    recog.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        final += event.results[i][0].transcript;
      }
      setTranscript(final);
    };

    recog.onend = () => setIsListening(false);
    recog.onerror = () => {
      setIsListening(false);
      setShowDemo(true);
      showToast('Speech error — switching to demo commands', 'info');
    };

    setRecognition(recog);
    recog.start();
    setIsListening(true);
  }, [selectedLang, recognition]);

  const stopListening = useCallback(() => {
    if (recognition) { recognition.stop(); setIsListening(false); }
  }, [recognition]);

  const handleDemoCommand = (cmd) => {
    setDemoLoading(true);
    setTranscript(cmd.text);
    setSelectedLang(cmd.lang);
    setSelectedAction(cmd.action);

    setTimeout(() => {
      const response = AI_RESPONSES[cmd.action] || 'Command processed successfully.';
      setDemoResponse(response);
      setDemoLoading(false);
      showToast(`Demo command processed: ${cmd.action}`, 'success');

      if (onVoiceResult) {
        onVoiceResult({ text: cmd.text, lang: cmd.lang, action: cmd.action, demo: true });
      }
    }, 800);
  };

  const handleSubmitVoice = () => {
    if (demoResponse) {
      showToast(`AI Response: ${demoResponse}`, 'success');
      setTranscript('');
      setDemoResponse('');
      setIsOpen(false);
      setShowDemo(false);
      return;
    }
    if (transcript.trim()) {
      onVoiceResult({ text: transcript, lang: selectedLang, action: selectedAction });
      setTranscript('');
      setIsOpen(false);
      setShowDemo(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 sm:bottom-28 right-4 sm:right-5 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-[#059669] hover:bg-[#047857] rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 active:scale-90 transition-all border-2 border-white"
          aria-label="Voice Assistant"
        >
          <Mic className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-[#059669] rounded-full animate-pulse" />
          </span>
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs" onClick={() => { setIsOpen(false); stopListening(); setShowDemo(false); setDemoResponse(''); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div className="bg-white rounded-t-[2.5rem] border-t border-slate-100 p-4 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Mic className="w-4.5 h-4.5 text-[#059669]" />
                  Voice Assistant
                </h3>
                <button onClick={() => { setIsOpen(false); stopListening(); setShowDemo(false); setDemoResponse(''); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedLang === lang.code ? 'bg-[#059669] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {lang.native}
                  </button>
                ))}
              </div>

              {!speechSupported && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium">Speech API unavailable. Use demo commands below to test.</p>
                </div>
              )}

              <div className="flex gap-2 mb-4 flex-wrap">
                {VOICE_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setSelectedAction(act.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedAction === act.id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span>{act.emoji}</span>
                    {act.label}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[80px] mb-4">
                {transcript ? (
                  <p className="text-sm text-slate-800 font-medium">{transcript}</p>
                ) : demoResponse ? (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{demoResponse}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {isListening ? 'Listening...' : demoLoading ? 'Processing...' : 'Tap mic or use demo commands below'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#059669] text-white hover:bg-[#047857]'
                  }`}
                >
                  {isListening ? <><Loader2 className="w-4 h-4 animate-spin" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
                </button>
                <button
                  onClick={handleSubmitVoice}
                  disabled={!transcript.trim() && !demoResponse}
                  className="px-5 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Use
                </button>
              </div>

              <div>
                <button
                  onClick={() => setShowDemo(!showDemo)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {showDemo ? 'Hide' : 'Try'} Demo Commands ({DEMO_COMMANDS.length})
                </button>

                {showDemo && (
                  <div className="mt-2 space-y-1.5">
                    {DEMO_COMMANDS.map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => handleDemoCommand(cmd)}
                        disabled={demoLoading}
                        className="w-full flex items-center gap-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl px-3 py-2 text-left transition-all active:scale-98 disabled:opacity-50"
                      >
                        <span className="text-xs">{cmd.action === 'pregnancy' ? '🤰' : cmd.action === 'symptom' ? '🩺' : '👶'}</span>
                        <span className="text-[10px] text-slate-700 font-medium truncate">{cmd.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {demoResponse && (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" /> AI Response
                  </p>
                  <p className="text-xs text-slate-700 mt-1">{demoResponse}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
