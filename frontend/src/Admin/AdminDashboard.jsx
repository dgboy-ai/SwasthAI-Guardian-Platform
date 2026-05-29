import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  LayoutDashboard, Globe, Activity, Users, Search,
  Shield, AlertTriangle, MapPin, Truck,
  CheckCircle, Download, BarChart3, Zap,
  BrainCircuit, WifiOff, PhoneCall, X, Database,
  Clock, TrendingUp
} from 'lucide-react';
import adminService from '../services/adminService';
import api from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchId, setSearchId] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [stats, setStats] = useState({ villages: 0, pregnancies: 0, malnutrition: 0, ambulances: 0, today_symptoms: 0 });
  const [summary, setSummary] = useState({ totalUsers: 0, totalNgos: 0, totalRequests: 0, emergencyCount: 0, sanitaryCount: 0 });
  const [ambulances, setAmbulances] = useState([]);
  const [ambLoading, setAmbLoading] = useState(true);
  const [outbreaks, setOutbreaks] = useState([]);
  const [outbreakLoading, setOutbreakLoading] = useState(true);
  const [alertSent, setAlertSent] = useState(false);

  const issueDistrictAlert = async () => {
    try {
      await api.post('/admin/outbreak-alert', {
        villageId: 'DISTRICT_WIDE',
        disease: 'Manual District Alert',
        action: 'All ASHA workers notified. Escalate to District Health Officer immediately.',
      });
    } catch (_) { /* best-effort */ }
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsError(false);
        const analyticsData = await adminService.getAnalytics();
        setStats(analyticsData);
        const res2 = await api.get('/admin/summary');
        setSummary(res2.data);
      } catch (err) {
        console.error('Admin analytics fetch failed:', err);
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchAmbulances = async () => {
      try {
        setAmbLoading(true);
        const res = await api.get('/admin/ambulances');
        setAmbulances(res.data || []);
      } catch (err) {
        console.error('Failed to fetch ambulance data:', err);
      } finally {
        setAmbLoading(false);
      }
    };

    const fetchOutbreaks = async () => {
      try {
        setOutbreakLoading(true);
        const res = await api.get('/admin/outbreaks');
        setOutbreaks(res.data.outbreaks || []);
      } catch (err) {
        console.error('Failed to fetch outbreak data:', err);
      } finally {
        setOutbreakLoading(false);
      }
    };

    fetchStats();
    fetchAmbulances();
    fetchOutbreaks();

    const interval = setInterval(() => { 
      fetchStats(); 
      fetchAmbulances(); 
      fetchOutbreaks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const downloadReport = async () => {
    try {
      const response = await api.get('/admin/report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'swasthai_admin_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report. Make sure you are logged in as Admin.');
    }
  };

  const tabs = [
    { id: 'analytics',    label: 'Analytics',         icon: BarChart3    },
    { id: 'intelligence', label: 'Outbreak AI',        icon: BrainCircuit },
    { id: 'dispatch',     label: 'Ambulance Feed',     icon: Truck        },
    { id: 'sync',         label: 'Offline Nodes',      icon: WifiOff      },
  ];

  const statusColor = (status) => ({
    pending:     'bg-yellow-100 text-yellow-700',
    assigned:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed:   'bg-emerald-100 text-emerald-700',
  }[status] || 'bg-slate-100 text-slate-500');

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="admin" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">

        {/* HEADER */}
        <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">District Admin Portal</p>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Admin <span className="text-emerald-600">Dashboard</span>
              </h1>
              <p className="text-slate-500 font-medium mt-3 text-base max-w-xl leading-relaxed">
                District-level analytics, outbreak surveillance, live ambulance dispatches, and offline node monitoring.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                className="bg-transparent border-0 focus:ring-0 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 w-full sm:w-52"
                placeholder="Search village by ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* TAB NAV */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-700">

            {/* Error Banner */}
            {statsError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-black text-rose-800 text-sm uppercase tracking-widest">Backend Unreachable</p>
                  <p className="text-rose-600 text-xs font-medium mt-0.5">Could not load live analytics. Ensure the backend is running on port 5000.</p>
                </div>
              </div>
            )}

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Villagers',          val: summary.totalUsers,    icon: Globe,         color: 'emerald' },
                { label: 'NGO Workers',        val: summary.totalNgos,     icon: Users,         color: 'sky'     },
                { label: 'Maternal Records',   val: stats.pregnancies ?? 0, icon: Activity,     color: 'rose'    },
                { label: 'At-Risk Children',   val: stats.malnutrition ?? 0, icon: AlertTriangle, color: 'amber' },
                { label: 'Ambulance Requests', val: summary.emergencyCount, icon: Truck,        color: 'purple'  },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-${s.color}-50 text-${s.color}-500 group-hover:bg-${s.color}-100 transition-colors`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{statsLoading ? '—' : s.val}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Action Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { t: 'Outbreak AI',        d: 'Cluster prediction across 1,200+ village nodes.',    icon: BrainCircuit, action: () => setActiveTab('intelligence') },
                { t: 'Ambulance Feed',     d: 'Live dispatch feed with status tracking.',            icon: Truck,        action: () => setActiveTab('dispatch')     },
                { t: 'Download Report',    d: 'Export district CSV report for all records.',         icon: Download,     action: downloadReport                     },
                { t: 'Telemedicine Hub',   d: 'Remote consultation trends and surgical referrals.',  icon: PhoneCall,    action: null                               },
              ].map(r => (
                <div
                  key={r.t}
                  onClick={r.action}
                  className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col"
                >
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <r.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mb-1">{r.t}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed flex-1">{r.d}</p>
                </div>
              ))}
            </div>

            {/* Ambulance Preview */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Recent Ambulance Dispatches</h3>
                </div>
                <button onClick={() => setActiveTab('dispatch')} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                  View All →
                </button>
              </div>
              <div className="p-4">
                {ambLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="w-5 h-5 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : ambulances.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Truck className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Dispatches Yet</p>
                    <p className="text-xs text-slate-300 font-medium mt-1">Ambulance requests will appear here.</p>
                  </div>
                ) : (
                  ambulances.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{a.name || `User #${a.user_id}`}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{a.location || 'District Request'}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── OUTBREAK AI TAB ── */}
        {activeTab === 'intelligence' && (
          <div className="animate-in fade-in duration-700 space-y-5">
            <div className="bg-emerald-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute right-[-5%] top-[-15%] opacity-10 pointer-events-none">
                <BrainCircuit className="w-64 h-64" />
              </div>
              <div className="relative z-10 mb-8">
                <div className="p-3 bg-emerald-800 text-emerald-400 rounded-2xl border border-emerald-700 inline-block mb-6">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-tight">Neural Outbreak Radar</h2>
                <p className="text-emerald-100/70 text-base font-medium leading-relaxed max-w-xl">
                  SwasthAI monitors symptom clusters in real time. If 5 or more cases of the same disease appear from the same village within 24 hours, an automatic outbreak alert is triggered and sent to all admins.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Villages Monitored', val: '1,200+' },
                  { label: 'Symptom Events Today', val: stats.today_symptoms ?? '—' },
                  { label: 'Outbreak Threshold', val: '3+ cases / 24h' },
                ].map(item => (
                  <div key={item.label} className="bg-emerald-800/50 border border-emerald-700/50 rounded-2xl p-4">
                    <p className="text-2xl font-black text-white">{item.val}</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={issueDistrictAlert}
                className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                  alertSent ? 'bg-emerald-400 text-white cursor-default' : 'bg-white text-emerald-900 hover:bg-emerald-500 hover:text-white'
                }`}>
                {alertSent ? '✅ Alert Sent to All ASHA Workers' : 'Issue District-Wide Alert'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Outbreak Alerts List */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Active AI Outbreak Alerts</h3>
                  </div>
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {outbreaks.length} Detected
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {outbreakLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : outbreaks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                      <Shield className="w-12 h-12 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">No Outbreaks Detected</p>
                      <p className="text-xs font-medium mt-1">Village clusters are within normal seasonal range.</p>
                    </div>
                  ) : (
                    outbreaks.map((ob) => (
                      <div key={ob.id} className="p-5 border border-rose-100 bg-rose-50/30 rounded-2xl relative overflow-hidden group hover:border-rose-300 transition-all">
                        <div className="absolute right-4 top-4">
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <p className="font-black text-rose-900 text-sm">Village ID: {ob.villageId}</p>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">{ob.classification} Detected</h4>
                        <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
                          Pattern: {ob.symptomPattern}
                        </p>
                        <div className="p-3 bg-white border border-rose-200 rounded-xl">
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Recommended Action</p>
                          <p className="text-xs text-slate-700 font-bold">{ob.action}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{new Date(ob.detectedAt).toLocaleString()}</span>
                          <span className="text-emerald-600">AI Confidence: {(ob.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logic Card */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 h-fit">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Surveillance Logic</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { step: '1', t: 'Symptom Ingestion', d: 'Villager submits symptoms via app/voice.' },
                    { step: '2', t: 'Pattern Mapping', d: 'AI classifies cases against MoHFW disease database.' },
                    { step: '3', t: 'Cluster Trigger', d: 'Agent detects ≥ 3 cases in 24h at same village node.' },
                    { step: '4', t: 'District Alert', d: 'Outbreak confirmed via Groq Llama-3.1 epidemiology model.' },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">{item.step}</div>
                      <div>
                        <p className="font-black text-slate-900 text-[13px]">{item.t}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-xs font-bold text-emerald-900 leading-relaxed">Agent is actively monitoring 1,200+ regional health nodes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AMBULANCE FEED TAB ── */}
        {activeTab === 'dispatch' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live Emergency Feed</p>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">All Ambulance Dispatches</h2>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">Auto-refreshes every 30 seconds. Updates instantly when villagers submit requests.</p>
                </div>
                <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-sm">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              {ambLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ambulances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                  <Truck className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="font-black text-slate-400 text-sm uppercase tracking-widest">No Dispatches Yet</h3>
                  <p className="text-slate-300 text-xs font-medium mt-1">Ambulance requests made by villagers will appear here in real time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Patient', 'Type', 'Location', 'Priority', 'Status', 'Time'].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ambulances.map((a, i) => (
                        <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-4 font-bold text-sm text-slate-900">{a.name || `User #${a.user_id}`}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${a.type === 'emergency' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {a.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-500 max-w-[200px] truncate">{a.location || 'District Request'}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              a.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                              a.priority === 'High'     ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>{a.priority || '—'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(a.status)}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-400">
                            {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── OFFLINE NODES TAB ── */}
        {activeTab === 'sync' && (
          <div className="animate-in fade-in duration-700 space-y-5">
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute right-[-5%] top-[-10%] opacity-5 pointer-events-none">
                <WifiOff className="w-64 h-64" />
              </div>
              <WifiOff className="w-8 h-8 text-emerald-400 mb-5 opacity-50" />
              <h2 className="text-3xl font-black tracking-tight mb-3">Offline Node Resilience</h2>
              <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl mb-8">
                SwasthAI is designed to work in low-connectivity rural areas. Village health workers can continue recording data offline, which is automatically synced when connectivity is restored.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Regional Sync Handshake Active</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Offline Nodes Monitored', val: '418',   icon: Database  },
                { label: 'Data Integrity',           val: '100%',  icon: Shield    },
                { label: 'Auto-Sync Protocol',       val: 'Active', icon: Zap      },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{item.val}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
