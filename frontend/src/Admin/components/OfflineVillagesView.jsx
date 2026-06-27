import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Database, Shield, CheckCircle, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { timeAgo } from './utils';

export default function OfflineVillagesView({ S, dynamoFeed, demoTourMode, loading, error }) {
  const liveNodes = dynamoFeed?.village_node_state || [];
  const nodes = liveNodes.map(node => ({
    villageId: node.villageId,
    status: node.status || 'online',
    lastActive: node.lastActive,
    syncPendingCount: node.syncPendingCount || 0,
    deviceName: node.deviceName || `Device-${node.villageId}`
  }));

  const totalPending = nodes.reduce((acc, curr) => acc + curr.syncPendingCount, 0);
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const successRate = nodes.length > 0 ? Math.round((onlineCount / nodes.length) * 100) : 0;

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      {demoTourMode && (
        <div className="bg-amber-500 text-white text-center py-1 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Demo Mode — Sample node data shown for demonstration
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
          <p className="text-[11px] font-bold text-rose-600">{error}</p>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-[0.04]"><WifiOff className="w-48 h-48" /></div>
        <WifiOff className="w-8 h-8 text-emerald-400 mb-4 opacity-70" />
        <h2 className="text-2xl font-black mb-2">Offline-First Sync Network</h2>
        <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed mb-6">
          ASHA workers log maternal records, child nutrition checks, and emergency requests in zero-signal zones.
          Data saves locally on-device and syncs to cloud the moment internet restores.
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Automatic Sync Engine Active &amp; Listening</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Village Devices', val: loading ? '...' : nodes.length, icon: Database, color: 'text-slate-900' },
          { label: 'Sync Success Rate', val: loading ? '...' : `${successRate}%`, icon: Shield, color: 'text-emerald-700' },
          { label: 'Pending Queue Records', val: loading ? '...' : totalPending, icon: RefreshCw, color: totalPending > 0 ? 'text-amber-600' : 'text-emerald-700' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Village Node Synchronization Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-wide">Village Node Synchronization</h3>
            <p className="text-[11px] text-slate-500 font-medium">Real-time connectivity &amp; sync queues of registered devices.</p>
          </div>
          {!loading && nodes.length > 0 && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">
              {onlineCount} Nodes Online
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <div className="py-12 text-center">
            <WifiOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No village devices registered</p>
            <p className="text-xs text-slate-300 font-medium mt-1">Devices appear here once they connect and sync</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Village ID', 'Device Name', 'Status', 'Pending Syncs', 'Last Heartbeat'].map(h => (
                  <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              className="divide-y divide-slate-50"
            >
              {nodes.map((node, i) => {
                const isOnline = node.status === 'online';
                return (
                  <motion.tr
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[12px] font-bold text-slate-900">{node.villageId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] font-mono text-slate-500 font-semibold">{node.deviceName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                        isOnline 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {isOnline ? 'Online / Synced' : 'Offline / Caching'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        node.syncPendingCount > 0 
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        {node.syncPendingCount} pending
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-450 font-semibold">{timeAgo(node.lastActive)}</td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
