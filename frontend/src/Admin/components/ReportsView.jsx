import React from 'react';
import { Download, CheckCircle, Settings, Users } from 'lucide-react';

export default function ReportsView({
  downloadReport,
  getChartData,
  SM,
  systemStatus,
  districtReport,
  downloadDistrictReport,
  reportLoading,
  REP,
  PERF
}) {
  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map(d => Math.max(d.symptoms, d.emergencies)), 10);

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-black text-slate-900 text-[18px] mb-1">Reports &amp; Exports</h2>
        <p className="text-[11px] text-slate-400 font-medium mb-5">Download full district health data as spreadsheets</p>
        <button onClick={downloadReport} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[12px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Download District CSV Report
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Weekly Health Trends Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-[15px]">Weekly Health Trends</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Symptom detections &amp; emergency dispatches over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> SOS Emergencies</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Symptom Clusters</span>
            </div>
          </div>

          <div className="h-48 w-full flex items-end justify-between gap-4 pt-4 px-2">
            {chartData.map((d, i) => {
              const symHeight = (d.symptoms / maxVal) * 100;
              const emHeight = (d.emergencies / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="flex items-end gap-1.5 h-full w-full justify-center">
                    {/* Emergencies bar */}
                    <div
                      className="w-3 sm:w-5 bg-rose-500 rounded-t-md hover:bg-rose-600 transition-all duration-300 relative group"
                      style={{ height: `${Math.max(emHeight, 4)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {d.emergencies} SOS
                      </div>
                    </div>
                    {/* Symptoms bar */}
                    <div
                      className="w-3 sm:w-5 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all duration-300 relative group"
                      style={{ height: `${Math.max(symHeight, 4)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {d.symptoms} Clusters
                      </div>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-[15px]">District Onboarding Checklist</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Procurement workflow for first district rollout</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Upload villages', done: (SM?.villages || 0) > 0 },
              { label: 'Assign ASHA workers', done: (SM?.totalNgos || 0) > 0 },
              { label: 'Configure outbreak threshold', done: true },
              { label: 'Verify AWS storage', done: systemStatus?.production_ready === true },
              { label: 'Export first district report', done: !!districtReport },
            ].map(step => (
              <div key={step.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[12px] font-bold text-slate-700">{step.label}</span>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {step.done ? 'Ready' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-[15px]">District Configuration</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Repeatable deployment settings for each buyer district</p>
            </div>
            <Settings className="w-5 h-5 text-slate-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Outbreak threshold', val: districtReport?.config?.outbreak_threshold ?? 3 },
              { label: 'Auto ambulance', val: districtReport?.config?.enable_auto_ambulance ? 'On' : 'Off' },
              { label: 'Emergency contact', val: districtReport?.config?.emergency_contact_phone || 'Pending' },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 min-w-0">
                <p className="text-[15px] font-black text-slate-900 truncate">{item.val}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-[15px]">Monthly CMO Report</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Generated from Aurora records + DynamoDB telemetry.</p>
            </div>
            <button onClick={downloadDistrictReport} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          {reportLoading ? (
            <p className="text-[12px] text-slate-400 font-bold">Loading report preview...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Villages', val: REP?.villages?.total ?? 0 },
                { label: 'High-risk', val: REP?.maternal?.highRiskPregnancies ?? 0 },
                { label: 'SOS', val: REP?.emergencies?.ambulanceRequests ?? 0 },
                { label: 'Outbreaks', val: REP?.outbreakAlerts?.count ?? 0 },
              ].map(metric => (
                <div key={metric.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[20px] font-black text-slate-900">{metric.val}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-[15px]">ASHA Performance</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Worker KPIs for CMO review and NGO operations</p>
            </div>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {(PERF || []).slice(0, 4).map(worker => (
              <div key={worker.asha_id || worker.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[12px] font-black text-slate-800 truncate">{worker.name || 'ASHA worker'}</p>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{worker.villageId || 'unassigned'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Ref', val: worker.referrals_count },
                    { label: 'Preg', val: worker.pregnancies_tracked },
                    { label: 'Vax', val: worker.vaccinations_completed },
                    { label: 'SOS', val: worker.emergencies_reported },
                  ].map(metric => (
                    <div key={metric.label}>
                      <p className="text-[14px] font-black text-slate-900">{metric.val ?? 0}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!PERF || PERF.length === 0) && (
              <p className="text-[12px] text-slate-400 font-bold">No ASHA KPI records yet.</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', val: SM?.totalRequests },
          { label: 'Villagers', val: SM?.totalUsers },
          { label: 'NGO Workers', val: SM?.totalNgos },
          { label: 'Emergency SOS', val: SM?.emergencyCount },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[24px] font-black text-slate-900">{s.val ?? 0}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
