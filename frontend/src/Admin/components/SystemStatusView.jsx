import React from 'react';
import { Settings, Shield, Database } from 'lucide-react';
import ProductionEvidencePanel from './ProductionEvidencePanel';
import { stackStatusMeta } from './utils';

export default function SystemStatusView({
  systemStatus,
  dynamoFeed,
  systemLoading,
  systemError,
  aiStatus,
  auditLogs
}) {
  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      <ProductionEvidencePanel
        systemStatus={systemStatus}
        dynamoFeed={dynamoFeed}
        loading={systemLoading}
        error={systemError}
      />
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

      {/* Audit Trail Section */}
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
                  <td colSpan={5} className="py-6 text-center text-slate-455 font-bold font-sans">No audit events recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
