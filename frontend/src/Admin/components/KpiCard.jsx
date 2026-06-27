import React from 'react';

const KPI_COLORS = {
  rose: { outer: 'from-rose-500 to-rose-600', iconBg: 'bg-rose-500', shadow: 'rgba(244,63,94,0.25)' },
  amber: { outer: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-500', shadow: 'rgba(245,158,11,0.25)' },
  red: { outer: 'from-red-500 to-rose-600', iconBg: 'bg-red-500', shadow: 'rgba(239,68,68,0.25)' },
  emerald: { outer: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-500', shadow: 'rgba(16,185,129,0.25)' },
  slate: { outer: 'from-slate-600 to-slate-700', iconBg: 'bg-slate-600', shadow: 'rgba(100,116,139,0.25)' },
  purple: { outer: 'from-purple-500 to-indigo-500', iconBg: 'bg-purple-500', shadow: 'rgba(168,85,247,0.25)' },
};

export default function KpiCard({ icon: Icon, label, value, trend, badge, color }) {
  const c = KPI_COLORS[color] || KPI_COLORS.slate;
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 group cursor-default flex flex-col justify-between relative overflow-hidden`}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s, transform 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 40px ${c.shadow}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${c.outer} opacity-[0.04] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
      <div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${c.outer} text-white group-hover:scale-110 transition-transform duration-300`}
            style={{ boxShadow: `0 4px 14px ${c.shadow}` }}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.5} />
          </div>
          {badge && (
            <span className="text-[10px] font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-sm tracking-wider uppercase animate-bounce">{badge}</span>
          )}
        </div>
        <p className={`text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1.5`}>{value}</p>
        <p className="text-xs sm:text-sm font-bold text-slate-500 leading-snug uppercase tracking-wider">{label}</p>
      </div>
      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md ${trend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs last week</span>
        </div>
      )}
    </div>
  );
}

