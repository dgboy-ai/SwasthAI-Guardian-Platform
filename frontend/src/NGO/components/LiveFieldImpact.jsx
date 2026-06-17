import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, Heart, Stethoscope, Ambulance, Users, TrendingUp } from 'lucide-react';

const DEFAULT_METRICS = [
  { label: 'Pregnancies Monitored', value: 24, icon: Heart, color: '#F97316', bg: '#FFF7ED', change: '+2 this week' },
  { label: 'Children Screened', value: 156, icon: Baby, color: '#8B5CF6', bg: '#F5F3FF', change: '+12 this week' },
  { label: 'Symptoms Checked', value: 18, icon: Stethoscope, color: '#059669', bg: '#ECFDF5', change: 'Today' },
  { label: 'Emergency Responses', value: 7, icon: Ambulance, color: '#EF4444', bg: '#FEF2F2', change: '3 active' },
  { label: 'Villagers Served / Month', value: 412, icon: Users, color: '#2563EB', bg: '#EFF6FF', change: '+18% vs last month' },
];

function AnimatedValue({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(target / (1200 / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { clearInterval(timer); setCount(target); return; }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}</>;
}

export default function LiveFieldImpact({ metrics = DEFAULT_METRICS, className = '' }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-3xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#059669]" />
          Live Field Impact
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                <AnimatedValue target={m.value} />
              </p>
              <p className="text-[10px] font-bold text-slate-500 mt-1.5 leading-tight">{m.label}</p>
              <p className="text-[9px] font-semibold mt-1" style={{ color: m.color }}>{m.change}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
