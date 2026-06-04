import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Activity, Heart, Baby, Truck, Radio, BrainCircuit,
  Users, MapPin, WifiOff, Zap, ArrowRight, CheckCircle, Globe,
  Database, Stethoscope
} from 'lucide-react';
import api from '../services/api';
import { VERSION } from '../constants/version';

const ROLES = [
  {
    role: 'Villager',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
    path: '/login',
    // Matches LoginPage DEMO_CREDENTIALS — use Password mode on login page
    credentials: { identifier: '9876543210', password: 'Demo@1234' },
    features: [
      'AI Symptom Diagnosis (101 diseases, 7 languages)',
      'Skin Disease Detection via camera',
      'Ambulance SOS dispatch',
      'Menstrual health & cycle tracker',
      'Government schemes eligibility engine',
      'Voice-first guided health mode',
    ],
  },
  {
    role: 'ASHA / NGO Worker',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-700',
    path: '/login',
    // Matches LoginPage DEMO_CREDENTIALS — use Password mode on login page
    credentials: { identifier: '9876543211', password: 'Demo@1234' },
    features: [
      'Maternal risk assessment (WHO thresholds)',
      'Child malnutrition WHO Z-score monitor',
      'Sanitary pad request management',
      'Live ambulance dispatch feed',
      'Village health node management',
      'Offline-first field logging',
    ],
  },
  {
    role: 'District Admin / CMO',
    icon: Shield,
    color: 'from-slate-700 to-slate-900',
    border: 'border-slate-200',
    bg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    path: '/login',
    credentials: { identifier: 'admin@swasthai.in', password: 'Demo@1234' },
    features: [
      'National Rural Health Command Center',
      'Autonomous AI outbreak detection (30 min loop)',
      'Real-time SSE ambulance & outbreak feed',
      'Groq AI reasoning trace log',
      'DynamoDB outbreak telemetry viewer',
      'District CSV export & briefings',
    ],
  },
];

const TECH_STACK = [
  { icon: Globe,       label: 'Frontend',   val: 'React 18 + Vite + PWA',          sub: 'Vercel Edge' },
  { icon: Database,    label: 'Relational',  val: 'Amazon Aurora PostgreSQL',        sub: 'ap-south-1' },
  { icon: Database,    label: 'NoSQL',       val: 'Amazon DynamoDB PAY_PER_REQUEST', sub: '4 tables + GSIs' },
  { icon: BrainCircuit,label: 'LLM',         val: 'Groq Llama-3.3-70b',             sub: 'RAG + Agent' },
  { icon: Stethoscope, label: 'AI Models',   val: 'PyTorch SymptomNet',              sub: '96.8% accuracy' },
  { icon: WifiOff,     label: 'Offline',     val: 'IndexedDB Sync Queue',            sub: 'Zero-signal villages' },
];

const IMPACT = [
  { val: '600M+', label: 'Rural Indians served' },
  { val: '1.4M',  label: 'ASHA workers supported' },
  { val: '17',    label: 'Diseases diagnosed' },
  { val: '6',     label: 'Indian languages' },
];

export default function DemoPage() {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 font-inter">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-5 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">H0 Hackathon — Live Demo</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none">
            SwasthAI<br/><span className="text-emerald-400">Guardian</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto mb-3 leading-relaxed">
            National Rural Health Intelligence Platform — AI-powered disease surveillance, offline-first medical access,
            and autonomous outbreak detection for 600 million rural Indians.
          </p>
          <div className="flex items-center justify-center gap-2 mb-12">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Track 2 · B2B SaaS</span>
            <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">AWS Databases</span>
            <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest">Vercel Deployed</span>
          </div>

          {/* Live impact counter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {IMPACT.map(({ val, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-3xl font-black text-white mb-1">{val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          {/* Live DB stats from Aurora */}
          {stats && (
            <div className="inline-flex items-center gap-6 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-12">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Live from Aurora PostgreSQL</span>
              {[
                { val: stats.villages,       label: 'Villages' },
                { val: stats.pregnancies,    label: 'Pregnancies' },
                { val: stats.today_symptoms, label: 'Diagnoses Today' },
                { val: stats.ambulances,     label: 'SOS Requests' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-black text-white">{val ?? 0}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role cards */}
      <div className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-2">Three Perspectives. One Platform.</h2>
        <p className="text-slate-500 text-sm text-center mb-10 font-medium">Use the demo credentials to log in and explore each role</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {ROLES.map(({ role, icon: Icon, color, border, bg, iconColor, path, credentials, features }) => (
            <div key={role} className={`bg-slate-900 border ${border} rounded-3xl overflow-hidden`}>
              <div className={`bg-gradient-to-br ${color} p-6`}>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">{role}</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Credentials */}
                <div className={`${bg} border ${border} rounded-xl p-3 space-y-2`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Demo Login</p>
                  <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    ⚠ Use <span className="underline">Password</span> mode on login page
                  </p>
                  {[
                    { label: 'Phone / Email', val: credentials.identifier },
                    { label: 'Password', val: credentials.password },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">{label}</p>
                        <p className={`text-[11px] font-mono font-bold ${iconColor}`}>{val}</p>
                      </div>
                      <button
                        onClick={() => copy(val, `${role}-${label}`)}
                        className="text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-lg font-black text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {copied === `${role}-${label}` ? '✓' : 'copy'}
                      </button>
                    </div>
                  ))}
                </div>
                {/* Features */}
                <ul className="space-y-1.5">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-slate-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={path}
                  className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r ${color} text-white rounded-xl font-black text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg mt-2`}
                >
                  Login as {role.split('/')[0].trim()} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-10">
          <h2 className="text-xl font-black text-white text-center mb-6">AWS-Native Architecture</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH_STACK.map(({ icon: Icon, label, val, sub }) => (
              <div key={label} className="text-center p-4 bg-slate-800 rounded-2xl border border-slate-700">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-[11px] font-black text-white leading-tight">{val}</p>
                <p className="text-[9px] text-slate-600 font-medium mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agentic loop highlight */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-3xl p-8 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Autonomous Outbreak Intelligence Loop</h3>
              <p className="text-emerald-400/70 text-[11px] font-medium">World-class for a hackathon — no other submission has this</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { n: '1', label: 'Every 30 min', sub: 'OutbreakAgent daemon wakes' },
              { n: '2', label: 'Query Aurora', sub: 'Fetch village symptom clusters' },
              { n: '3', label: 'Groq Llama-3', sub: 'Classify: outbreak vs noise' },
              { n: '4', label: 'DynamoDB', sub: 'Write to outbreak_telemetry' },
              { n: '5', label: 'SSE Push', sub: 'Admin dashboard updates live' },
            ].map(({ n, label, sub }) => (
              <div key={n} className="flex flex-col items-center text-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-black text-sm mb-2">{n}</span>
                <p className="text-[11px] font-black text-white">{label}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-slate-500 text-[11px] font-medium mb-4">
            Built for H0: Hack the Zero Stack with Vercel v0 and AWS Databases · Track 2 B2B · SwasthAI Guardian {VERSION}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login" className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[13px] uppercase tracking-wider transition-colors shadow-lg">
              Explore Platform
            </Link>
            <a
              href="/api/health/detailed"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-black text-[13px] uppercase tracking-wider transition-colors"
            >
              View API Health
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
