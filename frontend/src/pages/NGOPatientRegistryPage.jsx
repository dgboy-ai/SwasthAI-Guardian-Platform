import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, MapPin, Calendar, Heart, Baby, Activity,
  AlertTriangle, Phone, Clock, User, Sparkles, ArrowRight,
  Brain, TrendingUp
} from 'lucide-react';
import NGOSidebarLayout from '../components/NGOSidebarLayout';

const DEMO_PATIENTS = [
  { id: 'P001', name: 'Sunita Devi', age: 26, gender: 'F', condition: 'High Risk Pregnancy', village: 'Village V101', status: 'Critical', lastVisit: '2026-06-10', nextVisit: '2026-06-17', risk: 'high', score: 87 },
  { id: 'P002', name: 'Raju Kumar', age: 2, gender: 'M', condition: 'Severe Acute Malnutrition', village: 'Village V101', status: 'Critical', lastVisit: '2026-06-12', nextVisit: '2026-06-19', risk: 'high', score: 92 },
  { id: 'P003', name: 'Rani Kumari', age: 24, gender: 'F', condition: 'Pregnancy (5mo)', village: 'Village V102', status: 'Follow-up', lastVisit: '2026-06-08', nextVisit: '2026-06-22', risk: 'medium', score: 55 },
  { id: 'P004', name: 'Lata Devi', age: 55, gender: 'F', condition: 'Chest Pain / Breathing Issue', village: 'Village V102', status: 'Emergency', lastVisit: '2026-06-13', nextVisit: 'Today', risk: 'high', score: 95 },
  { id: 'P005', name: 'Karan Singh', age: 1.5, gender: 'M', condition: 'Moderate Malnutrition', village: 'Village V103', status: 'Improving', lastVisit: '2026-06-09', nextVisit: '2026-06-23', risk: 'medium', score: 48 },
  { id: 'P006', name: 'Pooja Gupta', age: 22, gender: 'F', condition: 'Pregnancy (3mo)', village: 'Village V103', status: 'Stable', lastVisit: '2026-06-11', nextVisit: '2026-07-02', risk: 'low', score: 22 },
  { id: 'P007', name: 'Ram Singh', age: 60, gender: 'M', condition: 'Chest Pain / Breathing Issue', village: 'Village V104', status: 'Recovered', lastVisit: '2026-06-05', nextVisit: '2026-07-05', risk: 'low', score: 18 },
  { id: 'P008', name: 'Geeta Devi', age: 28, gender: 'F', condition: 'Pad Request Follow-up', village: 'Village V101', status: 'Scheduled', lastVisit: '2026-06-01', nextVisit: '2026-06-28', risk: 'medium', score: 52 },
];

const AI_INSIGHTS = {
  'P001': { trend: 'increasing', action: 'Missed last 2 prenatal visits — immediate follow-up required', badge: 'High anemia probability' },
  'P002': { trend: 'critical', action: 'Weight dropped 8% in 2 weeks — urgent nutritional intervention needed', badge: 'Severe malnutrition risk' },
  'P004': { trend: 'critical', action: 'Breathing pattern deteriorating — emergency escalation recommended', badge: 'Cardiac risk flagged' },
};

const HERO_STATS = [
  { label: 'Total Patients', value: DEMO_PATIENTS.length, icon: Users, gradient: 'from-slate-600 to-slate-700', bg: 'bg-slate-50', text: 'text-slate-700', sub: 'Registered in system' },
  { label: 'High Risk', value: DEMO_PATIENTS.filter(p => p.risk === 'high').length, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700', sub: 'Needs immediate care' },
  { label: 'Follow-ups Today', value: DEMO_PATIENTS.filter(p => p.nextVisit === 'Today').length, icon: Calendar, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', sub: 'Due for check-in' },
  { label: 'AI Priority Cases', value: DEMO_PATIENTS.filter(p => p.risk === 'high').length + 1, icon: Brain, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', sub: 'Flagged by AI engine' },
];

const RISK_CONFIG = {
  high: {
    gradient: 'from-rose-50 via-rose-50/50 to-white',
    border: 'border-l-[5px] border-l-rose-500',
    shadow: 'shadow-rose-200/30',
    cardShadow: 'shadow-md hover:shadow-xl shadow-rose-200/20',
    badge: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-200/40',
    icon: 'text-rose-600', bg: 'bg-rose-50',
    label: 'CRITICAL',
    ring: 'ring-1 ring-rose-200',
    pulseColor: 'bg-red-500',
    dotBg: 'bg-rose-500',
    gauge: 'bg-rose-500'
  },
  medium: {
    gradient: 'from-amber-50 via-amber-50/30 to-white',
    border: 'border-l-[4px] border-l-amber-400',
    shadow: '', cardShadow: 'shadow-sm hover:shadow-lg',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    icon: 'text-amber-600', bg: 'bg-amber-50',
    label: 'MEDIUM',
    ring: '', pulseColor: 'bg-amber-500',
    dotBg: 'bg-amber-500',
    gauge: 'bg-amber-500'
  },
  low: {
    gradient: 'from-emerald-50 via-emerald-50/20 to-white',
    border: 'border-l-[4px] border-l-emerald-400',
    shadow: '', cardShadow: 'shadow-sm hover:shadow-lg',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    icon: 'text-emerald-600', bg: 'bg-emerald-50',
    label: 'LOW',
    ring: '', pulseColor: 'bg-emerald-500',
    dotBg: 'bg-emerald-500',
    gauge: 'bg-emerald-500'
  },
};

export default function NGOPatientRegistryPage() {
  console.log("NGOPatientRegistryPage Rendered");
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const highCount = DEMO_PATIENTS.filter(p => p.risk === 'high').length;
  const mediumCount = DEMO_PATIENTS.filter(p => p.risk === 'medium').length;
  const lowCount = DEMO_PATIENTS.filter(p => p.risk === 'low').length;

  const filtered = DEMO_PATIENTS
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = filterRisk === 'all' || p.risk === filterRisk;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      if (a.risk === 'high' && b.risk !== 'high') return -1;
      if (a.risk !== 'high' && b.risk === 'high') return 1;
      if (a.risk === 'medium' && b.risk === 'low') return -1;
      if (a.risk === 'low' && b.risk === 'medium') return 1;
      return 0;
    });

  const getConditionIcon = (condition) => {
    if (condition.toLowerCase().includes('pregnancy')) return Heart;
    if (condition.toLowerCase().includes('malnutrition') || condition.toLowerCase().includes('nutrition')) return Baby;
    if (condition.toLowerCase().includes('pain') || condition.toLowerCase().includes('breathing') || condition.toLowerCase().includes('chest')) return Activity;
    return User;
  };

  const isHighRisk = (p) => p.risk === 'high';

  if (pageLoading) {
    return (
      <NGOSidebarLayout activeTab="patients">
        <div className="px-6 xl:px-8 pt-4 sm:pt-6 pb-8">
          <div className="animate-pulse">
            <div className="h-10 w-72 bg-slate-200/70 rounded-xl mb-2" />
            <div className="h-4 w-64 bg-slate-200/50 rounded-lg mb-6" />
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-sm border border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
              </div>
            </div>
            <div className="h-8 w-48 bg-slate-200/50 rounded-xl mb-4" />
            <div className="h-28 bg-white rounded-2xl border border-slate-100 shadow-sm mb-6" />
            <div className="h-10 w-full bg-slate-200/50 rounded-2xl mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                      <div className="space-y-2">
                        <div className="h-5 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded mb-3" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded mb-3" />
                    <div className="h-2 bg-slate-100 rounded-full mb-4" />
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                      <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                      <div className="flex-1 h-9 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </NGOSidebarLayout>
    );
  }

  return (
    <NGOSidebarLayout activeTab="patients">
      <div className="px-6 xl:px-8 pt-4 sm:pt-6 pb-10">

        {/* ═══════════════════════════════════════════════════════════════════
           SECTION 1: HERO — Patient Registry Command Center
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Patient Registry Command Center</h1>
              <p className="text-sm sm:text-base text-slate-500 font-semibold mt-1.5">
                Real-time monitoring of high-risk rural patients · <span className="text-slate-700">{highCount} critical</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start">
              <Clock className="w-3.5 h-3.5" />
              Live census
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
          </div>

          {/* Hero KPI Cards */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {HERO_STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.12em]">{stat.label}</span>
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${stat.text}`} />
                      </div>
                    </div>
                    <p className={`text-3xl sm:text-4xl font-black tracking-tight ${stat.text} leading-none`}>{stat.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-1.5">{stat.sub}</p>
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
           SECTION 2: HIGH RISK ZONE — Spotlight Critical Patients
           ═══════════════════════════════════════════════════════════════════ */}
        {DEMO_PATIENTS.filter(p => p.risk === 'high').length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-widest text-red-600">Requires Immediate Attention</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent ml-2" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {DEMO_PATIENTS.filter(p => p.risk === 'high').map((p) => {
                const ai = AI_INSIGHTS[p.id];
                const ConditionIcon = getConditionIcon(p.condition);
                return (
                  <motion.div key={p.id} layout
                    className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl border border-red-200 shadow-lg shadow-red-200/30 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ring-1 ring-red-200">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">AI Priority · Critical</span>
                      </div>
                      <Brain className="w-4 h-4 text-red-200" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-xl font-black text-red-700 shadow-sm shrink-0">
                          {p.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900 leading-tight">{p.name}</p>
                          <p className="text-xs text-slate-400 font-semibold">{p.village} · {p.age}yrs</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                          <ConditionIcon className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <span className="text-xs font-bold text-red-800">{p.condition}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 ring-1 ring-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Risk: {p.score}/100
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 ring-1 ring-violet-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      </div>

                      {ai && (
                        <div className="bg-gradient-to-r from-violet-50 to-violet-50/50 rounded-xl p-3 border border-violet-200 mb-3">
                          <p className="text-[10px] font-black text-violet-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                            <Brain className="w-3 h-3" /> AI Insight
                          </p>
                          <p className="text-[11px] text-violet-600 font-semibold leading-snug">{ai.action}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{ai.badge}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm">
                          <Phone className="w-3.5 h-3.5" /> Contact
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95">
                          <ArrowRight className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
           SECTION 3: SEARCH + FILTERS
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input type="text" placeholder="Search patients by name, village, or condition..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all shadow-sm" />
          </div>
          <div className="flex gap-2">
            {([
              { label: 'All', value: 'all' },
              { label: 'Critical', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]).map(f => {
              const count = f.value === 'all' ? DEMO_PATIENTS.length : DEMO_PATIENTS.filter(p => p.risk === f.value).length;
              return (
                <button key={f.value} onClick={() => setFilterRisk(f.value)}
                  className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                    filterRisk === f.value
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600 hover:shadow-sm'
                  }`}>
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-bold ${
                    filterRisk === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
           SECTION 4: PATIENT CARDS GRID
           ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p, i) => {
              const rc = RISK_CONFIG[p.risk] || RISK_CONFIG.low;
              const ConditionIcon = getConditionIcon(p.condition);
              const isHigh = isHighRisk(p);
              const ai = AI_INSIGHTS[p.id];
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedPatient(selectedPatient === p.id ? null : p.id)}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group ${
                    isHigh
                      ? `${rc.cardShadow} bg-gradient-to-r ${rc.gradient} ${rc.ring}`
                      : `${rc.cardShadow}`
                  } ${rc.border}`}>
                  <div className="p-5 sm:p-6">
                    {/* Top row: avatar + name + risk badge */}
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                          isHigh
                            ? 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 shadow-rose-200/50'
                            : p.risk === 'medium'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {p.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black leading-tight ${isHigh ? 'text-xl text-slate-900' : 'text-lg text-slate-900'}`}>{p.name}</p>
                          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="truncate">{p.village}</span>
                            <span className="text-slate-300">·</span>
                            <span>{p.age} yrs</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${rc.badge}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {rc.label}
                        </span>
                        {isHigh && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Priority
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Condition row */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-8 h-8 rounded-xl ${isHigh ? 'bg-rose-50' : 'bg-slate-50'} flex items-center justify-center`}>
                        <ConditionIcon className={`w-4 h-4 ${rc.icon}`} />
                      </div>
                      <span className={`text-sm font-bold ${isHigh ? 'text-slate-800' : 'text-slate-600'}`}>{p.condition}</span>
                    </div>

                    {/* Risk score gauge with number */}
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-bold text-slate-500">Risk Score</span>
                          <span className={`font-black ${isHigh ? 'text-rose-600' : 'text-slate-500'}`}>{p.score}/100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${p.score}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                            className={`h-full rounded-full ${rc.gauge} shadow-sm`} />
                        </div>
                      </div>
                      {isHigh && (
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center ring-1 ring-red-200 shrink-0">
                          <TrendingUp className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>

                    {/* AI Insights for high-risk */}
                    {isHigh && ai && (
                      <div className="bg-gradient-to-r from-violet-50 to-violet-50/30 rounded-xl p-3 border border-violet-200 mb-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-[8px] font-black text-violet-700 uppercase tracking-wider">AI Risk Assessment</span>
                        </div>
                        <p className="text-[11px] text-violet-600 font-semibold leading-snug">{ai.action}</p>
                      </div>
                    )}

                    {/* Visit info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-3 border-t border-slate-100 mb-3.5">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-300" /> Last: {p.lastVisit}</span>
                      <span className={`font-bold flex items-center gap-1.5 ${p.nextVisit === 'Today' ? 'text-red-600' : 'text-slate-600'}`}>
                        <Clock className="w-3.5 h-3.5 text-slate-300" /> Next: {p.nextVisit}
                      </span>
                    </div>

                    {/* Premium action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={(e) => { e.stopPropagation(); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
                          isHigh
                            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-200/30'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}>
                        <Phone className="w-3.5 h-3.5" /> Contact
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
                          isHigh
                            ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}>
                        <MapPin className="w-3.5 h-3.5" /> Location
                      </button>
                    </div>
                  </div>

                  {/* Expandable section */}
                  <AnimatePresence>
                    {selectedPatient === p.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                          <div className="h-px bg-slate-200" />
                          <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={(e) => { e.stopPropagation(); }}
                              className="py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-rose-200/30 active:scale-[0.98] flex items-center justify-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> Schedule Visit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); }}
                              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" /> View History
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {/* ─── EMPTY STATE ─── */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-28 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-xl">
              <Users className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-black text-slate-300 text-2xl tracking-tight">No Patients Found</p>
            <p className="text-sm text-slate-400 font-medium mt-2 max-w-xs">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}

      </div>
    </NGOSidebarLayout>
  );
}
