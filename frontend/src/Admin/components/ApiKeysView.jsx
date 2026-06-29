import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Key, Plus, Copy, CheckCircle, XCircle, Trash2,
  Eye, EyeOff, Shield, AlertTriangle, X,
  Activity, Zap, Lock, TrendingUp, BarChart2,
  Building2, Globe, Clock
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import adminService from '../../services/adminService';

/* ── Tenant color map ── */
const TENANT_PAL = {
  Sehore:   { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', dot: '#10b981' },
  Bhopal:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  Indore:   { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6' },
  Varanasi: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  Pune:     { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#f43f5e' },
};
const DEFAULT_PAL = { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', dot: '#64748b' };

/* ── Permission config ── */
const PERM_CFG = {
  'read':       { label: 'Read',       bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: Eye },
  'read,write': { label: 'Read·Write', bg: '#f0fdf4', text: '#065f46', border: '#a7f3d0', icon: Zap },
  'admin':      { label: 'Admin',      bg: '#fdf4ff', text: '#6b21a8', border: '#e9d5ff', icon: Lock },
};

/* ── Animated number ── */
function AnimCount({ value, duration = 1000 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);
  return <span ref={ref}>{n.toLocaleString()}</span>;
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 relative overflow-hidden"
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: accent }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">
        {typeof value === 'number' ? <AnimCount value={value} /> : value}
      </p>
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-1.5">{sub}</p>}
    </motion.div>
  );
}

/* ── Usage mini bar ── */
function MiniBar({ pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-bold text-slate-400 w-6 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function ApiKeysView() {
  const [keys, setKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('api_keys_cache') || '[]'); } catch { return []; }
  });
  const [usage, setUsage] = useState(() => {
    try { return JSON.parse(localStorage.getItem('api_usage_cache') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(!keys.length);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newKeyTenant, setNewKeyTenant] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState('read');
  const [createdKey, setCreatedKey] = useState(null);

  useEffect(() => { loadKeys(); loadUsage(); }, []);

  async function loadKeys() {
    try {
      const data = await adminService.getApiKeys();
      if (data.success) { setKeys(data.keys); try { localStorage.setItem('api_keys_cache', JSON.stringify(data.keys)); } catch {} }
      else setKeys([]);
    } catch { setKeys([]); }
    finally { setLoading(false); }
  }
  async function loadUsage() {
    try {
      const data = await adminService.getApiKeyUsage();
      if (data.success) { setUsage(data); try { localStorage.setItem('api_usage_cache', JSON.stringify(data)); } catch {} }
      else setUsage({ totalKeys: 0, activeKeys: 0, totalUsage: 0, generatedAt: new Date().toISOString() });
    } catch { setUsage({ totalKeys: 0, activeKeys: 0, totalUsage: 0, generatedAt: new Date().toISOString() }); }
  }
  async function handleCreate() {
    if (!newKeyName.trim()) return showToast('Key name is required', 'error');
    try {
      const data = await adminService.createApiKey(newKeyName.trim(), newKeyTenant.trim() || null, newKeyPerms);
      if (data.success) {
        setCreatedKey(data.key);
        setNewKeyName(''); setNewKeyTenant(''); setNewKeyPerms('read');
        await loadKeys(); await loadUsage();
      }
    } catch (e) { showToast(e.message, 'error'); }
  }
  async function handleToggle(id) {
    try {
      const data = await adminService.toggleApiKey(id);
      if (data.success) {
        setKeys(keys.map(k => k.id === id ? { ...k, isActive: data.isActive } : k));
        showToast(data.isActive ? 'Key activated' : 'Key deactivated', 'info');
      }
    } catch (e) { showToast(e.message, 'error'); }
  }
  async function handleDelete(id) {
    try {
      const data = await adminService.deleteApiKey(id);
      if (data.success) { setKeys(keys.filter(k => k.id !== id)); await loadUsage(); showToast('API key revoked', 'info'); }
    } catch (e) { showToast(e.message, 'error'); }
  }
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'success')).catch(() => showToast('Failed to copy', 'error'));
  }

  if (loading) return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="h-14 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );

  const maxUsage = Math.max(...keys.map(k => k.usageCount), 1);
  const activeCount = keys.filter(k => k.isActive).length;

  return (
    <>
    <div className="p-5 lg:p-6 space-y-6 text-left">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shadow-sm">
              <Key className="w-4.5 h-4.5 text-violet-600" />
            </div>
            API Key Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 ml-11">
            Manage API keys for NGO and enterprise integrations
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreatedKey(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-violet-200/50"
        >
          <Plus className="w-4 h-4" /> Generate Key
        </button>
      </motion.div>

      {/* ── KPI Row ── */}
      {usage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total Keys"     value={usage.totalKeys}  sub="Across all tenants"        icon={Key}       accent="#7c3aed" delay={0.05} />
          <KpiCard label="Active Keys"    value={usage.activeKeys} sub={`${usage.totalKeys - usage.activeKeys} inactive`} icon={Activity} accent="#059669" delay={0.1} />
          <KpiCard label="Total API Calls" value={usage.totalUsage} sub="All-time usage"            icon={BarChart2} accent="#2563eb" delay={0.15} />
        </div>
      )}

      {/* ── Create Form ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-violet-200 shadow-lg overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-400" />
            <div className="p-6">
              {createdKey ? (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm"
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">API Key Generated!</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">Copy this key now — it won't be shown again</p>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 max-w-lg mx-auto">
                    <code className="flex-1 text-xs font-mono text-slate-700 break-all select-all text-left">{createdKey.keyId}</code>
                    <button
                      onClick={() => copyToClipboard(createdKey.keyId)}
                      className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <button
                    onClick={() => { setShowCreate(false); setCreatedKey(null); }}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900">Generate New API Key</h3>
                    </div>
                    <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Key Name *</label>
                      <input
                        type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g., NGO Sync Integration"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                        Tenant ID <span className="text-slate-300 font-normal normal-case">(optional)</span>
                      </label>
                      <input
                        type="text" value={newKeyTenant} onChange={e => setNewKeyTenant(e.target.value)}
                        placeholder="e.g., Sehore"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Permissions</label>
                      <select
                        value={newKeyPerms} onChange={e => setNewKeyPerms(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                      >
                        <option value="read">Read Only</option>
                        <option value="read,write">Read + Write</option>
                        <option value="admin">Full Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreate}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm shadow-violet-200"
                    >
                      Generate Key
                    </button>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keys Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="font-black text-slate-800 text-sm uppercase tracking-wider">API Keys</span>
          <span className="px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 text-[9px] font-black uppercase tracking-wider rounded-full ml-1">
            {activeCount} Active
          </span>
          <div className="flex-1" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {keys.length} keys total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                {[
                  { label: 'Integration',  w: '' },
                  { label: 'API Key',      w: '' },
                  { label: 'Tenant',       w: '' },
                  { label: 'Permissions',  w: '' },
                  { label: 'Usage',        w: 'min-w-[140px]' },
                  { label: 'Status',       w: '' },
                  { label: 'Created',      w: '' },
                  { label: 'Actions',      w: '', right: true },
                ].map(h => (
                  <th
                    key={h.label}
                    className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 ${h.right ? 'text-right' : 'text-left'} ${h.w}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Key className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">No API keys yet</p>
                    <p className="text-xs text-slate-300 font-medium mt-1">Generate your first key to enable NGO integrations</p>
                  </td>
                </tr>
              ) : (
                keys.map((key, i) => {
                  const tPal = TENANT_PAL[key.tenantId] || DEFAULT_PAL;
                  const pCfg = PERM_CFG[key.permissions] || PERM_CFG['read'];
                  const PermIcon = pCfg.icon;
                  const usagePct = (key.usageCount / maxUsage) * 100;

                  return (
                    <motion.tr
                      key={key.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors group ${!key.isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ background: tPal.bg, border: `1.5px solid ${tPal.border}`, color: tPal.dot }}
                          >
                            {(key.tenantId || '?')[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{key.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium">Enterprise Integration</p>
                          </div>
                        </div>
                      </td>

                      {/* API Key */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                            {key.keyId}
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.keyId)}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy key"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </td>

                      {/* Tenant */}
                      <td className="px-4 py-3.5">
                        {key.tenantId ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                            style={{ background: tPal.bg, border: `1px solid ${tPal.border}`, color: tPal.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: tPal.dot }} />
                            {key.tenantId}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Permissions */}
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase"
                          style={{ background: pCfg.bg, border: `1px solid ${pCfg.border}`, color: pCfg.text }}
                        >
                          <PermIcon className="w-2.5 h-2.5" />
                          {pCfg.label}
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-3.5 min-w-[140px]">
                        <p className="text-xs font-bold text-slate-700 mb-1">{key.usageCount.toLocaleString()}</p>
                        <MiniBar pct={usagePct} color={tPal.dot} delay={0.05 * i} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {key.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(key.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(key.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            title={key.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {key.isActive
                              ? <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(key.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── B2B Info Panel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-violet-200 p-5 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-violet-200 shadow-sm flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-black text-violet-900 uppercase tracking-wider">B2B Enterprise Integration</h4>
            <span className="px-1.5 py-0.5 bg-violet-100 border border-violet-200 rounded text-[8px] font-black text-violet-700 uppercase">
              Production Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            API keys enable NGOs and government health departments to integrate SwasthAI data with their existing HMIS, CRM,
            and analytics platforms. Each key is scoped by tenant (village/district), supports read/write permissions,
            and is fully auditable. Keys use the{' '}
            <code className="text-[10px] bg-violet-100 border border-violet-200 px-1 py-0.5 rounded font-mono text-violet-700">sk_live_</code>
            {' '}prefix.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-violet-600">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Multi-tenant</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Billing Ready</span>
          </div>
        </div>
      </motion.div>

    </div>

    {/* ── Delete Confirm Modal ── */}
    <AnimatePresence>
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 text-sm">Revoke API Key</p>
                <p className="text-[11px] text-slate-400 font-medium">This action cannot be undone</p>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium mb-5 leading-relaxed">
              All integrations using this key will <strong>immediately lose access</strong>. Make sure all consumers have migrated to a new key first.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
                className="px-4 py-2 bg-red-600 rounded-xl text-[11px] font-black text-white hover:bg-red-700 transition-colors uppercase tracking-wider shadow-sm shadow-red-200"
              >
                Revoke Key
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
