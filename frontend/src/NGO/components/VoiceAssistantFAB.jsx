import React, { useState, useCallback } from 'react';
import { Mic, X, Languages, Check, Loader2 } from 'lucide-react';

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

export default function VoiceAssistantFAB({ onVoiceResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [transcript, setTranscript] = useState('');
  const [selectedAction, setSelectedAction] = useState('symptom');
  const [recognition, setRecognition] = useState(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Try Chrome on desktop or Android.');
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

    recog.onend = () => {
      setIsListening(false);
    };

    recog.onerror = () => {
      setIsListening(false);
    };

    setRecognition(recog);
    recog.start();
    setIsListening(true);
  }, [selectedLang, recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const handleSubmitVoice = () => {
    if (transcript.trim()) {
      onVoiceResult({ text: transcript, lang: selectedLang, action: selectedAction });
      setTranscript('');
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 right-5 z-50 w-14 h-14 bg-[#059669] hover:bg-[#047857] rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 active:scale-90 transition-all border-2 border-white"
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
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs" onClick={() => { setIsOpen(false); stopListening(); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div className="bg-white rounded-t-[2.5rem] border-t border-slate-100 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Mic className="w-4.5 h-4.5 text-[#059669]" />
                  Voice Assistant
                </h3>
                <button onClick={() => { setIsOpen(false); stopListening(); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedLang === lang.code
                        ? 'bg-[#059669] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {lang.native}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                {VOICE_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setSelectedAction(act.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedAction === act.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
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
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {isListening ? 'Listening...' : 'Tap the mic button and start speaking'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#059669] text-white hover:bg-[#047857]'
                  }`}
                >
                  {isListening ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Stop Recording</>
                  ) : (
                    <><Mic className="w-4 h-4" /> Start Recording</>
                  )}
                </button>
                <button
                  onClick={handleSubmitVoice}
                  disabled={!transcript.trim()}
                  className="px-5 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Use
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
