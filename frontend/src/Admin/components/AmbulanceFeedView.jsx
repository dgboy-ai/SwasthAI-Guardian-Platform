import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Truck, ChevronDown, ChevronUp, MapPin, Clock, Phone, User, AlertTriangle } from 'lucide-react';
import { timeAgo, statusColor } from './utils';

function AmbulanceDetailRow({ a }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.tr
        key={a.id || a.requestId || a.created_at}
        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="px-5 py-3.5 font-bold text-[13px] text-slate-900 flex items-center gap-2">
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-300 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
          {a.name || `User #${a.user_id}`}
        </td>
        <td className="px-5 py-3.5">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${a.type === 'emergency' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{a.type}</span>
        </td>
        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-500 max-w-[160px] truncate">{a.location || 'District Request'}</td>
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
      </motion.tr>
      <AnimatePresence>
        {open && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50/50"
          >
            <td colSpan={6} className="px-8 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Patient</p>
                    <p className="text-[13px] font-bold text-slate-700">{a.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Location</p>
                    <p className="text-[13px] font-bold text-slate-700">{a.location || 'District Request'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Requested</p>
                    <p className="text-[13px] font-bold text-slate-700">{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contact</p>
                    <p className="text-[13px] font-bold text-slate-700">{a.phone || a.contact || '—'}</p>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AmbulanceFeedView({ AM, downloadReport, demoTourMode, loading, lastSync }) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const typeCounts = {};
  const statusCounts = {};
  AM.forEach(a => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const filtered = AM.filter(a => {
    if (filterType !== 'ALL' && a.type !== filterType) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const FILTER_TYPES = ['ALL', ...Object.keys(typeCounts)];
  const FILTER_STATUSES = ['ALL', ...Object.keys(statusCounts)];

  return (
    <div className="p-4 lg:p-5 text-left">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live Emergency Feed</p>
              {demoTourMode && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-wider">LIVE</span>}
            </div>
            <h2 className="text-[18px] font-black text-slate-900">All Ambulance Dispatches</h2>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-refreshes every 30s · Synced {lastSync}
            </p>
          </div>
          <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {AM.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Type:</span>
              {FILTER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status:</span>
              {FILTER_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider transition-all cursor-pointer ${
                    filterStatus === s
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-slate-400 font-bold ml-auto">{filtered.length} / {AM.length} requests</span>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/6" />
                  <div className="h-4 bg-slate-200 rounded w-1/5" />
                  <div className="h-4 bg-slate-200 rounded w-1/6" />
                  <div className="h-4 bg-slate-200 rounded w-1/6" />
                  <div className="h-4 bg-slate-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Patient', 'Type', 'Location', 'Priority', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => (
                  <AmbulanceDetailRow key={a.id || a.requestId || a.created_at} a={a} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center py-16 bg-slate-50/50">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                  {AM.length > 0 ? <AlertTriangle className="w-7 h-7 text-slate-300" /> : <Truck className="w-7 h-7 text-slate-300" />}
                </div>
                <p className="text-sm font-black text-slate-300 uppercase tracking-wider">
                  {AM.length > 0 ? 'No matching records' : 'No ambulance data'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                  {AM.length > 0
                    ? 'No ambulance requests match the selected filters. Try adjusting the filter criteria.'
                    : 'Ambulance dispatch records will appear here as they arrive from the field.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
