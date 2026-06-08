import React, { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';
import api from '../../services/api';

export default function AIReasoningTrace() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    api.get('/admin/rag-traces')
      .then(r => setTraces(r.data || []))
      .catch(() => setTraces([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-[13px]">AI Decision Log — Groq Reasoning Trace</p>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black">
            {traces.length} entries
          </span>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto bg-slate-950">
          {loading ? (
            <p className="text-[11px] text-slate-500 font-mono text-center py-6">Loading trace logs…</p>
          ) : traces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[11px] font-mono text-slate-500">No traces yet — trigger a Sakhi health query to see reasoning logs</p>
            </div>
          ) : [...traces].reverse().map((t, i) => (
            <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">TRACE-{String(traces.length - i).padStart(3, '0')}</span>
                <span className="text-slate-500">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '—'}</span>
              </div>
              <p className="text-slate-400">Query: <span className="text-white">{t.query || 'Health query'}</span></p>
              <p className="text-slate-400">Latency: <span className={`font-bold ${(t.latency || 0) < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>{t.latency || '—'}ms</span></p>
              <p className="text-slate-400">
                Grounded: <span className={`font-bold ${t.grounded ? 'text-emerald-400' : 'text-amber-400'}`}>{t.grounded ? '✓ RAG (WHO/ASHA)' : '⚡ Direct Groq'}</span>
              </p>
              {t.sources?.length > 0 && (
                <p className="text-slate-500">Sources: {t.sources.slice(0, 2).join(' · ')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
