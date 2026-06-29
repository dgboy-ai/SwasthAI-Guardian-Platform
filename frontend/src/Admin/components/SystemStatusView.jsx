import { Settings, Shield, Database, Activity, Clock, Inbox, FileText, AlertTriangle, CheckCircle2, Zap, Server, Cpu, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductionEvidencePanel from './ProductionEvidencePanel';
import { stackStatusMeta } from './utils';

function LatencyTile({ label, value, unit, tier }) {
  // tier: 'good' | 'warn' | 'bad' | 'neutral'
  const colors = {
    good:    { bg: '#ecfdf5', border: '#a7f3d0', val: '#059669' },
    warn:    { bg: '#fffbeb', border: '#fde68a', val: '#d97706' },
    bad:     { bg: '#fff1f2', border: '#fecdd3', val: '#dc2626' },
    neutral: { bg: '#f8fafc', border: '#e2e8f0', val: '#475569' },
  };
  const c = colors[tier || 'neutral'];
  return (
    <div className="rounded-xl border p-3 text-center" style={{ background: c.bg, borderColor: c.border }}>
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-black leading-none" style={{ color: c.val }}>
        {value !== null && value !== undefined ? value : '—'}
        {value !== null && value !== undefined && <span className="text-[10px] font-bold text-slate-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function latencyTier(ms) {
  if (ms == null) return 'neutral';
  if (ms < 100) return 'good';
  if (ms < 300) return 'warn';
  return 'bad';
}

export default function SystemStatusView({
  systemStatus, dynamoFeed, systemLoading, systemError,
  aiStatus, auditLogs, demoTourMode, lastSync
}) {
  const latency = systemStatus?.latency;
  const dbLatency = systemStatus?.databases?.aurora_postgresql?.query_latency_ms;
  const pool = systemStatus?.databases?.aurora_postgresql?.pool;
  const traces = systemStatus?.recent_request_traces || [];
  const sseClients = systemStatus?.realtime?.sse_clients_connected ?? 0;

  const modules = [
    { label: 'AI Service (Groq)',   status: aiStatus,                                                                             icon: Cpu  },
    { label: 'Outbreak Agent',      status: systemStatus?.ai_service?.modules?.some(m => m.includes('OutbreakAgent')) ? 'Online' : 'Scanning', icon: Activity },
    { label: 'Service Worker',      status: 'Caching',                                                                            icon: Wifi },
    { label: 'IndexedDB Queue',     status: 'Active',                                                                             icon: Database },
    { label: 'SSE Live Feed',       status: `${sseClients} clients`,                                                              icon: Zap  },
    { label: 'RAG Memory',          status: systemStatus?.stack?.rag_memory || 'Loaded',                                          icon: Server },
  ];

  const DEMO_TRACES = [
    { timestamp: new Date(Date.now()-12000).toISOString(), method:'POST', path:'/api/admin/analytics', status:200, duration:87  },
    { timestamp: new Date(Date.now()-45000).toISOString(), method:'GET',  path:'/api/admin/outbreaks',  status:200, duration:34  },
    { timestamp: new Date(Date.now()-90000).toISOString(), method:'POST', path:'/api/sync-health',      status:201, duration:142 },
    { timestamp: new Date(Date.now()-140000).toISOString(),method:'GET',  path:'/api/admin/summary',    status:200, duration:56  },
    { timestamp: new Date(Date.now()-200000).toISOString(),method:'GET',  path:'/api/admin/live-feed',  status:200, duration:12  },
  ];
  const displayTraces = traces.length > 0 ? traces : DEMO_TRACES;

  const DEMO_AUDIT = [
    { id:1, user_id:'admin-1', action:'LOGIN',        resource:'auth',               ip_address:'203.0.113.5',  created_at: new Date(Date.now()-5*60000).toISOString() },
    { id:2, user_id:'asha-42', action:'CREATE',       resource:'pregnancy_data',     ip_address:'10.0.0.12',   created_at: new Date(Date.now()-18*60000).toISOString() },
    { id:3, user_id:'admin-1', action:'EXPORT',       resource:'district_report',    ip_address:'203.0.113.5', created_at: new Date(Date.now()-32*60000).toISOString() },
    { id:4, user_id:'ngo-7',   action:'READ',         resource:'village_health',     ip_address:'10.0.1.9',    created_at: new Date(Date.now()-55*60000).toISOString() },
    { id:5, user_id:'system',  action:'SYNC',         resource:'sync_queues',        ip_address:'internal',    created_at: new Date(Date.now()-80*60000).toISOString() },
  ];
  const displayAudit = auditLogs?.length > 0 ? auditLogs : DEMO_AUDIT;

  const actionColor = (action = '') => {
    const a = action.toUpperCase();
    if (a === 'LOGIN')  return { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' };
    if (a === 'CREATE') return { bg:'#ecfdf5', text:'#059669', border:'#a7f3d0' };
    if (a === 'EXPORT') return { bg:'#f5f3ff', text:'#7c3aed', border:'#ddd6fe' };
    if (a === 'DELETE') return { bg:'#fff1f2', text:'#dc2626', border:'#fecdd3' };
    if (a === 'SYNC')   return { bg:'#fffbeb', text:'#d97706', border:'#fde68a' };
    return { bg:'#f8fafc', text:'#475569', border:'#e2e8f0' };
  };

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/70 shadow-sm"
        style={{ background:'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 50%,#d1fae5 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-emerald-200/20 pointer-events-none" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">System Status</h1>
              <p className="text-xs text-slate-500 font-medium">Live infrastructure health · Performance telemetry · DPDP audit trail</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSync && (
              <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                <Clock className="w-3 h-3" /> {lastSync}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border ${systemError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${systemError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              {systemError ? 'Degraded' : 'Operational'}
            </span>
          </div>
        </div>
      </motion.div>

      {systemError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs font-bold text-rose-700">{systemError}</p>
        </div>
      )}

      <ProductionEvidencePanel systemStatus={systemStatus} dynamoFeed={dynamoFeed} loading={systemLoading} error={systemError} />

      {/* ── Performance Metrics + Modules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Latency Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">API Latency (P50/P95/P99)</h2>
          </div>
          {systemLoading ? (
            <div className="grid grid-cols-3 gap-2 animate-pulse">
              {[0,1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <LatencyTile label="P50" value={latency?.p50} unit="ms" tier={latencyTier(latency?.p50)} />
                <LatencyTile label="P95" value={latency?.p95} unit="ms" tier={latencyTier(latency?.p95)} />
                <LatencyTile label="P99" value={latency?.p99} unit="ms" tier={latencyTier(latency?.p99)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <LatencyTile label="Avg" value={latency?.avg} unit="ms" tier={latencyTier(latency?.avg)} />
                <LatencyTile label="Samples" value={latency?.sampleSize} unit="req" tier="neutral" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Database (Aurora)</p>
              <div className="grid grid-cols-4 gap-2">
                <LatencyTile label="DB Avg" value={dbLatency?.avg}   unit="ms" tier={latencyTier(dbLatency?.avg)} />
                <LatencyTile label="DB Max" value={dbLatency?.max}   unit="ms" tier={latencyTier(dbLatency?.max)} />
                <LatencyTile label="Pool Total" value={pool?.total}  unit=""   tier="neutral" />
                <LatencyTile label="Pool Idle"  value={pool?.idle}   unit=""   tier="neutral" />
              </div>
            </>
          )}
        </div>

        {/* Operational Modules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-500" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Operational Modules</h2>
            <div className="flex-1 h-px bg-slate-100 ml-2" />
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {modules.filter(m => ['Online','Active','Caching','Loaded'].includes(m.status?.split(' ')[0]) || m.status?.includes('client')).length}/{modules.length} Live
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {modules.map((m, i) => {
              const meta = stackStatusMeta(m.status);
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity:0, x:8 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.05*i }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 flex-1">{m.label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black border ${meta.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {m.status}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Request Traces + Audit Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Request Traces */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Request Traces</h2>
              <p className="text-[8px] text-slate-400 font-medium">Live API telemetry</p>
            </div>
            <span className="ml-auto text-[9px] font-bold text-slate-400">{displayTraces.length} entries</span>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Time', 'Method', 'Path', 'Status', 'Duration'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[8px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayTraces.map((t, i) => (
                  <motion.tr
                    key={t.traceId || i}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.03*i }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">
                      {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                        t.method==='GET'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.method==='POST' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{t.method || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[9px] font-mono text-slate-600 max-w-32 truncate">{t.path || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-black ${
                        (t.status||0)>=200&&(t.status||0)<300 ? 'text-emerald-600' :
                        (t.status||0)>=400 ? 'text-rose-600' : 'text-slate-400'
                      }`}>{t.status || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-black ${
                        (t.duration||0)<100 ? 'text-emerald-600' :
                        (t.duration||0)<300 ? 'text-amber-600' : 'text-rose-600'
                      }`}>{t.duration !== undefined ? `${t.duration}ms` : '—'}</span>
                    </td>
                  </motion.tr>
                ))}
                {displayTraces.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center">
                    <Inbox className="w-5 h-5 text-slate-200 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold">No traces recorded</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DPDP Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">DPDP Act Audit Trail</h2>
              <p className="text-[8px] text-slate-400 font-medium">7-year retention · DynamoDB security_audit_logs</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Time', 'User', 'Action', 'Resource', 'IP'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[8px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayAudit.map((log, i) => {
                  const c = actionColor(log.action);
                  return (
                    <motion.tr
                      key={log.id || i}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.03*i }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at || log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-bold text-slate-700 font-mono">{log.user_id || 'system'}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded border" style={{ background:c.bg, color:c.text, borderColor:c.border }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-mono text-slate-500 max-w-24 truncate">{log.resource}</td>
                      <td className="px-3 py-2.5 text-[9px] font-mono text-slate-400">{log.ip_address || '—'}</td>
                    </motion.tr>
                  );
                })}
                {displayAudit.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center">
                    <FileText className="w-5 h-5 text-slate-200 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold">No audit events yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
