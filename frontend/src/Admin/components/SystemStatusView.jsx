import React from 'react';
import { Settings, Shield, Database, Activity, Clock, Inbox, FileText, AlertTriangle } from 'lucide-react';
import ProductionEvidencePanel from './ProductionEvidencePanel';
import { stackStatusMeta } from './utils';

function LatencyCard({ label, value, unit }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-lg font-black text-slate-900">
        {value !== null && value !== undefined ? value : '—'}
        <span className="text-[10px] text-slate-400 font-bold ml-0.5">{unit || ''}</span>
      </div>
    </div>
  );
}

export default function SystemStatusView({
  systemStatus,
  dynamoFeed,
  systemLoading,
  systemError,
  aiStatus,
  auditLogs,
  demoTourMode,
  lastSync
}) {
  const latency = systemStatus?.latency;
  const dbLatency = systemStatus?.databases?.aurora_postgresql?.query_latency_ms;
  const pool = systemStatus?.databases?.aurora_postgresql?.pool;
  const traces = systemStatus?.recent_request_traces || [];

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      {systemError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-700">System status unavailable</p>
            <p className="text-[10px] text-rose-500 font-medium mt-0.5">{systemError}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end">
        {lastSync && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
            <Clock className="w-3 h-3" /> Synced {lastSync}
          </span>
        )}
      </div>
      <ProductionEvidencePanel
        systemStatus={systemStatus}
        dynamoFeed={dynamoFeed}
        loading={systemLoading}
        error={systemError}
      />

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Performance Metrics</h2>
        </div>
        {systemLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <LatencyCard label="P50 Latency" value={latency?.p50} unit="ms" />
          <LatencyCard label="P95 Latency" value={latency?.p95} unit="ms" />
          <LatencyCard label="P99 Latency" value={latency?.p99} unit="ms" />
          <LatencyCard label="Avg Latency" value={latency?.avg} unit="ms" />
          <LatencyCard label="Sample Size" value={latency?.sampleSize} unit="req" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <LatencyCard label="DB Avg Query" value={dbLatency?.avg} unit="ms" />
          <LatencyCard label="DB Max Query" value={dbLatency?.max} unit="ms" />
          <LatencyCard label="Pool Total" value={pool?.total} unit="" />
          <LatencyCard label="Pool Idle" value={pool?.idle} unit="" />
        </div>
        </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Operational Modules</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'AI Service', status: aiStatus },
            { label: 'Outbreak Agent', status: systemStatus?.ai_service?.modules?.some(m => m.includes('OutbreakAgent')) ? 'Online' : 'Not confirmed' },
            { label: 'Service Worker', status: 'Caching' },
            { label: 'IndexedDB Queue', status: 'Active' },
            { label: 'SSE Live Feed', status: `${systemStatus?.realtime?.sse_clients_connected ?? 0} clients` },
            { label: 'RAG Memory', status: systemStatus?.stack?.rag_memory || 'Not loaded' },
          ].map(s => {
            const meta = stackStatusMeta(s.status);
            return (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-[12px] text-slate-700">{s.label}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black border ${meta.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {s.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Request Traces */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Recent Request Traces</h2>
        </div>
        <p className="text-[11px] text-slate-400 font-bold mb-4 uppercase tracking-widest">Live telemetry from DynamoDB sync_queues</p>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-3 text-slate-400">Timestamp</th>
                <th className="py-2.5 px-3 text-slate-400">Method</th>
                <th className="py-2.5 px-3 text-slate-400">Path</th>
                <th className="py-2.5 px-3 text-slate-400">Status</th>
                <th className="py-2.5 px-3 text-slate-400">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-700">
              {traces.length > 0 ? (
                traces.map((t, i) => (
                  <tr key={t.traceId || i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        t.method === 'GET' ? 'bg-emerald-50 text-emerald-700' :
                        t.method === 'POST' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{t.method || '—'}</span>
                    </td>
                    <td className="py-2 px-3 max-w-[200px] truncate" title={t.path}>{t.path || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`font-black ${(t.status || 0) >= 200 && (t.status || 0) < 300 ? 'text-emerald-600' : (t.status || 0) >= 400 ? 'text-red-500' : 'text-slate-400'}`}>{t.status || '—'}</span>
                    </td>
                    <td className="py-2 px-3 font-black">{t.duration !== undefined ? `${t.duration}ms` : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-bold font-sans">
                    <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                    No request traces recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Compliance & Audit Trail Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Security Compliance &amp; Audit Trail</h2>
        </div>
        <p className="text-[11px] text-slate-400 font-bold mb-4 uppercase tracking-widest">Live DPDP Act 2023 Auditing System</p>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-3 text-slate-400">Timestamp</th>
                <th className="py-2.5 px-3 text-slate-400">User ID</th>
                <th className="py-2.5 px-3 text-slate-400">Action</th>
                <th className="py-2.5 px-3 text-slate-400">Resource</th>
                <th className="py-2.5 px-3 text-slate-400">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-700">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{new Date(log.created_at || log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{log.user_id || 'system'}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-black uppercase text-[9px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3">{log.resource}</td>
                    <td className="py-2 px-3 text-slate-400">{log.ip_address || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-bold font-sans">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                    No audit events recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
