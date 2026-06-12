import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import {
  Shield, Activity, Heart, Baby, Truck, Radio, BrainCircuit,
  Users, MapPin, WifiOff, Zap, ArrowRight, CheckCircle, Globe,
  Database, Stethoscope, Landmark
} from 'lucide-react';
import api from '../services/api';
import { VERSION } from '../constants/version';

const ROLES = [
  {
    role: 'Villager',
    roleKey: 'villager',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    path: '/login',
    credentials: { identifier: '9876543210', password: 'Demo@1234' },
    features: [
      'AI Symptom Diagnosis (101 diseases, 6 languages + Hinglish)',
      'Skin Disease Detection via camera',
      'Ambulance SOS dispatch',
      'Menstrual health & cycle tracker',
      'Government schemes eligibility engine',
      'Voice-first guided health mode',
    ],
  },
  {
    role: 'ASHA Worker',
    roleKey: 'ngo',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    path: '/login',
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
    role: 'Admin',
    roleKey: 'admin',
    icon: Shield,
    color: 'from-slate-700 to-slate-900',
    border: 'border-slate-500/20',
    bg: 'bg-slate-500/10',
    iconColor: 'text-slate-400',
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
  const navigate = useNavigate();
  const { loginPassword } = useAuth();
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(null);
  const [demoLoading, setDemoLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('villager');

  useEffect(() => {
    api.get('/admin/analytics').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleOneClickLogin = async (id, password, role) => {
    setDemoLoading(role);
    try {
      await loginPassword(id, password, role);
      navigate(`/${role}`);
    } catch (err) {
      showToast(err.message || 'Demo login failed.', 'error');
    } finally {
      setDemoLoading(null);
    }
  };

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
            <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">Platform Live Demo</span>
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
        <p className="text-slate-500 text-sm text-center mb-10 font-medium">Select a role below then click "Try This →" to jump straight into the live dashboard</p>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-slate-900/90 border border-slate-800 rounded-full shadow-2xl">
            {ROLES.map(({ role, roleKey, icon: Icon }) => {
              const isActive = activeTab === roleKey;
              return (
                <button
                  key={roleKey}
                  onClick={() => setActiveTab(roleKey)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Content */}
        {(() => {
          const currentRole = ROLES.find(r => r.roleKey === activeTab);
          const Icon = currentRole.icon;
          return (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 mb-16 backdrop-blur shadow-2xl transition-all duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Info Panel */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                      {currentRole.role} Role Overview
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                      <span className={`p-2.5 rounded-2xl bg-gradient-to-br ${currentRole.color} text-white`}>
                        <Icon className="w-7 h-7" />
                      </span>
                      Explore the {currentRole.role} Experience
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Interact with the platform from the perspective of a {currentRole.role.toLowerCase()}. 
                      Test the primary features, workflows, and tools built specifically for this workflow.
                    </p>
                    
                    <div className="space-y-3">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Key Capabilities Available:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentRole.features.map(f => (
                          <div key={f} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation / Action Card */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                  
                  <div>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Guided Auto-Login</h4>
                        <p className="text-[10px] text-slate-500">Self-guided verification bypass</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold uppercase tracking-wider">
                        No Credentials Required
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Username/Phone</span>
                            <span className="text-xs font-mono font-bold text-slate-300">{currentRole.credentials.identifier}</span>
                          </div>
                          <button
                            onClick={() => copy(currentRole.credentials.identifier, `${currentRole.role}-user`)}
                            className="text-[9px] px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg font-bold transition-colors"
                          >
                            {copied === `${currentRole.role}-user` ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Password</span>
                            <span className="text-xs font-mono font-bold text-slate-300">{currentRole.credentials.password}</span>
                          </div>
                          <button
                            onClick={() => copy(currentRole.credentials.password, `${currentRole.role}-pass`)}
                            className="text-[9px] px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg font-bold transition-colors"
                          >
                            {copied === `${currentRole.role}-pass` ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      disabled={demoLoading !== null}
                      onClick={() => handleOneClickLogin(currentRole.credentials.identifier, currentRole.credentials.password, currentRole.roleKey)}
                      className={`relative flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r ${currentRole.color} text-white rounded-xl font-black text-sm uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-emerald-950/40 border border-white/10`}
                    >
                      {demoLoading === currentRole.roleKey ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Configuring Session...</span>
                        </>
                      ) : (
                        <>
                          <span>Try This →</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center font-medium">
                      One-click authentication will load user data and navigate directly to the {currentRole.role} Command Center.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
              <p className="text-emerald-400/70 text-[11px] font-medium">World-class operations architecture — designed for production-level scale</p>
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

        {/* B2B SaaS Monetization Tiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-10 text-white">
          <h2 className="text-xl font-black text-center mb-2">B2B SaaS Pricing & Monetization Model</h2>
          <p className="text-slate-400 text-xs text-center mb-8 font-medium">Sustainable public-private partnership models built to scale with rural public health networks.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'NGO Starter',
                price: 'Free',
                period: 'forever',
                color: 'border-slate-850 bg-slate-950/40',
                features: ['Up to 1 active district', 'Up to 50 active villages', 'Community-supported setups', 'IndexedDB offline-first queues']
              },
              {
                title: 'District Command',
                price: '₹15,000',
                period: '/month',
                color: 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-950/50',
                badge: 'Recommended',
                features: ['Unlimited villages in district', 'Autonomous Outbreak AI Loop', 'Live SSE Admin feed active', 'Custom threshold configurations', 'District CSV summaries & CMO reports']
              },
              {
                title: 'State Enterprise',
                price: 'Custom',
                period: 'pricing',
                color: 'border-slate-850 bg-slate-950/40',
                features: ['Multi-district scaling', 'AWS Aurora cluster dedicated pools', 'Aadhaar e-KYC verified nodes', 'Custom SLA & 24/7 dedicated support', 'State ministry direct API access']
              }
            ].map(tier => (
              <div key={tier.title} className={`border rounded-2xl p-6 flex flex-col justify-between relative ${tier.color}`}>
                {tier.badge && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full">{tier.badge}</span>
                )}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{tier.title}</h4>
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-black">{tier.price}</span>
                    <span className="text-slate-500 text-[10px] ml-1 font-bold">{tier.period}</span>
                  </div>
                  <ul className="space-y-2.5 border-t border-slate-800/80 pt-4">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-snug">
                        <span className="text-emerald-500 font-black">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-slate-500 text-[11px] font-medium mb-4">
            SwasthAI Guardian Operations Platform {VERSION}
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
