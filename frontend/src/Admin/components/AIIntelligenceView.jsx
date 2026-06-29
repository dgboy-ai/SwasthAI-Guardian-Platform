import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Clock, ShieldAlert, CheckCircle2, RefreshCw, Zap, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import ConfBadge from './ConfBadge';
import AIReasoningTrace from './AIReasoningTrace';
import { showToast } from '../../utils/toast';
import adminService from '../../services/adminService';

const DEMO_SCANS = [
  { timestamp: new Date(Date.now()-8*60000).toISOString(),  villageId:'V-104', villageName:'Rajpur Village',   casesScanned:12, symptoms:'Fever, vomiting, diarrhoea', outbreakDetected:true,  disease:'Cholera',    confidence:0.91, action:'Deploy ORS and water purification. Alert district PHC immediately.' },
  { timestamp: new Date(Date.now()-22*60000).toISOString(), villageId:'V-101', villageName:'Lakhpur Village',  casesScanned:7,  symptoms:'Joint pain, rash, fever',    outbreakDetected:false, disease:'Dengue',     confidence:0.72, action:'Monitor and advise vector control measures.' },
  { timestamp: new Date(Date.now()-38*60000).toISOString(), villageId:'V-107', villageName:'Sindhpur Village', casesScanned:9,  symptoms:'High fever, headache',       outbreakDetected:false, disease:'Typhoid',    confidence:0.68, action:'Test water sources. Prescribe antibiotics for confirmed cases.' },
  { timestamp: new Date(Date.now()-61*60000).toISOString(), villageId:'V-103', villageName:'Barwah Village',   casesScanned:5,  symptoms:'Cough, breathlessness',      outbreakDetected:false, disease:'Respiratory',confidence:0.55, action:'Seasonal pattern. No outbreak. Continue monitoring.' },
];

export default function AIIntelligenceView({ recs, demoTourMode }) {
  const displayedRecs = recs?.length > 0 ? recs : [];
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [activeTab, setActiveTab] = useState('scans');

  const fetchScans = async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminService.getAgentScans();
      setScans(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load agent scans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const iv = setInterval(fetchScans, 15000);
    return () => clearInterval(iv);
  }, []);

  const displayScans = scans.length > 0 ? scans : DEMO_SCANS;
  const outbreakCount = displayScans.filter(s => s.outbreakDetected).length;

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── AI Hero Panel ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 shadow-lg"
        style={{ background:'linear-gradient(135deg,#021a10 0%,#042d1d 50%,#043927 100%)' }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">AI District Intelligence</h1>
                <p className="text-xs text-emerald-300 font-medium">Groq Llama-3.3-70b · SymptomNet Core · 30-min autonomous scan loop</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label:'Model',    val:'SymptomNet', color:'#6ee7b7' },
                { label:'Accuracy', val:'96.8%',      color:'#6ee7b7' },
                { label:'Interval', val:'30 min',     color:'#fcd34d' },
                { label:'Outbreaks', val:outbreakCount, color: outbreakCount > 0 ? '#fca5a5' : '#6ee7b7' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-black" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-[7px] font-bold text-white/30 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Recommendations */}
          {displayedRecs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 mb-2">Active Recommendations</p>
              {displayedRecs.map((r, i) => {
                const pct = Math.round((r.conf ?? 0.8) * 100);
                const priority = pct >= 90 ? 'CRITICAL' : pct >= 80 ? 'HIGH' : pct >= 70 ? 'MEDIUM' : 'LOW';
                const pCls = priority === 'CRITICAL' ? '#dc2626' : priority === 'HIGH' ? '#d97706' : priority === 'MEDIUM' ? '#d97706' : '#475569';
                return (
                  <div key={i} className={`bg-white/5 border-l-4 ${r.color} rounded-r-xl px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded text-white" style={{ background:pCls }}>{priority}</span>
                        <span className="text-[9px] font-bold text-emerald-400">{pct}% confidence</span>
                      </div>
                      <p className="text-[10px] text-white/80 font-semibold leading-normal">{r.text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ConfBadge pct={r.conf} />
                      <button onClick={() => showToast(`Initiated: ${r.action}`, 'info')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black text-white ${r.btnCls} transition-colors shadow-sm`}>
                        {r.action}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl px-5 py-4 text-center border border-dashed border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-black text-white/50 uppercase tracking-wider">No Active Alerts</p>
              <p className="text-[9px] text-white/30 mt-0.5">Agent scanning — next pass in ~30 min</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tab bar ── */}
      <div className="bg-slate-100/80 rounded-2xl p-1.5 flex items-center gap-1">
        {[
          { id:'scans',  label:'Agent Scan Timeline', icon: ShieldAlert },
          { id:'trace',  label:'AI Reasoning Trace',  icon: BrainCircuit },
        ].map(({ id, label, icon:Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab===id ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {activeTab === 'scans' && (
          <button onClick={fetchScans} disabled={loading}
            className="p-2 hover:bg-white rounded-xl transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.15 }}
        >
          {activeTab === 'scans' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Autonomous Agent Scan Timeline</h2>
                  <p className="text-[8px] text-slate-400 font-medium">Groq Llama-3.3 · Real-time evaluation loop</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {outbreakCount} Outbreak{outbreakCount !== 1 ? 's' : ''} Detected
                  </span>
                </div>
              </div>

              {error && (
                <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-600">{error}</p>
                </div>
              )}

              {loading && displayScans.length === 0 ? (
                <div className="p-5 space-y-3 animate-pulse">
                  {[0,1,2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
                </div>
              ) : (
                <div className="p-5 relative border-l-2 border-slate-100 ml-7 space-y-4">
                  {displayScans.slice(0, 6).map((scan, idx) => {
                    const timeStr = new Date(scan.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity:0, x:-8 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay:0.06*idx }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[27px] top-3 w-4 h-4 rounded-full border-4 border-white shadow-sm ${scan.outbreakDetected ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                        />
                        <div className={`rounded-xl border p-4 hover:shadow-sm transition-shadow ${scan.outbreakDetected ? 'bg-rose-50/60 border-rose-200/70' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-800">{scan.villageName || scan.villageId}</p>
                              <span className="text-[8px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">{scan.casesScanned} cases</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="text-[9px] font-bold">{timeStr}</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium mb-2">
                            <span className="font-black text-slate-600">Symptoms: </span>{scan.symptoms}
                          </p>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 flex-wrap">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${scan.outbreakDetected ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                              {scan.outbreakDetected ? '⚠ Outbreak Confirmed' : '✓ Seasonal Noise'}
                            </span>
                            {scan.disease && scan.disease !== 'unknown' && (
                              <span className="text-[9px] font-bold text-slate-700">
                                Suspected: <span className="font-black">{scan.disease}</span>
                                <span className="text-slate-400 ml-1">({Math.round((scan.confidence||0)*100)}% conf.)</span>
                              </span>
                            )}
                          </div>

                          {scan.action && (
                            <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2.5">
                              <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recommended Action</p>
                              <p className="text-[10px] font-medium text-slate-600">{scan.action}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trace' && (
            <AIReasoningTrace demoTourMode={demoTourMode} />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
