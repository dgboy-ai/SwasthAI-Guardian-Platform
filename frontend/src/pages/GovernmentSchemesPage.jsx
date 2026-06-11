import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META = {
  health_insurance: { icon: '🏥', color: '#10b981', bg: '#d1fae5', border: '#6ee7b7' },
  maternal_health:  { icon: '🤱', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  child_health:     { icon: '👶', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  insurance:        { icon: '🛡️', color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  nutrition:        { icon: '🥗', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  disease:          { icon: '💊', color: '#06b6d4', bg: '#cffafe', border: '#67e8f9' },
  other:            { icon: '📋', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
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
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
      overflow: 'hidden', height: 280,
    }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '18px 20px' }}>
        {[100, 60, '100%', '80%', '60%'].map((w, i) => (
          <div key={i} style={{ width: w, height: i < 2 ? 12 : 10, borderRadius: 6, marginBottom: 12, background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    </div>
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
        setError('⚠️ Showing cached data');
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)', fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 80, position: 'relative' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .scheme-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .scheme-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .know-more-btn { transition: all 0.2s; }
        .know-more-btn:hover { transform: scale(1.02); }
      `}</style>
      <Navbar />

      {/* Fixed gradient orbs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
            ← {s.back?.replace('← ', '') || 'Back'}
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#064e3b', margin: 0, lineHeight: 1.2 }}>
              🏛️ {s.title || 'Government Health Schemes'}
            </h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{s.subtitle || 'Free benefits your family is entitled to'}</p>
          </div>
          {profile && (
            <button
              onClick={() => setShowAllSchemes(!showAllSchemes)}
              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, background: showAllSchemes ? '#f0fdf4' : '#064e3b', color: showAllSchemes ? '#064e3b' : '#fff', border: `1px solid ${showAllSchemes ? '#10b981' : '#064e3b'}`, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {showAllSchemes ? s.show_mine || '🎯 My Schemes' : s.browse_all || '📋 Browse All'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Offline banner */}
        {isOffline && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px 16px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #fde68a', marginBottom: 0 }}>
            📡 Offline — showing cached data
          </div>
        )}

        {/* Profile eligibility card */}
        {profile && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', margin: '16px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>🎯 Your Profile:</span>
            {profile.age && <Chip label={`${s.eligibility_age || 'Age'}: ${profile.age}`} />}
            {profile.gender && <Chip label={profile.gender} />}
            {profile.economic_status && <Chip label={profile.economic_status} />}
            {profile.area_type && <Chip label={profile.area_type} />}
            {!profile.age && !profile.gender && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Complete your profile to see personalized results →</span>
            )}
          </div>
        )}

        {/* Search + Filter bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '10px 16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              placeholder={s.search_placeholder || 'Search schemes...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'transparent' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
            <FilterChip label={s.filter_all || '📋 All'} active={filter === 'all'} onClick={() => setFilter('all')} />
            {categories.map(cat => {
              const meta = getCat(cat, t);
              return <FilterChip key={cat} label={`${meta.icon} ${meta.label}`} active={filter === cat} onClick={() => setFilter(cat)} color={meta.color} />;
            })}
          </div>
        </div>

        {/* Count */}
        {!loading && !error && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0', fontWeight: 500 }}>
            {s.showing || 'Showing'} <strong>{displayed.length}</strong> {s.of || 'of'} <strong>{schemes.length}</strong> {s.schemes_word || 'schemes'}
            {!showAllSchemes && profile && <span style={{ color: '#10b981', marginLeft: 4 }}>• {s.my_schemes || 'matching your profile'}</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16, paddingBottom: 24 }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error && schemes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <p style={{ color: '#ef4444', marginTop: 12 }}>{error}</p>
            <button onClick={() => fetchSchemes(showAllSchemes)} style={{ marginTop: 16, padding: '10px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
              {s.retry || 'Try Again'}
            </button>
          </div>
        ) : (
          <>
            {error && <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16, paddingBottom: 24, animation: 'fadeUp 0.4s ease' }}>
              {displayed.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} t={t} lang={lang} />)}
            </div>
            {displayed.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <p style={{ color: '#9ca3af', marginTop: 12 }}>{s.no_schemes || 'No schemes found.'}</p>
                <button onClick={() => { setSearch(''); setFilter('all'); }} style={{ marginTop: 12, padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
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
    <div className="scheme-card" style={{ background: '#fff', borderRadius: 16, border: `1px solid ${cat.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Top accent */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Category + year */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: cat.color, background: cat.bg, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {cat.icon} {cat.label}
          </span>
          {scheme.start_year && (
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>since {scheme.start_year}</span>
          )}
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 3px', lineHeight: 1.35 }}>{displayName}</h3>
        {displayName !== scheme.name && (
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px', lineHeight: 1.3 }}>{scheme.name}</p>
        )}

        {/* Benefit callout */}
        <div style={{ background: cat.bg, borderRadius: 10, padding: '8px 12px', marginBottom: 12, border: `1px solid ${cat.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            💰 {s.benefit_label || 'BENEFIT'}
          </div>
          <div style={{ fontSize: 13, color: '#111827', fontWeight: 700, lineHeight: 1.4 }}>{displayBenefit}</div>
        </div>

        {/* Why helps — simple villager language */}
        {displayWhyHelps && (
          <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {displayWhyHelps}
          </p>
        )}

        {/* Eligibility chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <EligChip label={`${scheme.min_age}–${scheme.max_age === 120 ? '∞' : scheme.max_age} ${s.age_range || 'yrs'}`} icon="👤" />
          {scheme.gender_eligibility === 'female' && <EligChip label={s.female_only || 'Women only'} icon="♀️" color="#8b5cf6" />}
          {scheme.economic_status_eligibility === 'BPL' && <EligChip label="BPL" icon="📋" color="#ef4444" />}
        </div>

        {/* Know More button */}
        <Link
          to={`/schemes/${scheme.id}`}
          className="know-more-btn"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '11px', borderRadius: 10, fontSize: 13,
            background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800,
            textDecoration: 'none', boxSizing: 'border-box',
            boxShadow: `0 4px 12px ${cat.color}33`,
          }}
        >
          {s.know_more || 'Know More →'}
        </Link>
      </div>
    </div>
  );
}

function Chip({ label }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', fontWeight: 600 }}>{label}</span>;
}

function EligChip({ label, icon, color = '#374151' }) {
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f8fafc', color, border: '1px solid #e5e7eb', fontWeight: 700 }}>{icon} {label}</span>;
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1px solid ${active && color ? color : active ? '#064e3b' : '#e5e7eb'}`,
        background: active ? (color || '#064e3b') : '#fff', cursor: 'pointer', fontWeight: 700,
        color: active ? '#fff' : '#374151', transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}
