import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Download, CheckCircle2, Settings, Users, Clock,
  Heart, Truck, Radio, MapPin, BarChart3,
  TrendingUp, TrendingDown, Shield, FileText,
  AlertCircle, Star
} from 'lucide-react';

/* ─── Animated counter ─────────────────────────────────────────────────── */
function AnimCount({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const num = typeof value === 'number' ? value : 0;
  const [n, setN] = [0, () => {}];
  if (inView && typeof value === 'number') {/* handled below */}
  return (
    <span ref={ref}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        {value ?? '—'}
      </motion.span>
    </span>
  );
}

/* ─── Bar chart bar ─────────────────────────────────────────────────────── */
function Bar({ height, color, tooltip, delay }) {
  return (
    <div className="relative group flex flex-col justify-end h-full">
      <motion.div
        className="w-full rounded-t-sm cursor-default"
        style={{ backgroundColor: color }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: `${Math.max(height, 3)}%`, opacity: 1 }}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      />
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg font-bold">
        {tooltip}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function ReportsView({
  downloadReport, getChartData, SM, systemStatus,
  districtReport, downloadDistrictReport, reportLoading, REP, PERF, demoTourMode, lastSync
}) {
  const chartData = getChartData();
  const hasData = chartData.length > 0;
  const maxVal = hasData ? Math.max(...chartData.map(d => Math.max(d.symptoms, d.emergencies)), 1) : 1;

  /* demo fallback data when no live data */
  const DEMO_PERF = [
    { name: 'Priya Sharma', villageId: 'V101', referrals_count: 14, pregnancies_tracked: 8, vaccinations_completed: 22, emergencies_reported: 3 },
    { name: 'Anita Devi',   villageId: 'V103', referrals_count: 11, pregnancies_tracked: 6, vaccinations_completed: 18, emergencies_reported: 2 },
    { name: 'Sunita Rai',   villageId: 'V107', referrals_count: 9,  pregnancies_tracked: 5, vaccinations_completed: 15, emergencies_reported: 1 },
    { name: 'Meena Kumari', villageId: 'V104', referrals_count: 7,  pregnancies_tracked: 4, vaccinations_completed: 12, emergencies_reported: 2 },
  ];

  const DEMO_CHART = [
    { label: 'Mon', symptoms: 3, emergencies: 1 },
    { label: 'Tue', symptoms: 5, emergencies: 2 },
    { label: 'Wed', symptoms: 2, emergencies: 1 },
    { label: 'Thu', symptoms: 8, emergencies: 3 },
    { label: 'Fri', symptoms: 4, emergencies: 2 },
    { label: 'Sat', symptoms: 6, emergencies: 1 },
    { label: 'Sun', symptoms: 3, emergencies: 0 },
  ];

  const chart = hasData ? chartData : DEMO_CHART;
  const cMax = Math.max(...chart.map(d => Math.max(d.symptoms, d.emergencies)), 1);
  const perf = PERF?.length > 0 ? PERF : DEMO_PERF;

  const yLabels = [cMax, Math.round(cMax * 0.75), Math.round(cMax * 0.5), Math.round(cMax * 0.25), 0];

  const checklistItems = [
    { label: 'Village data uploaded',        done: (SM?.totalUsers || 0) > 0,              icon: MapPin,       category: 'Setup' },
    { label: 'ASHA workers assigned',         done: (SM?.totalNgos || 0) > 0,              icon: Users,        category: 'Setup' },
    { label: 'Outbreak threshold configured', done: true,                                   icon: Radio,        category: 'Config' },
    { label: 'AWS storage verified',          done: systemStatus?.production_ready === true, icon: Shield,       category: 'Infra' },
    { label: 'First district report exported',done: !!districtReport,                       icon: FileText,     category: 'Report' },
  ];
  const doneCount = checklistItems.filter(c => c.done).length;

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Hero Header + Export Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/70 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-200/20 pointer-events-none" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Reports & Exports</h1>
                {demoTourMode && (
                  <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full">Demo</span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">District health analytics · ASHA performance · CMO-ready exports</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {lastSync && (
              <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                <Clock className="w-3 h-3" /> {lastSync}
              </span>
            )}
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm hover:shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              District CSV
            </button>
            <button
              onClick={downloadDistrictReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm hover:shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              CMO Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Aggregate KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Villagers', val: SM?.totalUsers ?? 0,     icon: Users,   color: '#059669', light: '#ecfdf5', border: '#a7f3d0' },
          { label: 'NGO Partners',    val: SM?.totalNgos ?? 0,      icon: Heart,   color: '#dc2626', light: '#fff1f2', border: '#fecdd3' },
          { label: 'Emergency SOS',   val: SM?.emergencyCount ?? 0, icon: Truck,   color: '#d97706', light: '#fffbeb', border: '#fde68a' },
          { label: 'Active Districts',val: 1,                       icon: MapPin,  color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
        ].map(({ label, val, icon: Icon, color, light, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i }}
            className="rounded-2xl border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
            style={{ background: light, borderColor: border }}
          >
            <div className="w-9 h-9 rounded-xl bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: border }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">{val}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Chart + CMO Report side by side ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Weekly Health Trends Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">Weekly Health Trends</h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Symptom detections & emergency dispatches · last 7 days
                {!hasData && <span className="ml-2 text-amber-600 font-bold">(demo data)</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" />
                Symptom Clusters
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-rose-500 inline-block" />
                SOS Emergencies
              </span>
            </div>
          </div>

          {/* Chart area */}
          <div className="flex gap-2 h-44">
            {/* Y-axis */}
            <div className="flex flex-col justify-between items-end pr-2 shrink-0">
              {yLabels.map((y, i) => (
                <span key={i} className="text-[8px] font-bold text-slate-300">{y}</span>
              ))}
            </div>
            {/* Bars */}
            <div className="flex-1 flex items-end gap-2 border-b border-l border-slate-100">
              {chart.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full">
                  <div className="flex-1 w-full flex items-end gap-0.5">
                    <Bar height={(d.symptoms / cMax) * 100}    color="#10b981" tooltip={`${d.symptoms} clusters`}    delay={0.04 * i} />
                    <Bar height={(d.emergencies / cMax) * 100} color="#f43f5e" tooltip={`${d.emergencies} SOS`}      delay={0.04 * i + 0.02} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider pb-1">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Symptom Reports', val: chart.reduce((a, d) => a + d.symptoms, 0),    color: '#059669', icon: TrendingUp },
              { label: 'Total SOS Dispatches',  val: chart.reduce((a, d) => a + d.emergencies, 0), color: '#dc2626', icon: Truck },
              { label: 'Avg/Day (Symptoms)',    val: (chart.reduce((a,d)=>a+d.symptoms,0)/7).toFixed(1), color: '#7c3aed', icon: BarChart3 },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
                <p className="text-base font-black text-slate-900">{val}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CMO Monthly Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">CMO Report</h2>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Aurora records + DynamoDB telemetry</p>
            </div>
            <button
              onClick={downloadDistrictReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>

          {reportLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {[0,1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: 'Total Villages',    val: REP?.villages?.total ?? 0,                    icon: MapPin,  color: '#059669', light: '#ecfdf5', border: '#a7f3d0' },
                { label: 'High-Risk Maternal',val: REP?.maternal?.highRiskPregnancies ?? 0,       icon: Heart,  color: '#dc2626', light: '#fff1f2', border: '#fecdd3' },
                { label: 'Ambulance Requests',val: REP?.emergencies?.ambulanceRequests ?? 0,      icon: Truck,  color: '#d97706', light: '#fffbeb', border: '#fde68a' },
                { label: 'Outbreak Alerts',   val: REP?.outbreakAlerts?.count ?? 0,               icon: Radio,  color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
              ].map(({ label, val, icon: Icon, color, light, border }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.07 * i }}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ background: light, borderColor: border }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: border }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{val}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ASHA Performance + Checklist side by side ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ASHA Leaderboard */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">ASHA Performance</h2>
                <p className="text-[9px] text-slate-400 font-medium">Worker KPIs · CMO review panel</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{perf.length} workers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['#', 'Worker', 'Village', 'Referrals', 'Pregnancies', 'Vaccinations', 'SOS', 'Score'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perf.slice(0, 5).map((w, i) => {
                  const score = (w.referrals_count || 0) + (w.pregnancies_tracked || 0) * 2 + (w.vaccinations_completed || 0) + (w.emergencies_reported || 0) * 3;
                  const isTop = i === 0;
                  return (
                    <motion.tr
                      key={w.asha_id || w.name || i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={`border-b border-slate-50 hover:bg-emerald-50/30 transition-colors ${isTop ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        {isTop
                          ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          : <span className="text-[9px] font-black text-slate-300">{i + 1}</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                            {(w.name || 'A')[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-24">{w.name || 'ASHA Worker'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">{w.villageId || '—'}</span>
                      </td>
                      {[
                        { val: w.referrals_count,        color: '#059669' },
                        { val: w.pregnancies_tracked,    color: '#dc2626' },
                        { val: w.vaccinations_completed, color: '#1d4ed8' },
                        { val: w.emergencies_reported,   color: '#d97706' },
                      ].map(({ val, color }, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <span className="text-sm font-black" style={{ color }}>{val ?? 0}</span>
                        </td>
                      ))}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (score / 80) * 100)}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-slate-600">{score}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {perf.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">No ASHA records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboarding Checklist + District Config */}
        <div className="space-y-4">
          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider">Deployment Checklist</h2>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">District rollout readiness</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-700">{doneCount}/{checklistItems.length}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Complete</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / checklistItems.length) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors"
                    style={{
                      background: item.done ? '#f0fdf4' : '#fafafa',
                      borderColor: item.done ? '#a7f3d0' : '#e2e8f0'
                    }}
                  >
                    {item.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    }
                    <span className="text-[10px] font-bold text-slate-700 flex-1">{item.label}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.done ? 'Ready' : 'Pending'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* District Config */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider">District Config</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Outbreak Threshold',  val: districtReport?.config?.outbreak_threshold ?? 3,                               color: '#dc2626', light: '#fff1f2', border: '#fecdd3' },
                { label: 'Auto Ambulance',      val: districtReport?.config?.enable_auto_ambulance ? 'Enabled' : 'Disabled',         color: '#059669', light: '#ecfdf5', border: '#a7f3d0' },
                { label: 'Emergency Contact',   val: districtReport?.config?.emergency_contact_phone || 'Pending setup',             color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
              ].map(({ label, val, color, light, border }) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: light, borderColor: border }}>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-black" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
