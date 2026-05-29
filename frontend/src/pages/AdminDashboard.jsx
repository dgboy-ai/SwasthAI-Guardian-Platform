import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
  Search, AlertTriangle, Truck, Home, MapPin, Users, Activity, 
  Shield, Globe, PlusCircle, BarChart2, Zap, ArrowRight, RefreshCw,
  Layout, Activity as ActivityIcon, ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';

const data = [
  { name: 'Jan', cases: 400 },
  { name: 'Feb', cases: 300 },
  { name: 'Mar', cases: 500 },
  { name: 'Apr', cases: 280 },
  { name: 'May', cases: 590 },
  { name: 'Jun', cases: 800 },
];

const villageMatrix = [
  { name: 'Kishanpur Node', pop: '1,200', asha: '4', node: 'Ultra-Link', mal: '12%', status: 'Optimal' },
  { name: 'Rampur Node', pop: '850', asha: '3', node: 'Basic (Low Bandwidth)', mal: '18%', status: 'Focus Required' },
  { name: 'Gopalpur Node', pop: '1,500', asha: '6', node: 'Ultra-Link', mal: '8%', status: 'Optimal' },
  { name: 'Shantinagar Node', pop: '920', asha: '2', node: 'Satellite Stub', mal: '22%', status: 'Intervention' },
];

export default function AdminDashboard() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
      console.error('Failed to download CSV:', err);
      alert('Failed to download report. Please try again later.');
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-inter selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar role="admin" />
      
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto w-full max-w-[1700px] mx-auto">
        
        {/* EXECUTIVE HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-5 sm:gap-8 pb-6 sm:pb-8 border-b border-slate-200"
        >
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 sm:gap-3 text-emerald-600 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[8px] sm:text-[10px]">
               <ActivityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> SYSTEM OVERWATCH: ACTIVE
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
               Executive <span className="text-emerald-600 italic">Command.</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs sm:text-lg uppercase tracking-widest">Village Health Oversight</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-96 group">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search villages..." 
                className="input-field pl-11 sm:pl-14 py-3 sm:py-4 text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="p-3 sm:p-4 bg-white border border-slate-100 text-slate-400 rounded-xl sm:rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm shrink-0">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </motion.header>

        {/* STRATEGIC METRICS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12"
        >
          {[
            { label: 'Active Nodes', value: '124', icon: Globe, color: 'blue', trend: '+4', trendType: 'pos' },
            { label: 'Population', value: '42.8k', icon: Users, color: 'indigo', trend: '+1.2%', trendType: 'pos' },
            { label: 'Red-Alerts', value: '18', icon: AlertTriangle, color: 'rose', trend: '-2', trendType: 'pos' },
            { label: 'Uptime', value: '99.9%', icon: Truck, color: 'emerald', trend: 'Stable', trendType: 'neut' },
          ].map(m => (
            <motion.div 
              key={m.label} 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="stat-card p-4 sm:p-8 flex flex-col justify-between"
            >
               <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className={`p-2.5 sm:p-4 bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl border border-slate-100`}>
                    <m.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest ${
                    m.trendType === 'pos' ? 'bg-emerald-50 text-emerald-600' : m.trendType === 'neut' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {m.trend}
                  </span>
               </div>
               <div>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">{m.label}</p>
                  <h3 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">{m.value}</h3>
               </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ANALYTICS AXIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-5 sm:p-10 lg:col-span-2 shadow-2xl shadow-slate-200/50"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">Clinical Surveillance</h2>
                <p className="text-[8px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Outbreak Analytics & Risk Vectors</p>
              </div>
              <div className="flex gap-1.5 sm:gap-2 bg-slate-50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-3 sm:px-5 py-2 hover:bg-white text-slate-400 hover:text-slate-900 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all">Week</button>
                <button className="flex-1 sm:flex-none px-3 sm:px-5 py-2 bg-white text-slate-900 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-sm border border-slate-100">Month</button>
              </div>
            </div>
            
            <div className="h-64 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 16px 32px -8px rgba(0,0,0,0.1)', padding: '12px' }} 
                    itemStyle={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="cases" stroke="#10b981" strokeWidth={3} sm:strokeWidth={5} fillOpacity={1} fill="url(#colorCases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* RESPONSE & FEED AXIS */}
          <div className="space-y-6">
            <motion.div 
               whileHover={{ y: -5 }}
               className="premium-card p-6 sm:p-8 bg-[#0A2E24] text-white border-none shadow-2xl shadow-emerald-900/20 relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10" />
               <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-xl border border-white/20 flex items-center justify-center">
                    <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-rose-600 px-2.5 py-1.5 rounded-full animate-pulse">Critical</span>
               </div>
               <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter relative z-10">Emergency</h3>
               <p className="text-emerald-100/60 text-[11px] sm:text-sm mt-2 sm:mt-3 leading-relaxed font-bold uppercase tracking-wide relative z-10">
                 Dispatch request from Sector 9. Acute Myocardial detected.
               </p>
               <button className="w-full mt-6 sm:mt-8 py-4 sm:py-5 bg-white hover:bg-emerald-50 text-[#0A2E24] font-black uppercase text-[9px] sm:text-[10px] tracking-widest sm:tracking-[0.3em] rounded-xl sm:rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10">
                  Execute Dispatch <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
               </button>
            </motion.div>

            <motion.div 
               whileHover={{ y: -5 }}
               className="premium-card p-8 border-slate-100"
            >
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                 <Shield className="w-5 h-5 text-emerald-600" /> Security Feed
               </h3>
               <div className="space-y-5">
                  {[
                    { msg: 'System integrity: Verified', time: '5m' },
                    { msg: 'Auth token encryption renewed', time: '1h' },
                    { msg: 'Satellite node XY-09 synced', time: '3h' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-emerald-100 transition-colors">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.msg}</span>
                       <span className="text-[10px] font-black text-emerald-600/50">{s.time}</span>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-4 text-[10px] font-black text-slate-400 hover:text-emerald-600 tracking-widest uppercase transition-all flex items-center justify-center gap-2 group">
                 Open Command Logs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </motion.div>
          </div>
        </div>

        {/* REGIONAL CONNECTIVITY MATRIX */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 md:p-10 overflow-hidden shadow-2xl shadow-slate-200/50"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><MapPin className="w-6 h-6" /></div>
                 Network Infrastructure Matrix
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Global Node Deployment & Regional Health Scores</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/monitoring')} className="btn-secondary py-3 text-[10px] border-indigo-100 bg-indigo-50 text-indigo-600">🛰️ System Monitoring</button>
              <button onClick={downloadReport} className="btn-secondary py-3 text-[10px] border-slate-100 bg-slate-50/50">Export Strategic Report</button>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
                  <th className="pb-6">Village Node</th>
                  <th className="pb-6">Reg Population</th>
                  <th className="pb-6">Clinical Hub</th>
                  <th className="pb-6">Sync Bandwidth</th>
                  <th className="pb-6">Mal-Risk</th>
                  <th className="pb-6">Node Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {villageMatrix.map((v, i) => (
                  <tr key={i} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="py-6 font-black text-slate-900 uppercase tracking-tight">{v.name}</td>
                    <td className="py-6 text-slate-400 font-bold uppercase text-xs">{v.pop}</td>
                    <td className="py-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">{v.asha} Units</td>
                    <td className="py-6">
                       <span className={`inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${v.node.includes('Ultra') ? 'text-emerald-500' : 'text-slate-300'}`}>
                         <Globe className="w-4 h-4" /> {v.node}
                       </span>
                    </td>
                    <td className="py-6 text-slate-900 font-black text-xs">{v.mal}</td>
                    <td className="py-6">
                       <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border-2 ${
                         v.status === 'Optimal' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : v.status === 'Focus Required' ? 'bg-amber-50/50 text-amber-600 border-amber-100' : 'bg-rose-50/50 text-rose-600 border-rose-100'
                       }`}>
                         {v.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
