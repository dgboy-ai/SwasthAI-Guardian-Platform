import { motion } from 'framer-motion';
import { Shield, BookOpen, Heart, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

const COLORS = {
  rose: { text: 'text-rose-600', groupText: 'group-hover:text-rose-400' },
  emerald: { text: 'text-emerald-600', groupText: 'group-hover:text-emerald-400' },
  indigo: { text: 'text-indigo-600', groupText: 'group-hover:text-indigo-400' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Awareness() {
  const tips = [
    { t: 'Maternal Nutrition', d: 'Iron & Folic Acid importance during 3rd trimester.', icon: Heart, col: 'rose' },
    { t: 'Clean Water Axis', d: 'Prevent Cholera with boiled water nodes.', icon: Activity, col: 'emerald' },
    { t: 'Vaccination Sync', d: 'Polio & Smallpox schedule for children < 5y.', icon: Shield, col: 'indigo' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-10 lg:p-14"
    >
       <header className="mb-14">
          <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
             <BookOpen className="w-5 h-5" />
             <span>Health Wisdom Hub</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Village Knowledge Core</h1>
          <p className="text-slate-500 mt-2 text-xl font-medium">Sovereign insights for health and longevity in Rampur.</p>
       </header>

       <motion.div
         variants={container}
         initial="hidden"
         animate="show"
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
       >
          {tips.map(tip => {
            const c = COLORS[tip.col] || COLORS.indigo;
            return (
             <motion.div
               key={tip.t}
               variants={item}
               whileHover={{ y: -4 }}
               className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 group hover:bg-slate-900 transition-all duration-500 cursor-pointer overflow-hidden relative shadow-sm hover:shadow-xl"
             >
                <div className="absolute right-[-20px] top-[-20px] bg-slate-100 opacity-50 w-40 h-40 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                <tip.icon className={`w-12 h-12 mb-8 ${c.text} ${c.groupText} transition-colors`} />
                <h3 className="text-2xl font-black mb-3 group-hover:text-white transition-colors">{tip.t}</h3>
                <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">{tip.d}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-white group-hover:underline">
                   Read Full Node <ArrowRight className="w-4 h-4" />
                </div>
             </motion.div>
            );
          })}

          <motion.div
            variants={item}
            className="bg-indigo-600 text-white rounded-3xl p-6 md:p-10 border-0 shadow-2xl relative overflow-hidden flex flex-col justify-center"
          >
             <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <Activity className="w-10 h-10 mb-6 text-indigo-200" />
             <h3 className="text-4xl font-black mb-4">Live Session: ASHA Visit</h3>
             <p className="text-indigo-100 mb-8 font-medium">Next visit to Rampur Sector 4: 12th August (Polio specialized).</p>
             <button className="py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">Add Reminder</button>
          </motion.div>
       </motion.div>

       {/* Emergency Awareness */}
       <motion.div
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.3, duration: 0.4 }}
         className="mt-16 bg-white border border-rose-200 rounded-3xl p-6 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-12 shadow-sm"
       >
          <div className="p-8 bg-rose-50 text-rose-600 rounded-[40px] shadow-2xl shadow-rose-100">
             <AlertTriangle className="w-16 h-16" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-rose-900 tracking-tighter">Emergency Signaling Core</h2>
            <p className="text-rose-700/70 text-lg font-medium leading-relaxed mt-2 max-w-2xl">If pulse is weak or breathing is shallow, do not wait for node sync. Use the Emergency Rescue tactical button immediately.</p>
          </div>
       </motion.div>
    </motion.div>
  );
}
