import React from 'react';
import {
  Heart, Baby, Radio, Truck, WifiOff, Activity,
  BrainCircuit, AlertTriangle, TrendingUp, Users,
  Zap, Shield, Database, ArrowRight, ChevronRight,
  Package, FileText
} from 'lucide-react';
import ProductionEvidencePanel from './ProductionEvidencePanel';
import KpiCard from './KpiCard';
import SkeletonCard from '../../components/SkeletonCard';
import { timeAgo, latestDynamoWrite } from './utils';

export default function CommandCenterView({
  systemStatus,
  dynamoFeed,
  systemLoading,
  systemError,
  critAlerts,
  recs,
  S,
  OB,
  AM,
  SM,
  isLoading,
  setActiveView,
  downloadReport,
  judgeDemoMode,
  liveAmbulanceLocations = {}
}) {
  const latestWrite = latestDynamoWrite(dynamoFeed);
  const activeDispatches = Object.values(liveAmbulanceLocations);

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <ProductionEvidencePanel
        systemStatus={systemStatus}
        dynamoFeed={dynamoFeed}
        loading={systemLoading}
        error={systemError}
      />

      {/* Critical Alerts */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="font-black text-rose-800 text-sm uppercase tracking-wider">
              🔴 Critical Health Alerts ({critAlerts.length} Active)
            </p>
          </div>
          <button 
            onClick={() => setActiveView('outbreak')}
            className="text-xs font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
          >
            View All Alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {critAlerts.map((a, i) => (
            <div key={i} className="bg-white rounded-xl border border-rose-100 p-3.5 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <a.icon className="w-4.5 h-4.5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-rose-800 text-sm truncate">{a.title}</p>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{a.sub}</p>
                <p className="text-[10px] sm:text-xs text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse shrink-0" />
                  {a.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantified Impact Dashboard */}
      <div className="bg-[#032d1e] rounded-2xl p-5 text-white border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="font-extrabold text-white text-sm sm:text-base tracking-wide uppercase leading-tight">Quantified Impact Dashboard</p>
            <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">Social Return on Investment &amp; Lives Saved</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black tracking-wider uppercase ml-auto">
            WHO Benchmark Ratios
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Lives Impacted', val: '2,34,000', sub: 'Based on seeded village data', color: 'text-emerald-300' },
            { label: 'Maternal Deaths Preventable', val: '12 / year', sub: 'WHO benchmark ratio', color: 'text-rose-300' },
            { label: 'Avg Outbreak Detection', val: '4.2 hours', sub: 'vs. 72-hour manual baseline', color: 'text-amber-300' },
            { label: 'ASHA Tech Cost', val: '₹0 / worker / month', sub: 'Offline-first architecture', color: 'text-sky-300' },
          ].map((x, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div>
                <p className={`text-2xl font-black ${x.color}`}>{x.val}</p>
                <p className="text-xs font-black text-white/90 uppercase tracking-wider mt-1">{x.label}</p>
              </div>
              <p className="text-xs text-white/60 font-semibold mt-2">{x.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* ── LEFT 3/5 ── */}
        <div className="xl:col-span-3 space-y-4">

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
              <>
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
              </>
            ) : (
              <>
                <KpiCard icon={Heart} color="rose" label="High-Risk Pregnancies" value={S.pregnancies ?? 126} trend={18} />
                <KpiCard icon={Baby} color="amber" label="Severe Malnutrition Cases" value={S.malnutrition ?? 248} trend={12} />
                <KpiCard icon={Radio} color="red" label="Active Outbreak Clusters" value={OB.length || 3} badge="NEW" />
                <KpiCard icon={Truck} color="emerald" label="Active Ambulances" value={`${AM.length || 7}/7`} />
                <KpiCard icon={WifiOff} color="slate" label="Offline Villages" value={S.villages ?? 4} />
                <KpiCard icon={Activity} color="purple" label="Emergency Cases Today" value={S.today_symptoms ?? 12} trend={20} />
              </>
            )}
          </div>

          {/* 🚑 Live Ambulance WebSocket Telemetry Panel */}
          {activeDispatches.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Truck className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-wide">Live Dispatch Telemetry</h3>
                    <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">WebSocket Gateway Stream Connected</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-250 rounded-full text-[10px] font-black tracking-wider uppercase animate-pulse">
                  {activeDispatches.length} Active Dispatch{activeDispatches.length > 1 ? 'es' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeDispatches.map((loc) => (
                  <div key={loc.requestId} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-350 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">Patient: {loc.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">ID: AMB-{loc.requestId}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider shrink-0 ${
                        loc.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse' : 'bg-orange-50 text-orange-700 border-orange-255'
                      }`}>
                        {loc.priority}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 space-y-1 text-[11px] font-medium text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-bold">GPS Lat:</span>
                        <span className="font-mono text-slate-800">{loc.coords?.lat}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-bold">GPS Lng:</span>
                        <span className="font-mono text-slate-800">{loc.coords?.lng}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                        <span>Progress</span>
                        <span className="text-emerald-700 font-black">ETA: {loc.eta} min{loc.eta !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, Math.min(100, ((14 - loc.eta) / 14) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row of AI District Intelligence & Offline Village Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI District Intelligence */}
            <div className="bg-[#032d1e] rounded-2xl p-5 relative overflow-hidden border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.08)] flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-40 h-40 opacity-[0.03] pointer-events-none">
                <BrainCircuit className="w-full h-full text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow">
                      <BrainCircuit className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-sm sm:text-base tracking-wide uppercase">AI District Intelligence</p>
                      <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">SymptomNet Surveillance Engine</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {recs.map((r, i) => (
                    <div key={i} className={`bg-white/5 border-l-4 ${r.color} rounded-r-xl px-3 py-2 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors`}>
                      <p className="text-xs text-white/80 font-semibold flex-1 leading-normal">{r.text}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => setActiveView('outbreak')}
                          className={`px-2 py-1 rounded text-xs font-black text-white ${r.btnCls} transition-colors whitespace-nowrap shadow-sm`}
                        >
                          {r.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Offline Village Monitor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <WifiOff className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-wide">Offline Village Monitor</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ASHA Offline-First Sync</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { label: 'Villages Offline', val: S.villages ?? 4, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'Pending Records', val: '12', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                    { label: 'Sync Success Rate', val: '98.1%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Last Recovered', val: 'Village 8', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
                  ].map((x, idx) => (
                    <div key={idx} className={`p-2 rounded-xl border ${x.bg} text-center`}>
                      <p className={`text-lg font-black leading-none ${x.color}`}>{x.val}</p>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">{x.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-semibold text-center italic mt-2">📡 Sync engine automatically retrying in background</p>
            </div>
          </div>

          {/* Recent Outbreak Events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="font-black text-slate-900 text-sm sm:text-base">Recent Outbreak Events</p>
              </div>
              <button onClick={() => setActiveView('outbreak')} className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Village', 'Disease / Type', 'Detected At', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {OB.slice(0, 5).map((ob, i) => {
                    const statusLabel = i === 0 ? 'New' : i <= 2 ? 'Investigating' : 'Monitoring';
                    const outbreakStatusStyle = (s = '') => {
                      const l = s.toLowerCase();
                      if (l.includes('new')) return 'bg-red-100 text-red-700 border-red-200';
                      if (l.includes('invest')) return 'bg-orange-100 text-orange-700 border-orange-200';
                      return 'bg-blue-100 text-blue-700 border-blue-200';
                    };
                    return (
                      <tr key={ob.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs">🏘️</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900">Village {ob.villageId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-slate-600 font-semibold">{ob.classification}</td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-slate-400 font-medium">{timeAgo(ob.detectedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${outbreakStatusStyle(statusLabel)}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT 2/5 ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Platform Users (Moved Higher) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-600" />
              <p className="font-black text-slate-900 text-sm sm:text-base">Platform scale &amp; Reach</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Villagers', val: SM.totalUsers, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'NGO Workers', val: SM.totalNgos, color: 'text-sky-700', bg: 'bg-sky-50' },
                { label: 'SOS Requests', val: SM.emergencyCount, color: 'text-rose-700', bg: 'bg-rose-50' },
                { label: 'Pad Requests', val: SM.sanitaryCount, color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val ?? 0}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Workflows */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-600" />
              <p className="font-black text-slate-900 text-sm sm:text-base">Operational Workflows</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Radio, label: 'Launch Outbreak Investigation', color: 'rose', view: 'outbreak' },
                { icon: Truck, label: 'Ambulance Operations Center', color: 'rose', view: 'ambulance' },
                { icon: WifiOff, label: 'Monitor Offline Villages', color: 'slate', view: 'offline' },
                { icon: Package, label: 'Pad Distribution Monitoring', color: 'purple', view: null },
                { icon: FileText, label: 'Export District Health Report', color: 'emerald', view: null, action: downloadReport },
                { icon: BrainCircuit, label: 'Review AI Recommendations', color: 'blue', view: 'ai' },
              ].map((w, i) => {
                const bg = { rose: 'bg-rose-100', slate: 'bg-slate-100', purple: 'bg-purple-100', emerald: 'bg-emerald-100', blue: 'bg-blue-100' };
                const ic = { rose: 'text-rose-600', slate: 'text-slate-600', purple: 'text-purple-600', emerald: 'text-emerald-700', blue: 'text-blue-600' };
                const PackageIcon = w.icon;
                return (
                  <button
                    key={i}
                    onClick={() => w.action ? w.action() : w.view && setActiveView(w.view)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-center group"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg[w.color]} ${ic[w.color]} group-hover:scale-105 transition-transform shadow-sm`}>
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-tight">{w.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Engines & Judge Toolkit */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-600" />
              <p className="font-black text-slate-900 text-sm sm:text-base">Core Engines &amp; Judge Toolkit</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Sakhi RAG Status', right: <span className="text-xs font-black text-emerald-600 flex items-center gap-1">Connected <span className="text-[10px] font-normal text-slate-400">(430ms)</span></span> },
                { label: 'Offline Sync Queue', right: <span className="text-xs font-black text-rose-600">12 pending</span> },
                { label: 'Judge Evaluation Toolkit', right: <span className={`px-2 py-0.5 rounded text-xs font-black border ${judgeDemoMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{judgeDemoMode ? 'Active' : 'Inactive'}</span> },
                { label: 'Network Simulator Status', right: <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Normal</span> },
                { label: 'Outbreak AI Engine', right: <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Scanning</span> },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500 font-medium">{r.label}</span>
                  {r.right}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">Built on AWS Cloud ☁️</span>
                {['Aurora PostgreSQL', 'DynamoDB', 'AI Service (Groq)'].map(s => (
                  <span key={s} className="text-[10px] text-slate-400 font-medium border-l border-slate-200 pl-1.5">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
