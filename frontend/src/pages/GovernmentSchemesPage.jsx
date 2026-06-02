import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META = {
  health_insurance: { label: 'Health Insurance', label_hi: 'स्वास्थ्य बीमा', icon: '🏥', color: '#10b981', bg: '#d1fae5' },
  maternal_health:  { label: 'Maternal Health',  label_hi: 'मातृ स्वास्थ्य',  icon: '🤱', color: '#8b5cf6', bg: '#ede9fe' },
  child_health:     { label: 'Child Health',      label_hi: 'बाल स्वास्थ्य',   icon: '👶', color: '#f59e0b', bg: '#fef3c7' },
  insurance:        { label: 'Insurance',          label_hi: 'बीमा',            icon: '🛡️', color: '#3b82f6', bg: '#dbeafe' },
  nutrition:        { label: 'Nutrition',          label_hi: 'पोषण',            icon: '🥗', color: '#ef4444', bg: '#fee2e2' },
  other:            { label: 'Other',              label_hi: 'अन्य',            icon: '📋', color: '#6b7280', bg: '#f3f4f6' },
};

function getCat(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

// ── IndexedDB offline cache ───────────────────────────────────────────────────
const CACHE_KEY = 'swasthai_schemes_cache';
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < 6 * 60 * 60 * 1000) return data; // 6h TTL
  } catch (_) {}
  return null;
}

// ── Aadhaar e-KYC Modal ───────────────────────────────────────────────────────
function AadhaarModal({ onClose, onSuccess }) {
  const [aadhaar, setAadhaar] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1=input, 2=consent, 3=done

  const handleVerify = async () => {
    if (!consent) { setError('Please read and accept the consent before proceeding.'); return; }
    const clean = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean)) { setError('Aadhaar must be exactly 12 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/aadhaar-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aadhaar: clean }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed.'); return; }
      setStep(3);
      onSuccess(data.masked);
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>✕</button>

        {step === 1 && (
          <>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔐</div>
            <h2 style={styles.modalTitle}>Link Aadhaar Card</h2>
            <p style={styles.modalSub}>आधार कार्ड लिंक करें / Link your Aadhaar to verify eligibility</p>
            <div style={styles.securityNote}>
              <span>🔒</span>
              <span>Your Aadhaar number is <strong>never stored</strong>. Only an irreversible cryptographic hash is saved — compliant with UIDAI security guidelines.</span>
            </div>
            <label style={styles.fieldLabel}>Aadhaar Number (12 digits) *</label>
            <input
              type="password"
              maxLength={12}
              value={aadhaar}
              onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Enter 12-digit Aadhaar"
              style={styles.aadhaarInput}
              autoComplete="off"
              inputMode="numeric"
            />
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              {aadhaar.length}/12 digits entered
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            <button
              style={{ ...styles.primaryBtn, opacity: aadhaar.length === 12 ? 1 : 0.5 }}
              disabled={aadhaar.length !== 12}
              onClick={() => { setError(''); setStep(2); }}
            >
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>📋</div>
            <h2 style={styles.modalTitle}>Consent Required</h2>
            <div style={styles.consentBox}>
              <p><strong>You are about to link Aadhaar: XXXX-XXXX-{aadhaar.slice(-4)}</strong></p>
              <p style={{ marginTop: 10, lineHeight: 1.7 }}>
                By proceeding, I voluntarily consent to SwasthAI Guardian securely verifying
                my Aadhaar number using Verhoeff checksum validation. I understand that:
              </p>
              <ul style={{ marginTop: 8, lineHeight: 2, paddingLeft: 20 }}>
                <li>My raw Aadhaar number will <strong>never be stored</strong></li>
                <li>Only a one-way cryptographic hash is saved</li>
                <li>This is used solely to verify eligibility for government health schemes</li>
                <li>I can unlink my Aadhaar at any time from my profile</li>
              </ul>
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 4, transform: 'scale(1.4)' }} />
              <span style={{ fontSize: 14 }}>I have read and I agree to the above consent terms</span>
            </label>
            {error && <div style={styles.errorBox}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={styles.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
              <button
                style={{ ...styles.primaryBtn, flex: 1, opacity: consent ? 1 : 0.5 }}
                disabled={!consent || loading}
                onClick={handleVerify}
              >
                {loading ? '⏳ Verifying...' : '✅ Verify & Link Aadhaar'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 60 }}>🎉</div>
            <h2 style={{ color: '#10b981', margin: '12px 0 8px' }}>Aadhaar Linked!</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Your Aadhaar has been securely verified and linked.<br />
              Displayed as: <strong>{`XXXX-XXXX-${aadhaar.slice(-4)}`}</strong>
            </p>
            <button style={styles.primaryBtn} onClick={onClose}>Done ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scheme Detail Modal ───────────────────────────────────────────────────────
function SchemeDetailModal({ scheme, onClose }) {
  const cat = getCat(scheme.category);
  const [copiedStep, setCopiedStep] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedStep(idx);
    setTimeout(() => setCopiedStep(null), 1500);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>✕</button>

        {/* Header */}
        <div style={{ background: cat.bg, borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 48 }}>{cat.icon}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: 1 }}>
              {cat.label} · {cat.label_hi}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '4px 0 2px' }}>{scheme.name}</h2>
            {scheme.name_hi && <p style={{ fontSize: 14, color: '#6b7280' }}>{scheme.name_hi}</p>}
          </div>
        </div>

        {/* Benefit callout */}
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 12, padding: '14px 18px', color: '#fff', marginBottom: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 600, marginBottom: 4 }}>💰 BENEFIT / लाभ</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{scheme.benefit}</div>
        </div>

        {/* Description */}
        <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>{scheme.description}</p>

        {/* Eligibility chips */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={styles.sectionHead}>✅ Eligibility / पात्रता</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <Chip label={`Age: ${scheme.min_age}–${scheme.max_age === 120 ? 'Any' : scheme.max_age} years`} />
            <Chip label={`Gender: ${scheme.gender_eligibility === 'all' ? 'All / सभी' : scheme.gender_eligibility}`} />
            <Chip label={`BPL: ${scheme.economic_status_eligibility === 'all' ? 'Not required' : scheme.economic_status_eligibility}`} />
            <Chip label={`Area: ${scheme.area_type_eligibility === 'all' ? 'Rural + Urban' : scheme.area_type_eligibility}`} />
          </div>
        </div>

        {/* Required documents */}
        {scheme.required_documents?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={styles.sectionHead}>📄 Documents Required / जरूरी दस्तावेज़</h3>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scheme.required_documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontSize: 18 }}>📌</span>
                  <span style={{ fontSize: 14, color: '#374151' }}>{doc.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-step guide */}
        {scheme.steps?.length > 0 && (
          <div>
            <h3 style={styles.sectionHead}>🗺️ How to Apply / आवेदन कैसे करें</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheme.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: '#166534', lineHeight: 1.6 }}>{step.replace(/^\d+\.\s*/, '')}</div>
                  <button
                    title="Copy step"
                    onClick={() => handleCopy(step, i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}
                  >
                    {copiedStep === i ? '✅' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button style={styles.secondaryBtn} onClick={onClose}>← Back to Schemes</button>
          <a
            href="https://pmjay.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.primaryBtn, textDecoration: 'none', textAlign: 'center', flex: 1 }}
          >
            🌐 Official Portal ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GovernmentSchemesPage() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aadhaarMasked, setAadhaarMasked] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showAllSchemes, setShowAllSchemes] = useState(false);

  // Offline detection
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

    // Try from cache first if offline
    if (isOffline) {
      const cached = loadCache();
      if (cached) { setSchemes(cached.schemes || []); setProfile(cached.profile || null); setLoading(false); return; }
      setError('You are offline and no cached data is available.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = all ? '/api/schemes/all' : '/api/schemes';
      const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { navigate('/login'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch schemes');
      setSchemes(data.schemes || []);
      setProfile(data.profile || null);
      saveCache(data);
    } catch (err) {
      const cached = loadCache();
      if (cached) { setSchemes(cached.schemes || []); setProfile(cached.profile || null); setError('⚠️ Showing cached data (offline mode)'); }
      else setError(err.message || 'Failed to load schemes.');
    } finally { setLoading(false); }
  }, [navigate, isOffline]);

  useEffect(() => { fetchSchemes(showAllSchemes); }, [showAllSchemes]);

  // Filter + search
  const displayed = schemes.filter(s => {
    const matchCat = filter === 'all' || s.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.name_hi && s.name_hi.includes(q)) || s.description?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const categories = [...new Set(schemes.map(s => s.category))];

  return (
    <div style={styles.page}>
      {/* Background gradient orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <div>
          <h1 style={styles.title}>Government Schemes</h1>
          <p style={styles.subtitle}>सरकारी योजनाएँ · Your eligible welfare programs</p>
        </div>
        <button
          onClick={() => setShowAadhaar(true)}
          style={aadhaarMasked ? styles.aadhaarLinked : styles.aadhaarBtn}
        >
          {aadhaarMasked ? `🔐 ${aadhaarMasked}` : '🔗 Link Aadhaar'}
        </button>
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div style={styles.offlineBanner}>
          📡 You are offline — showing cached schemes. Some data may be outdated.
        </div>
      )}

      {/* Profile eligibility summary */}
      {profile && (
        <div style={styles.profileCard}>
          <div style={styles.profileTitle}>🎯 Your Eligibility Profile</div>
          <div style={styles.profileChips}>
            {profile.age && <Chip label={`Age: ${profile.age} years`} />}
            {profile.gender && <Chip label={`Gender: ${profile.gender}`} />}
            {profile.economic_status && <Chip label={`Status: ${profile.economic_status}`} />}
            {profile.caste && <Chip label={`Caste: ${profile.caste}`} />}
            {profile.area_type && <Chip label={`Area: ${profile.area_type}`} />}
            {!profile.age && !profile.gender && (
              <span style={{ fontSize: 13, color: '#9ca3af' }}>
                Complete your profile to see personalized scheme eligibility →
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAllSchemes(!showAllSchemes)}
            style={{ ...styles.secondaryBtn, marginTop: 12, fontSize: 13 }}
          >
            {showAllSchemes ? '🎯 Show My Eligible Schemes' : '📋 Browse All Schemes'}
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div style={styles.controls}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            placeholder="Search schemes... / योजना खोजें"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && <button onClick={() => setSearch('')} style={styles.clearSearch}>✕</button>}
        </div>
        <div style={styles.filterRow}>
          {['all', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{ ...styles.filterChip, ...(filter === cat ? styles.filterChipActive : {}) }}
            >
              {cat === 'all' ? '📋 All' : `${getCat(cat).icon} ${getCat(cat).label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '0 20px 60px' }}>
          <style>{`
            @keyframes skeleton-pulse {
              0% { opacity: 0.5; background-color: #f1f5f9; }
              50% { opacity: 1; background-color: #e2e8f0; }
              100% { opacity: 0.5; background-color: #f1f5f9; }
            }
          `}</style>
          <div style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ ...styles.card, cursor: 'default', height: 280, padding: 20, boxSizing: 'border-box' }}>
                {/* Top Accent */}
                <div style={{ height: 4, background: '#cbd5e1', borderRadius: '12px 12px 0 0', margin: '-20px -20px 20px' }} />
                
                {/* Category Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 100, height: 20, borderRadius: 8, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                  <div style={{ width: 24, height: 24, borderRadius: '50%', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                </div>

                {/* Name */}
                <div style={{ width: '80%', height: 16, borderRadius: 4, marginBottom: 8, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '50%', height: 12, borderRadius: 4, marginBottom: 16, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />

                {/* Benefit */}
                <div style={{ background: '#f9fafb', border: '1px solid #f1f5f9', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                  <div style={{ width: 60, height: 8, borderRadius: 4, marginBottom: 6, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                  <div style={{ width: '70%', height: 12, borderRadius: 4, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                </div>

                {/* Description lines */}
                <div style={{ width: '100%', height: 10, borderRadius: 4, marginBottom: 6, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '90%', height: 10, borderRadius: 4, marginBottom: 16, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ width: 120, height: 10, borderRadius: 4, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                  <div style={{ width: 80, height: 24, borderRadius: 8, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error && schemes.length === 0 ? (
        <div style={styles.center}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ color: '#ef4444', marginTop: 12 }}>{error}</p>
          <button style={styles.primaryBtn} onClick={() => fetchSchemes(showAllSchemes)}>Retry</button>
        </div>
      ) : (
        <>
          {error && <div style={styles.warnBanner}>{error}</div>}
          <div style={styles.count}>
            Showing <strong>{displayed.length}</strong> of <strong>{schemes.length}</strong> schemes
            {!showAllSchemes && <span style={{ color: '#10b981' }}> matching your profile</span>}
          </div>

          <div style={styles.grid}>
            {displayed.map(scheme => {
              const cat = getCat(scheme.category);
              return (
                <div
                  key={scheme.id}
                  style={styles.card}
                  onClick={() => setSelectedScheme(scheme)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
                >
                  {/* Card top accent */}
                  <div style={{ height: 4, background: cat.color, borderRadius: '12px 12px 0 0', margin: '-1px -1px 0' }} />

                  <div style={{ padding: '18px 20px' }}>
                    {/* Category badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {cat.icon} {cat.label}
                      </span>
                      <span style={{ fontSize: 22 }}>{cat.icon}</span>
                    </div>

                    {/* Scheme name */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.4 }}>{scheme.name}</h3>
                    {scheme.name_hi && <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 10px' }}>{scheme.name_hi}</p>}

                    {/* Benefit pill */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 2 }}>💰 BENEFIT</div>
                      <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{scheme.benefit}</div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {scheme.description}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        📄 {scheme.required_documents?.length || 0} docs · 🗺️ {scheme.steps?.length || 0} steps
                      </div>
                      <button
                        style={{ fontSize: 12, color: cat.color, background: cat.bg, border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}
                        onClick={e => { e.stopPropagation(); setSelectedScheme(scheme); }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {displayed.length === 0 && (
            <div style={styles.center}>
              <div style={{ fontSize: 48 }}>🔍</div>
              <p style={{ color: '#9ca3af', marginTop: 12 }}>No schemes match your search.</p>
              <button style={styles.secondaryBtn} onClick={() => { setSearch(''); setFilter('all'); }}>Clear Filters</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedScheme && <SchemeDetailModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />}
      {showAadhaar && (
        <AadhaarModal
          onClose={() => setShowAadhaar(false)}
          onSuccess={(masked) => { setAadhaarMasked(masked); setShowAadhaar(false); }}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
    padding: '0 0 60px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  orb1: {
    position: 'fixed', top: -120, right: -120, width: 400, height: 400,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  orb2: {
    position: 'fixed', bottom: -80, left: -80, width: 300, height: 300,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  header: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '20px 20px 16px',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px',
    cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500,
  },
  title: { fontSize: 22, fontWeight: 800, color: '#064e3b', margin: 0 },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '2px 0 0' },
  aadhaarBtn: {
    marginLeft: 'auto', padding: '9px 16px', borderRadius: 10, fontSize: 13,
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },
  aadhaarLinked: {
    marginLeft: 'auto', padding: '9px 16px', borderRadius: 10, fontSize: 13,
    background: '#f0fdf4', color: '#065f46', border: '1px solid #10b981',
    cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  },
  offlineBanner: {
    background: '#fef3c7', color: '#92400e', padding: '10px 20px', fontSize: 13,
    fontWeight: 500, borderBottom: '1px solid #fde68a', position: 'relative', zIndex: 1,
  },
  profileCard: {
    margin: '16px 20px', background: '#fff', borderRadius: 14,
    padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb', position: 'relative', zIndex: 1,
  },
  profileTitle: { fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 },
  profileChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  controls: { padding: '16px 20px 0', position: 'relative', zIndex: 1 },
  searchWrapper: {
    display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
    borderRadius: 12, padding: '10px 14px', border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827',
    background: 'transparent',
  },
  clearSearch: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af',
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 12 },
  filterChip: {
    fontSize: 12, padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontWeight: 500, color: '#374151',
    transition: 'all 0.2s',
  },
  filterChipActive: {
    background: '#064e3b', color: '#fff', border: '1px solid #064e3b',
  },
  count: { padding: '8px 20px', fontSize: 13, color: '#6b7280', position: 'relative', zIndex: 1 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16, padding: '8px 20px', position: 'relative', zIndex: 1,
  },
  card: {
    background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden',
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px', gap: 12, position: 'relative', zIndex: 1,
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid #e5e7eb', borderTopColor: '#10b981',
    animation: 'spin 0.8s linear infinite',
  },
  warnBanner: {
    margin: '0 20px 8px', background: '#fef3c7', border: '1px solid #fde68a',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400e',
    position: 'relative', zIndex: 1,
  },
  // Modals
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#fff', borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 480, position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.25s ease',
  },
  modalClose: {
    position: 'absolute', top: 16, right: 16, background: '#f3f4f6',
    border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
    fontSize: 14, color: '#6b7280',
  },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#111827', textAlign: 'center', margin: '0 0 6px' },
  modalSub: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  securityNote: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
    padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
    fontSize: 13, color: '#166534', marginBottom: 20, lineHeight: 1.6,
  },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  aadhaarInput: {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e5e7eb',
    fontSize: 18, letterSpacing: 4, outline: 'none', boxSizing: 'border-box',
    marginBottom: 8, textAlign: 'center', fontFamily: 'monospace',
    transition: 'border-color 0.2s',
  },
  consentBox: {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '16px', fontSize: 13, color: '#374151', marginBottom: 16, lineHeight: 1.6,
  },
  errorBox: {
    background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
    padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16,
  },
  primaryBtn: {
    width: '100%', padding: '13px', borderRadius: 10, fontSize: 15,
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 700,
    transition: 'opacity 0.2s',
  },
  secondaryBtn: {
    padding: '11px 18px', borderRadius: 10, fontSize: 14,
    background: '#f3f4f6', color: '#374151', border: 'none',
    cursor: 'pointer', fontWeight: 600,
  },
  sectionHead: { fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 },
};
