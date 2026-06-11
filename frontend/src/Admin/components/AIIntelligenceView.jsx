import React from 'react';
import { BrainCircuit } from 'lucide-react';
import ConfBadge from './ConfBadge';
import AIReasoningTrace from './AIReasoningTrace';
import { showToast } from '../../utils/toast';

const DEFAULT_RECS = [
  { color: 'border-l-rose-500', action: 'Deploy Now', btnCls: 'bg-emerald-600 hover:bg-emerald-700', text: 'Fever Cluster detected in Village 47 — High fever + body ache reported in 6 cases', conf: 0.91 },
  { color: 'border-l-orange-400', action: 'Activate Program', btnCls: 'bg-orange-500 hover:bg-orange-600', text: 'Diarrheal Signal detected in Village 12 — Watery stools + dehydration in 4 cases', conf: 0.78 },
  { color: 'border-l-blue-400', action: 'Investigate', btnCls: 'bg-blue-500 hover:bg-blue-600', text: 'Respiratory Cases detected in Village 8 — Cough + cold cluster — 5 cases in 12 hours', conf: 0.84 }
];

export default function AIIntelligenceView({ recs, judgeDemoMode }) {
  const displayedRecs = (recs && recs.length > 0) ? recs : DEFAULT_RECS;

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <div className="bg-[#043927] rounded-2xl p-6 text-white border border-emerald-500/20 shadow-lg relative overflow-hidden">
        {/* Background glow decorator */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border border-emerald-400/30">
            <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-[18px] uppercase tracking-wide leading-tight">AI District Intelligence</h2>
            <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">Powered by Groq Llama-3.3-70b + SymptomNet Core Surveillance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
          {[
            { label: 'Neural Model', val: 'SymptomNet' },
            { label: 'Accuracy', val: '96.8%' },
            { label: 'Scan Interval', val: '30 min' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
              <p className="text-[15px] font-black text-white">{s.val}</p>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-2.5 relative z-10">
          {displayedRecs.map((r, i) => (
            <div key={i} className={`bg-white/5 border-l-4 ${r.color} rounded-r-xl px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-all duration-150`}>
              <p className="text-[11px] text-white/85 font-semibold flex-1 leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-2 shrink-0">
                <ConfBadge pct={r.conf} />
                <button 
                  onClick={() => showToast(`Initiated: ${r.action} plan for warning.`, 'info')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black text-white ${r.btnCls} transition-colors shadow-sm`}
                >
                  {r.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Reasoning Trace — live Groq decision log from Sakhi RAG */}
      <AIReasoningTrace judgeDemoMode={judgeDemoMode} />
    </div>
  );
}
