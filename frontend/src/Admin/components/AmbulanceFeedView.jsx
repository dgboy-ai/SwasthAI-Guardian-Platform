import React from 'react';
import { Download } from 'lucide-react';
import { timeAgo, statusColor } from './utils';

export default function AmbulanceFeedView({ AM, downloadReport }) {
  return (
    <div className="p-4 lg:p-5 text-left">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live Emergency Feed</p>
            </div>
            <h2 className="text-[18px] font-black text-slate-900">All Ambulance Dispatches</h2>
            <p className="text-[11px] text-slate-400 font-medium">Auto-refreshes every 30 seconds</p>
          </div>
          <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Patient', 'Type', 'Location', 'Priority', 'Status', 'Time'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {AM.map((a, i) => (
                <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[13px] text-slate-900">{a.name || `User #${a.user_id}`}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${a.type === 'emergency' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{a.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-slate-500 max-w-[180px] truncate">{a.location || 'District Request'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${a.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        a.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>{a.priority || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${statusColor(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[11px] font-medium text-slate-400">{timeAgo(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
