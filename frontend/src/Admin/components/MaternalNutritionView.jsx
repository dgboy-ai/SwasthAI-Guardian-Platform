import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Baby, ArrowRight, Users, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const METRIC_COLORS = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
};

export default function MaternalNutritionView({ activeView, demoTourMode, lastSync, S, SM }) {
  const isMaternal = activeView === 'maternal';

  const metrics = isMaternal ? [
    { icon: Heart, label: 'High-Risk Pregnancies', val: S?.pregnancies, color: 'rose', desc: 'WHO danger threshold alerts active' },
    { icon: Activity, label: 'Malnutrition Cases', val: S?.malnutrition, color: 'amber', desc: 'Severe acute malnutrition (SAM) tracked' },
    { icon: Users, label: 'Registered Mothers', val: SM?.totalUsers, color: 'emerald', desc: 'Active antenatal care records' },
    { icon: AlertTriangle, label: 'Critical Alerts', val: SM?.emergencyCount, color: 'red', desc: 'SOS escalations this period' },
  ] : [
    { icon: Baby, label: 'Children Monitored', val: SM?.totalUsers, color: 'emerald', desc: 'WHO Z-score growth tracking' },
    { icon: Activity, label: 'Malnutrition Risk', val: S?.malnutrition, color: 'amber', desc: 'BMI-for-age below -2 SD' },
    { icon: Heart, label: 'Vaccination Coverage', val: S?.pregnancies, color: 'purple', desc: 'Immunization schedule compliance' },
    { icon: Users, label: 'NGO Field Workers', val: SM?.totalNgos, color: 'blue', desc: 'ASHA workers assigned to villages' },
  ];

  const hasData = metrics.some(m => m.val !== null && m.val !== undefined && m.val !== '−');

  return (
    <div className="p-4 lg:p-5 text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900 text-[18px] flex items-center gap-2">
            {isMaternal ? 'Maternal Health' : 'Child Nutrition'}
            {demoTourMode && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-wider">LIVE</span>}
          </h2>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            {isMaternal ? 'Real-time pregnancy risk surveillance & WHO threshold alerts' : 'WHO Z-score + BMI child growth monitoring'}
          </p>
        </div>
        {lastSync && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
            <Clock className="w-3 h-3" /> Synced {lastSync}
          </span>
        )}
      </div>

      {/* Metric Cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-3"
      >
        {!hasData ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
              {isMaternal ? <Heart className="w-7 h-7 text-slate-300" /> : <Baby className="w-7 h-7 text-slate-300" />}
            </div>
            <p className="font-black text-slate-300 uppercase tracking-wider text-sm">
              No {isMaternal ? 'maternal' : 'nutrition'} records yet
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1 mb-5 max-w-sm mx-auto">
              {isMaternal
                ? 'ASHA workers will submit pregnancy vitals from the field. Data appears here once synced.'
                : 'Child growth measurements logged by NGO workers appear here after sync.'}
            </p>
            <Link
              to={isMaternal ? '/ngo/maternal' : '/ngo/child-nutrition'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Open NGO Module <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : metrics.map(m => (
          <motion.div
            key={m.label}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${METRIC_COLORS[m.color]?.bg} ${METRIC_COLORS[m.color]?.text} ${METRIC_COLORS[m.color]?.border}`}>
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mb-0.5">{m.val ?? '−'}</p>
            <p className="text-[10px] text-slate-400 font-medium">{m.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      {hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-black text-slate-900 text-[12px] uppercase tracking-wider">Detailed Records Module</p>
              <p className="text-[10px] text-slate-400 font-medium">Access full patient-level data and historical trends</p>
            </div>
          </div>
          <Link
            to={isMaternal ? '/ngo/maternal' : '/ngo/child-nutrition'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
          >
            Open NGO Module <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}