import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Baby, Stethoscope, Ambulance, Users, Zap } from 'lucide-react';

const IMPACT_STATS = [
  { label: 'Pregnancies', value: 24, icon: Heart, color: '#F97316', bg: '#FFF7ED', suffix: '' },
  { label: 'Children', value: 156, icon: Baby, color: '#8B5CF6', bg: '#F5F3FF', suffix: '' },
  { label: 'Symptoms', value: 418, icon: Stethoscope, color: '#059669', bg: '#ECFDF5', suffix: '' },
  { label: 'Emergencies', value: 37, icon: Ambulance, color: '#EF4444', bg: '#FEF2F2', suffix: '' },
  { label: 'Villagers', value: 1428, icon: Users, color: '#2563EB', bg: '#EFF6FF', suffix: '' },
  { label: 'Lives Saved', value: 860, icon: Zap, color: '#7C3AED', bg: '#F5F3FF', suffix: '+' },
];

function AnimatedNumber({ target, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { clearInterval(timer); setCount(target); return; }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

export default function LiveImpactCounter({ className = '' }) {
  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-black text-white">Live Impact Counter</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Real-time field impact across your block</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-800/50">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {IMPACT_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center hover:bg-slate-700/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ backgroundColor: stat.bg }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-black text-white leading-none">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
