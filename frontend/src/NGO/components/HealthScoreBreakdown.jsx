import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { label: 'Vaccination', value: 91, color: '#059669', bg: '#ECFDF5', trend: 'up', change: '+3%' },
  { label: 'Maternal Health', value: 78, color: '#D97706', bg: '#FFFBEB', trend: 'up', change: '+2%' },
  { label: 'Child Nutrition', value: 74, color: '#7C3AED', bg: '#F5F3FF', trend: 'down', change: '-1%' },
  { label: 'Disease Risk', value: 32, color: '#DC2626', bg: '#FEF2F2', trend: 'stable', change: '0%', inverse: true },
];

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const trendColor = (trend, inverse) => {
  if (inverse) {
    if (trend === 'up') return 'text-red-600';
    if (trend === 'down') return 'text-emerald-600';
    return 'text-slate-400';
  }
  if (trend === 'up') return 'text-emerald-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-slate-400';
};

export default function HealthScoreBreakdown({ score = 82, categories = DEFAULT_CATEGORIES, className = '' }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-3xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#059669]" />
          Health Score Breakdown
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          Updated today
        </span>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#E2E8F0" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="30" fill="none" stroke="#059669" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-[#059669]">{score}/100</span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-semibold leading-relaxed">
          <p>Village V101 overall health</p>
          <p className="text-[#059669] font-black">{score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Needs Attention'}</p>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700">{cat.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black ${trendColor(cat.trend, cat.inverse)}`}>
                  <TrendIcon trend={cat.trend} />
                </span>
                <span className={`text-[10px] font-black ${trendColor(cat.trend, cat.inverse)}`}>
                  {cat.change}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cat.inverse ? 100 - cat.value : cat.value}%`, backgroundColor: cat.color }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] font-bold text-slate-400">{cat.value}%</span>
              <span
                className="text-[10px] font-bold"
                style={{ color: cat.inverse ? (cat.value > 50 ? '#DC2626' : '#059669') : cat.color }}
              >
                {cat.inverse ? `${100 - cat.value}% Safe` : `${cat.value}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
