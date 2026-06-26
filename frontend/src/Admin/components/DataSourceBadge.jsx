import { dataSourceBadge } from './utils';

export default function DataSourceBadge({ demoTourMode, isMock, label }) {
  const cfg = dataSourceBadge(demoTourMode, isMock);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
      {label || cfg.label}
    </span>
  );
}
