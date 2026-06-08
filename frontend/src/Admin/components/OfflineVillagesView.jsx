import React from 'react';
import { WifiOff, Database, Shield, CheckCircle } from 'lucide-react';

export default function OfflineVillagesView({ S }) {
  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
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
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">📡 Automatic Sync Engine Active &amp; Listening</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Village Devices', val: '418', icon: Database },
          { label: 'Sync Success Rate', val: '100%', icon: Shield },
          { label: 'Local Sync Status', val: 'Synced', icon: CheckCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.val}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
