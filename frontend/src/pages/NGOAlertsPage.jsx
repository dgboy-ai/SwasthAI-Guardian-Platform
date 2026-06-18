import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, Ambulance, Heart, Activity, MapPin, TrendingUp,
  ChevronRight, ShieldCheck, Wifi, CheckCircle, Clock, Radio, Users,
  Shield, AlertCircle, ArrowRight, Database, HardDrive, WifiOff,
  Brain, Bug, Gauge, Lightbulb
} from 'lucide-react';
import NGOSidebarLayout from '../components/NGOSidebarLayout';

const DEMO_NOTIFICATIONS = [
  { id: 'N1', type: 'outbreak', text: 'AI Outbreak Radar: Malaria cluster anomaly in block sector.', time: '2m ago', unread: true, severity: 'high', village: 'V103' },
  { id: 'N2', type: 'sos', text: 'Critical SOS: Heavy breathing emergency alert from Lata Devi.', time: '15m ago', unread: true, severity: 'critical', village: 'V102' },
  { id: 'N3', type: 'pregnancy', text: 'Maternal Health Flag: Sunita Devi missed 8mo check-up.', time: '1h ago', unread: false, severity: 'medium', village: 'V101' },
  { id: 'N4', type: 'system', text: 'Offline Sync: 3 pending records uploaded successfully.', time: '3h ago', unread: false, severity: 'info' },
  { id: 'N5', type: 'outbreak', text: 'Dengue spike detected — 12 new cases in Village V103 in last 48 hours.', time: '4h ago', unread: false, severity: 'high', village: 'V103' },
  { id: 'N6', type: 'sos', text: 'Emergency: Chest pain / breathing issue reported from Ram Singh, Rampur Sector 4.', time: '5h ago', unread: false, severity: 'critical', village: 'V104' },
  { id: 'N7', type: 'system', text: 'AWS Sync Success: Local databases are fully consolidated.', time: '6h ago', unread: false, severity: 'info' },
];

const OUTBREAK_ALERTS = [
  { disease: 'Malaria', severity: 'high', cases: 12, village: 'V103', trend: 'increasing', message: 'Malaria spike detected — 12 new cases in last 48 hours', riskScore: 87 },
  { disease: 'Dengue', severity: 'medium', cases: 5, village: 'V101', trend: 'stable', message: 'Dengue cases stable — continue monitoring', riskScore: 45 },
];

const SOS_ALERTS = [
  { id: 'E001', name: 'Lata Devi', location: 'Rampur Sector 2', time: '12m ago', condition: 'Pregnancy labour pain', priority: 'critical' },
  { id: 'E002', name: 'Ram Singh', location: 'Rampur Sector 4', time: '5m ago', condition: 'Chest pain / Breathing issue', priority: 'high' },
];

const FILTER_DEFS = [
  { label: 'All', value: 'all' },
  { label: 'Outbreak', value: 'outbreak' },
  { label: 'SOS', value: 'sos' },
  { label: 'Pregnancy', value: 'pregnancy' },
  { label: 'System', value: 'system' },
];

const SEVERITY_CONFIG = {
  critical: {
    stripe: 'bg-gradient-to-b from-red-500 to-red-400', border: 'border-l-[5px] border-l-red-500',
    badge: 'bg-red-100 text-red-700 ring-1 ring-red-200', bg: 'bg-red-50', icon: 'text-red-600',
    dot: 'bg-red-500', label: 'CRITICAL', glow: 'shadow-red-200/40 ring-1 ring-red-200',
    hover: 'hover:shadow-red-200/40', pulseColor: 'bg-red-500',
    gradient: 'from-red-50 to-white'
  },
  high: {
    stripe: 'bg-gradient-to-b from-orange-500 to-orange-400', border: 'border-l-[4px] border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200', bg: 'bg-orange-50', icon: 'text-orange-600',
    dot: 'bg-orange-500', label: 'HIGH', glow: '', hover: '',
    pulseColor: 'bg-orange-500', gradient: 'from-orange-50 to-white'
  },
  medium: {
    stripe: 'bg-gradient-to-b from-yellow-500 to-yellow-400', border: 'border-l-[4px] border-l-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200', bg: 'bg-yellow-50', icon: 'text-yellow-600',
    dot: 'bg-yellow-500', label: 'MEDIUM', glow: '', hover: '',
    pulseColor: 'bg-yellow-500', gradient: 'from-yellow-50 to-white'
  },
  info: {
    stripe: 'bg-gradient-to-b from-blue-500 to-blue-400', border: 'border-l-[4px] border-l-blue-400',
    badge: 'bg-blue-100 text-blue-600 ring-1 ring-blue-200', bg: 'bg-blue-50', icon: 'text-blue-500',
    dot: 'bg-blue-400', label: 'INFO', glow: '', hover: '',
    pulseColor: 'bg-blue-500', gradient: 'from-blue-50 to-white'
  },
};

export default function NGOAlertsPage() {
  console.log("NGOAlertsPage Rendered");
  const [pageLoading, setPageLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const totalAlerts = DEMO_NOTIFICATIONS.length;
  const criticalCount = DEMO_NOTIFICATIONS.filter(n => n.severity === 'critical').length;
  const highCount = DEMO_NOTIFICATIONS.filter(n => n.severity === 'high').length;
  const unreadCount = DEMO_NOTIFICATIONS.filter(n => n.unread).length;
  const villagesAffected = [...new Set(DEMO_NOTIFICATIONS.filter(n => n.village).map(n => n.village))].length;

  const filtered = filter === 'all' ? DEMO_NOTIFICATIONS : DEMO_NOTIFICATIONS.filter(n => n.type === filter);

  const getCountForFilter = (val) => {
    if (val === 'all') return totalAlerts;
    return DEMO_NOTIFICATIONS.filter(n => n.type === val).length;
  };

  const getAlertIcon = (type) => {
    if (type === 'outbreak') return Bug;
    if (type === 'sos') return Ambulance;
    if (type === 'pregnancy') return Heart;
    return Bell;
  };

  if (pageLoading) {
    return (
      <NGOSidebarLayout activeTab="alerts">
        <div className="px-6 xl:px-8 pt-4 sm:pt-6 pb-8 animate-pulse">
          <div className="h-10 w-64 bg-slate-200/70 rounded-xl mb-4" />
          <div className="h-4 w-80 bg-slate-200/50 rounded-lg mb-6" />
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-sm border border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
            </div>
          </div>
          <div className="grid xl:grid-cols-[1fr_360px] gap-6">
            <div className="min-w-0 space-y-4">
              <div className="h-10 w-56 bg-slate-200/50 rounded-xl" />
              <div className="flex gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-9 w-20 bg-slate-200/50 rounded-xl" />)}</div>
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100" />)}
            </div>
            <div className="w-full space-y-4">
              <div className="h-56 bg-white rounded-2xl shadow-sm border border-slate-100" />
              <div className="h-44 bg-white rounded-2xl shadow-sm border border-slate-100" />
            </div>
          </div>
        </div>
      </NGOSidebarLayout>
    );
  }

  return (
    <NGOSidebarLayout activeTab="alerts">
      <div className="px-6 xl:px-8 pt-4 sm:pt-6 pb-10">

        {/* ═══════════════════════════════════════════════════════════════════
           SECTION 1: HERO OVERVIEW — Glassmorphism Command Header
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Alerts Command Center</h1>
              <p className="text-sm sm:text-base text-slate-500 font-semibold mt-1.5">
                District Health Operations · <span className="text-slate-700">{totalAlerts} active alerts</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start">
              <Clock className="w-3.5 h-3.5" />
              Last updated: just now
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
          </div>

          {/* Hero Stats Cards */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Active Alerts', value: totalAlerts, icon: Bell, gradient: 'from-slate-600 to-slate-700', bg: 'bg-slate-50', text: 'text-slate-700', sub: 'Total incoming alerts' },
                { label: 'Critical Cases', value: criticalCount, icon: AlertCircle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700', sub: 'Immediate action required' },
                { label: 'High Priority', value: highCount, icon: TrendingUp, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', sub: 'Needs attention soon' },
                { label: 'Villages Impacted', value: villagesAffected, icon: MapPin, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', sub: 'Across your district' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.12em]">{stat.label}</span>
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-[18px] h-[18px] ${stat.text}`} />
                      </div>
                    </div>
                    <p className={`text-3xl sm:text-4xl font-black tracking-tight ${stat.text} leading-none`}>{stat.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-1.5">{stat.sub}</p>
                    {/* Mini trend bar */}
                    <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${stat.text.replace('text-', 'bg-')}/30`} style={{ width: `${Math.min((stat.value / 10) * 100, 100)}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
           SECTION 2: COMMAND CENTER DASHBOARD
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">

          {/* ─── LEFT (70%): LIVE ALERT TIMELINE ─── */}
          <main className="min-h-screen w-full min-w-0 space-y-4">
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">Live Alert Timeline</h2>
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                  {unreadCount} new
                </span>
              </div>
              <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                Mark all read <CheckCircle className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* Filter tabs */}
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 flex-wrap">
              {FILTER_DEFS.map(f => {
                const count = getCountForFilter(f.value);
                const isActive = filter === f.value;
                return (
                  <button key={f.value} onClick={() => setFilter(f.value)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] border transition-all active:scale-95 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5'
                    }`}>
                    {f.label}
                    <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[21px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100 rounded-full" />

              <AnimatePresence mode="popLayout">
                {filtered.map((n, i) => {
                  const sc = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info;
                  const isCritical = n.severity === 'critical';
                  const AlertIcon = getAlertIcon(n.type);
                  return (
                    <motion.div key={n.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                      className={`relative ml-12 mb-4 bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden group ${
                        isCritical ? `hover:shadow-xl ${sc.hover}` : 'hover:shadow-lg'
                      } ${isCritical ? `shadow-md ${sc.glow}` : ''}`}>
                      {/* Severity stripe — full height left side */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${sc.stripe}`} />

                      {/* Timeline dot */}
                      <div className={`absolute -left-[27px] top-6 w-[15px] h-[15px] rounded-full border-[3px] border-white shadow-sm ${sc.dot} ${n.unread ? 'animate-pulse' : ''}`} />

                      <div className={`p-5 sm:p-6 bg-gradient-to-r ${sc.gradient}`}>
                        <div className="flex items-start gap-4">
                          {/* Alert icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            n.severity === 'critical' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' :
                            n.severity === 'high' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' :
                            n.severity === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-blue-50 text-blue-500'
                          }`}>
                            <AlertIcon className="w-5.5 h-5.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Top row: type badge + severity + time + unread */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${sc.icon}`}>{n.type}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${sc.badge}`}>{sc.label}</span>
                              {n.unread && <span className={`w-2 h-2 rounded-full animate-pulse ${sc.pulseColor}`} />}
                              <span className="text-[10px] text-slate-400 font-semibold ml-auto flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-lg border border-slate-100">
                                <Clock className="w-3.5 h-3.5" />{n.time}
                              </span>
                            </div>

                            {/* Alert message */}
                            <p className={`text-base leading-snug mb-2.5 ${isCritical ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{n.text}</p>

                            {/* Bottom badges row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {n.village && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                                  <MapPin className="w-3 h-3" />{n.village}
                                </span>
                              )}
                              {n.severity !== 'info' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg ring-1 ring-violet-200">
                                  <Brain className="w-3 h-3" />AI Detected
                                </span>
                              )}
                              {n.type === 'sos' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg ring-1 ring-red-200">
                                  <AlertTriangle className="w-3 h-3" />Emergency
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Empty state */}
              {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-28 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 via-emerald-50 to-white flex items-center justify-center mb-6 shadow-xl shadow-emerald-200/20 ring-1 ring-emerald-100">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                  <p className="font-black text-slate-300 text-2xl tracking-tight">All Clear</p>
                  <p className="text-sm text-slate-400 font-medium mt-2 max-w-xs">
                    No {filter === 'all' ? '' : filter} notifications to review. Everything is operating normally.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-300 font-semibold bg-white px-4 py-2 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5" /> All systems operational
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── SECTION 3: ALERT ANALYTICS & METRICS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Resolution Rate', value: '94%', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Last 24 hours', change: '+2.1%', changeColor: 'text-emerald-600' },
                { label: 'Avg Response Time', value: '4.2m', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Across all teams', change: '-0.8m', changeColor: 'text-emerald-600' },
                { label: 'Active Responders', value: '14', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', sub: 'On-field personnel', change: '3 inbound', changeColor: 'text-amber-600' },
              ].map((m, i) => {
                const MIcon = m.icon;
                return (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.12em]">{m.label}</span>
                      <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                        <MIcon className={`w-[18px] h-[18px] ${m.color}`} />
                      </div>
                    </div>
                    <p className={`text-3xl font-black tracking-tight ${m.color} leading-none`}>{m.value}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-slate-400 font-semibold">{m.sub}</p>
                      <span className={`text-[9px] font-bold ${m.changeColor}`}>{m.change}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ─── SECTION 4: RESOLUTION PERFORMANCE ─── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Resolution Performance
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Critical Alerts Resolved', current: 4, total: 6, pct: 67, color: 'bg-red-500' },
                  { label: 'High Priority Resolved', current: 8, total: 12, pct: 75, color: 'bg-orange-500' },
                  { label: 'Medium Priority Resolved', current: 14, total: 16, pct: 88, color: 'bg-yellow-500' },
                  { label: 'SLA Compliance Rate', current: 22, total: 24, pct: 92, color: 'bg-emerald-500' },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-slate-700">{r.label}</span>
                      <span className="font-black text-slate-900">{r.current}/{r.total} <span className="text-slate-400 font-semibold">({r.pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 0.8, delay: 0.4 }}
                        className={`h-full rounded-full ${r.color} shadow-sm`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── SECTION 5: RECENT ESCALATION ACTIVITY ─── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-amber-400" /> Recent Escalation Activity
                  </h3>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">LIVE</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { action: 'Escalated to Rapid Response', alert: 'Lata Devi SOS', time: '12m ago', by: 'AI Auto-Escalation', priority: 'critical' },
                  { action: 'Field team dispatched', alert: 'V103 Malaria Outbreak', time: '2h ago', by: 'Dr. Sharma', priority: 'high' },
                  { action: 'WHO protocol activated', alert: 'Dengue containment zone', time: '3h ago', by: 'District Officer', priority: 'high' },
                  { action: 'Resupply order placed', alert: 'V101 Nutrition Program', time: '5h ago', by: 'NGO Coordinator', priority: 'medium' },
                  { action: 'Patient transferred', alert: 'Ram Singh Chest Pain', time: '6h ago', by: 'EMS Dispatch', priority: 'critical' },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      act.priority === 'critical' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' :
                      act.priority === 'high' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">{act.action}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          act.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          act.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{act.priority.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{act.alert} · by {act.by}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{act.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </main>

          {/* ─── RIGHT (30%): INTELLIGENCE PANELS — sticky on desktop ─── */}
          <aside className="w-full">
            <div className="lg:sticky lg:top-6 space-y-5">

              {/* Outbreak Intelligence */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" /> Outbreak Intel
                    </h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AI LIVE
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {OUTBREAK_ALERTS.map((o, i) => {
                    const isHigh = o.severity === 'high';
                    const gaugeColor = o.riskScore >= 70 ? 'bg-red-500' : o.riskScore >= 50 ? 'bg-orange-500' : 'bg-amber-500';
                    return (
                      <div key={i} className={`rounded-2xl p-4 border transition-all hover:shadow-md ${
                        isHigh ? 'bg-gradient-to-br from-red-50 to-red-50/30 border-red-200' : 'bg-gradient-to-br from-amber-50 to-amber-50/30 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isHigh ? 'bg-red-100' : 'bg-amber-100'}`}>
                              <Bug className={`w-4 h-4 ${isHigh ? 'text-red-600' : 'text-amber-600'}`} />
                            </div>
                            <span className={`text-sm font-black ${isHigh ? 'text-red-800' : 'text-amber-800'}`}>{o.disease}</span>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{isHigh ? 'HIGH' : 'MEDIUM'}</span>
                        </div>

                        <p className="text-xs text-slate-600 font-semibold mb-3 leading-snug">{o.message}</p>

                        {/* Risk Score Gauge */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="font-bold text-slate-500 flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> Risk Score</span>
                            <span className={`font-black ${isHigh ? 'text-red-600' : 'text-amber-600'}`}>{o.riskScore}/100</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${o.riskScore}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-full rounded-full ${gaugeColor} shadow-sm`} />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-white/60 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-black text-slate-800">{o.cases}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Cases</p>
                          </div>
                          <div className="bg-white/60 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-black text-slate-800">{o.village}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Village</p>
                          </div>
                          <div className="bg-white/60 rounded-xl p-2.5 text-center">
                            <p className={`text-sm font-black flex items-center justify-center gap-0.5 ${o.trend === 'increasing' ? 'text-red-600' : 'text-emerald-600'}`}>
                              <TrendingUp className="w-3.5 h-3.5" />
                              {o.trend === 'increasing' ? '↑' : '→'}
                            </p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Trend</p>
                          </div>
                        </div>

                        {/* AI Prediction Badge */}
                        <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-violet-50/50 rounded-xl px-3.5 py-2.5 border border-violet-200">
                          <Brain className="w-4 h-4 text-violet-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-violet-700 uppercase tracking-wider">AI Prediction</p>
                            <p className="text-[10px] text-violet-600 font-semibold">
                              {o.riskScore >= 70
                                ? 'High risk — immediate intervention recommended'
                                : 'Moderate risk — continue monitoring'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Emergency SOS Feed */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Ambulance className="w-4 h-4 text-red-200" /> Emergency SOS
                    </h3>
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                      {SOS_ALERTS.length} active
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {SOS_ALERTS.map((sos) => (
                    <div key={sos.id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          sos.priority === 'critical' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-orange-50 text-orange-600'
                        }`}>
                          <AlertTriangle className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-900">{sos.name}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              sos.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>{sos.priority === 'critical' ? 'CRITICAL' : 'HIGH'}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">{sos.condition}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sos.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sos.time}</span>
                          </div>
                        </div>
                        <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-400 transition-all shrink-0 mt-0.5 group-hover:shadow-sm">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* System Status — Enterprise */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Status
                  </h3>
                </div>
                <div className="p-4 space-y-0.5">
                  {[
                    { label: 'AWS Aurora Sync', icon: Database, status: 'operational', color: 'emerald', desc: 'Connected · Real-time replication' },
                    { label: 'Local Database', icon: HardDrive, status: 'operational', color: 'emerald', desc: 'IndexedDB · 45ms latency' },
                    { label: 'Offline Queue', icon: WifiOff, status: unreadCount > 0 ? 'degraded' : 'operational', color: unreadCount > 0 ? 'amber' : 'emerald', desc: unreadCount > 0 ? `${unreadCount} pending records` : 'All synced' },
                    { label: 'API Health', icon: Radio, status: 'operational', color: 'emerald', desc: '99.2% uptime · 120ms avg' },
                  ].map((svc) => {
                    const dotColor = svc.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
                    const bgColor = svc.color === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50';
                    const textColor = svc.color === 'emerald' ? 'text-emerald-700' : 'text-amber-700';
                    const Icon = svc.icon;
                    return (
                      <div key={svc.label} className={`flex items-center justify-between p-3 rounded-xl transition-all hover:bg-slate-50`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${svc.color === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50'} flex items-center justify-center`}>
                            <Icon className={`w-4.5 h-4.5 ${svc.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{svc.label}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{svc.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-wider ${svc.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {svc.status === 'operational' ? 'Operational' : 'Degraded'}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ${svc.color === 'emerald' ? 'animate-pulse' : ''}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Recent AI Insights */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> AI Insights
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { text: 'Dengue risk increasing in V103 — 12 new cases detected', severity: 'high', time: '2h ago' },
                    { text: 'Missed maternal visits detected — 3 patients overdue', severity: 'medium', time: '4h ago' },
                    { text: 'Nutrition alert — 2 moderate malnutrition cases flagged', severity: 'medium', time: '6h ago' },
                  ].map((insight, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-slate-50 ${
                      insight.severity === 'high' ? 'bg-red-50/50' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        insight.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold leading-snug ${
                          insight.severity === 'high' ? 'text-red-800' : 'text-slate-700'
                        }`}>{insight.text}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{insight.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* District Health Summary */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> District Health Summary
                    </h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LIVE</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Active Outbreaks', value: OUTBREAK_ALERTS.length, icon: Bug, color: 'text-red-600', bg: 'bg-red-50', change: '+1 new' },
                      { label: 'Villages Covered', value: villagesAffected + 3, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', change: '84% coverage' },
                      { label: 'Health Workers', value: 12, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', change: '8 on-field' },
                      { label: 'Bed Availability', value: '87%', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '42 beds free' },
                    ].map((s, i) => {
                      const SIcon = s.icon;
                      return (
                        <div key={i} className={`${s.bg} rounded-xl p-3 border border-transparent hover:border-slate-200 transition-all`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                              <SIcon className={`w-3.5 h-3.5 ${s.color}`} />
                            </div>
                            <span className="text-lg font-black text-slate-800 leading-none">{s.value}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500">{s.label}</p>
                          <p className={`text-[8px] font-semibold ${s.color} mt-0.5`}>{s.change}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Escalation Queue */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Escalation Queue
                    </h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">{DEMO_NOTIFICATIONS.filter(n => n.severity === 'critical' || n.severity === 'high').length} items</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {DEMO_NOTIFICATIONS.filter(n => n.severity === 'critical' || n.severity === 'high').slice(0, 4).map((n, i) => (
                    <div key={n.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${n.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 leading-snug truncate">{n.text}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{n.time} · {n.village || 'System'}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                        n.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>{n.severity === 'critical' ? 'CRITICAL' : 'HIGH'}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Response Team Status */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Response Team Status
                  </h3>
                </div>
                <div className="p-3 space-y-1">
                  {[
                    { name: 'Rapid Response', members: 4, status: 'available', eta: '2 min' },
                    { name: 'Maternal Health', members: 3, status: 'deployed', eta: '25 min' },
                    { name: 'Field Operations', members: 5, status: 'available', eta: '5 min' },
                    { name: 'Nutrition Unit', members: 2, status: 'standby', eta: '—' },
                  ].map((team) => (
                    <div key={team.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        team.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                        team.status === 'deployed' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800">{team.name}</p>
                          <span className={`text-[9px] font-semibold ml-auto flex items-center gap-1 ${
                            team.status === 'available' ? 'text-emerald-600' :
                            team.status === 'deployed' ? 'text-amber-600' :
                            'text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              team.status === 'available' ? 'bg-emerald-500' :
                              team.status === 'deployed' ? 'bg-amber-500' :
                              'bg-slate-300'
                            }`} />
                            {team.status === 'available' ? 'Available' : team.status === 'deployed' ? 'Deployed' : 'Standby'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold mt-0.5">
                          <span>{team.members} members</span>
                          {team.status !== 'standby' && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>ETA: {team.eta}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </aside>
        </div>
      </div>
    </NGOSidebarLayout>
    );
  }