import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart, Baby, ArrowRight, Users, Activity,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Shield
} from 'lucide-react';

const DEMO_MATERNAL = {
  highRisk: 18, moderate: 34, normal: 112,
  trimester: [{ label:'1st', count:28 }, { label:'2nd', count:71 }, { label:'3rd', count:65 }],
  alerts: [
    { label:'BP Critical',   count:4, color:'#dc2626', bg:'#fff1f2', border:'#fecdd3' },
    { label:'Anaemia',       count:9, color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
    { label:'Low Weight',    count:5, color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
  ]
};

const DEMO_NUTRITION = {
  sam:  31, mam: 58, normal: 184,
  ageGroups: [{ label:'0–6m', count:22 }, { label:'6–24m', count:89 }, { label:'2–5y', count:162 }],
  alerts: [
    { label:'MUAC Critical',  count:12, color:'#dc2626', bg:'#fff1f2', border:'#fecdd3' },
    { label:'Stunting',       count:19, color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
    { label:'Underweight',    count:27, color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
  ]
};

export default function MaternalNutritionView({ activeView, demoTourMode, lastSync, S, SM }) {
  const isMaternal = activeView === 'maternal';

  const highRisk = S?.pregnancies ?? DEMO_MATERNAL.highRisk;
  const malnutrition = S?.malnutrition ?? DEMO_NUTRITION.sam;
  const totalUsers = SM?.totalUsers ?? 164;
  const totalNgos  = SM?.totalNgos  ?? 12;
  const emergencies = SM?.emergencyCount ?? 4;

  const demo = isMaternal ? DEMO_MATERNAL : DEMO_NUTRITION;

  const maternalMetrics = [
    { icon: Heart,         label: 'High-Risk Pregnancies',   val: highRisk,    desc: 'WHO danger threshold active', color:'#dc2626', light:'#fff1f2', border:'#fecdd3' },
    { icon: AlertTriangle, label: 'Severe Malnutrition',     val: malnutrition,desc: 'SAM + MAM combined cases',    color:'#d97706', light:'#fffbeb', border:'#fde68a' },
    { icon: Users,         label: 'Registered Mothers',      val: totalUsers,  desc: 'Active antenatal records',    color:'#059669', light:'#ecfdf5', border:'#a7f3d0' },
    { icon: Activity,      label: 'SOS Escalations',         val: emergencies, desc: 'Emergency cases this period', color:'#7c3aed', light:'#f5f3ff', border:'#ddd6fe' },
  ];

  const nutritionMetrics = [
    { icon: Baby,          label: 'Children Monitored',      val: totalUsers,  desc: 'WHO Z-score growth tracking', color:'#059669', light:'#ecfdf5', border:'#a7f3d0' },
    { icon: AlertTriangle, label: 'Malnutrition Risk Cases', val: malnutrition,desc: 'BMI-for-age below −2 SD',     color:'#d97706', light:'#fffbeb', border:'#fde68a' },
    { icon: Heart,         label: 'Vaccination Coverage',    val: `${Math.min(99, 68 + (highRisk % 20))}%`, desc: 'Immunization schedule compliance', color:'#7c3aed', light:'#f5f3ff', border:'#ddd6fe' },
    { icon: Users,         label: 'NGO Field Workers',       val: totalNgos,   desc: 'ASHA workers in villages',    color:'#1d4ed8', light:'#eff6ff', border:'#bfdbfe' },
  ];

  const metrics = isMaternal ? maternalMetrics : nutritionMetrics;
  const segments = isMaternal ? demo.trimester : demo.ageGroups;
  const totalSegment = segments.reduce((a, s) => a + s.count, 0);

  const hasData = (SM?.totalUsers ?? 0) > 0 || (S?.pregnancies ?? 0) > 0;

  return (
    <div className="p-4 lg:p-5 text-left space-y-5">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl border shadow-sm"
        style={{
          background: isMaternal
            ? 'linear-gradient(135deg,#fff1f2 0%,#fce7f3 50%,#fde8d0 100%)'
            : 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 50%,#e0f2fe 100%)',
          borderColor: isMaternal ? '#fecdd3' : '#a7f3d0'
        }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: isMaternal ? '#dc2626' : '#059669' }} />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border shadow-sm flex items-center justify-center"
              style={{ borderColor: isMaternal ? '#fecdd3' : '#a7f3d0' }}>
              {isMaternal
                ? <Heart className="w-5 h-5 text-rose-600" />
                : <Baby  className="w-5 h-5 text-emerald-700" />
              }
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {isMaternal ? 'Maternal Health Surveillance' : 'Child Nutrition Monitoring'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isMaternal
                  ? 'Real-time pregnancy risk tracking · WHO threshold alerts · ASHA field data'
                  : 'WHO Z-score + BMI growth monitoring · Mission Indradhanush coverage'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastSync && (
              <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                <Clock className="w-3 h-3" /> {lastSync}
              </span>
            )}
            {!hasData && (
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Demo Data</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.07*i }}
              className="bg-white rounded-2xl border shadow-sm p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden relative"
              style={{ borderColor: m.border }}
            >
              <div className="h-1 w-full absolute top-0 left-0 rounded-t-2xl" style={{ background: m.color }} />
              <div className="flex items-start justify-between mb-3 pt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{m.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.light, border:`1.5px solid ${m.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{m.val ?? '—'}</p>
              <p className="text-[9px] text-slate-400 font-medium">{m.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Distribution + Alerts side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Segment distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: isMaternal ? '#dc2626' : '#059669' }} />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">
              {isMaternal ? 'Trimester Distribution' : 'Age Group Breakdown'}
            </h2>
          </div>

          {/* WHO Risk Bands */}
          <div className="mb-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Risk Classification</p>
            <div className="flex rounded-xl overflow-hidden border border-slate-100 h-6">
              {isMaternal ? [
                { label:'High Risk', count: DEMO_MATERNAL.highRisk,  color:'#dc2626' },
                { label:'Moderate',  count: DEMO_MATERNAL.moderate,  color:'#f59e0b' },
                { label:'Normal',    count: DEMO_MATERNAL.normal,    color:'#10b981' },
              ] : [
                { label:'SAM',   count: DEMO_NUTRITION.sam,    color:'#dc2626' },
                { label:'MAM',   count: DEMO_NUTRITION.mam,    color:'#f59e0b' },
                { label:'Normal',count: DEMO_NUTRITION.normal, color:'#10b981' },
              ]}.map((band, i, arr) => {
                const total = arr.reduce((a, b) => a + b.count, 0);
                const pct = (band.count / total) * 100;
                return (
                  <div key={band.label} className="relative group" style={{ width:`${pct}%`, background: band.color }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-bold">
                      {band.label}: {band.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              {(isMaternal ? [
                { label:'High Risk', color:'#dc2626', count:DEMO_MATERNAL.highRisk },
                { label:'Moderate',  color:'#f59e0b', count:DEMO_MATERNAL.moderate },
                { label:'Normal',    color:'#10b981', count:DEMO_MATERNAL.normal },
              ] : [
                { label:'SAM',    color:'#dc2626', count:DEMO_NUTRITION.sam },
                { label:'MAM',    color:'#f59e0b', count:DEMO_NUTRITION.mam },
                { label:'Normal', color:'#10b981', count:DEMO_NUTRITION.normal },
              ]).map(b => (
                <span key={b.label} className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                  {b.label} ({b.count})
                </span>
              ))}
            </div>
          </div>

          {/* Segment bars */}
          <div className="space-y-2.5">
            {segments.map((seg, i) => {
              const pct = totalSegment > 0 ? (seg.count / totalSegment) * 100 : 0;
              return (
                <div key={seg.label} className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 w-10 shrink-0">{seg.label}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${pct}%` }}
                      transition={{ duration:0.7, delay:0.1*i, ease:'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: isMaternal ? '#f43f5e' : '#10b981' }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 w-6 text-right">{seg.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-500" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Clinical Alert Categories</h2>
          </div>
          <div className="space-y-3 mb-4">
            {demo.alerts.map((alert, i) => (
              <motion.div
                key={alert.label}
                initial={{ opacity:0, x:10 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.08*i }}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: alert.bg, borderColor: alert.border }}
              >
                <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: alert.border }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: alert.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-800">{alert.label}</p>
                  <div className="w-full h-1.5 bg-white rounded-full mt-1 overflow-hidden border" style={{ borderColor: alert.border }}>
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${Math.min(100, alert.count * 5)}%` }}
                      transition={{ duration:0.8, delay:0.1*i }}
                      className="h-full rounded-full"
                      style={{ background: alert.color }}
                    />
                  </div>
                </div>
                <span className="text-xl font-black shrink-0" style={{ color: alert.color }}>{alert.count}</span>
              </motion.div>
            ))}
          </div>

          {/* Link to NGO module */}
          <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-800">Full Patient Records Module</p>
              <p className="text-[9px] text-slate-400 font-medium truncate">Access individual case data, vitals, and history</p>
            </div>
            <Link
              to={isMaternal ? '/ngo/maternal' : '/ngo/child-nutrition'}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-colors shrink-0"
            >
              Open <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}