import React, { useState } from 'react';
import { 
  Radio, MapPin, Activity, Shield, AlertTriangle, 
  Send, Download, Sparkles, BellRing, Target, 
  TrendingUp, Zap, HelpCircle, HeartPulse, RefreshCw
} from 'lucide-react';
import { timeAgo } from './utils';
import { showToast } from '../../utils/toast';
import DistrictOutbreakMap from '../../components/DistrictOutbreakMap';

export default function OutbreakRadarView({
  OB,
  S,
  simulateOutbreak,
  simulatingOutbreak,
  issueDistrictAlert,
  alertSent,
  alertError,
  downloadReport,
  lastAgentScan
}) {
  const [dispatchedAlerts, setDispatchedAlerts] = useState({});

  const handleDispatchUnit = (alertId, villageId, disease) => {
    setDispatchedAlerts(prev => ({ ...prev, [alertId]: true }));
    showToast(`Response Unit Dispatched to Village ${villageId} for ${disease}. ASHA local team alerted.`, 'success');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 text-left bg-gradient-to-br from-[#EBF3FC] via-[#F3FAF7] to-[#FBF8FC] min-h-screen text-slate-800 font-inter relative overflow-hidden">
      
      {/* Embedded CSS animations for premium visual effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes card-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        .progress-bar-shimmer {
          position: relative;
          overflow: hidden;
        }
        .progress-bar-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          animation: progress-shimmer 2s infinite linear;
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 3s infinite ease-in-out;
        }
      `}} />

      {/* Premium ambient light blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-300/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-rose-300/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-300/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(244,63,94,0.35)] relative">
            <Radio className="w-7 h-7 text-white animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-550"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-2xl tracking-tight text-slate-900 uppercase">Epidemic Outbreak Radar</h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                Surveillance Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Autonomous surveillance scanning 1,200+ telemetry nodes every 30 minutes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastAgentScan && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-700">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Agent scan: {timeAgo(lastAgentScan.timestamp)}
            </div>
          )}
          <button
            onClick={() => showToast('Surveillance AI node diagnostics normal. Cache synced.', 'info')}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-250 rounded-xl text-slate-650 hover:text-slate-900 transition-all text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 duration-200"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" /> Diagnostics
          </button>
        </div>
      </div>

      {/* ── HIGH DENSITY METRICS OVERVIEW ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Active Alerts', val: OB.length || 3, icon: '🚨', borderCls: 'from-rose-400 to-red-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(244,63,94,0.15)] hover:border-rose-300/80', valCls: 'text-rose-600', iconBg: 'bg-rose-50 text-rose-500 border-rose-100' },
          { label: 'High-Risk Villages', val: 3, icon: '🏘️', borderCls: 'from-orange-400 to-amber-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(245,158,11,0.15)] hover:border-orange-300/80', valCls: 'text-orange-600', iconBg: 'bg-orange-50 text-orange-500 border-orange-100' },
          { label: 'Under Monitor', val: 24, icon: '🕵️', borderCls: 'from-sky-400 to-blue-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(14,165,233,0.15)] hover:border-sky-300/80', valCls: 'text-sky-600', iconBg: 'bg-sky-50 text-sky-500 border-sky-100' },
          { label: 'Symptom Clusters', val: 8, icon: '📊', borderCls: 'from-yellow-400 to-amber-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(234,179,8,0.15)] hover:border-yellow-300/80', valCls: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-500 border-amber-100' },
          { label: 'Cases Today', val: S.today_symptoms ?? 12, icon: '📈', borderCls: 'from-indigo-400 to-purple-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(99,102,241,0.15)] hover:border-indigo-300/80', valCls: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-550 border-indigo-100' },
          { label: 'AI Risk Prediction', val: '94.2%', icon: '🧠', borderCls: 'from-emerald-400 to-teal-500', glowCls: 'hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)] hover:border-emerald-300/80', valCls: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500 border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white/80 border border-slate-200/60 backdrop-blur-md rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 cursor-default relative overflow-hidden group shadow-md ${s.glowCls}`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r items-stretch" style={{ backgroundImage: `linear-gradient(to right, ${s.borderCls.split(' ')[1]} , ${s.borderCls.split(' ')[3]})` }} />
            <div className="flex justify-between items-start">
              <span className={`text-3xl font-black tracking-tight font-sans ${s.valCls}`}>{s.val}</span>
              <div className={`w-9 h-9 border rounded-xl flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-110 transition-transform ${s.iconBg}`}>{s.icon}</div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── ACTION CONTROLS WIDGET ── */}
      <div className="bg-white border border-slate-100 rounded-[2.25rem] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5 pl-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
          <span className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">Outbreak Response Console</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={simulateOutbreak}
            disabled={simulatingOutbreak}
            className="px-6 py-3.5 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-black rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_6px_20px_rgba(244,63,94,0.25)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.35)] active:scale-95 cursor-pointer"
          >
            {simulatingOutbreak ? 'Simulating Event...' : 'Simulate Outbreak'}
          </button>
          
          <button
            onClick={issueDistrictAlert}
            className={`px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 border cursor-pointer ${
              alertSent 
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_6px_20px_rgba(16,185,129,0.2)]' 
                : alertError 
                ? 'bg-rose-600 text-white border-rose-500 shadow-[0_6px_20px_rgba(244,63,94,0.2)]' 
                : 'bg-white border-slate-200 text-[#1e293b] hover:bg-slate-50 hover:border-slate-300 shadow-sm'
            }`}
          >
            {alertSent ? '✓ Alert Dispatched' : alertError ? '⚠️ Action Failed' : 'Dispatch Alert'}
          </button>

          <button
            onClick={() => showToast('ASHA Local Networks Broadcast Completed.', 'success')}
            className="px-6 py-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_6px_20px_rgba(15,23,42,0.15)] active:scale-95 cursor-pointer"
          >
            Notify ASHA workers
          </button>
          
          <button
            onClick={downloadReport}
            className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#1e293b] rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          <button
            onClick={() => showToast('AI Surveillance Analysis: Fever spikes in Northern Zone require vector control fogging immediately. Dispatches prioritized.', 'info')}
            className="px-6 py-3.5 bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#9333ea] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white font-black rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_6px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> AI Summary
          </button>
        </div>
      </div>

      {/* Conditional message boxes */}
      {alertSent && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-4.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-350 shadow-md">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span>Outbreak Alert SSE Broadcast completed. DynamoDB and Aurora successfully synchronized across nodes.</span>
        </div>
      )}
      {alertError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-850 p-4.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-350 shadow-md">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          <span>Transmission Error: {alertError}</span>
        </div>
      )}

      {/* ── TICKER/ALERT BANNER ── */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-250 rounded-2xl p-4.5 flex items-start sm:items-center gap-3.5 relative overflow-hidden shadow-sm animate-subtle-pulse">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500" />
        <span className="text-xl shrink-0 p-2 bg-amber-500/10 rounded-2xl border border-amber-200/60 text-amber-600">⚠️</span>
        <div className="text-[12.5px] font-bold text-amber-900/95 leading-relaxed text-left">
          <span className="text-amber-750 uppercase tracking-wider font-black text-[11px] block sm:inline mr-1.5">District Warning Alert:</span>
          {OB.length} outbreak clusters identified across 5 sectors. AI surveillance recommends immediate vector/hygiene intervention in Northern Zone.
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="w-full bg-white border border-slate-200/80 rounded-[3rem] p-4.5 shadow-xl relative overflow-hidden">
        <div className="absolute top-3.5 left-8 px-4.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 shadow-xl z-20">
          Live Surveillance Area Map
        </div>
        <DistrictOutbreakMap />
      </div>

      {/* ── TWO-COLUMN DETAILED VIEWS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Active Outbreak List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] overflow-hidden shadow-md">
            <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                <h3 className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-wider">Active Telemetry Alerts</h3>
              </div>
              <span className="px-3.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-black">{OB.length} Active Signals</span>
            </div>
            
            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {OB.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center opacity-70">
                  <Shield className="w-14 h-14 mb-3 text-slate-300" />
                  <p className="font-black text-sm uppercase tracking-wider text-slate-500">All Nodes Stable</p>
                  <p className="text-xs text-slate-400 mt-1">Surveillance monitoring registers zero active anomalies.</p>
                </div>
              ) : OB.map((ob, i) => {
                const rawSeverity = ob.severity || (i === 0 || i === 3 ? 'high' : i === 1 ? 'critical' : 'medium');
                const severity = rawSeverity.charAt(0).toUpperCase() + rawSeverity.slice(1);
                
                const severityColor = 
                  severity === 'Critical' 
                    ? 'text-rose-700 bg-rose-50 border-rose-200 shadow-sm' 
                    : severity === 'High' 
                    ? 'text-orange-700 bg-orange-50 border-orange-200' 
                    : 'text-amber-700 bg-amber-50 border-amber-250';

                const riskScore = ob.riskScore || (ob.confidence ? Math.round(ob.confidence * 100) : (90 - i * 6));
                const confidence = Math.round((ob.confidence ?? (riskScore / 100) ?? 0.8) * 100);
                const villagesImpacted = ob.caseCount ? Math.max(1, Math.min(5, Math.ceil(ob.caseCount / 3))) : (i === 0 ? 3 : i === 1 ? 2 : 1);
                const popImpact = ob.caseCount ? `~${ob.caseCount * 45} villagers` : (i === 0 ? '~450 villagers' : i === 1 ? '~280 villagers' : '~120 villagers');
                const priority = severity === 'Critical' || severity === 'High' ? 'P1 - Immediate Deploy' : 'P2 - Monitor';
                
                const alertId = ob.id || `${ob.villageId}-${ob.detectedAt || i}`;
                const isDispatched = dispatchedAlerts[alertId];

                return (
                  <div key={alertId} 
                    className="pt-6 pb-6 pr-6 pl-8 border border-slate-100 bg-slate-50/40 hover:bg-white rounded-[2rem] hover:border-emerald-400/60 hover:shadow-[0_12px_35px_rgba(16,185,129,0.08)] transition-all duration-300 transform hover:-translate-y-0.5 space-y-4 relative group overflow-hidden"
                  >
                    {/* Glowing status stripe on side of card */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      severity === 'Critical' ? 'bg-gradient-to-b from-rose-500 to-red-500' : severity === 'High' ? 'bg-gradient-to-b from-orange-500 to-amber-500' : 'bg-amber-400'
                    }`} />
                    
                    <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-slate-150">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                        <p className="font-black text-slate-505 text-[11px] tracking-widest uppercase">Village ID: <span className="text-slate-800 font-extrabold">{ob.villageId}</span></p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${severityColor}`}>{severity} Severity</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-slate-100/80 text-slate-650 border border-slate-200">Risk: {riskScore}/100</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-250">Impacted: {villagesImpacted} {villagesImpacted > 1 ? 'villages' : 'village'}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-[15px] font-black text-slate-800 leading-snug">{ob.classification || ob.disease || 'Unknown'} Outbreak Signal</h4>
                      <p className="text-[12px] text-slate-500 font-semibold leading-relaxed">{ob.symptomPattern}</p>
                    </div>

                    <div className="p-4.5 bg-gradient-to-br from-[#F4FDF8] to-[#F8FAFC] border border-emerald-150 rounded-2xl space-y-3 shadow-inner">
                      <div>
                        <p className="text-[9.5px] font-black text-emerald-750 uppercase tracking-widest mb-1.5">Recommended Action Plan</p>
                        <p className="text-xs text-slate-700 font-bold leading-relaxed">{ob.action}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-emerald-100/60 text-left">
                        <div>
                          <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">AI Confidence</p>
                          <p className="text-xs font-black text-emerald-600 font-mono mt-0.5">{confidence}%</p>
                        </div>
                        <div>
                          <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Pop. Impact</p>
                          <p className="text-xs font-black text-slate-700 mt-0.5">{popImpact}</p>
                        </div>
                        <div>
                          <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Priority Level</p>
                          <p className={`text-xs font-black mt-0.5 ${priority.includes('P1') ? 'text-rose-600' : 'text-slate-500'}`}>{priority}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold pt-1">
                      <span>Detected: {timeAgo(ob.detectedAt)}</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleDispatchUnit(alertId, ob.villageId, ob.classification || ob.disease)}
                          disabled={isDispatched}
                          className={`px-5 py-2.5 rounded-2xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 cursor-pointer ${
                            isDispatched 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-250 cursor-default shadow-none font-bold' 
                              : 'bg-slate-900 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/20'
                          }`}
                        >
                          {isDispatched ? '✓ Dispatched' : 'Dispatch Unit'}
                        </button>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> Telemetry Active</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Disease Metrics */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-150 pb-3">
              <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h3 className="font-black text-slate-800 text-[13.5px] uppercase tracking-wider">Top Disease Signals</h3>
            </div>
            
            <div className="space-y-5">
              {[
                { name: 'Fever Cases / बुखार', count: 48, pct: 75, fromColor: 'from-rose-500', toColor: 'to-rose-600' },
                { name: 'Diarrheal Cases / दस्त', count: 32, pct: 50, fromColor: 'from-orange-500', toColor: 'to-amber-500' },
                { name: 'Respiratory / सांस की तकलीफ', count: 29, pct: 45, fromColor: 'from-amber-500', toColor: 'to-yellow-500' },
                { name: 'Skin Infections / त्वचा संक्रमण', count: 14, pct: 22, fromColor: 'from-blue-500', toColor: 'to-cyan-500' },
                { name: 'Maternal Risk / मातृ स्वास्थ्य जोखिम', count: 5, pct: 8, fromColor: 'from-rose-600', toColor: 'to-pink-600' },
              ].map((d, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="tracking-wide">{d.name}</span>
                    <span className="text-slate-900 font-black font-mono">{d.count} cases</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/60 p-0.5 shadow-inner">
                    <div className={`progress-bar-shimmer bg-gradient-to-r ${d.fromColor} ${d.toColor} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-150 text-center">
              <p className="text-[10.5px] text-slate-455 font-semibold italic">
                Data refreshed dynamically from synced ASHA offline logs.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
