// ─── SwasthAI Guardian — District Health Command Center ───────────────────────
// Full desktop command center: sidebar + topbar + analytics + outbreak radar +
// emergency panel + pregnancy + nutrition + vaccination + NGO dashboard
// Route: /district  |  Desktop-first (lg+)  |  React + Tailwind + Recharts

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Heart, Bell, Wifi, WifiOff, RefreshCw, ChevronRight,
  AlertTriangle, Users, Activity, Shield, TrendingUp, TrendingDown,
  MapPin, Clock, Zap, BarChart2, FileText, Settings, Home,
  Baby, Phone, CheckCircle, X, Menu, ChevronDown, MoreHorizontal
} from 'lucide-react';

// ── Mock Data ────────────────────────────────────────────────────────────────
const vaccData = [
  { month: 'Jan', coverage: 62 }, { month: 'Feb', coverage: 68 },
  { month: 'Mar', coverage: 71 }, { month: 'Apr', coverage: 74 },
  { month: 'May', coverage: 78 }, { month: 'Jun', coverage: 82 },
];

const diseaseData = [
  { week: 'W1', malaria: 8, dengue: 3, fever: 12 },
  { week: 'W2', malaria: 12, dengue: 5, fever: 9 },
  { week: 'W3', malaria: 7, dengue: 8, fever: 15 },
  { week: 'W4', malaria: 15, dengue: 6, fever: 11 },
  { week: 'W5', malaria: 10, dengue: 4, fever: 8 },
  { week: 'W6', malaria: 18, dengue: 9, fever: 14 },
];

const nutritionData = [
  { name: 'Normal', value: 68, color: '#10B981' },
  { name: 'Moderate', value: 22, color: '#F59E0B' },
  { name: 'Severe', value: 10, color: '#EF4444' },
];

const referralData = [
  { month: 'Jan', sent: 24, closed: 18 }, { month: 'Feb', sent: 31, closed: 25 },
  { month: 'Mar', sent: 28, closed: 22 }, { month: 'Apr', sent: 35, closed: 30 },
  { month: 'May', sent: 40, closed: 36 }, { month: 'Jun', sent: 38, closed: 34 },
];

const SOS_ALERTS = [
  { id: 'S1', patient: 'Meena Devi', location: 'Village V101, Block Rampur', type: 'Pregnancy Complication', status: 'En Route', time: '3m ago', priority: 'CRITICAL' },
  { id: 'S2', patient: 'Ram Singh', location: 'Village V203, Block Sitapur', type: 'Chest Pain', status: 'Assigned', time: '12m ago', priority: 'HIGH' },
  { id: 'S3', patient: 'Sunita Kumari', location: 'Village V105, Block Rampur', type: 'Snake Bite', status: 'Pending', time: '18m ago', priority: 'HIGH' },
];

const HIGH_RISK_PREGNANCIES = [
  { id: 'P1', name: 'Sunita Devi', village: 'V101', weeks: 34, risk: 'HIGH', bp: '150/95', hb: '8.2', lastVisit: '3 days ago' },
  { id: 'P2', name: 'Kavita Yadav', village: 'V203', weeks: 28, risk: 'MEDIUM', bp: '130/85', hb: '9.1', lastVisit: '1 week ago' },
  { id: 'P3', name: 'Rani Devi', village: 'V308', weeks: 38, risk: 'CRITICAL', bp: '160/100', hb: '7.8', lastVisit: '5 days ago' },
  { id: 'P4', name: 'Priya Singh', village: 'V412', weeks: 32, risk: 'HIGH', bp: '145/90', hb: '8.5', lastVisit: '2 days ago' },
];

const MALNUTRITION_CASES = [
  { id: 'M1', name: 'Baby Arjun', age: '2y 3m', village: 'V101', grade: 'SAM', weight: '7.2 kg', muac: '10.5 cm', status: 'Under Treatment' },
  { id: 'M2', name: 'Baby Priya', age: '1y 8m', village: 'V203', grade: 'MAM', weight: '8.1 kg', muac: '11.8 cm', status: 'Follow-up Due' },
  { id: 'M3', name: 'Baby Rohan', age: '3y 1m', village: 'V308', grade: 'MAM', weight: '10.2 kg', muac: '12.1 cm', status: 'Recovering' },
];

const KPI_DATA = [
  { label: 'Villages Covered', value: '47', sub: '+3 this month', icon: MapPin, color: '#10B981', bg: '#ECFDF5' },
  { label: 'Active Cases', value: '124', sub: '↑12 from last week', icon: Activity, color: '#EF4444', bg: '#FEF2F2' },
  { label: 'High Risk Pregnancies', value: '34', sub: '8 need urgent visit', icon: Heart, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Vaccinations This Week', value: '289', sub: '78% coverage', icon: Shield, color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Malnutrition Cases', value: '56', sub: '12 severe (SAM)', icon: Baby, color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'SOS Alerts Today', value: '3', sub: '2 en route', icon: Phone, color: '#EC4899', bg: '#FDF2F8' },
  { label: 'Referrals Closed', value: '18', sub: '82% success rate', icon: CheckCircle, color: '#14B8A6', bg: '#F0FDFA' },
  { label: 'ASHA Workers Active', value: '12/14', sub: '2 offline today', icon: Users, color: '#6366F1', bg: '#EEF2FF' },
];

const OUTBREAK_RISKS = [
  { disease: 'Malaria', probability: 87, trend: 'up', level: 'CRITICAL', villages: 6, color: '#EF4444' },
  { disease: 'Dengue', probability: 52, trend: 'stable', level: 'HIGH', villages: 3, color: '#F59E0B' },
  { disease: 'Cholera', probability: 31, trend: 'down', level: 'MEDIUM', villages: 2, color: '#2563EB' },
  { disease: 'Typhoid', probability: 18, trend: 'down', level: 'LOW', villages: 1, color: '#10B981' },
];

const NGO_KPIS = [
  { label: 'Villages Served', value: '47', icon: '🏘️' },
  { label: 'Lives Impacted', value: '18,420', icon: '❤️' },
  { label: 'Vaccines Completed', value: '12,840', icon: '💉' },
  { label: 'Referrals Closed', value: '384', icon: '📋' },
  { label: 'Funding Utilized', value: '₹42.3L', icon: '💰' },
];

const NOTIFICATIONS = [
  { id: 1, type: 'emergency', msg: 'SOS: Pregnancy complication in V101', time: '3m', unread: true },
  { id: 2, type: 'outbreak', msg: 'Malaria cases spike: 8 new reports in V203', time: '15m', unread: true },
  { id: 3, type: 'pregnancy', msg: 'Rani Devi (V308): BP critically high — visit required', time: '32m', unread: true },
  { id: 4, type: 'vaccination', msg: 'Vaccination drive completed: V412 block', time: '1h', unread: false },
  { id: 5, type: 'sync', msg: 'AWS sync successful — 47 records updated', time: '2h', unread: false },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/asha' },
  { id: 'patients', label: 'Patients', icon: Users, route: '/ngo/maternal' },
  { id: 'outbreak', label: 'Outbreak Radar', icon: AlertTriangle, route: '#' },
  { id: 'emergency', label: 'Emergency Center', icon: Phone, route: '/ambulance' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, route: '#' },
  { id: 'ngos', label: 'NGOs', icon: Heart, route: '#' },
  { id: 'reports', label: 'Reports', icon: FileText, route: '#' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/profile' },
];

const riskColor = (level) => ({
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
}[level] || 'bg-slate-100 text-slate-600 border-slate-200');

const statusColor = (status) => ({
  'En Route': 'bg-blue-100 text-blue-700',
  Assigned: 'bg-orange-100 text-orange-700',
  Pending: 'bg-red-100 text-red-700',
  Reached: 'bg-green-100 text-green-700',
  Closed: 'bg-slate-100 text-slate-600',
}[status] || 'bg-slate-100 text-slate-600');

// ════════════════════════════════════════════════════════════════════════════════
export default function DistrictCommandCenter() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 min ago');
  const [isOffline, setIsOffline] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [sosAlerts, setSosAlerts] = useState(SOS_ALERTS);
  const [activeOutbreakSection, setActiveOutbreakSection] = useState('radar');
  const unread = notifications.filter(n => n.unread).length;

  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setLastSync('Just now'); }, 2000);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setLastSync(p => p === 'Just now' ? '1 min ago' : p === '1 min ago' ? '2 min ago' : p);
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, unread: false })));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white">SwasthAI</span>
                <span className="text-sm font-black text-emerald-400">GUARDIAN</span>
              </div>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">District Command</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); if (item.route !== '#') navigate(item.route); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left group ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
                {!sidebarCollapsed && active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors text-sm font-semibold"
          >
            <Menu className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-6 py-3 z-20 sticky top-0">
          <div>
            <h1 className="text-base font-black text-white">District Health Command Center</h1>
            <p className="text-xs text-slate-500 font-medium">Rampur District • Uttar Pradesh • Real-time Epidemiological Intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Agent pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/60 border border-purple-700/50 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">AI Agent Active</span>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            </div>

            {/* AWS Sync */}
            <button
              onClick={triggerSync}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isOffline
                  ? 'bg-red-900/40 border-red-700/50 text-red-400'
                  : 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />}
              <div>
                <div className="font-black">{isOffline ? 'Offline' : 'AWS Connected'}</div>
                <div className="text-[9px] opacity-75">{syncing ? 'Syncing…' : `Last: ${lastSync}`}</div>
              </div>
            </button>

            {/* Offline toggle */}
            <button
              onClick={() => setIsOffline(p => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isOffline ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isOffline ? 'Go Online' : 'Offline Mode'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(p => !p)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Bell className="w-4.5 h-4.5 text-slate-400" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowNotifs(false)}
                      className="fixed inset-0 z-30"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute top-11 right-0 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-slate-800">
                        <p className="text-sm font-black text-white">Notifications</p>
                        <button onClick={markAllRead} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">Mark all read</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`flex gap-3 p-3 border-b border-slate-800 last:border-0 ${n.unread ? 'bg-emerald-900/10' : ''}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{n.msg}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.time} ago</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-black text-white">D</div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-white leading-tight">Dr. Priya Sharma</p>
                <p className="text-[9px] text-slate-500">District Health Officer</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── KPI GRID ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {KPI_DATA.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                      <Icon className="w-5 h-5" style={{ color: k.color }} />
                    </div>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-2xl font-black text-white mb-0.5">{k.value}</p>
                  <p className="text-xs font-semibold text-slate-400 mb-1">{k.label}</p>
                  <p className="text-[10px] text-slate-500">{k.sub}</p>
                </motion.div>
              );
            })}
          </div>

          {/* ── ROW 2: Outbreak Radar + Emergency + Pregnancy ──────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* OUTBREAK RADAR */}
            <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-black text-white">AI Outbreak Radar</span>
                  <span className="text-[9px] font-black bg-red-900 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">Live</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {OUTBREAK_RISKS.map((r, i) => (
                  <motion.div
                    key={r.disease}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">{r.disease}</span>
                        {r.probability >= 80 && <div className="w-2 h-2 rounded-full animate-ping bg-red-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${riskColor(r.level)}`}>{r.level}</span>
                        <span className="text-sm font-black" style={{ color: r.color }}>{r.probability}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.probability}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">{r.villages} villages affected · {r.trend === 'up' ? '↑ Increasing' : r.trend === 'down' ? '↓ Decreasing' : '→ Stable'}</p>
                  </motion.div>
                ))}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 font-medium">
                    🤖 AI model confidence: <span className="text-emerald-400 font-bold">94.2%</span> · Updated 3m ago
                  </p>
                </div>
              </div>
            </div>

            {/* EMERGENCY CENTER */}
            <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-black text-white">Emergency Dispatch</span>
                </div>
                <span className="text-[9px] font-black bg-orange-900 text-orange-400 px-2 py-0.5 rounded-full">{sosAlerts.length} Active</span>
              </div>
              <div className="p-4 space-y-3">
                {sosAlerts.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{s.patient}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${riskColor(s.priority)}`}>{s.priority}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.type}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${statusColor(s.status)}`}>{s.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{s.location}</span>
                      <span className="ml-auto text-slate-600">{s.time}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 py-1.5 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">Dispatch Ambulance</button>
                      <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Track</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* HIGH RISK PREGNANCIES */}
            <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-700 rounded-lg flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-black text-white">High Risk Pregnancies</span>
                </div>
                <span className="text-[9px] font-black bg-pink-900 text-pink-400 px-2 py-0.5 rounded-full">{HIGH_RISK_PREGNANCIES.length} cases</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-wide">Patient</th>
                      <th className="text-left px-2 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-wide">Weeks</th>
                      <th className="text-left px-2 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-wide">BP</th>
                      <th className="text-left px-2 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-wide">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {HIGH_RISK_PREGNANCIES.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-200">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.village} · {p.lastVisit}</p>
                        </td>
                        <td className="px-2 py-3 font-bold text-slate-300">{p.weeks}w</td>
                        <td className="px-2 py-3 text-slate-300">{p.bp}</td>
                        <td className="px-2 py-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${riskColor(p.risk)}`}>{p.risk}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── ROW 3: Disease Trends Chart + Nutrition + Vaccination ──────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Disease Trends */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-white">Disease Trends</h3>
                  <p className="text-[10px] text-slate-500">Weekly case counts — Last 6 weeks</p>
                </div>
                <div className="flex gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Malaria</span>
                  <span className="flex items-center gap-1 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Dengue</span>
                  <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Fever</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={diseaseData}>
                  <defs>
                    <linearGradient id="malGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="denGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="malaria" stroke="#EF4444" strokeWidth={2} fill="url(#malGrad)" />
                  <Area type="monotone" dataKey="dengue" stroke="#F59E0B" strokeWidth={2} fill="url(#denGrad)" />
                  <Line type="monotone" dataKey="fever" stroke="#60A5FA" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Child Nutrition Donut */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-black text-white mb-1">Child Nutrition Status</h3>
              <p className="text-[10px] text-slate-500 mb-4">Based on MUAC measurements</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={nutritionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {nutritionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {nutritionData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-slate-400 font-semibold">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">{d.value}%</span>
                  </div>
                ))}
              </div>
              {/* Malnutrition cases table mini */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                {MALNUTRITION_CASES.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-300">{m.name} <span className="text-slate-500 font-normal">({m.age})</span></p>
                      <p className="text-[10px] text-slate-500">{m.village} · {m.status}</p>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${m.grade === 'SAM' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'}`}>{m.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ROW 4: Vaccination Chart + Referral Chart + NGO KPIs ─────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Vaccination Trend */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-black text-white mb-1">Vaccination Coverage Trend</h3>
              <p className="text-[10px] text-slate-500 mb-4">Monthly % · Target: 90%</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={vaccData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="coverage" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Current: <span className="text-emerald-400 font-black">82%</span></span>
                <span className="text-[10px] text-red-400 font-bold">8% below target</span>
              </div>
            </div>

            {/* Referral Success */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-black text-white mb-1">Referral Analytics</h3>
              <p className="text-[10px] text-slate-500 mb-4">Sent vs. successfully closed</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={referralData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="sent" fill="#6366F1" radius={[4, 4, 0, 0]} name="Sent" />
                  <Bar dataKey="closed" fill="#10B981" radius={[4, 4, 0, 0]} name="Closed" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-indigo-400"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Sent</span>
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Closed</span>
                <span className="ml-auto text-slate-400">Avg close rate: <span className="text-emerald-400">87%</span></span>
              </div>
            </div>

            {/* NGO Impact */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white">NGO Impact Dashboard</h3>
                  <p className="text-[10px] text-slate-500">FY 2024–25 · Q2 Report</p>
                </div>
                <div className="flex gap-2">
                  {['PDF', 'CSV', 'Excel'].map(fmt => (
                    <button key={fmt} className="px-2 py-1 text-[9px] font-black bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors">{fmt}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {NGO_KPIS.map(k => (
                  <div key={k.label} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{k.icon}</span>
                      <span className="text-xs font-semibold text-slate-400">{k.label}</span>
                    </div>
                    <span className="text-sm font-black text-white">{k.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer row ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 pb-4 border-t border-slate-800">
            <p>SwasthAI Guardian v2.4.1 · Powered by AWS Bedrock &amp; React · IEEE YESIST12 2025</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 font-bold">All systems operational</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
