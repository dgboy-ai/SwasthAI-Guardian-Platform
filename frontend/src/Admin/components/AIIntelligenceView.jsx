import React, { useState, useEffect } from 'react';
import { BrainCircuit, Clock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import ConfBadge from './ConfBadge';
import AIReasoningTrace from './AIReasoningTrace';
import { showToast } from '../../utils/toast';
import adminService from '../../services/adminService';

const DEFAULT_RECS = [
  { color: 'border-l-rose-500', action: 'Deploy Now', btnCls: 'bg-emerald-600 hover:bg-emerald-700', text: 'Fever Cluster detected in Village 47 — High fever + body ache reported in 6 cases', conf: 0.91 },
  { color: 'border-l-orange-400', action: 'Activate Program', btnCls: 'bg-orange-500 hover:bg-orange-600', text: 'Diarrheal Signal detected in Village 12 — Watery stools + dehydration in 4 cases', conf: 0.78 },
  { color: 'border-l-blue-400', action: 'Investigate', btnCls: 'bg-blue-500 hover:bg-blue-600', text: 'Respiratory Cases detected in Village 8 — Cough + cold cluster — 5 cases in 12 hours', conf: 0.84 }
];

export default function AIIntelligenceView({ recs, demoTourMode }) {
  const displayedRecs = (recs && recs.length > 0) ? recs : DEFAULT_RECS;
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAgentScans();
      setScans(data || []);
    } catch (err) {
      console.error("Failed to load agent scans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 lg:p-5 space-y-6 text-left">
      <div className="bg-[#043927] rounded-2xl p-6 text-white border border-emerald-500/20 shadow-lg relative overflow-hidden">
        {/* Background glow decorator */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shadow-lg border border-emerald-400/30">
            <BrainCircuit className="w-5 h-5 text-emerald-800 animate-pulse" />
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

      {/* AUTONOMOUS OUTBREAK AGENT TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">Autonomous Agent Scan Timeline</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time scan logs from Groq Llama-3.3 evaluation loop</p>
            </div>
          </div>
          <button 
            onClick={fetchScans} 
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-5">
          {scans.slice(0, 5).map((scan, idx) => {
            const dateStr = new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={idx} className="relative group">
                {/* Timeline Node Point */}
                <div className={`absolute -left-[32px] top-1.5 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                  scan.outbreakDetected 
                    ? 'bg-rose-500 animate-pulse' 
                    : 'bg-emerald-500'
                }`} style={{ width: '18px', height: '18px' }} />

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase">{scan.villageName || scan.villageId}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded-md">
                        {scan.casesScanned} Cases
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{dateStr}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500">
                      <span className="font-black text-slate-600">Symptom Profile: </span>
                      {scan.symptoms || "N/A"}
                    </p>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 mt-2">
                      {scan.outbreakDetected ? (
                        <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2 py-0.5 text-[9px] font-black uppercase">
                          Outbreak confirmed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 text-[9px] font-black uppercase">
                          Seasonal Noise
                        </div>
                      )}
                      {scan.disease && scan.disease !== 'unknown' && (
                        <span className="text-[10px] font-bold text-slate-700">
                          Suspected: <span className="font-black text-slate-900">{scan.disease}</span> ({(scan.confidence * 100).toFixed(0)}% confidence)
                        </span>
                      )}
                    </div>
                    {scan.action && (
                      <p className="text-[10px] font-bold text-slate-500 bg-white border border-slate-100 rounded-lg p-2.5 mt-2">
                        <span className="font-black text-slate-700 block uppercase text-[8px] tracking-wider mb-0.5">Recommended action</span>
                        {scan.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {scans.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase">
              No recent scans recorded
            </div>
          )}
        </div>
      </div>
      
      {/* AI Reasoning Trace — live Groq decision log from Sakhi RAG */}
      <AIReasoningTrace demoTourMode={demoTourMode} />
    </div>
  );
}
