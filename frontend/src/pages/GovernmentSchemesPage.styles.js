export const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
    padding: '0 0 80px',
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
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: 16, padding: '8px 16px', position: 'relative', zIndex: 1,
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
