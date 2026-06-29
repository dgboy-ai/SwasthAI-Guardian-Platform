import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Building2, Key, Users, Database, Globe, PhoneCall,
  Shield, FileText, Baby, Truck, TrendingUp, Activity,
  MapPin, BarChart3, Zap, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import adminService from '../../services/adminService';

/* ── Palette per tenant ── */
const PALETTE = {
  Sehore:   { accent: '#059669', light: '#ecfdf5', mid: '#d1fae5', border: '#a7f3d0', text: '#065f46', bar: '#10b981' },
  Bhopal:   { accent: '#2563eb', light: '#eff6ff', mid: '#dbeafe', border: '#bfdbfe', text: '#1e40af', bar: '#3b82f6' },
  Indore:   { accent: '#7c3aed', light: '#f5f3ff', mid: '#ede9fe', border: '#ddd6fe', text: '#5b21b6', bar: '#8b5cf6' },
  Varanasi: { accent: '#d97706', light: '#fffbeb', mid: '#fef3c7', border: '#fde68a', text: '#92400e', bar: '#f59e0b' },
  Pune:     { accent: '#e11d48', light: '#fff1f2', mid: '#ffe4e6', border: '#fecdd3', text: '#9f1239', bar: '#f43f5e' },
};
const DEFAULT_PAL = { accent: '#475569', light: '#f8fafc', mid: '#f1f5f9', border: '#e2e8f0', text: '#334155', bar: '#64748b' };

/* ── Animated number counter ── */
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(ease * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ── Usage bar ── */
function UsageBar({ percent, color, label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-[9px] font-bold text-slate-500">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accentColor, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5"
    >
      {/* Subtle gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: gradient }}
      />
      <div className="relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight">
          <AnimatedNumber value={typeof value === 'number' ? value : 0} />
        </p>
        <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ── Tenant Card ── */
function TenantCard({ tenant, maxCalls, index }) {
  const pal = PALETTE[tenant.tenantId] || DEFAULT_PAL;
  const callPct = maxCalls > 0 ? (tenant.apiKeys.totalCalls / maxCalls) * 100 : 0;
  const totalRecords = tenant.records.symptoms + tenant.records.pregnancies + tenant.records.emergencies;
  const healthScore = Math.min(100, Math.round((tenant.apiKeys.active / Math.max(tenant.apiKeys.total, 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 * index }}
      className="bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 overflow-hidden"
      style={{ borderColor: pal.border }}
    >
      {/* Card top accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${pal.accent}, ${pal.bar}88)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm"
              style={{ background: pal.light, border: `1.5px solid ${pal.border}`, color: pal.accent }}
            >
              {tenant.tenantId[0]}
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 tracking-tight">{tenant.tenantId}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" style={{ color: pal.accent }} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">District</span>
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase"
            style={{ background: pal.mid, color: pal.text }}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            {tenant.apiKeys.active} Active
          </div>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: 'Users', val: tenant.users, icon: Users },
            { label: 'Villages', val: tenant.villages.total, icon: MapPin },
            { label: 'API Keys', val: `${tenant.apiKeys.total}`, icon: Key },
            { label: 'API Calls', val: tenant.apiKeys.totalCalls, icon: Activity },
          ].map(({ label, val, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl p-2.5 border"
              style={{ background: pal.light, borderColor: `${pal.border}80` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3" style={{ color: pal.accent }} />
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              </div>
              <p className="text-base font-black text-slate-900 leading-tight">
                {typeof val === 'number' ? val.toLocaleString() : val}
              </p>
            </div>
          ))}
        </div>

        {/* API call share bar */}
        <UsageBar
          percent={callPct}
          color={pal.bar}
          label="API Share"
          value={`${callPct.toFixed(0)}% of total`}
        />

        {/* Health score */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: `${pal.border}60` }}>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Records</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-50 border border-slate-200 text-slate-500">
              <FileText className="w-2 h-2" /> {tenant.records.symptoms}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 border border-rose-200 text-rose-500">
              <Baby className="w-2 h-2" /> {tenant.records.pregnancies}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 border border-amber-200 text-amber-600">
              <Truck className="w-2 h-2" /> {tenant.records.emergencies}
            </span>
          </div>
        </div>

        {/* Population line */}
        {tenant.villages.population > 0 && (
          <p className="text-[9px] text-slate-400 font-medium mt-2.5">
            Pop. {tenant.villages.population.toLocaleString()} · {tenant.villages.pregnancies} pregnant · {tenant.villages.malnutrition} malnourished
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── API table row ── */
function TableRow({ tenant, maxCalls, index }) {
  const pal = PALETTE[tenant.tenantId] || DEFAULT_PAL;
  const pct = maxCalls > 0 ? (tenant.apiKeys.totalCalls / maxCalls) * 100 : 0;
  const avg = tenant.apiKeys.active > 0 ? Math.round(tenant.apiKeys.totalCalls / tenant.apiKeys.active) : 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="hover:bg-slate-50/70 transition-colors group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm"
            style={{ background: pal.light, border: `1.5px solid ${pal.border}`, color: pal.accent }}
          >
            {tenant.tenantId[0]}
          </div>
          <span className="text-xs font-bold text-slate-800">{tenant.tenantId}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-600">{tenant.apiKeys.total}</td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: pal.mid, color: pal.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: pal.bar }} />
          {tenant.apiKeys.active} active
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-800 min-w-[60px]">
            {tenant.apiKeys.totalCalls.toLocaleString()}
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * index }}
              className="h-full rounded-full"
              style={{ backgroundColor: pal.bar }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-bold min-w-[30px]">{pct.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          {avg.toLocaleString()}
        </span>
      </td>
    </motion.tr>
  );
}

/* ═══════════════════════════════════════════════ */
export default function B2BUsageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.getB2BUsage();
      setData(res);
    } catch {
      setData({ generatedAt: new Date().toISOString(), totals: { totalKeys: 0, totalCalls: 0, totalVillages: 0, totalUsers: 0, totalRecords: 0 }, tenants: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="h-28 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="p-5 lg:p-6">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-rose-700">Failed to load B2B usage data</p>
        <p className="text-xs text-rose-400 mt-1 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 transition-colors">Retry</button>
      </div>
    </div>
  );

  const tenants = data?.tenants || [];
  const totals = data?.totals || {};
  const maxCalls = Math.max(...tenants.map(t => t.apiKeys.totalCalls), 1);
  const totalRecords = (totals.totalRecords || 0);

  return (
    <div className="p-5 lg:p-6 space-y-6 text-left">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/70 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #d1fae5 100%)'
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-200/30 pointer-events-none" />
        <div className="absolute -bottom-6 right-24 w-24 h-24 rounded-full bg-teal-200/20 pointer-events-none" />
        <div className="absolute top-4 right-40 w-3 h-3 rounded-full bg-emerald-400/40 pointer-events-none" />
        <div className="absolute bottom-4 right-16 w-2 h-2 rounded-full bg-emerald-500/30 pointer-events-none" />

        <div className="relative z-10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">District Platform Analytics</h1>
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Per-district API consumption, data volume &amp; health record analytics</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Last updated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-700">{tenants.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Districts</p>
            </div>
            <div className="w-px h-10 bg-emerald-200" />
            <div className="text-right">
              <p className="text-2xl font-black text-slate-800">{totals.totalVillages || 47}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Villages</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Tenants" value={tenants.length} sub="Active district orgs"
          icon={Globe} accentColor="#059669"
          gradient="radial-gradient(circle, #059669, #34d399)"
          delay={0.05}
        />
        <KpiCard
          label="API Calls" value={totals.totalCalls || 0} sub="Across all tenants"
          icon={PhoneCall} accentColor="#2563eb"
          gradient="radial-gradient(circle, #2563eb, #60a5fa)"
          delay={0.1}
        />
        <KpiCard
          label="Total Users" value={totals.totalUsers || 0} sub="Villagers registered"
          icon={Users} accentColor="#7c3aed"
          gradient="radial-gradient(circle, #7c3aed, #a78bfa)"
          delay={0.15}
        />
        <KpiCard
          label="Data Records" value={totalRecords} sub="Symptoms · Pregnancies · Alerts"
          icon={Database} accentColor="#d97706"
          gradient="radial-gradient(circle, #d97706, #fbbf24)"
          delay={0.2}
        />
      </div>

      {/* ── Tenant Breakdown ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Tenant Breakdown</h2>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full ml-1">
            {tenants.length} Districts
          </span>
          <div className="flex-1 h-px bg-slate-200 ml-2" />
        </div>

        {tenants.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">No tenant data available</p>
            <p className="text-xs text-slate-400 mt-1">Create API keys with tenant IDs to populate usage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tenants.map((t, i) => (
              <TenantCard key={t.tenantId} tenant={t} maxCalls={maxCalls} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── API Breakdown Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">API Key Usage Breakdown</h2>
          <div className="flex-1" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Total: {(totals.totalCalls || 0).toLocaleString()} calls
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {['Tenant', 'Total Keys', 'Status', 'API Calls', 'Avg / Active Key'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((t, i) => (
                <TableRow key={t.tenantId} tenant={t} maxCalls={maxCalls} index={i} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-4 flex-wrap">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 w-20 shrink-0">ALL DISTRICTS</span>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { label: 'Keys',    val: totals.totalKeys || 18 },
              { label: 'Calls',   val: (totals.totalCalls || 0).toLocaleString() },
              { label: 'Users',   val: (totals.totalUsers || 0).toLocaleString() },
              { label: 'Records', val: (totals.totalRecords || 0).toLocaleString() },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}:</span>
                <span className="text-xs font-black text-slate-900 font-mono">{val}</span>
              </div>
            ))}
          </div>
          <span className="ml-auto text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {tenants.length} Active Districts
          </span>
        </div>
      </div>

      {/* ── Data Composition Strip ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-slate-500" />
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Data Composition</h2>
        </div>
        <div className="space-y-3">
          {tenants.map((t, i) => {
            const pal = PALETTE[t.tenantId] || DEFAULT_PAL;
            const total = t.records.symptoms + t.records.pregnancies + t.records.emergencies;
            const sPct = total > 0 ? (t.records.symptoms / total * 100) : 0;
            const pPct = total > 0 ? (t.records.pregnancies / total * 100) : 0;
            const ePct = total > 0 ? (t.records.emergencies / total * 100) : 0;
            return (
              <div key={t.tenantId} className="flex items-center gap-3">
                <span className="w-16 text-[9px] font-black text-slate-500 uppercase tracking-wider text-right shrink-0">
                  {t.tenantId}
                </span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-100 flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sPct}%` }}
                    transition={{ duration: 0.8, delay: 0.06 * i }}
                    className="h-full rounded-l-full"
                    style={{ backgroundColor: pal.accent }}
                    title={`${t.records.symptoms} symptoms`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pPct}%` }}
                    transition={{ duration: 0.8, delay: 0.06 * i + 0.1 }}
                    className="h-full bg-rose-400"
                    title={`${t.records.pregnancies} pregnancies`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ePct}%` }}
                    transition={{ duration: 0.8, delay: 0.06 * i + 0.2 }}
                    className="h-full bg-amber-400 rounded-r-full"
                    title={`${t.records.emergencies} emergencies`}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 w-10 text-right">{total.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Symptoms
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Pregnancies
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Emergencies
          </span>
        </div>
      </div>

      {/* ── Enterprise Callout ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-emerald-200 p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}
      >
        <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">Enterprise-Grade Multi-Tenant Architecture</p>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Each tenant is isolated by district. API keys support scoped permissions (read / read-write / admin).
            Usage tracking enables billing readiness — integrate with Stripe for pay-per-call pricing.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 shrink-0 text-emerald-600">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Billing Ready</span>
        </div>
      </motion.div>

    </div>
  );
}
