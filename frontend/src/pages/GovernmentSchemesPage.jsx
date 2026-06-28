import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Baby, Heart, Shield, Apple, Pill, ClipboardList, AlertTriangle, Landmark, Target, Wifi, Search, X, DollarSign, User, Heart as Venus } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META = {
  health_insurance: { icon: Stethoscope, color: '#10b981', bg: '#d1fae5', border: '#6ee7b7' },
  maternal_health:  { icon: Baby, color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  child_health:     { icon: Heart, color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  insurance:        { icon: Shield, color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  nutrition:        { icon: Apple, color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  disease:          { icon: Pill, color: '#06b6d4', bg: '#cffafe', border: '#67e8f9' },
  other:            { icon: ClipboardList, color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

function getCat(category, t) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const labelKey = `cat_${category}`;
  const label = t?.schemes?.[labelKey] || category;
  return { ...meta, label };
}

// ── Offline cache ─────────────────────────────────────────────────────────────
const CACHE_KEY = 'swasthai_schemes_cache_v2';
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < 6 * 60 * 60 * 1000) return data;
  } catch (_) {}
  return null;
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-[280px]"
    >
      <div className="h-1 bg-slate-200" />
      <div className="px-5 py-[18px]">
        {[100, 60, '100%', '80%', '60%'].map((w, i) => (
          <div key={i} className="rounded-lg mb-3 bg-slate-200" style={{ width: w, height: i < 2 ? 12 : 10 }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GovernmentSchemesPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const s = t?.schemes || {};

  const [schemes, setSchemes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAllSchemes, setShowAllSchemes] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const fetchSchemes = useCallback(async (all = false) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    if (isOffline) {
      const cached = loadCache();
      if (cached) { setSchemes(cached.schemes || []); setProfile(cached.profile || null); setLoading(false); return; }
      setError('You are offline and no cached data is available.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = all ? '/schemes/all' : '/schemes';
      const res = await api.get(endpoint);
      const data = res.data;
      setSchemes(data.schemes || []);
      setProfile(data.profile || null);
      saveCache(data);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      const cached = loadCache();
      if (cached) {
        setSchemes(cached.schemes || []);
        setProfile(cached.profile || null);
        setError('Showing cached data');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load schemes.');
      }
    } finally { setLoading(false); }
  }, [navigate, isOffline]);

  useEffect(() => { fetchSchemes(showAllSchemes); }, [showAllSchemes]);

  const displayed = schemes.filter(sc => {
    const matchCat = filter === 'all' || sc.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || sc.name.toLowerCase().includes(q)
      || (sc.name_hi && sc.name_hi.includes(q))
      || sc.description?.toLowerCase().includes(q)
      || sc.benefit?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const categories = [...new Set(schemes.map(sc => sc.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-green-50/40 to-sky-50/60 pb-20 relative font-inter">
      <Navbar />

      {/* Fixed gradient orbs */}
      <div className="fixed -top-24 -right-24 w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed -bottom-20 -left-20 w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md border-b border-black/5 px-5 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3 flex-wrap">
          <button onClick={() => { try { navigate(-1); } catch { navigate('/villager'); } }} className="bg-transparent border border-slate-200 rounded-xl px-3.5 py-1.5 cursor-pointer text-[13px] text-slate-600 font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors">
            ← {s.back ? s.back.replace(/^← /, '') : 'Back'}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-emerald-900 leading-tight m-0">
              <Landmark className="w-5 h-5 inline" /> {s.title || 'Government Health Schemes'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.subtitle || 'Free benefits your family is entitled to'}</p>
          </div>
          {profile && (
            <button
              onClick={() => setShowAllSchemes(!showAllSchemes)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${
                showAllSchemes ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-emerald-800 text-white border-emerald-800'
              }`}
            >
              {showAllSchemes ? <><Target className="w-4 h-4 inline" /> {s.show_mine || 'My Schemes'}</> : <><ClipboardList className="w-4 h-4 inline" /> {s.browse_all || 'Browse All'}</>}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">

        {/* Offline banner */}
        {isOffline && (
          <div className="bg-amber-50 text-amber-800 px-4 py-2.5 text-[13px] font-medium border-b border-amber-200 flex items-center gap-2">
            <Wifi className="w-4 h-4" /> Offline — showing cached data
          </div>
        )}

        {/* Profile eligibility card */}
        {profile && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-4 flex gap-2.5 flex-wrap items-center">
            <span className="text-[13px] font-bold text-slate-900 whitespace-nowrap inline-flex items-center gap-1"><Target className="w-4 h-4" /> Your Profile:</span>
            {profile.age && <Chip label={`${s.eligibility_age || 'Age'}: ${profile.age}`} />}
            {profile.gender && <Chip label={profile.gender} />}
            {profile.economic_status && <Chip label={profile.economic_status} />}
            {profile.area_type && <Chip label={profile.area_type} />}
            {!profile.age && !profile.gender && (
              <span className="text-xs text-slate-400">Complete your profile to see personalized results →</span>
            )}
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="mt-4">
          <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm mb-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              placeholder={s.search_placeholder || 'Search schemes...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border-none outline-none text-sm text-slate-900 bg-transparent"
            />
            {search && <button onClick={() => setSearch('')} className="bg-none border-none cursor-pointer text-slate-400 flex items-center p-0"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-2 flex-wrap pb-1">
            <FilterChip icon={<ClipboardList className="w-4 h-4" />} label={s.filter_all || 'All'} active={filter === 'all'} onClick={() => setFilter('all')} />
            {categories.map(cat => {
              const meta = getCat(cat, t);
              return <FilterChip key={cat} icon={<meta.icon className="w-4 h-4" />} label={meta.label} active={filter === cat} onClick={() => setFilter(cat)} color={meta.color} />;
            })}
          </div>
        </div>

        {/* Count */}
        {!loading && !error && (
          <p className="text-xs text-slate-400 my-2 font-medium">
            {s.showing || 'Showing'} <strong>{displayed.length}</strong> {s.of || 'of'} <strong>{schemes.length}</strong> {s.schemes_word || 'schemes'}
            {!showAllSchemes && profile && <span className="text-emerald-600 ml-1">• {s.my_schemes || 'matching your profile'}</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 pb-6">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error && schemes.length === 0 ? (
          <div className="text-center py-[60px] px-5">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-red-500 mt-3">{error}</p>
            <button onClick={() => fetchSchemes(showAllSchemes)} className="mt-4 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold border-none cursor-pointer hover:bg-emerald-600 transition-colors">
              {s.retry || 'Try Again'}
            </button>
          </div>
        ) : (
          <>
            {error && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[13px] text-amber-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 pb-6"
            >
              {displayed.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} t={t} lang={lang} />)}
            </motion.div>
            {displayed.length === 0 && (
              <div className="text-center py-[60px] px-5">
                <Search className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-slate-400 mt-3">{s.no_schemes || 'No schemes found.'}</p>
                <button onClick={() => { setSearch(''); setFilter('all'); }} className="mt-3 px-5 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold border-none cursor-pointer hover:bg-slate-200 transition-colors">
                  {s.clear_filters || 'Clear Filters'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Scheme Card ───────────────────────────────────────────────────────────────
function SchemeCard({ scheme, t, lang }) {
  const s = t?.schemes || {};
  const cat = getCat(scheme.category, t);

  // Locale-first content: t.scheme_data[name] > DB hi fields > English
  const schemeT = t?.scheme_data?.[scheme.name] || {};
  const displayName = schemeT.name || (lang === 'hi' && scheme.name_hi ? scheme.name_hi : null) || scheme.name;
  const displayBenefit = schemeT.benefit || scheme.benefit;
  const displayWhyHelps = schemeT.why_helps
    || (lang === 'hi' && scheme.why_helps_hi ? scheme.why_helps_hi : null)
    || scheme.why_helps;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${cat.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Top accent */}
      <div className="h-[5px]" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />

      <div className="px-[18px] py-4">
        {/* Category + year */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-extrabold uppercase inline-flex items-center gap-1" style={{ color: cat.color, background: cat.bg, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 }}>
            <cat.icon className="w-4 h-4" /> {cat.label}
          </span>
          {scheme.start_year && (
            <span className="text-[10px] text-slate-400 font-semibold">since {scheme.start_year}</span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-[15px] font-extrabold text-slate-900 m-0 leading-[1.35] mb-[3px]">{displayName}</h3>
        {displayName !== scheme.name && (
          <p className="text-[11px] text-slate-400 m-0 mb-[10px] leading-[1.3]">{scheme.name}</p>
        )}

        {/* Benefit callout */}
        <div className="mb-3" style={{ background: cat.bg, borderRadius: 10, padding: '8px 12px', border: `1px solid ${cat.border}` }}>
          <div className="text-[9px] font-extrabold uppercase mb-[2px] flex items-center gap-1" style={{ color: cat.color, letterSpacing: 0.8 }}>
            <DollarSign className="w-4 h-4" /> {s.benefit_label || 'BENEFIT'}
          </div>
          <div className="text-[13px] text-slate-900 font-bold leading-[1.4]">{displayBenefit}</div>
        </div>

        {/* Why helps — simple villager language */}
        {displayWhyHelps && (
          <p className="text-xs text-slate-600 leading-relaxed m-0 mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {displayWhyHelps}
          </p>
        )}

        {/* Eligibility chips */}
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          <EligChip label={`${scheme.min_age}–${scheme.max_age === 120 ? '∞' : scheme.max_age} ${s.age_range || 'yrs'}`} icon={<User className="w-3 h-3" />} />
          {scheme.gender_eligibility === 'female' && <EligChip label={s.female_only || 'Women only'} icon={<Venus className="w-3 h-3" />} color="#8b5cf6" />}
          {scheme.economic_status_eligibility === 'BPL' && <EligChip label="BPL" icon={<ClipboardList className="w-4 h-4" />} color="#ef4444" />}
        </div>

        {/* Know More button */}
        <Link
          to={`/schemes/${scheme.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 w-full py-[11px] text-[13px] text-white font-extrabold no-underline cursor-pointer box-border border-none rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
            boxShadow: `0 4px 12px ${cat.color}33`,
          }}
        >
          {s.know_more || 'Know More →'}
        </Link>
      </div>
    </motion.div>
  );
}

function Chip({ label }) {
  return <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-[10px] py-[3px]">{label}</span>;
}

function EligChip({ label, icon, color = '#374151' }) {
  return <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-full px-[8px] py-[2px] inline-flex items-center gap-1" style={{ color }}>{icon} {label}</span>;
}

function FilterChip({ label, active, onClick, color, icon }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-bold cursor-pointer inline-flex items-center gap-1 rounded-full px-[14px] py-[6px] transition-all duration-200"
      style={{
        border: `1px solid ${active && color ? color : active ? '#064e3b' : '#e5e7eb'}`,
        background: active ? (color || '#064e3b') : '#fff',
        color: active ? '#fff' : '#374151',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
