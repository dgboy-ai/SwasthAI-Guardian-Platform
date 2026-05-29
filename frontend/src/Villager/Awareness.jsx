import { Shield, BookOpen, Heart, Activity, CheckCircle, PlusCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Awareness() {
  const tips = [
    { t: 'Maternal Nutrition', d: 'Iron & Folic Acid importance during 3rd trimester.', icon: Heart, col: 'rose' },
    { t: 'Clean Water Axis', d: 'Prevent Cholera with boiled water nodes.', icon: Activity, col: 'emerald' },
    { t: 'Vaccination Sync', d: 'Polio & Smallpox schedule for children < 5y.', icon: Shield, col: 'indigo' },
  ];

  return (
    <div className="p-10 lg:p-14 animate-in fade-in slide-in-from-right-10 duration-1000">
       <header className="mb-14">
          <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
             <BookOpen className="w-5 h-5" />
             <span>Health Wisdom Hub</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Village Knowledge Core</h1>
          <p className="text-slate-500 mt-2 text-xl font-medium">Sovereign insights for health and longevity in Rampur.</p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {tips.map(tip => (
             <div key={tip.t} className="premium-card p-6 md:p-10 group hover:bg-slate-900 transition-all duration-700 cursor-pointer overflow-hidden relative">
                <div className="absolute right-[-20px] top-[-20px] bg-slate-100 opacity-50 w-40 h-40 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                <tip.icon className={`w-12 h-12 mb-8 text-${tip.col}-600 group-hover:text-${tip.col}-400 transition-colors`} />
                <h3 className="text-2xl font-black mb-3 group-hover:text-white transition-colors">{tip.t}</h3>
                <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">{tip.d}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-white group-hover:underline">
                   Read Full Node <ArrowRight className="w-4 h-4" />
                </div>
             </div>
          ))}

          <div className="premium-card p-6 md:p-10 bg-indigo-600 text-white border-0 shadow-2xl relative overflow-hidden flex flex-col justify-center">
             <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <Activity className="w-10 h-10 mb-6 text-indigo-200" />
             <h3 className="text-4xl font-black mb-4">Live Session: ASHA Visit</h3>
             <p className="text-indigo-100 mb-8 font-medium">Next visit to Rampur Sector 4: 12th August (Polio specialized).</p>
             <button className="py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">Add Reminder</button>
          </div>
       </div>

       {/* Emergency Awareness */}
       <div className="mt-16 premium-card p-6 md:p-12 bg-rose-50 border-rose-200 flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <div className="p-8 bg-white text-rose-600 rounded-[40px] shadow-2xl shadow-rose-100">
             <AlertTriangle className="w-16 h-16" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-rose-900 tracking-tighter">Emergency Signaling Core</h2>
            <p className="text-rose-700/70 text-lg font-medium leading-relaxed mt-2 max-w-2xl">If pulse is weak or breathing is shallow, do not wait for node sync. Use the **Emergency Rescue** tactical button immediately.</p>
          </div>
       </div>
    </div>
  );
}
