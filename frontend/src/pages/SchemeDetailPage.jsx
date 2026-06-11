import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
  health_insurance: { icon: '🏥', color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', glow: 'rgba(16,185,129,0.15)' },
  maternal_health:  { icon: '🤱', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd', glow: 'rgba(139,92,246,0.15)' },
  child_health:     { icon: '👶', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', glow: 'rgba(245,158,11,0.15)' },
  insurance:        { icon: '🛡️', color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd', glow: 'rgba(59,130,246,0.15)' },
  nutrition:        { icon: '🥗', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', glow: 'rgba(239,68,68,0.15)' },
  disease:          { icon: '💊', color: '#06b6d4', bg: '#cffafe', border: '#67e8f9', glow: 'rgba(6,182,212,0.15)' },
  other:            { icon: '📋', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', glow: 'rgba(107,114,128,0.1)' },
};

function getCat(category, t) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const label = t?.schemes?.[`cat_${category}`] || category;
  return { ...meta, label };
}

function parseList(raw, sep = ',') {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(sep).map(s => s.trim()).filter(Boolean);
}

function parseSteps(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split('|').map(s => s.trim()).filter(Boolean);
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyBtn({ text, t }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title={t?.schemes?.copy_step || 'Copy'}
      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: copied ? '#10b981' : '#9ca3af', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }}
    >
      {copied ? (t?.schemes?.copied || 'Copied!') : '📋'}
    </button>
  );
}

// ── Section Card ────────────────────────────────────────────────────────────────
function Section({ title, children, accentColor = '#10b981' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16, borderLeft: `4px solid ${accentColor}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>{title}</h2>
      {children}
    </div>
  );
}

// ── Main Detail Page ───────────────────────────────────────────────────────────
export default function SchemeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const s = t?.schemes || {};

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const headerRef = useRef(null);

  useEffect(() => {
    if (!id) { navigate('/schemes'); return; }
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Try from cache first for instant display, then background-refresh
    const CACHE_KEY = 'swasthai_schemes_cache_v2';
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data } = JSON.parse(raw);
        const found = (data?.schemes || []).find(sc => String(sc.id) === String(id));
        if (found) { setScheme(found); setLoading(false); return; }
      }
    } catch (_) {}

    // Fetch individual scheme from API
    api.get(`/schemes/${id}`)
      .then(res => { setScheme(res.data?.scheme || res.data); setLoading(false); })
      .catch(err => {
        if (err.response?.status === 401) { navigate('/login'); return; }
        setError(err.response?.data?.error || 'Failed to load scheme details.');
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) return <LoadingView t={t} />;
  if (error || !scheme) return <ErrorView error={error} t={t} />;

  const cat = getCat(scheme.category, t);
  const documents = parseList(scheme.required_documents, ',');
  const steps = parseSteps(scheme.steps);

  // Locale-first content lookup: t.scheme_data[schemeName] > DB fields > English fallback
  const schemeT = t?.scheme_data?.[scheme.name] || {};
  const displayName = schemeT.name || (lang === 'hi' && scheme.name_hi ? scheme.name_hi : null) || scheme.name;
  const displayBenefit = schemeT.benefit || scheme.benefit;
  const subName = displayName !== scheme.name ? scheme.name : (scheme.name_hi && lang !== 'hi' ? null : (lang !== 'en' ? scheme.name : scheme.name_hi));
  const whyHelps = schemeT.why_helps
    || (lang === 'hi' && scheme.why_helps_hi ? scheme.why_helps_hi : null)
    || scheme.why_helps
    || scheme.description;

  const genderLabel = scheme.gender_eligibility === 'female' ? (s.female_only || 'Women only') : (s.all_genders || 'All / Everyone');
  const bplLabel = scheme.economic_status_eligibility === 'BPL' ? (s.yes_bpl || 'BPL Card needed') : (s.no_bpl || 'Not required');
  const areaLabel = scheme.area_type_eligibility === 'rural' ? (s.rural_only || 'Rural areas') : (s.all_areas || 'Rural + Urban');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdf4, #f8faff 60%, #fef9ff)', fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .step-row:hover { background: #f8fafc; }
      `}</style>
      <Navbar />

      {/* Hero Header */}
      <div ref={headerRef} style={{ background: `linear-gradient(135deg, ${cat.color}18 0%, ${cat.color}08 100%)`, borderBottom: `1px solid ${cat.border}`, padding: '24px 20px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${cat.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Back breadcrumb */}
          <Link to="/schemes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: cat.color, fontWeight: 700, textDecoration: 'none', marginBottom: 16, background: cat.bg, padding: '6px 14px', borderRadius: 20, border: `1px solid ${cat.border}` }}>
            ← {s.back || 'Back to Schemes'}
          </Link>

          {/* Category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: cat.color, background: cat.bg, padding: '4px 14px', borderRadius: 20, border: `1px solid ${cat.border}`, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {cat.icon} {cat.label}
            </span>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#d1fae5', padding: '3px 10px', borderRadius: 20, border: '1px solid #6ee7b7' }}>
              {s.active_scheme || '✅ Active Scheme'}
            </span>
            {scheme.start_year && (
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{s.started_in || 'Started in'} {scheme.start_year}</span>
            )}
          </div>

          {/* Scheme Name */}
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#064e3b', margin: '0 0 6px', lineHeight: 1.2, animation: 'fadeUp 0.4s ease' }}>
            {displayName}
          </h1>
          {subName && subName !== displayName && (
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 20px' }}>{subName}</p>
          )}

          {/* Big Benefit Banner */}
          <div style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)`, borderRadius: '14px 14px 0 0', padding: '16px 22px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>💰</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                {s.what_you_get || 'WHAT YOU GET'}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{displayBenefit}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', animation: 'fadeUp 0.4s ease 0.1s both' }}>

        {/* Why This Helps You */}
        {whyHelps && (
          <Section title={s.why_helps_title || '💚 Why This Helps You'} accentColor={cat.color}>
            <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0, fontWeight: 450 }}>
              {whyHelps}
            </p>
            {scheme.description && scheme.description !== whyHelps && (
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: '12px 0 0', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                {scheme.description}
              </p>
            )}
          </Section>
        )}

        {/* Eligibility */}
        <Section title={s.eligibility_title || '✅ Are You Eligible?'} accentColor="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <EligCard icon="👤" label={s.eligibility_age || 'Age'} value={`${scheme.min_age}–${scheme.max_age === 120 ? 'Any age' : scheme.max_age} ${s.age_range || 'years'}`} />
            <EligCard icon="👫" label={s.eligibility_gender || 'Who Can Apply'} value={genderLabel} />
            <EligCard icon="📋" label={s.eligibility_bpl || 'BPL Required?'} value={bplLabel} highlight={scheme.economic_status_eligibility === 'BPL'} />
            <EligCard icon="🗺️" label={s.eligibility_area || 'Area'} value={areaLabel} />
          </div>
          <div style={{ marginTop: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#78350f', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <span>{s.ask_asha || 'Ask your ASHA worker or nearest PHC for help applying'}</span>
          </div>
        </Section>

        {/* Documents */}
        {documents.length > 0 && (
          <Section title={s.documents_title || '📄 Documents Needed'} accentColor="#f59e0b">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{getDocIcon(doc)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{doc}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* How to Apply — Steps */}
        {steps.length > 0 && (
          <Section title={s.how_to_apply || '🗺️ How to Apply — Step by Step'} accentColor="#8b5cf6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => {
                const cleanStep = step.replace(/^\d+\.\s*/, '');
                return (
                  <div key={i} className="step-row" style={{ display: 'flex', gap: 12, padding: '12px 10px', borderRadius: 10, transition: 'background 0.15s', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 1.6, paddingTop: 2 }}>{cleanStep}</div>
                    <CopyBtn text={cleanStep} t={t} />
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Helpline + Apply Online */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
          {scheme.helpline && (
            <a href={`tel:${scheme.helpline.replace(/[^0-9+]/g, '')}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📞</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.helpline || 'Helpline'}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{scheme.helpline}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Free government helpline</div>
                </div>
              </div>
            </a>
          )}

          {scheme.official_url && (
            <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`, borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', boxShadow: `0 4px 16px ${cat.glow}` }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>🌐</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Official Portal</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{s.official_portal || 'Apply on Official Website ↗'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{scheme.official_url}</div>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* ASHA tip */}
        <div style={{ background: 'linear-gradient(135deg, #065f46, #047857)', borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'center', color: '#fff' }}>
          <div style={{ fontSize: 30, flexShrink: 0 }}>👩‍⚕️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Need Help Applying?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              {s.ask_asha || 'Your ASHA worker is trained to help you apply for this scheme. Visit your nearest PHC or Anganwadi centre — they will guide you through every step free of charge.'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Eligibility Card ──────────────────────────────────────────────────────────
function EligCard({ icon, label, value, highlight }) {
  return (
    <div style={{ background: highlight ? '#fef2f2' : '#f8fafc', borderRadius: 12, padding: '12px 14px', border: `1px solid ${highlight ? '#fca5a5' : '#e5e7eb'}` }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: highlight ? '#ef4444' : '#111827' }}>{value}</div>
    </div>
  );
}

// ── Document Icon helper ──────────────────────────────────────────────────────
function getDocIcon(doc) {
  const d = doc.toLowerCase();
  if (d.includes('aadhaar') || d.includes('aadhar')) return '🪪';
  if (d.includes('ration')) return '📦';
  if (d.includes('bank') || d.includes('account')) return '🏦';
  if (d.includes('birth')) return '🍼';
  if (d.includes('income') || d.includes('bpl')) return '💵';
  if (d.includes('mcp') || d.includes('mother')) return '📋';
  if (d.includes('photo')) return '📸';
  if (d.includes('phone') || d.includes('mobile')) return '📱';
  if (d.includes('address')) return '🏠';
  if (d.includes('age') || d.includes('proof')) return '📄';
  return '📄';
}

// ── Loading View ──────────────────────────────────────────────────────────────
function LoadingView({ t }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
        {[260, '100%', '80%', '60%', '90%'].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 200 : 18, width: w, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        ))}
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    </div>
  );
}

// ── Error View ────────────────────────────────────────────────────────────────
function ErrorView({ error, t }) {
  const s = t?.schemes || {};
  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 52 }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: 15, margin: '12px 0' }}>{error || 'Scheme not found.'}</p>
        <Link to="/schemes" style={{ display: 'inline-block', marginTop: 12, padding: '10px 24px', background: '#10b981', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 800 }}>
          {s.back || '← Back to Schemes'}
        </Link>
      </div>
    </div>
  );
}
