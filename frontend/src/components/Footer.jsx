import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, ShieldCheck, PhoneCall, Mail, MapPin,
  Activity, Award, Home, Scan, Truck, Droplets, User, Mic
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-[#020617] text-white overflow-hidden pt-16 pb-8 px-6 border-t border-white/5">
      {/* Background decoration */}
      <div className="absolute top-0 left-[-10%] w-[300px] h-[300px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 lg:gap-12 border-b border-white/5 pb-12">

          {/* BRAND COLUMN */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center rounded-xl shadow-xl">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black tracking-tighter uppercase">
                  SwasthAI <span className="text-emerald-500 font-medium">Guardian</span>
                </span>
                <span className="text-[9px] font-black text-emerald-500/60 mt-0.5 uppercase tracking-widest">
                  Empowering Rural Bharat
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm">
              Bridging the healthcare gap in rural India. SwasthAI provides instant AI diagnostics, emergency ambulance dispatch, and maternal health tracking - offline-first.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Award className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300">Healthcare for All</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300">AI-Powered</span>
              </div>
            </div>
          </div>

          {/* VILLAGER QUICK LINKS */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">
              Villager Services
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Home Dashboard', path: '/villager', icon: Home },
                { name: 'Symptom Checker', path: '/symptoms', icon: Activity },
                { name: 'Skin Scan AI', path: '/skin-disease', icon: Scan },
                { name: 'Ambulance Request', path: '/ambulance', icon: Truck },
                { name: 'Menstrual Health', path: '/menstrual-health', icon: Droplets },
                { name: 'My Profile', path: '/profile', icon: User },
              ].map(item => (
                <li key={item.name} className="group">
                  <Link to={item.path} className="text-slate-400 font-bold hover:text-white transition-colors text-sm flex items-center gap-3 cursor-pointer">
                    <item.icon className="w-3.5 h-3.5 text-emerald-700 group-hover:text-emerald-400 transition-colors shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Connect</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4 text-slate-400 group">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 transition-all group-hover:border-emerald-500/50">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Regional Hub</p>
                  <p className="text-sm font-bold">Gwalior, M.P., India</p>
                </div>
              </li>
              <li className="flex items-start gap-4 text-slate-400 group">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 transition-all group-hover:border-emerald-500/50">
                  <Mail className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Support Line</p>
                  <p className="text-sm font-bold italic">Trueboy1123@gmail.com</p>
                </div>
              </li>
            </ul>
          </div>

          {/* EMERGENCY HELPLINES */}
          <div className="space-y-6">
            <h3 className="text-lg font-black tracking-tighter uppercase leading-none text-rose-500">
              Emergency Helplines
            </h3>
            <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-4 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 rounded-xl shadow-md border border-rose-500 animate-pulse">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">National Medical Helpline</p>
                  <p className="text-2xl font-black italic text-white leading-none">104 / 108</p>
                  <p className="text-[9px] font-bold text-rose-400/80 mt-1 uppercase">Free · 24x7 · Rural Support</p>
                </div>
              </div>
              <Link
                to="/ambulance"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Truck className="w-3.5 h-3.5" /> Request Ambulance
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> Secured by SwasthAI Protocols
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest text-center">
            © 2026 SwasthAI Guardian · AI-Powered Rural Healthcare
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Privacy</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Ethics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
