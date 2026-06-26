import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Copy, CheckCircle, XCircle, Trash2,
  Eye, EyeOff, Shield
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import adminService from '../../services/adminService';

export default function ApiKeysView() {
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyTenant, setNewKeyTenant] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState('read');
  const [createdKey, setCreatedKey] = useState(null);

  useEffect(() => {
    loadKeys();
    loadUsage();
  }, []);

  async function loadKeys() {
    try {
      const data = await adminService.getApiKeys();
      if (data.success) setKeys(data.keys);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsage() {
    try {
      const data = await adminService.getApiKeyUsage();
      if (data.success) setUsage(data);
    } catch {}
  }

  async function handleCreate() {
    if (!newKeyName.trim()) return showToast('Key name is required', 'error');
    try {
      const data = await adminService.createApiKey(newKeyName.trim(), newKeyTenant.trim() || null, newKeyPerms);
      if (data.success) {
        setCreatedKey(data.key);
        setNewKeyName('');
        setNewKeyTenant('');
        setNewKeyPerms('read');
        await loadKeys();
        await loadUsage();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function handleToggle(id) {
    try {
      const data = await adminService.toggleApiKey(id);
      if (data.success) {
        setKeys(keys.map(k => k.id === id ? { ...k, isActive: data.isActive } : k));
        showToast(data.isActive ? 'Key activated' : 'Key deactivated', 'info');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      const data = await adminService.deleteApiKey(id);
      if (data.success) {
        setKeys(keys.filter(k => k.id !== id));
        await loadUsage();
        showToast('API key revoked', 'info');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="animate-pulse h-32 bg-white rounded-2xl border border-slate-100" />
        <div className="animate-pulse h-48 bg-white rounded-2xl border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-violet-600" /> API Key Management
          </h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Manage API keys for NGO and enterprise integrations
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreatedKey(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-violet-200/30">
          <Plus className="w-4 h-4" /> Generate Key
        </button>
      </div>

      {/* Usage Summary */}
      {usage && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Keys</p>
            <p className="text-3xl font-black text-slate-900">{usage.totalKeys}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active</p>
            <p className="text-3xl font-black text-emerald-600">{usage.activeKeys}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total API Calls</p>
            <p className="text-3xl font-black text-violet-600">{usage.totalUsage.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
            {createdKey ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">API Key Generated</h3>
                <p className="text-sm text-slate-500 font-semibold mb-4">Copy this key now — you won't see it again</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 max-w-lg mx-auto">
                  <code className="flex-1 text-xs font-mono text-slate-700 break-all select-all">{createdKey.keyId}</code>
                  <button onClick={() => copyToClipboard(createdKey.keyId)}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <button onClick={() => { setShowCreate(false); setCreatedKey(null); }}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-black text-slate-900 mb-4">Generate New API Key</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Key Name</label>
                    <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                      placeholder="e.g., NGO Sync Integration"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                      Tenant ID <span className="text-slate-300 font-normal normal-case">(optional — restricts to one village)</span>
                    </label>
                    <input type="text" value={newKeyTenant} onChange={e => setNewKeyTenant(e.target.value)}
                      placeholder="e.g., V101"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Permissions</label>
                    <select value={newKeyPerms} onChange={e => setNewKeyPerms(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all">
                      <option value="read">Read Only</option>
                      <option value="read,write">Read + Write</option>
                      <option value="admin">Full Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleCreate}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95">
                      Generate
                    </button>
                    <button onClick={() => setShowCreate(false)}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">API Key</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Permissions</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Key className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">No API keys yet</p>
                    <p className="text-xs text-slate-300 font-medium mt-1">Generate your first key for NGO integrations</p>
                  </td>
                </tr>
              ) : keys.map((key) => (
                <tr key={key.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-slate-800">{key.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{key.keyId}</code>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold text-slate-500">{key.tenantId || <span className="text-slate-300">—</span>}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 uppercase">{key.permissions}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-slate-700">{key.usageCount.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    {key.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                        <XCircle className="w-3 h-3" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400 font-medium">{new Date(key.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(key.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title={key.isActive ? 'Deactivate' : 'Activate'}>
                        {key.isActive ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button onClick={() => handleDelete(key.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B2B Integration Info */}
      <div className="bg-gradient-to-r from-violet-50 to-violet-50/30 rounded-2xl p-5 border border-violet-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-violet-900 mb-1">B2B Enterprise Integration</h4>
            <p className="text-xs text-violet-700 font-semibold leading-relaxed">
              API keys enable NGOs and government health departments to integrate SwasthAI data with their existing HMIS, CRM, and analytics platforms.
              Each key is scoped by tenant (village/district), supports read/write permissions, and is fully auditable via the audit log.
              Keys use the <code className="text-[10px] bg-violet-100 px-1 py-0.5 rounded font-mono">sk_live_</code> prefix for easy identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
