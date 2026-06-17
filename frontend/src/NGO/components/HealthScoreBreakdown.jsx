import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Shield, HeartPulse, Apple, AlertTriangle, Clock } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { label: 'Vaccination', value: 91, color: '#059669', bg: '#ECFDF5', trend: 'up', change: '+3%' },
  { label: 'Maternal Health', value: 78, color: '#D97706', bg: '#FFFBEB', trend: 'up', change: '+2%' },
  { label: 'Child Nutrition', value: 74, color: '#7C3AED', bg: '#F5F3FF', trend: 'down', change: '-1%' },
  { label: 'Disease Risk', value: 32, color: '#DC2626', bg: '#FEF2F2', trend: 'stable', change: '0%', inverse: true },
];

const categoryIcons = {
  Vaccination: Shield,
  'Maternal Health': HeartPulse,
  'Child Nutrition': Apple,
  'Disease Risk': AlertTriangle,
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-2.5 h-2.5" />;
  if (trend === 'down') return <TrendingDown className="w-2.5 h-2.5" />;
  return <Minus className="w-2.5 h-2.5" />;
};

const trendColor = (trend, inverse) => {
  if (inverse) {
    if (trend === 'up') return 'text-red-500';
    if (trend === 'down') return 'text-emerald-500';
    return 'text-slate-400';
  }
  if (trend === 'up') return 'text-emerald-500';
  if (trend === 'down') return 'text-red-500';
  return 'text-slate-400';
};

const badge = (value, inverse) => {
  if (inverse) {
    if (value <= 20) return { label: 'Low', cls: 'bg-emerald-50 text-emerald-600' };
    if (value <= 40) return { label: 'Moderate', cls: 'bg-amber-50 text-amber-600' };
    return { label: 'High', cls: 'bg-red-50 text-red-600' };
  }
  if (value >= 90) return { label: 'Excellent', cls: 'bg-emerald-50 text-emerald-600' };
  if (value >= 75) return { label: 'Good', cls: 'bg-emerald-50 text-emerald-600' };
  if (value >= 60) return { label: 'Fair', cls: 'bg-amber-50 text-amber-600' };
  return { label: 'Low', cls: 'bg-red-50 text-red-600' };
};

export default function HealthScoreBreakdown({ score = 82, categories = DEFAULT_CATEGORIES, className = '' }) {
  const overall = score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Needs Attention';
  const overallCls = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  const circumference = 2 * Math.PI * 42;

  return (
    <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
            <Activity className="w-3 h-3 text-emerald-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Health Command Center</h3>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${overallCls}`}>{overall}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2.1 pts
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated today
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col items-center justify-center p-6 md:p-8 md:border-r md:border-slate-50 md:min-w-[220px]">
          <div className="relative w-28 h-28 mb-4">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#059669" strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold text-slate-900 leading-none">{score}</span>
              <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-800">Overall Health</span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4% vs last month
          </span>
          <span className="text-[10px] text-slate-400 mt-2">V101 &middot; Rampur</span>
        </div>

        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.label];
              const b = badge(cat.value, cat.inverse);
              const barValue = cat.inverse ? 100 - cat.value : cat.value;
              return (
                <div key={cat.label}
                  className="rounded-xl border border-slate-100 p-3.5 bg-white hover:shadow-sm hover:border-slate-200 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">{cat.label}</span>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-slate-900">{cat.value}%</span>
                    <span className={`text-[10px] font-medium ${trendColor(cat.trend, cat.inverse)} flex items-center gap-0.5`}>
                      <TrendIcon trend={cat.trend} /> {cat.change}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barValue}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
