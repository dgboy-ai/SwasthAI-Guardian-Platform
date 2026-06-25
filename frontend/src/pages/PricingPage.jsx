import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const TIERS = [
  {
    title: 'District Starter',
    price: '$199',
    period: '/month',
    desc: 'Perfect for smaller health networks or localized NGO pilots.',
    features: ['Up to 50 active villages', 'Offline-first maternal vital logs', 'Basic Sakhi RAG support', 'Weekly CSV / CMO report exports'],
    cta: 'Start Pilot',
    color: 'white',
  },
  {
    title: 'District Command',
    price: '$399',
    period: '/month',
    desc: 'Standard choice for active district health departments.',
    features: ['Up to 250 active villages', 'Autonomous Outbreak Agent scans', 'Live SSE real-time dashboards', 'Unified RDS PostgreSQL backup'],
    cta: 'Deploy Command',
    color: 'dark',
    badge: 'Recommended',
  },
  {
    title: 'State Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Enterprise scale for state ministries & national healthcare integrations.',
    features: ['Unlimited villages & workers', 'Dedicated AWS Aurora pool', 'Custom WHO/MoHFW protocol chunks', 'ABDM (National Health IDs) sync'],
    cta: 'Contact Sales',
    color: 'white',
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Flexible B2B SaaS Plans</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Monetization & SaaS Pricing</h1>
          <p className="mt-4 text-slate-500 text-sm max-w-xl mx-auto">Sustainable public-private partnership models for districts, state ministries, and non-profits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.title}
              className={`rounded-[2rem] p-8 flex flex-col justify-between hover:shadow-xl transition-all relative ${
                tier.color === 'dark'
                  ? 'bg-slate-900 border-2 border-emerald-500 scale-105 shadow-xl shadow-emerald-950/20'
                  : 'bg-white border border-slate-200'
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
      </div>
    </div>
  );
}
