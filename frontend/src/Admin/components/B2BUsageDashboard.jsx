import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Key, Users, Database, Globe, PhoneCall, Shield, FileText, Baby, Truck } from 'lucide-react';
import adminService from '../../services/adminService';

const TENANT_COLORS = {
  Sehore: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Bhopal: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  Indore: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  Varanasi: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  Pune: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
};

function UsageCard({ label, value, sub, icon: Icon, variants }) {
  return (
    <motion.div
      variants={variants}
      className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300/50 transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-700" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>
    </motion.div>
  );
}

function TenantCard({ tenant }) {
  const c = TENANT_COLORS[tenant.tenantId] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' };

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <p className={`font-black text-sm uppercase tracking-wider ${c.text}`}>{tenant.tenantId}</p>
        </div>
        <span className="text-[8px] font-bold text-slate-400 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">tenant</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="bg-white/70 rounded-xl p-2 border border-slate-200/50">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Users</p>
          <p className="text-lg font-black text-slate-900">{tenant.users.toLocaleString()}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-2 border border-slate-200/50">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Villages</p>
          <p className="text-lg font-black text-slate-900">{tenant.villages.total}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-2 border border-slate-200/50">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">API Keys</p>
          <p className="text-lg font-black text-slate-900">{tenant.apiKeys.total} <span className="text-[9px] font-bold text-emerald-600">({tenant.apiKeys.active} active)</span></p>
        </div>
        <div className="bg-white/70 rounded-xl p-2 border border-slate-200/50">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">API Calls</p>
          <p className="text-lg font-black text-slate-900">{tenant.apiKeys.totalCalls.toLocaleString()}</p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Records</p>
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/70 border border-slate-200 rounded text-[8px] font-mono text-slate-600">
            <FileText className="w-2.5 h-2.5 text-slate-500" /> {tenant.records.symptoms} symptoms
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/70 border border-slate-200 rounded text-[8px] font-mono text-slate-600">
            <Baby className="w-2.5 h-2.5 text-slate-500" /> {tenant.records.pregnancies} preg.
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/70 border border-slate-200 rounded text-[8px] font-mono text-slate-600">
            <Truck className="w-2.5 h-2.5 text-slate-500" /> {tenant.records.emergencies} emerg.
          </span>
        </div>
      </div>
      {tenant.villages.population > 0 && (
        <p className="text-[8px] text-slate-400 font-medium mt-2">
          Population: {tenant.villages.population.toLocaleString()} · {tenant.villages.pregnancies} pregnant · {tenant.villages.malnutrition} malnourished
        </p>
      )}
    </div>
  );
}

export default function B2BUsageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getB2BUsage();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load B2B usage data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-4 lg:p-5 space-y-5 text-left">
        <div className="h-8 bg-slate-100 rounded-2xl animate-pulse w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-5 space-y-5 text-left">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-bold text-rose-700">Failed to load B2B usage data</p>
          <p className="text-xs text-rose-500 mt-1 mb-3">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 transition-colors shadow-sm">Retry</button>
        </div>
      </div>
    );
  }

  const tenants = data?.tenants || [];
  const totals = data?.totals || { totalKeys: 0, totalCalls: 0, totalVillages: 0, totalUsers: 0, totalRecords: 0 };

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 border border-emerald-700/40 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-black text-white tracking-wide uppercase">B2B Multi-Tenant Usage</p>
              <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Per-tenant API consumption &amp; data volume analytics</p>
            </div>
          </div>
          <p className="text-[10px] text-white/40 font-medium">
            Last updated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <UsageCard label="Total Tenants" value={tenants.length} sub="Active districts" icon={Globe} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} />
        <UsageCard label="API Calls" value={totals.totalCalls.toLocaleString()} sub="Across all tenants" icon={PhoneCall} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} />
        <UsageCard label="Total Users" value={totals.totalUsers.toLocaleString()} sub="Villagers registered" icon={Users} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} />
        <UsageCard label="Data Records" value={totals.totalRecords.toLocaleString()} sub="Symptoms + pregnancies + emergencies" icon={Database} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} />
      </motion.div>

      {/* ── Tenant Breakdown ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Tenant Breakdown</p>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase">{tenants.length} Tenants</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tenants.length === 0 ? (
            <div className="col-span-full bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-8 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400">No tenant data available yet</p>
              <p className="text-xs text-slate-400 mt-1">Create API keys with tenant IDs to populate usage data.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              className="contents"
            >
              {tenants.map(t => (
                <motion.div key={t.tenantId} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <TenantCard tenant={t} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── API Key Usage Table ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">API Key Usage Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                {['Tenant', 'Total Keys', 'Active', 'Total API Calls', 'Avg / Active Key'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map(t => {
                const avg = t.apiKeys.active > 0 ? Math.round(t.apiKeys.totalCalls / t.apiKeys.active) : 0;
                return (
                  <tr key={t.tenantId} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-3 py-2.5 text-[10px] font-bold text-slate-800">{t.tenantId}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-600">{t.apiKeys.total}</td>
                    <td className="px-3 py-2.5"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${t.apiKeys.active > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{t.apiKeys.active}</span></td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-600 font-bold">{t.apiKeys.totalCalls.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{avg.toLocaleString()} / key</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Enterprise Info ── */}
      <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Enterprise B2B Ready</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Each tenant is isolated by district. API keys support scoped permissions (read/read,write/admin).
            Usage tracking enables billing readiness — integrate with Stripe for pay-per-call pricing.
          </p>
        </div>
      </div>

    </div>
  );
}
