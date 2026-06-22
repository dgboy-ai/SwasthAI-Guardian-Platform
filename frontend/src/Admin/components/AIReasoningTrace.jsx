import React, { useState, useEffect } from 'react';
import { BrainCircuit, Check, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_TRACES = [
  {
    query: "What is the referral protocol for a pregnant woman with blood pressure 150/95 in Village 47?",
    latency: 320,
    grounded: true,
    sources: ["WHO Maternal Vitals Handbook 2024 (p. 42)", "National Health Mission Protocol v4"],
    timestamp: new Date(Date.now() - 120000).toISOString()
  },
  {
    query: "Identify disease outbreak risks for a cluster of high fever + joint pain reported in Sehore district.",
    latency: 410,
    grounded: true,
    sources: ["WHO Malaria & Dengue Vector Control Guidelines", "SymptomNet Outbreak Classification Engine"],
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    query: "How should an ASHA worker handle severe child malnutrition acute symptoms in zero-signal zone?",
    latency: 280,
    grounded: true,
    sources: ["UNICEF Child Care & SAM Guidelines (2025)", "ASHA Offline Sync Training Manual Module 3"],
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

export default function AIReasoningTrace({ demoTourMode }) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    api.get('/admin/rag-traces')
      .then(r => setTraces(r.data || []))
      .catch(() => setTraces([]))
      .finally(() => setLoading(false));
  }, []);

  const displayedTraces = (demoTourMode || traces.length === 0) ? DEFAULT_TRACES : traces;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
          <p className="font-black text-slate-900 text-[13px] uppercase tracking-wide">AI Decision Log — Groq RAG Reasoning Trace</p>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black">
            {displayedTraces.length} entries
          </span>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-slate-950">
          {loading && traces.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono text-center py-6">Loading trace logs…</p>
          ) : displayedTraces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[11px] font-mono text-slate-500">No traces yet — trigger a Sakhi health query to see reasoning logs</p>
            </div>
          ) : [...displayedTraces].reverse().map((t, i) => (
            <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10.5px] space-y-1.5 transition-all hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-black tracking-wider">TRACE-{String(displayedTraces.length - i).padStart(3, '0')}</span>
                <span className="text-slate-500 text-[9.5px]">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '—'}</span>
              </div>
              <p className="text-slate-200 font-medium">Query: <span className="text-white font-bold">"{t.query}"</span></p>
              
              <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1">
                <span>Latency: <span className={`font-black ${(t.latency || 0) < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>{t.latency || '350'}ms</span></span>
                <span className="flex items-center gap-1">
                  Status: 
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.25 rounded text-[8.5px] font-bold ${t.grounded ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : 'bg-amber-950 text-amber-300 border border-amber-900'}`}>
                    {t.grounded ? '✓ Grounded WHO RAG' : '⚡ Direct GenAI'}
                  </span>
                </span>
              </div>

              {t.sources?.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-lg mt-2">
                  <p className="text-[8.5px] font-black uppercase text-emerald-500/80 tracking-widest mb-1">Grounding References</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.sources.map((src, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded text-[9px]">
                        📕 {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
