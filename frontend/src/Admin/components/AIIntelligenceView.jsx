import React from 'react';
import { BrainCircuit } from 'lucide-react';
import ConfBadge from './ConfBadge';
import AIReasoningTrace from './AIReasoningTrace';

export default function AIIntelligenceView({ recs }) {
  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <div className="bg-[#043927] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-[18px]">AI District Intelligence</h2>
            <p className="text-[11px] text-emerald-300">Powered by Groq Llama-3.3-70b + SymptomNet (96.8% accuracy)</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Neural Model', val: 'SymptomNet' },
            { label: 'Accuracy', val: '96.8%' },
            { label: 'Scan Interval', val: '30 min' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl p-3">
              <p className="text-[15px] font-black text-white">{s.val}</p>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {recs.map((r, i) => (
            <div key={i} className={`bg-white/5 border-l-4 ${r.color} rounded-r-xl px-4 py-3 flex items-center justify-between gap-3`}>
              <p className="text-[11px] text-white/80 font-medium flex-1 leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-2 shrink-0">
                <ConfBadge pct={r.conf} />
                <button className={`px-3 py-1.5 rounded-lg text-[10px] font-black text-white ${r.btnCls} transition-colors`}>{r.action}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* AI Reasoning Trace — live Groq decision log from Sakhi RAG */}
      <AIReasoningTrace />
    </div>
  );
}
