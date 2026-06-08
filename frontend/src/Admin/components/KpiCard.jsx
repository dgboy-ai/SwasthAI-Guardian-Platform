import React from 'react';

const KPI_COLORS = {
  rose: { outer: 'from-rose-500 to-rose-600', num: 'text-rose-600', bg: 'bg-rose-50' },
  amber: { outer: 'from-amber-500 to-orange-500', num: 'text-amber-600', bg: 'bg-amber-50' },
  red: { outer: 'from-red-500 to-red-600', num: 'text-red-600', bg: 'bg-red-50' },
  emerald: { outer: 'from-emerald-500 to-teal-600', num: 'text-emerald-700', bg: 'bg-emerald-50' },
  slate: { outer: 'from-slate-500 to-slate-700', num: 'text-slate-600', bg: 'bg-slate-100' },
  purple: { outer: 'from-purple-500 to-indigo-600', num: 'text-purple-700', bg: 'bg-purple-50' },
};

export default function KpiCard({ icon: Icon, label, value, trend, badge, color }) {
  const c = KPI_COLORS[color] || KPI_COLORS.slate;
  return (
    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-4 hover:shadow-md transition-all duration-200 group cursor-default flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${c.outer} shadow-sm`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {badge && (
            <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200 tracking-wider uppercase">{badge}</span>
          )}
        </div>
        <p className={`text-4xl font-black tracking-tight leading-none mb-2 ${c.num}`}>{value}</p>
        <p className="text-[10.5px] font-extrabold text-slate-500 leading-snug uppercase tracking-wider">{label}</p>
      </div>
      {trend !== undefined && (
        <div className="mt-2.5 pt-1.5 border-t border-slate-50 flex items-center gap-1">
          <span className={`flex items-center gap-0.5 text-[10.5px] font-black ${trend > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-[9.5px] font-semibold text-slate-400">from last week</span>
        </div>
      )}
    </div>
  );
}
