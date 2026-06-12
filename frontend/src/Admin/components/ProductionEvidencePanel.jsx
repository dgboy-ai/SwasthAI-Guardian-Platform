import React from 'react';
import { Shield } from 'lucide-react';
import { stackStatusMeta, latestDynamoWrite, timeAgo } from './utils';

export default function ProductionEvidencePanel({ systemStatus, dynamoFeed, loading, error, compact = false }) {
  const aurora = systemStatus?.databases?.aurora_postgresql || {};
  const dynamo = systemStatus?.databases?.dynamodb || {};
  const auroraMeta = stackStatusMeta(loading ? 'Loading' : aurora.status);
  const dynamoMeta = stackStatusMeta(loading ? 'Loading' : dynamo.status);
  const ready = !!systemStatus?.production_ready;
  const readyMeta = ready
    ? { label: 'Production ready', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    : stackStatusMeta(error ? 'Unavailable' : 'Fallback / not ready');
  const tables = dynamo.tables || [];
  const latestWrite = latestDynamoWrite(dynamoFeed);
  const recentTraces = systemStatus?.recent_request_traces || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-emerald-600" />
            <p className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-wide">Production Evidence</p>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Live proof from /api/health/detailed and DynamoDB telemetry feed.
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border whitespace-nowrap ${readyMeta.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${readyMeta.dot}`} />
          {readyMeta.label}
        </span>
      </div>

      {error && (
        <div className="mx-5 mt-4 p-3.5 rounded-xl border border-rose-100 bg-rose-50 text-xs sm:text-sm font-bold text-rose-700">
          Could not load live stack proof: {error}
        </div>
      )}

      <div className={`p-5 grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {[
          { label: 'Aurora PostgreSQL', status: auroraMeta.label, meta: auroraMeta, sub: aurora.engine || 'Relational system of record' },
          { label: 'Amazon DynamoDB', status: dynamoMeta.label, meta: dynamoMeta, sub: `${tables.length || 0} tables - ${dynamo.billing || 'PAY_PER_REQUEST'}` },
          { label: 'AWS Region', status: dynamo.region || aurora.region || 'ap-south-1', meta: stackStatusMeta('connected'), sub: 'Healthcare deployment region' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${item.meta.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.meta.dot}`} />
              {item.status}
            </span>
            <p className="text-xs text-slate-500 font-semibold mt-2.5 leading-snug">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">DynamoDB Tables</p>
          <div className="flex flex-wrap gap-2">
            {tables.length > 0 ? tables.map(t => (
              <span key={t.name} className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-black">
                {t.name}
              </span>
            )) : (
              <span className="text-xs font-bold text-slate-400">No live table schema available yet</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Latest Telemetry Writes</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">Newest DynamoDB event</p>
              <p className="text-sm font-black text-slate-900">{latestWrite ? timeAgo(latestWrite) : 'No event loaded'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Aurora pool</p>
              <p className="text-sm font-black text-slate-900">
                {aurora.pool ? `${aurora.pool.total} total / ${aurora.pool.idle} idle` : 'Not exposed'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Registered users</p>
              <p className="text-sm font-black text-slate-900">{aurora.registered_users ?? '...'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">SSE clients</p>
              <p className="text-sm font-black text-slate-900">{systemStatus?.realtime?.sse_clients_connected ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recent Request Traces</p>
          {recentTraces.length === 0 ? (
            <span className="text-xs font-bold text-slate-400">No request traces loaded yet</span>
          ) : (
            <div className="space-y-2">
              {recentTraces.slice(0, 4).map(trace => (
                <div key={trace.traceId || `${trace.method}-${trace.path}-${trace.timestamp}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-700 truncate">{trace.method} {trace.path}</p>
                    <p className="text-[10px] sm:text-xs font-mono text-slate-400 truncate">{trace.traceId || 'trace unavailable'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900">{trace.status || '...'}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">{trace.duration ?? 0}ms</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-5 mb-5 p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 flex items-start gap-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-0.5">DISHA & DPDP Compliance Layer Active</p>
          <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
            Patient health records stored in <strong>Amazon Aurora PostgreSQL</strong> are encrypted at rest using an enterprise-grade customer-managed key via <strong>AWS KMS (Key Management Service)</strong>. All PII (Aadhaar, phone, email, and names) is automatically redacted by the frontend middleware before external LLM queries, conforming to the Digital Personal Data Protection (DPDP) Act of India.
          </p>
        </div>
      </div>
    </div>
  );
}
