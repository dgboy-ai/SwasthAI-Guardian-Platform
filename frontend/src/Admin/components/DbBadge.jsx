const DB_META = {
  postgresql: { label: 'PostgreSQL', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  dynamodb:   { label: 'DynamoDB',   bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  mock:       { label: 'Mock',       bg: 'bg-sky-100',   text: 'text-sky-700',   border: 'border-sky-200',   dot: 'bg-sky-500' },
};

export default function DbBadge({ db, size = 'xs' }) {
  const m = DB_META[db] || { label: db || '?', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-[9px]';
  return (
    <span className={`inline-flex items-center gap-1 ${sz} rounded font-bold uppercase tracking-wider border ${m.bg} ${m.text} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
