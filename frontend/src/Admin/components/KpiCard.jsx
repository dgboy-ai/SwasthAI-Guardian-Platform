import React from 'react';

const KPI_COLORS = {
  rose: { outer: 'from-rose-500 to-rose-600', num: 'text-rose-600', bg: 'bg-rose-50/50 border-rose-100', glow: 'group-hover:shadow-rose-500/10' },
  amber: { outer: 'from-amber-500 to-orange-500', num: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100', glow: 'group-hover:shadow-amber-500/10' },
  red: { outer: 'from-red-500 to-red-600', num: 'text-red-600', bg: 'bg-red-50/50 border-red-100', glow: 'group-hover:shadow-red-500/10' },
  emerald: { outer: 'from-emerald-500 to-teal-600', num: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100', glow: 'group-hover:shadow-emerald-500/10' },
  slate: { outer: 'from-slate-500 to-slate-700', num: 'text-slate-600', bg: 'bg-slate-50 border-slate-100', glow: 'group-hover:shadow-slate-500/10' },
  purple: { outer: 'from-purple-500 to-indigo-600', num: 'text-purple-700', bg: 'bg-purple-50/50 border-purple-100', glow: 'group-hover:shadow-purple-500/10' },
};

export default function KpiCard({ icon: Icon, label, value, trend, badge, color }) {
  const c = KPI_COLORS[color] || KPI_COLORS.slate;
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow} group cursor-default flex flex-col justify-between relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${c.outer} opacity-[0.02] rounded-bl-full pointer-events-none`} />
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${c.outer} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          {badge && (
            <span className="text-[9px] font-black px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 tracking-wider uppercase animate-pulse">{badge}</span>
          )}
        </div>
        <p className={`text-3xl sm:text-4xl font-black tracking-tight leading-none mb-2 ${c.num}`}>{value}</p>
        <p className="text-[10px] sm:text-[11px] font-black text-slate-500 leading-snug uppercase tracking-widest">{label}</p>
      </div>
      {trend !== undefined && (
        <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <span className={`flex items-center gap-0.5 text-[10.5px] font-black ${trend > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-[9.5px] font-bold text-slate-400">from last week</span>
        </div>
      )}
    </div>
  );
}

