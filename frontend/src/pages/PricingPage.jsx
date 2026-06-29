import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Check, HelpCircle, ShieldAlert, Star, TrendingUp, Users, Database, Cloud, Shield, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const TIERS = [
  {
    title: 'District Starter',
    price: '₹18,800',
    period: '/month',
    usd: '~$199',
    desc: 'Perfect for smaller health networks or localized NGO pilots. AWS Aurora + DynamoDB included.',
    features: [
      'Up to 50 active villages',
      'Offline-first maternal vital logs',
      'Basic Sakhi RAG support',
      'Weekly CSV / CMO report exports',
      'Aurora PostgreSQL shared pool',
      'Local credential hashes',
    ],
    cta: 'Start Pilot',
    popular: false,
  },
  {
    title: 'District Command',
    price: '₹37,700',
    period: '/month',
    usd: '~$399',
    desc: 'Standard choice for active district health departments. Full AWS stack with autonomous AI.',
    features: [
      'Up to 250 active villages',
      'Autonomous Outbreak Agent (Groq Llama)',
      'Live SSE real-time dashboards',
      'Unified Aurora PostgreSQL backup',
      'Predictive Village Risk Intelligence',
      'Full 7-language support + Voice I/O',
      'Dedicated DynamoDB table throughput',
    ],
    cta: 'Deploy Command',
    popular: true,
    badge: 'Recommended',
  },
  {
    title: 'State Enterprise',
    price: 'Custom',
    period: '',
    usd: '',
    desc: 'Enterprise scale for state ministries & national healthcare integrations. Dedicated AWS infrastructure.',
    features: [
      'Unlimited villages & workers',
      'Dedicated Aurora PostgreSQL cluster',
      'Custom WHO/MoHFW protocol chunks',
      'ABDM National Health ID sync',
      'SLA-guaranteed response times',
      'Dedicated success coordinator',
      'On-prem deployment option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const COMPARISON = [
  { feature: 'Offline-First Vital Logging', starter: true, command: true, enterprise: true },
  { feature: 'Autonomous Outbreak Scanning', starter: false, command: true, enterprise: true },
  { feature: 'AWS Aurora PostgreSQL Pool', starter: 'Shared', command: 'Dedicated', enterprise: 'Dedicated Cluster' },
  { feature: 'Real-time SSE Dashboards', starter: 'Basic updates', command: 'Live streams', enterprise: 'Live streams' },
  { feature: 'Village Risk Early Warnings', starter: false, command: true, enterprise: true },
  { feature: 'DynamoDB Table Throughput', starter: 'Standard', command: 'Burst', enterprise: 'Provisioned' },
  { feature: 'PII Consent & 7yr Audit Trails', starter: 'Local only', command: 'Immutable Logs', enterprise: 'Immutable Logs' },
];

const FAQS = [
  {
    q: 'How does offline sync work for workers in deep rural areas?',
    a: 'ASHA workers register patients and log assessments entirely offline. The application computes growth indices locally in the browser and queues records in IndexedDB. Once an internet connection is established, the sync queue automatically replays and updates the centralized Aurora PostgreSQL database.',
  },
  {
    q: 'How does SwasthAI protect patient privacy?',
    a: 'We strictly align with India\'s DPDP Act 2023 and DISHA guidelines. All PII is encrypted at rest via AWS KMS. Vitals passed to external LLM services are redacted browser-side before transmission. Immutable audit trails are retained in DynamoDB for 7 years.',
  },
  {
    q: 'Can we integrate with state government portals?',
    a: 'Yes. The State Enterprise tier includes custom API integration nodes designed to safely sync metadata with national schemas (ABDM) or export data in standard formats used by regional Chief Medical Officers (CMO).',
  },
  {
    q: 'What AWS infrastructure is included?',
    a: 'Every deployment runs on AWS ap-south-1 (Mumbai). Aurora PostgreSQL handles all ACID-transactional health records. DynamoDB PAY_PER_REQUEST tables handle outbreak telemetry, emergency SOS streams, and 7-year immutable audit logs — all with auto-expiring TTLs.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};

export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 text-slate-900">
      <Navbar />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 pt-32 pb-24"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Sustainable Public-Private Pricing</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
            Powered by <span className="text-emerald-600">AWS</span> — Priced for{' '}
            <span className="text-emerald-600">Impact</span>
          </h1>
          <p className="mt-4 text-slate-500 text-sm max-w-2xl mx-auto font-medium">
            Every tier includes Amazon Aurora PostgreSQL + Amazon DynamoDB in ap-south-1. 
            Pay only for the scale you need. No hidden infrastructure costs.
          </p>
        </motion.div>

        {/* Tiers Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20"
        >
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.title}
              variants={item}
              whileHover={{ y: -6, scale: tier.popular ? 1.03 : 1.02 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className={`rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden ${
                tier.popular
                  ? 'bg-slate-900 text-white border-2 border-emerald-400 scale-105 shadow-2xl shadow-emerald-500/20'
                  : 'bg-white/80 backdrop-blur-xl border border-emerald-100/60 text-slate-900 shadow-lg shadow-emerald-500/5'
              }`}
            >
              {/* Glassmorphism shine */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                tier.popular ? 'bg-emerald-400/10' : 'bg-emerald-200/40'
              }`} />

              {tier.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 z-10">
                  {tier.badge}
                </div>
              )}

              <div className="relative z-10">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  tier.popular
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : 'text-emerald-600 bg-emerald-100/60 backdrop-blur-sm'
                }`}>
                  {tier.title}
                </span>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-4xl font-black tracking-tight ${tier.popular ? 'text-white' : 'text-slate-900'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`text-sm font-semibold ${tier.popular ? 'text-slate-400' : 'text-slate-400'}`}>
                      {tier.period}
                    </span>
                  )}
                  {tier.usd && (
                    <span className={`text-[10px] font-semibold ml-1 px-2 py-0.5 rounded-full ${
                      tier.popular ? 'text-slate-500 bg-slate-800' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {tier.usd}
                    </span>
                  )}
                </div>

                <p className={`text-xs mt-2 font-medium leading-relaxed ${
                  tier.popular ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {tier.desc}
                </p>

                <ul className={`mt-6 space-y-3 text-xs font-medium border-t pt-6 ${
                  tier.popular ? 'text-slate-300 border-slate-700' : 'text-slate-600 border-emerald-100/60'
                }`}>
                  {tier.features.map((f, fi) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + fi * 0.04 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-2"
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        tier.popular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => tier.price === 'Custom' ? window.location.href = 'mailto:enterprise@swasthai.in' : navigate('/login')}
                className={`mt-8 w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                  tier.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {tier.cta}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20 bg-white/70 backdrop-blur-xl border border-emerald-100/60 rounded-[2rem] overflow-hidden shadow-xl shadow-emerald-500/5"
        >
          <div className="p-6 border-b border-emerald-100/60 bg-emerald-50/50">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Plan Details & Feature Matrix
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-emerald-100/60 text-slate-400 uppercase tracking-wider font-bold bg-white/50">
                  <th className="p-4">Feature</th>
                  <th className="p-4">District Starter</th>
                  <th className="p-4 text-emerald-600">District Command</th>
                  <th className="p-4">State Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/40 text-slate-700 font-medium">
                {COMPARISON.map((row, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    viewport={{ once: true }}
                    className="hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900">{row.feature}</td>
                    <td className="p-4">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-slate-300">—</span>
                      ) : (
                        <span className="text-slate-600">{row.starter}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {typeof row.command === 'boolean' ? (
                        row.command ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-slate-300">—</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">{row.command}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-slate-300">—</span>
                      ) : (
                        <span className="text-slate-600">{row.enterprise}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Testimonial Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-[2rem] p-8 md:p-10 border border-emerald-800/20 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-emerald-400/5 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm sm:text-base md:text-lg italic leading-relaxed text-slate-200 font-medium">
              "SwasthAI alerted our district medical staff to an unusual cluster of fever and joint pain cases in a remote village 48 hours before our manual paper reports would have caught it. The early intervention saved lives and prevented a major malaria outbreak. The AWS infrastructure gave us the reliability we needed."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black rounded-xl flex items-center justify-center shadow-lg">
                CMO
              </div>
              <div>
                <p className="text-xs font-black text-white">Chief Medical Officer (CMO)</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">District Command deployment — AWS ap-south-1</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ x: 4 }}
                className="bg-white/70 backdrop-blur-sm border border-emerald-100/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{faq.q}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[2rem] p-8 md:p-10 text-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden"
        >
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
              Ready to deploy in your district?
            </h2>
            <p className="text-emerald-100 text-sm mb-8 font-medium max-w-lg mx-auto leading-relaxed">
              Schedule a confidential pilot demo. See live Aurora PostgreSQL + DynamoDB proof, 
              the autonomous outbreak agent, and B2B analytics tailored to your district's data.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="mailto:enterprise@swasthai.in"
                className="flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-700 rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-emerald-50 transition-all shadow-lg"
              >
                Book a Pilot Demo →
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="mailto:enterprise@swasthai.in"
                className="flex items-center gap-2 px-8 py-3.5 bg-white/10 border border-white/30 text-white rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                enterprise@swasthai.in
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
