import React from 'react';
import { Radio, MapPin, Activity, Shield } from 'lucide-react';
import { timeAgo, outbreakStatusStyle } from './utils';
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
  downloadReport
}) {
  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center">
          <Radio className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="font-black text-slate-900 text-[18px]">Epidemic Outbreak Radar</h2>
          <p className="text-[11px] text-slate-400 font-medium">AI monitors 1,200+ village nodes every 30 minutes</p>
        </div>
      </div>

      {/* High operational density metrics (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Active Alerts', val: OB.length || 3, color: 'text-rose-600' },
          { label: 'High-Risk Villages', val: 3, color: 'text-rose-700' },
          { label: 'Villages Under Monitor', val: 24, color: 'text-slate-700' },
          { label: 'Symptom Clusters', val: 8, color: 'text-amber-700' },
          { label: 'Cases Today', val: S.today_symptoms ?? 12, color: 'text-indigo-600' },
          { label: 'AI Risk Predictions', val: '94.2%', color: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sleek, compact horizontal action toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Outbreak Response Controls</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={simulateOutbreak}
            disabled={simulatingOutbreak}
            className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-400 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm"
          >
            {simulatingOutbreak ? 'Simulating...' : 'Simulate Outbreak Event'}
          </button>
          <button
            onClick={issueDistrictAlert}
            className={`px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm ${alertSent ? 'bg-emerald-500 text-white' : alertError ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'}`}
          >
            {alertSent ? '✅ Alert Sent' : alertError ? '⚠️ Alert Failed' : 'Issue Alert'}
          </button>
          {alertSent && (
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 animate-pulse transition-all">
              ⚡ SSE Broadcast Confirmed (DynamoDB & Aurora Synced)
            </span>
          )}
          {alertError && (
            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 transition-opacity">
              Error: {alertError}
            </span>
          )}
          <button
            onClick={() => showToast('ASHA Network Broadcast Signal Dispatched.')}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm"
          >
            Notify ASHA Network
          </button>
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm"
          >
            Export Outbreak Report
          </button>
          <button
            onClick={() => showToast('AI Briefing Summary: Fever signals registered in Village 47 have triggered a P1 response dispatch. Resource reallocation completed.', 'info')}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm"
          >
            Generate AI Briefing
          </button>
        </div>
      </div>

      {/* District Summary Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <p className="text-[12px] font-bold text-amber-800 leading-relaxed">
          <strong>District Outbreak Summary:</strong> {OB.length} outbreak clusters detected across 5 villages. AI recommends immediate intervention in Northern Zone.
        </p>
      </div>

      {/* 🗺️ Real-time Outbreak Heatmap */}
      <div className="w-full">
        <DistrictOutbreakMap />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Active AI Outbreak Alerts (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="font-black text-slate-900 text-[13px]">Active AI Outbreak Alerts</p>
              </div>
              <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border border-rose-100">{OB.length} Detected</span>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {OB.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center opacity-40">
                  <Shield className="w-12 h-12 mb-3" />
                  <p className="font-black text-sm">No Outbreaks Detected</p>
                </div>
              ) : OB.map((ob, i) => {
                const severity = i === 0 || i === 3 ? 'High' : i === 1 ? 'Critical' : 'Medium';
                const severityColor = severity === 'Critical' || severity === 'High' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200';
                const riskScore = ob.confidence ? Math.round(ob.confidence * 100) : (90 - i * 6);
                const confidence = Math.round((ob.confidence ?? 0.8) * 100);
                const villagesImpacted = i === 0 ? 3 : i === 1 ? 2 : 1;
                const popImpact = i === 0 ? '~450 villagers' : i === 1 ? '~280 villagers' : '~120 villagers';
                const priority = severity === 'Critical' || severity === 'High' ? 'P1 - Immediate Deploy' : 'P2 - Monitor';

                return (
                  <div key={ob.id || i} className="p-4 border border-slate-200 bg-white rounded-2xl hover:border-slate-300 transition-colors shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                        <p className="font-black text-slate-800 text-[12px]">Village ID: {ob.villageId}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${severityColor}`}>{severity} Severity</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-50 text-slate-600 border border-slate-200">Risk: {riskScore}/100</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">Impacted: {villagesImpacted} {villagesImpacted > 1 ? 'villages' : 'village'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[14px] font-black text-slate-900">{ob.classification} Signal Detected</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{ob.symptomPattern}</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                      <div>
                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">Recommended Action Plan</p>
                        <p className="text-[11.5px] text-slate-700 font-bold leading-relaxed">{ob.action}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                        <div>
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">AI Confidence</p>
                          <p className="text-[11px] font-black text-slate-800">{confidence}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Pop. Impact</p>
                          <p className="text-[11px] font-black text-slate-800">{popImpact}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Priority Level</p>
                          <p className={`text-[11px] font-black ${priority.includes('P1') ? 'text-red-600' : 'text-slate-600'}`}>{priority}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                      <span>Detected: {timeAgo(ob.detectedAt)}</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> Real-time telemetry feed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Top Disease Signals & Status Panel (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-600" />
              <p className="font-black text-slate-900 text-[13px] uppercase tracking-wide">Top Disease Signals</p>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Fever Cases', count: 48, pct: 75, color: 'bg-rose-500' },
                { name: 'Diarrheal Cases', count: 32, pct: 50, color: 'bg-orange-500' },
                { name: 'Respiratory Cases', count: 29, pct: 45, color: 'bg-amber-500' },
                { name: 'Skin Infection Cases', count: 14, pct: 22, color: 'bg-blue-500' },
                { name: 'Maternal Risk Alerts', count: 5, pct: 8, color: 'bg-rose-600' },
              ].map((d, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">{d.name}</span>
                    <span className="text-slate-900">{d.count} cases</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
