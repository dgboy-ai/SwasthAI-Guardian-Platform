import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, MapPin, Activity, Shield, AlertTriangle,
  Send, Download, Sparkles, Target, Zap,
  CheckCircle2, Clock, RefreshCw, ChevronRight, Bell
} from 'lucide-react';
import { timeAgo } from './utils';
import { showToast } from '../../utils/toast';
import DistrictOutbreakMap from '../../components/DistrictOutbreakMap';

/* ─── Demo outbreak data ─────────────────────────────────────────────── */
const DEMO_OB = [
  {
    id:'OB-001', villageId:'V-104', villageName:'Rajpur', disease:'Cholera', classification:'Cholera',
    severity:'critical', confidence:0.91, caseCount:14, riskScore:94,
    symptomPattern:'Profuse watery diarrhoea, vomiting, rapid dehydration in 14 patients.',
    action:'Deploy ORS + IV-fluid packets. Alert district PHC. Boil-water advisory.',
    detectedAt: new Date(Date.now()-18*60000).toISOString(),
  },
  {
    id:'OB-002', villageId:'V-102', villageName:'Lakhpur', disease:'Dengue', classification:'Dengue Fever',
    severity:'high', confidence:0.78, caseCount:8, riskScore:75,
    symptomPattern:'Joint pain, rash, fever >39°C in 8 cases. Vector density elevated.',
    action:'Vector control fogging. Distribute mosquito nets. Monitor platelet counts.',
    detectedAt: new Date(Date.now()-47*60000).toISOString(),
  },
  {
    id:'OB-003', villageId:'V-107', villageName:'Sindhpur', disease:'Typhoid', classification:'Typhoid',
    severity:'medium', confidence:0.67, caseCount:5, riskScore:58,
    symptomPattern:'Sustained high fever, headache, abdominal discomfort in 5 patients.',
    action:'Water source testing. Prescribe antibiotics. Hygiene awareness drive.',
    detectedAt: new Date(Date.now()-90*60000).toISOString(),
  },
];

const SEVERITY_META = {
  critical: { bg:'#fff1f2', border:'#fecdd3', text:'#9f1239', bar:'#dc2626', dot:'bg-rose-500',   label:'CRITICAL' },
  high:     { bg:'#fff7ed', border:'#fed7aa', text:'#9a3412', bar:'#ea580c', dot:'bg-orange-500', label:'HIGH'     },
  medium:   { bg:'#fefce8', border:'#fde68a', text:'#78350f', bar:'#d97706', dot:'bg-amber-500',  label:'MEDIUM'   },
  low:      { bg:'#f0fdf4', border:'#a7f3d0', text:'#065f46', bar:'#059669', dot:'bg-emerald-500',label:'LOW'      },
};

function severityKey(s = '') { return (s.toLowerCase() in SEVERITY_META) ? s.toLowerCase() : 'medium'; }

/* ─── Alert Card ──────────────────────────────────────────────────────── */
function AlertCard({ ob, index, dispatched, onDispatch }) {
  const [expanded, setExpanded] = useState(index === 0);
  const sk = severityKey(ob.severity);
  const meta = SEVERITY_META[sk];
  const conf = Math.round((ob.confidence ?? 0.8) * 100);
  const isDispatched = dispatched[ob.id];

  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay:0.06*index }}
      className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow duration-200"
      style={{ borderColor: meta.border }}
    >
      {/* Header bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${meta.bar}, ${meta.bar}80)` }}
      />

      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Pulsing dot */}
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot} ${sk === 'critical' ? 'animate-pulse' : ''}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-black text-slate-900">{ob.classification || ob.disease} Cluster</p>
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider"
              style={{ background:meta.bg, color:meta.text, borderColor:meta.border }}>{meta.label}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">
            {ob.villageName || ob.villageId} · {ob.caseCount} cases · Detected {timeAgo(ob.detectedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-black" style={{ color:meta.bar }}>{conf}% AI</span>
          <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
              {/* Symptom + action */}
              <div className="pt-3 grid grid-cols-1 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Symptom Pattern</p>
                  <p className="text-[10px] font-medium text-slate-700 leading-relaxed">{ob.symptomPattern}</p>
                </div>
                <div className="rounded-xl p-3 border" style={{ background:meta.bg, borderColor:meta.border }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color:meta.bar }}>
                    Recommended Action
                  </p>
                  <p className="text-[10px] font-bold text-slate-800 leading-relaxed">{ob.action}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label:'AI Conf.',  val:`${conf}%`,         color:meta.bar },
                  { label:'Risk Score',val:`${ob.riskScore}/100`, color:meta.bar },
                  { label:'Cases',     val:ob.caseCount,       color:'#475569' },
                  { label:'Priority',  val:sk==='critical'?'P1':sk==='high'?'P2':'P3', color:sk==='critical'?'#dc2626':'#d97706' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center bg-slate-50 rounded-lg py-2 border border-slate-100">
                    <p className="text-xs font-black" style={{ color }}>{val}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Dispatch */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Telemetry Active
                </div>
                <button
                  onClick={() => onDispatch(ob.id, ob.villageId, ob.classification || ob.disease)}
                  disabled={isDispatched}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                    isDispatched
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md active:scale-95'
                  }`}
                >
                  {isDispatched ? '✓ Unit Dispatched' : 'Dispatch Response Unit'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function OutbreakRadarView({
  OB, S, simulateOutbreak, simulatingOutbreak,
  issueDistrictAlert, alertSent, alertError,
  downloadReport, lastAgentScan, demoTourMode, loading, lastSync,
}) {
  const [dispatched, setDispatched] = useState({});
  const [consoleTab, setConsoleTab] = useState('actions');

  const obList = OB?.length > 0 ? OB : DEMO_OB;
  const isDemo = !OB?.length;

  const highRisk   = obList.filter(o => ['critical','high'].includes((o.severity||'').toLowerCase())).length;
  const totalCases = obList.reduce((a, o) => a + (o.caseCount || 1), 0);
  const aiConf     = obList.length ? Math.round(obList.reduce((a,o)=>a+(o.confidence||0.8),0)/obList.length*100) : 0;

  const diseaseCounts = {};
  obList.forEach(o => {
    const d = (o.disease || o.classification || 'Unknown').replace(/_/g,' ');
    diseaseCounts[d] = (diseaseCounts[d] || 0) + (o.caseCount || 1);
  });
  const sorted = Object.entries(diseaseCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxCount = sorted.length ? Math.max(...sorted.map(([,c])=>c)) : 1;
  const dColors = ['#dc2626','#ea580c','#d97706','#1d4ed8','#7c3aed'];

  const handleDispatch = (id, village, disease) => {
    setDispatched(p => ({ ...p, [id]:true }));
    showToast(`Response Unit dispatched to ${village} for ${disease}. ASHA teams alerted.`, 'success');
  };

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl border border-rose-200/70 shadow-sm"
        style={{ background:'linear-gradient(135deg,#fff1f2 0%,#fce7f3 40%,#fff7ed 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-rose-300/15 pointer-events-none" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center justify-center">
              <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Epidemic Outbreak Radar</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Surveillance Active
                </span>
                {isDemo && <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700">Demo</span>}
              </div>
              <p className="text-xs text-slate-500 font-medium">Autonomous AI scan · Groq Llama-3.3 · DynamoDB outbreak_telemetry · 30-min loop</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {lastSync && (
              <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                <Clock className="w-3 h-3" /> {lastSync}
              </span>
            )}
            {lastAgentScan && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Last scan {timeAgo(lastAgentScan.timestamp)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:'Active Alerts',      val: obList.length,  color:'#dc2626', light:'#fff1f2', border:'#fecdd3', icon:'🚨' },
          { label:'High-Risk Villages', val: highRisk,        color:'#ea580c', light:'#fff7ed', border:'#fed7aa', icon:'🏘️' },
          { label:'Total Cases Today',  val: totalCases,      color:'#d97706', light:'#fefce8', border:'#fde68a', icon:'📊' },
          { label:'Cases (Symptoms)',   val: S?.today_symptoms ?? totalCases, color:'#1d4ed8', light:'#eff6ff', border:'#bfdbfe', icon:'📈' },
          { label:'Avg AI Confidence',  val: `${aiConf}%`,   color:'#059669', light:'#ecfdf5', border:'#a7f3d0', icon:'🧠' },
        ].map(({ label, val, color, light, border, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.05*i }}
            className="bg-white rounded-2xl border p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            style={{ borderColor:border }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl font-black" style={{ color }}>{val}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Alert Banner (conditional) ── */}
      {(alertSent || alertError || obList.some(o => severityKey(o.severity) === 'critical')) && (
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${alertSent ? 'bg-emerald-50 border-emerald-200' : alertError ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-1 h-8 rounded-full shrink-0 ${alertSent ? 'bg-emerald-500' : alertError ? 'bg-rose-500' : 'bg-amber-500'}`} />
          <AlertTriangle className={`w-4 h-4 shrink-0 ${alertSent ? 'text-emerald-600' : alertError ? 'text-rose-600' : 'text-amber-600'}`} />
          <p className={`text-xs font-bold ${alertSent ? 'text-emerald-800' : alertError ? 'text-rose-800' : 'text-amber-900'}`}>
            {alertSent
              ? 'Alert broadcast complete. DynamoDB + Aurora synchronized across nodes.'
              : alertError
              ? `Transmission error: ${alertError}`
              : `District Warning: ${obList.filter(o=>severityKey(o.severity)==='critical').length} critical cluster(s) detected. Immediate response required.`
            }
          </p>
        </div>
      )}

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* LEFT: Map + Alert feed */}
        <div className="xl:col-span-2 space-y-4">

          {/* Map */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Live Surveillance Map</h2>
                <span className="text-[8px] font-bold text-slate-400">Varanasi Division · ap-south-1</span>
              </div>
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live nodes
              </span>
            </div>
            <DistrictOutbreakMap />
          </div>

          {/* Active Alerts Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Active Telemetry Alerts</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-black rounded-full">
                {obList.length} Active
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {obList.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-black text-slate-400 text-xs uppercase tracking-wider">All Nodes Stable</p>
                  <p className="text-[10px] text-slate-300 mt-1">Zero active anomalies detected</p>
                </div>
              ) : obList.map((ob, i) => (
                <AlertCard key={ob.id || i} ob={ob} index={i} dispatched={dispatched} onDispatch={handleDispatch} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Command Console + Disease Panel */}
        <div className="space-y-4">

          {/* ── OUTBREAK RESPONSE CONSOLE ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Console header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Response Console</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] font-bold text-slate-400">ARMED</span>
              </div>
            </div>

            {/* Tab strip */}
            <div className="flex border-b border-slate-100">
              {[{ id:'actions', label:'Actions' }, { id:'status', label:'Status' }].map(t => (
                <button key={t.id} onClick={() => setConsoleTab(t.id)}
                  className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                    consoleTab===t.id ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {consoleTab === 'actions' ? (
                <div className="space-y-2.5">
                  {/* Simulate */}
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Simulation</p>
                    <button
                      onClick={simulateOutbreak}
                      disabled={simulatingOutbreak}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {simulatingOutbreak ? 'Simulating...' : 'Simulate Outbreak Event'}
                    </button>
                  </div>

                  {/* District Alert */}
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">District Broadcast</p>
                    <button
                      onClick={issueDistrictAlert}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                        alertSent
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {alertSent ? '✓ Alert Dispatched' : 'Issue District Alert'}
                    </button>
                  </div>

                  {/* ASHA Notify */}
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Field Network</p>
                    <button
                      onClick={() => showToast('ASHA local networks broadcast completed.', 'success')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Notify ASHA Workers
                    </button>
                  </div>

                  {/* Export + AI Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadReport}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-black rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <button
                      onClick={() => showToast('AI Analysis: Fever spikes in Northern Zone. Vector fogging recommended immediately.', 'info')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" /> AI Brief
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label:'DynamoDB Telemetry',   val:'Connected',   ok:true  },
                    { label:'Aurora Sync',           val:'Active',      ok:true  },
                    { label:'SSE Broadcast',         val:`${obList.length} listeners`, ok:true },
                    { label:'Agent Loop',            val:'30-min cycle',ok:true  },
                    { label:'Last Scan',             val:lastAgentScan ? timeAgo(lastAgentScan.timestamp) : 'Pending', ok:!!lastAgentScan },
                  ].map(({ label, val, ok }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[9px] font-bold text-slate-500">{label}</span>
                      <div className="flex items-center gap-1.5">
                        {ok
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <AlertTriangle className="w-3 h-3 text-amber-400" />
                        }
                        <span className={`text-[9px] font-black ${ok ? 'text-emerald-700' : 'text-amber-600'}`}>{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Disease Signals Panel ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Disease Signal Distribution</h2>
            </div>

            {sorted.length > 0 ? (
              <div className="space-y-3">
                {sorted.map(([name, count], i) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background:dColors[i] }} />
                        <span className="text-[10px] font-bold text-slate-700 capitalize">{name}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-900 font-mono">{count} cases</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width:`${(count/maxCount)*100}%` }}
                        transition={{ duration:0.7, delay:0.1*i, ease:'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background:dColors[i] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400">No disease signals</p>
              </div>
            )}

            {/* AI confidence summary */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Average AI Confidence</span>
                <span className="text-[9px] font-black text-emerald-700">{aiConf}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${aiConf}%` }}
                  transition={{ duration:1, ease:'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
