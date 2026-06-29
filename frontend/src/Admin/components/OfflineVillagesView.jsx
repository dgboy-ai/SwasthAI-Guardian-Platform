import { motion } from 'framer-motion';
import { WifiOff, Database, Shield, CheckCircle2, MapPin, RefreshCw, AlertTriangle, Wifi, Clock, Activity } from 'lucide-react';
import { timeAgo } from './utils';

const DEMO_NODES = [
  { villageId:'V-101', status:'online',  lastActive: new Date(Date.now()-2*60000).toISOString(),  syncPendingCount:0,  deviceName:'Device-V101', population:1240 },
  { villageId:'V-102', status:'offline', lastActive: new Date(Date.now()-47*60000).toISOString(), syncPendingCount:14, deviceName:'Device-V102', population:890  },
  { villageId:'V-103', status:'online',  lastActive: new Date(Date.now()-8*60000).toISOString(),  syncPendingCount:0,  deviceName:'Device-V103', population:1560 },
  { villageId:'V-104', status:'offline', lastActive: new Date(Date.now()-183*60000).toISOString(),syncPendingCount:31, deviceName:'Device-V104', population:720  },
  { villageId:'V-105', status:'online',  lastActive: new Date(Date.now()-1*60000).toISOString(),  syncPendingCount:0,  deviceName:'Device-V105', population:2100 },
  { villageId:'V-107', status:'online',  lastActive: new Date(Date.now()-15*60000).toISOString(), syncPendingCount:3,  deviceName:'Device-V107', population:980  },
  { villageId:'V-108', status:'offline', lastActive: new Date(Date.now()-92*60000).toISOString(), syncPendingCount:8,  deviceName:'Device-V108', population:1340 },
];

export default function OfflineVillagesView({ S, dynamoFeed, demoTourMode, loading, error }) {
  const liveNodes = dynamoFeed?.village_node_state || [];
  const raw = liveNodes.length > 0 ? liveNodes.map(n => ({
    villageId: n.villageId,
    status: n.status || 'online',
    lastActive: n.lastActive,
    syncPendingCount: n.syncPendingCount || 0,
    deviceName: n.deviceName || `Device-${n.villageId}`,
    population: n.population || 0,
  })) : DEMO_NODES;

  const nodes = raw;
  const totalPending = nodes.reduce((a, n) => a + n.syncPendingCount, 0);
  const onlineCount  = nodes.filter(n => n.status === 'online').length;
  const offlineCount = nodes.length - onlineCount;
  const successRate  = nodes.length > 0 ? Math.round((onlineCount / nodes.length) * 100) : 0;

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl border border-slate-700/30 shadow-lg"
        style={{ background:'linear-gradient(135deg,#0f172a 0%,#0d2a1a 50%,#064e3b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">Offline-First Sync Network</h1>
                <p className="text-xs text-emerald-300 font-medium">ASHA devices → IndexedDB → DynamoDB sync_queues → Aurora</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-black uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Sync Engine Active
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label:'Total Devices',   val: nodes.length,    color:'#a7f3d0', icon: Database },
              { label:'Online Now',      val: onlineCount,     color:'#6ee7b7', icon: Wifi },
              { label:'Offline / Queuing', val: offlineCount,  color:'#fcd34d', icon: WifiOff },
              { label:'Pending Records', val: totalPending,    color: totalPending > 0 ? '#fca5a5' : '#6ee7b7', icon: RefreshCw },
            ].map(({ label, val, color, icon:Icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <div>
                  <p className="text-base font-black" style={{ color }}>{val}</p>
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs font-bold text-rose-700">{error}</p>
        </div>
      )}

      {/* ── Sync health gauge + summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Fleet Sync Rate</p>
          <div className="relative w-24 h-24 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <motion.circle
                cx="50" cy="50" r="40" fill="none"
                stroke={successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (successRate / 100) * 251.2 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black text-slate-900">{successRate}%</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500">{onlineCount} of {nodes.length} online</p>
        </div>

        {/* How it works */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Offline-First Architecture</h2>
          </div>
          <div className="space-y-2">
            {[
              { step:'1', text:'ASHA worker logs data offline (no signal)', tag:'IndexedDB', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
              { step:'2', text:'Device detects connectivity → background sync fires', tag:'Service Worker', color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
              { step:'3', text:'Payload queued in DynamoDB sync_queues (256K+ items)', tag:'DynamoDB', color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
              { step:'4', text:'Lambda fan-out writes ACID record to Aurora PostgreSQL', tag:'Aurora', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
            ].map(({ step, text, tag, color, bg, border }) => (
              <div key={step} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ background:bg, borderColor:border }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0" style={{ background:color }}>{step}</span>
                <p className="text-[10px] font-medium text-slate-700 flex-1">{text}</p>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background:color }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Village Node Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Village Node Synchronisation</h2>
              <p className="text-[8px] text-slate-400 font-medium">Real-time device connectivity from DynamoDB village_node_state</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black rounded-full">
            {onlineCount} Nodes Online
          </span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[0,1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Village', 'Device', 'Status', 'Pending Syncs', 'Last Heartbeat', 'Health'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {nodes.map((node, i) => {
                  const isOnline = node.status === 'online';
                  const hasPending = node.syncPendingCount > 0;
                  return (
                    <motion.tr
                      key={node.villageId || i}
                      initial={{ opacity:0, x:-6 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:0.04*i }}
                      className={`hover:bg-slate-50/60 transition-colors ${!isOnline ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-900">{node.villageId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] font-mono text-slate-500">{node.deviceName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black border ${
                          isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          {isOnline ? 'Online' : 'Offline / Caching'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                          hasPending ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {node.syncPendingCount > 0 ? `${node.syncPendingCount} queued` : '✓ Synced'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-medium">{timeAgo(node.lastActive)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {isOnline && !hasPending
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <AlertTriangle className="w-4 h-4 text-amber-500" />
                          }
                          <span className={`text-[9px] font-black ${isOnline && !hasPending ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isOnline && !hasPending ? 'Healthy' : isOnline ? 'Syncing' : 'Degraded'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
