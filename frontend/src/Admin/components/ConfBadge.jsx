import React from 'react';

export default function ConfBadge({ pct }) {
  const n = Math.round((pct || 0) * 100);
  const cls = n >= 85 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : n >= 70 ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-rose-100 text-rose-700 border-rose-200';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${cls}`}>
      {n}% confidence
    </span>
  );
}
