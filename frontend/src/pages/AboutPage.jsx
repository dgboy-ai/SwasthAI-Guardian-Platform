import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Shield, BrainCircuit, WifiOff, Database,
  Users, MapPin, Activity, CheckCircle, ArrowRight, Globe
} from 'lucide-react';

const IMPACT_STATS = [
  { val: '600M+', label: 'Rural Indians addressable', color: 'text-emerald-600' },
  { val: '1.4M',  label: 'ASHA workers supported',  color: 'text-violet-600'  },
  { val: '101',   label: 'Disease classes modelled', color: 'text-rose-600'    },
  { val: '7',     label: 'Indian languages (+ Hinglish)', color: 'text-amber-600' },
];

const PILLARS = [
  {
    icon: Database,
    title: 'Dual-Database Strategy',
    desc: 'Amazon Aurora PostgreSQL handles ACID-compliant medical records; Amazon DynamoDB handles high-velocity telemetry. Each database chosen for what it does best — not just what was easiest.',
    badge: 'AWS Architecture',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    icon: BrainCircuit,
    title: 'Owned AI Intelligence',
    desc: 'SymptomNet (3-layer MLP on multilingual Transformer embeddings) + a calibrated RAG engine with 243 WHO/MoHFW clinical chunks. We own our inference stack — no third-party prompt wrappers.',
    badge: 'AI / ML',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
  },
  {
    icon: WifiOff,
    title: 'Offline-First by Design',
    desc: 'ASHA workers in zero-signal villages can still log maternal vitals, assess malnutrition, and trigger ambulance SOS. An IndexedDB sync queue replays data automatically on reconnect with LWW conflict resolution.',
    badge: 'PWA',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    icon: Activity,
    title: 'Autonomous Outbreak Agent',
    desc: 'A background daemon queries village symptom clusters every 30 minutes, reasons with Groq Llama-3.3-70b, deduplicates via DynamoDB, and broadcasts real-time SSE alerts to district admins before a cluster becomes an epidemic.',
    badge: 'Agentic AI',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  {
    icon: Shield,
    title: 'Regulatory Compliance',
    desc: 'Built under DISHA 2023, DPDP Act 2023, IT Act 2008, and HIPAA-aligned security practices. Active consent modals, PII redaction in backend logs, 7-year immutable audit trails in DynamoDB, and Helmet security headers.',
    badge: 'Compliance',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
  },
  {
    icon: Globe,
    title: 'B2B SaaS Monetisation',
    desc: 'Tenant-scoped sk_live_* API keys let NGOs and district departments pull village health data in their jurisdiction. Usage is tracked per key for Stripe-ready billing. 3-tier pricing: NGO Starter → District Command (₹15K/mo) → State Enterprise.',
    badge: 'Revenue Model',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
];

const TECH_STACK = [
  { cat: 'Frontend',    tech: 'React 18 + Vite PWA · Vercel Edge · React.lazy() code splitting' },
  { cat: 'Relational DB', tech: 'Amazon Aurora PostgreSQL · ap-south-1 · pg.Pool:20 · ACID' },
  { cat: 'NoSQL DB',    tech: 'Amazon DynamoDB · PAY_PER_REQUEST · 5 tables · 8 GSIs' },
  { cat: 'AI/ML',       tech: 'FastAPI + SymptomNet MLP + Groq Llama-3.3-70b + ONNX offline' },
  { cat: 'Backend',     tech: 'Node.js + Express · Render · SSE · WebSocket telemetry' },
  { cat: 'Security',    tech: 'JWT + Bcrypt + DISHA consent · PII redaction · Helmet headers' },
];

const TEAM = [
  { name: 'Divyansh Gupta', role: 'AI/ML · Backend Architecture · Cloud Deployment', initials: 'DG' },
  { name: 'Tejshvee Yerpurwad', role: 'Frontend · UX Design · Localisation · RAG Engine', initials: 'TY' },
  { name: 'Rishabh Agnihotri', role: 'Product Strategy · Official Presenter', initials: 'RA' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">About SwasthAI Guardian</p>
        <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
          Built for Bharat's<br />
          <span className="text-emerald-600">600 million villages.</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mb-4">
          SwasthAI Guardian is a production-grade, AI-powered B2B district health operations platform for rural India.
          We bridge the gap between village-level ASHA workers, district health officials, and state-level policymakers
          using a real-time, offline-first, multi-modal AI stack deployed on AWS and Vercel.
        </p>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl font-medium border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-3 rounded-r-xl">
          <strong>We didn't build AI for doctors. We built it for the 600,000 villages that don't have one.</strong>
        </p>
      </section>

      {/* Impact Stats */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-6 text-center">Platform Scale</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {IMPACT_STATS.map(({ val, label, color }) => (
              <div key={label} className="text-center">
                <p className={`text-4xl font-black ${color} mb-1`}>{val}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">The Problem</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-6">Why rural India needs this now</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { stat: '70%', desc: 'of India\'s healthcare infrastructure is in urban areas — yet 65% of the population is rural.' },
            { stat: '1 doctor', desc: 'per 11,000 rural residents on average. The WHO recommends 1 per 1,000.' },
            { stat: '48 hours', desc: 'average delay between an outbreak\'s first case and a district CMO\'s awareness. SwasthAI cuts this to under 30 minutes.' },
          ].map(({ stat, desc }) => (
            <div key={stat} className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <p className="text-3xl font-black text-rose-600 mb-3">{stat}</p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6 Pillars */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Architecture</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-10">Six pillars that make it different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map(({ icon: Icon, title, desc, badge, color }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${color}`}>{badge}</span>
                </div>
                <h3 className="font-black text-slate-900 text-sm mb-2 tracking-tight">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Technology Stack</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-8">Built on AWS and Vercel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TECH_STACK.map(({ cat, tech }) => (
            <div key={cat} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 transition-colors">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2">{cat}</p>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">{tech}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Strip */}
      <section className="bg-emerald-950 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-5 text-center">Regulatory Compliance</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['DISHA 2023', 'DPDP Act 2023', 'IT Act 2008', 'HIPAA Aligned', 'WHO Guidelines', 'MoHFW Protocols', 'WCAG 2.5.5', 'NVBDCP / NTEP', 'FOGSI 2023'].map(badge => (
              <span key={badge} className="px-3 py-1.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-full text-[10px] font-bold tracking-wide">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">The Team</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-8">Built by builders who care</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TEAM.map(({ name, role, initials }) => (
            <div key={name} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-3">Ready to see it live?</h2>
          <p className="text-emerald-100 text-sm mb-8 font-medium">
            Log in as Admin to see the live Aurora + DynamoDB proof panel, autonomous outbreak agent, and B2B usage dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/demo"
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-700 rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-emerald-50 transition-colors shadow-lg"
            >
              View Live Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:enterprise@swasthai.in"
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700/40 border border-white/30 text-white rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-emerald-700/60 transition-colors"
            >
              Book a Pilot
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
