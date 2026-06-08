export const statusColor = (s) => ({
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}[s] || 'bg-slate-100 text-slate-500 border-slate-200');

export const outbreakStatusStyle = (s = '') => {
  const l = s.toLowerCase();
  if (l.includes('new')) return 'bg-red-100 text-red-700 border-red-200';
  if (l.includes('invest')) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} hr ago`;
};

export const stackStatusMeta = (status = '') => {
  const s = String(status || '').toLowerCase();
  if (
    s.includes('connected') ||
    s.includes('online') ||
    s.includes('active') ||
    s.includes('ok') ||
    s.includes('ready') ||
    s.includes('scanning') ||
    s.includes('caching') ||
    s.includes('client') ||
    s.includes('dual-track')
  ) {
    return { label: status || 'Connected', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }
  if (s.includes('mock') || s.includes('sqlite') || s.includes('fallback') || s.includes('not configured') || s.includes('not confirmed')) {
    return { label: status || 'Fallback', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-100' };
  }
  if (s.includes('loading')) {
    return { label: 'Loading', dot: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600 border-slate-100' };
  }
  return { label: status || 'Unavailable', dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 border-rose-100' };
};

export const latestDynamoWrite = (feed) => {
  if (!feed) return null;
  const records = [
    ...(feed.outbreak_telemetry || []),
    ...(feed.sync_queues || []),
    ...(feed.village_node_state || []),
    ...(feed.emergency_streams || []),
  ];
  return records
    .map(item => item.timestamp || item.ts || item.detectedAt || item.queuedAt || item.lastActive || item._insertedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || feed.timestamp || null;
};
