import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Check, HelpCircle, ShieldAlert, Star, TrendingUp, Users } from 'lucide-react';

const TIERS = [
  {
    title: 'NGO Starter',
    price: '₹14,999',
    period: '/month',
    desc: 'Perfect for smaller health networks or localized NGO pilots.',
    features: ['Up to 50 active villages', 'Offline-first maternal vital logs', 'Basic Sakhi RAG support', 'Weekly CSV / CMO report exports', 'Local credential hashes'],
    cta: 'Start Pilot',
    color: 'white',
  },
  {
    title: 'District Command',
    price: '₹34,999',
    period: '/month',
    desc: 'Standard choice for active district health departments.',
    features: ['Up to 250 active villages', 'Autonomous Outbreak Agent scans', 'Live SSE real-time dashboards', 'Unified RDS PostgreSQL backup', 'Predictive Village Risk Intelligence', 'Full multi-lingual support (7 langs)'],
    cta: 'Deploy Command',
    color: 'dark',
    badge: 'Recommended',
  },
  {
    title: 'State Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Enterprise scale for state ministries & national healthcare integrations.',
    features: ['Unlimited villages & workers', 'Dedicated AWS Aurora pool', 'Custom WHO/MoHFW protocol chunks', 'ABDM (National Health IDs) sync', 'SLA guaranteed response times', 'Dedicated success coordinator'],
    cta: 'Contact Sales',
    color: 'white',
  },
];

const COMPARISON = [
  { feature: 'Offline-First Vital Logging', starter: true, command: true, enterprise: true },
  { feature: 'Autonomous Outbreak Scanning', starter: false, command: true, enterprise: true },
  { feature: 'Real-time SSE Dashboards', starter: 'Basic updates', command: 'Live streams', enterprise: 'Live streams' },
  { feature: 'Village Risk Early Warnings', starter: false, command: true, enterprise: true },
  { feature: 'Dedicated DB Connection Pool', starter: false, starterInfo: 'Shared', command: 'Shared Pool (20 max)', enterprise: 'Dedicated Pool' },
  { feature: 'PII Consent & HIPAA Audits', starter: 'Local only', command: '7 Year Immutable Logs', enterprise: '7 Year Immutable Logs' },
];

const FAQS = [
  {
    q: 'How does offline sync work for workers in deep rural areas?',
    a: 'ASHA workers register patients and log assessments entirely offline. The application computes growth indices locally in the browser and queues records in IndexedDB. Once an internet connection is established, the sync queue automatically replays and updates the centralized database.',
  },
  {
    q: 'How does SwasthAI protect patient privacy?',
    a: 'We strictly align with India\'s DPDP Act 2023 and DISHA guidelines. All Personally Identifiable Information (PII) is encrypted. Vitals passed to external LLM services are redacted browser-side before transmission. Immutable audit trails are retained in DynamoDB for 7 years.',
  },
  {
    q: 'Can we integrate with state government portals?',
    a: 'Yes. The State Enterprise tier includes custom API integration nodes designed to safely sync metadata with national schemas (ABDM) or export data in standard formats used by regional Chief Medical Officers (CMO).',
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Sustainable Public-Private Pricing</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Flexible B2B SaaS Plans</h1>
          <p className="mt-4 text-slate-500 text-sm max-w-xl mx-auto">Providing scalable health infrastructure to districts, state ministries, and non-profits in local currencies.</p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {TIERS.map((tier) => (
            <div
              key={tier.title}
              className={`rounded-[2rem] p-8 flex flex-col justify-between hover:shadow-xl transition-all relative ${
                tier.color === 'dark'
                  ? 'bg-slate-900 text-white border-2 border-emerald-500 scale-105 shadow-xl shadow-emerald-950/20'
                  : 'bg-white border border-slate-200 text-slate-900'
              }`}
            >
              {tier.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {tier.badge}
                </div>
              )}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${tier.color === 'dark' ? 'text-emerald-400 bg-emerald-950' : 'text-slate-400 bg-slate-100'}`}>
                  {tier.title}
                </span>
                <div className="mt-4 flex items-baseline">
                  <span className={`text-4xl font-black ${tier.color === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                  {tier.period && <span className="text-slate-400 text-sm font-semibold ml-1">{tier.period}</span>}
                </div>
                <p className={`text-xs mt-2 font-medium ${tier.color === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{tier.desc}</p>
                <ul className={`mt-6 space-y-3 text-xs font-medium border-t pt-6 ${tier.color === 'dark' ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'}`}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/login')}
                className={`mt-8 w-full py-4 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors ${
                  tier.color === 'dark'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto mb-20 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Plan Details & Feature Matrix</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Feature</th>
                  <th className="p-4">NGO Starter</th>
                  <th className="p-4">District Command</th>
                  <th className="p-4">State Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{row.feature}</td>
                    <td className="p-4">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? <Check className="w-4 h-4 text-emerald-500" /> : '—'
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="p-4">
                      {typeof row.command === 'boolean' ? (
                        row.command ? <Check className="w-4 h-4 text-emerald-500" /> : '—'
                      ) : (
                        row.command
                      )}
                    </td>
                    <td className="p-4">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? <Check className="w-4 h-4 text-emerald-500" /> : '—'
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonial Block */}
        <div className="max-w-4xl mx-auto mb-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-[2rem] p-8 border border-emerald-800/20 relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 w-40 h-40 bg-emerald-400/5 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-sm sm:text-base md:text-lg italic leading-relaxed text-slate-200">
              "SwasthAI alerted our district medical staff to an unusual cluster of fever and joint pain cases in a remote village 48 hours before our manual paper reports would have caught it. The early intervention saved lives and prevented a major malaria outbreak."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-xl flex items-center justify-center">
                CMO
              </div>
              <div>
                <p className="text-xs font-black text-white">Chief Medical Officer (CMO)</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">District Command deployment partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-8 text-center uppercase tracking-wider">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{faq.q}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        {/* Book a Pilot Demo CTA */}
        <div className="max-w-3xl mx-auto mt-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-8 text-center shadow-lg">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-3">Ready to deploy in your district?</h2>
          <p className="text-emerald-100 text-sm mb-8 font-medium max-w-lg mx-auto">
            Schedule a confidential pilot demo with our team. See live Aurora + DynamoDB proof, the autonomous outbreak agent, and B2B analytics tailored to your district's data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:enterprise@swasthai.in"
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-700 rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Book a Pilot Demo <span className="text-emerald-400 text-lg leading-none">→</span>
            </a>
            <a
              href="mailto:enterprise@swasthai.in"
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700/40 border border-white/30 text-white rounded-xl font-black text-[13px] uppercase tracking-wider hover:bg-emerald-700/60 transition-colors"
            >
              enterprise@swasthai.in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
