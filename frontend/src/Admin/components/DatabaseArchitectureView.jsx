import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Server, GitBranch, Clock, Hash, BarChart3,
  Shield, Zap, Layers, Table, Search, Globe, Activity,
  ArrowRight, CheckCircle2, ChevronRight, Cpu, Lock
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────── */
const AURORA_TABLES = [
  { name: 'village_health',     rows: '84',    badge: 'Master Registry', purpose: 'Village GPS, demographics, ASHA contacts', cols: 12, indexes: 1,  highlight: 'emerald' },
  { name: 'users',              rows: '1.2K+', badge: 'Auth',            purpose: 'Villager/ASHA/admin registry, Aadhaar masked', cols: 10, indexes: 2,  highlight: 'blue' },
  { name: 'pregnancy_data',     rows: '380+',  badge: 'Maternal',        purpose: 'Vitals, AI risk scoring, offline-sync dedup', cols: 13, indexes: 2,  highlight: 'rose' },
  { name: 'malnutrition_data',  rows: '248+',  badge: 'Child Health',    purpose: 'WHO Z-score malnutrition tracking', cols: 8,  indexes: 2,  highlight: 'amber' },
  { name: 'symptoms',           rows: '890+',  badge: 'Surveillance',    purpose: 'Disease prediction, confidence scores, AI model', cols: 9,  indexes: 3,  highlight: 'purple' },
  { name: 'ambulance_requests', rows: '450+',  badge: 'Emergency',       purpose: 'SOS + pad requests with priority triage', cols: 9,  indexes: 2,  highlight: 'red' },
  { name: 'vaccination_records',rows: '200+',  badge: 'Immunization',    purpose: 'Mission Indradhanush schedule tracker', cols: 10, indexes: 1,  highlight: 'teal' },
  { name: 'referrals',          rows: '150+',  badge: 'Referral',        purpose: 'ASHA → PHC lifecycle tracking', cols: 10, indexes: 2,  highlight: 'indigo' },
  { name: 'audit_logs',         rows: '5K+',   badge: 'Compliance',      purpose: 'DPDP Act audit trail, full traceability', cols: 8,  indexes: 0,  highlight: 'slate' },
  { name: 'asha_performance',   rows: '60+',   badge: 'Impact',          purpose: 'Monthly ASHA KPIs for NGO reporting', cols: 7,  indexes: 1,  highlight: 'emerald' },
  { name: 'government_schemes', rows: '20',    badge: 'Policy',          purpose: '20 verified Indian health schemes catalog', cols: 14, indexes: 1,  highlight: 'blue' },
  { name: 'api_keys',           rows: 'SaaS',  badge: 'Enterprise',      purpose: 'Per-tenant API keys with usage tracking', cols: 10, indexes: 1,  highlight: 'violet' },
];

const AURORA_COLUMNS = {
  village_health:     ['id (PK)', 'villageId ★', 'name', 'population', 'pregnant_women', 'children_under_5', 'malnutrition_cases', 'outbreakAlert', 'districtId', 'lat', 'lng', 'created_at'],
  users:              ['id (PK)', 'phone ★', 'email ★', 'name', 'role', 'villageId (FK)', 'gender', 'age', 'economic_status', 'aadhaar_hash'],
  pregnancy_data:     ['id (PK)', 'name', 'age', 'trimester', 'dueDate', 'riskLevel', 'villageId', 'systolic_bp', 'diastolic_bp', 'bs', 'body_temp', 'heart_rate', 'client_request_id ★'],
  malnutrition_data:  ['id (PK)', 'childName', 'ageMonths', 'weight', 'height', 'status', 'villageId', 'client_request_id ★'],
  symptoms:           ['id (PK)', 'userId', 'villageId', 'symptoms', 'prediction', 'disease', 'confidence', 'model_used', 'client_request_id ★'],
  ambulance_requests: ['id (PK)', 'user_id', 'name', 'location', 'priority', 'type', 'request_type', 'status', 'client_request_id ★'],
  vaccination_records:['id (PK)', 'child_name', 'parent_phone', 'vaccine_name', 'scheduled_date', 'given_date', 'status', 'villageId (FK)', 'recorded_by (FK)', 'client_request_id ★'],
  referrals:          ['id (PK)', 'patient_name', 'villageId', 'referred_by', 'referred_to', 'reason', 'priority', 'status', 'outcome', 'client_request_id ★'],
  audit_logs:         ['id (PK)', 'user_id', 'action', 'resource', 'resource_id', 'ip_address', 'trace_id', 'created_at'],
  asha_performance:   ['id (PK)', 'asha_id (FK)', 'month', 'referrals_count', 'pregnancies_tracked', 'vaccinations_completed', 'emergencies_reported'],
  government_schemes: ['id (PK)', 'name ★', 'name_hi', 'description', 'benefit', 'category', 'min_age', 'max_age', 'gender_eligibility', 'caste_eligibility', 'economic_status_eligibility', 'required_documents', 'steps', 'official_url'],
  api_keys:           ['id (PK)', 'key_id ★', 'name', 'tenant_id', 'created_by (FK)', 'last_used_at', 'expires_at', 'is_active', 'permissions', 'usage_count'],
};

const DYNAMO_TABLES = [
  { name: 'outbreak_telemetry',  pk: 'villageId',  sk: 'detectedAt',  ttl: '90d',   rows: '98+',   gsis: 3, purpose: 'Disease surveillance time-series. Sharded GSI prevents hot partitions.', billing: 'PAY_PER_REQUEST' },
  { name: 'sync_queues',         pk: 'deviceId',   sk: 'queuedAt',    ttl: '30d',   rows: '256K+', gsis: 1, purpose: 'Offline-first replay queue for 84 ASHA devices across all villages.', billing: 'PAY_PER_REQUEST' },
  { name: 'village_node_state',  pk: 'villageId',  sk: '—',           ttl: '7d',    rows: '84',    gsis: 1, purpose: 'Heartbeat store for real-time offline village monitoring.', billing: 'PAY_PER_REQUEST' },
  { name: 'emergency_streams',   pk: 'districtId', sk: 'streamId',    ttl: '365d',  rows: '200+',  gsis: 2, purpose: 'Real-time emergency event stream for ambulance dispatch & maternal alerts.', billing: 'PAY_PER_REQUEST' },
  { name: 'security_audit_logs', pk: 'actor',      sk: 'timestamp',   ttl: '7yr',   rows: '1K+',   gsis: 0, purpose: 'DPDP Act compliance log with 7-year retention for medical regulatory audit.', billing: 'PAY_PER_REQUEST' },
];

const ACCESS_PATTERNS = [
  { pattern: 'Recent outbreaks, all villages',   store: 'DynamoDB', table: 'outbreak_telemetry',   idx: 'gsikey-time-index',    freq: 'Every 30s' },
  { pattern: 'Outbreaks by disease',             store: 'DynamoDB', table: 'outbreak_telemetry',   idx: 'disease-index',        freq: 'On demand' },
  { pattern: 'Outbreaks by district',            store: 'DynamoDB', table: 'outbreak_telemetry',   idx: 'district-time-index',  freq: 'On demand' },
  { pattern: 'Patient records by village',       store: 'Aurora',   table: 'pregnancy, malnutrition, symptoms', idx: 'village indexes', freq: 'Every req' },
  { pattern: 'Ambulance requests by status',     store: 'Aurora',   table: 'ambulance_requests',   idx: 'idx_ambulance_status', freq: 'Every 30s' },
  { pattern: 'User login by phone',              store: 'Aurora',   table: 'users',                idx: 'phone UNIQUE',         freq: 'Every auth' },
  { pattern: 'Village health demographics',      store: 'Aurora',   table: 'village_health',       idx: 'villageId UNIQUE',     freq: 'Dash load' },
  { pattern: 'Emergencies by district + date',   store: 'DynamoDB', table: 'emergency_streams',    idx: 'district-date-index',  freq: 'On demand' },
  { pattern: 'Critical emergencies (SSE)',        store: 'DynamoDB', table: 'emergency_streams',    idx: 'priority-index',       freq: 'Real-time' },
  { pattern: 'Sync queue by device',             store: 'DynamoDB', table: 'sync_queues',          idx: '(deviceId, queuedAt)', freq: 'Every sync' },
  { pattern: 'Village offline/online state',     store: 'DynamoDB', table: 'village_node_state',   idx: 'villageId',            freq: 'Every 30s' },
  { pattern: 'ASHA monthly performance',         store: 'Aurora',   table: 'asha_performance',     idx: 'UNIQUE(asha_id,month)', freq: 'Monthly' },
  { pattern: 'Security audit trail',             store: 'Both',     table: 'security_audit_logs',  idx: '(actor, timestamp)',   freq: 'Compliance' },
  { pattern: 'API key auth + usage',             store: 'Aurora',   table: 'api_keys',             idx: 'key_id UNIQUE',        freq: 'Every call' },
];

const TTL_POLICIES = [
  { table: 'outbreak_telemetry',  ttl: '90 days',  bar: 15,  color: '#f59e0b', reason: 'Outbreak data >90 days is not actionable' },
  { table: 'sync_queues',         ttl: '30 days',  bar: 5,   color: '#3b82f6', reason: 'Stale sync items should not be retried' },
  { table: 'village_node_state',  ttl: '7 days',   bar: 2,   color: '#10b981', reason: 'Auto-expire inactive nodes; heartbeat refreshes' },
  { table: 'emergency_streams',   ttl: '365 days', bar: 60,  color: '#ef4444', reason: 'Annual compliance review retention' },
  { table: 'security_audit_logs', ttl: '7 years',  bar: 100, color: '#7c3aed', reason: 'DPDP Act mandates 7-yr medical audit retention' },
];

const FLOW_STAGES = [
  { id: 'asha', label: 'Villager / ASHA', sub: 'Offline-first PWA', color: '#059669', light: '#ecfdf5', border: '#a7f3d0', items: ['Symptom check', 'Maternal record', 'Emergency SOS', 'IndexedDB queue'] },
  { id: 'api',  label: 'Node.js API',     sub: 'Express + EventEmitter', color: '#2563eb', light: '#eff6ff', border: '#bfdbfe', items: ['ACID write → Aurora', 'Async → DynamoDB', 'SSE broadcast', 'DLQ retry'] },
  { id: 'aurora', label: 'Aurora PostgreSQL', sub: 'Source of Truth', color: '#065f46', light: '#d1fae5', border: '#6ee7b7', items: ['12 ACID tables', 'FK integrity', 'Trigger audit', 'Idempotent sync'] },
  { id: 'dynamo', label: 'DynamoDB', sub: 'Hot-Path Telemetry', color: '#92400e', light: '#fef3c7', border: '#fcd34d', items: ['5 tables, 8 GSIs', 'TTL auto-expire', '256K+ sync items', 'PAY_PER_REQUEST'] },
  { id: 'dash',  label: 'Admin Dashboard', sub: 'Real-time SSE', color: '#5b21b6', light: '#f5f3ff', border: '#ddd6fe', items: ['Command Center', 'Outbreak Radar', 'Risk Intel', 'System Status'] },
];

const HIGHLIGHT_COLORS = {
  emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', dot: '#10b981' },
  blue:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  rose:    { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#f43f5e' },
  amber:   { bg: '#fffbeb', border: '#fde68a', text: '#78350f', dot: '#f59e0b' },
  purple:  { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6' },
  red:     { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', dot: '#ef4444' },
  teal:    { bg: '#f0fdfa', border: '#99f6e4', text: '#134e4a', dot: '#14b8a6' },
  indigo:  { bg: '#eef2ff', border: '#c7d2fe', text: '#312e81', dot: '#6366f1' },
  slate:   { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', dot: '#64748b' },
  violet:  { bg: '#fdf4ff', border: '#e9d5ff', text: '#581c87', dot: '#a855f7' },
};

/* ─── Tiny sub-components ─────────────────────────────────────────────── */
function StoreBadge({ store }) {
  if (store === 'DynamoDB') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[8px] font-black text-amber-700">⚡ Dynamo</span>
  );
  if (store === 'Both') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded text-[8px] font-black text-violet-700">⚡🗄 Both</span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[8px] font-black text-emerald-700">🗄 Aurora</span>
  );
}

function TabBtn({ id, label, icon: Icon, active, count, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-white border border-slate-200 text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count && (
        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function DatabaseArchitectureView() {
  const [tab, setTab] = useState('aurora');
  const [selectedTable, setSelectedTable] = useState(null);

  const selectedAurora = AURORA_TABLES.find(t => t.name === selectedTable);
  const selectedDynamo = DYNAMO_TABLES.find(t => t.name === selectedTable);

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">

      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-emerald-200/70 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #d1fae5 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-200/25 pointer-events-none" />
        <div className="absolute top-3 right-40 w-2.5 h-2.5 rounded-full bg-emerald-400/35 pointer-events-none" />
        <div className="absolute bottom-3 right-20 w-2 h-2 rounded-full bg-teal-400/25 pointer-events-none" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center">
              <Database className="w-5.5 h-5.5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Database Architecture</h1>
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full">ap-south-1</span>
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-full">Mumbai</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Aurora PostgreSQL + DynamoDB · Purpose-built dual-store · PAY_PER_REQUEST billing</p>
            </div>
          </div>
          {/* KPI strip */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { val: '12', label: 'Aurora Tables', color: '#059669' },
              { val: '5',  label: 'DynamoDB Tables', color: '#d97706' },
              { val: '8',  label: 'GSIs', color: '#7c3aed' },
              { val: '5',  label: 'TTL Policies', color: '#dc2626' },
              { val: '256K+', label: 'Sync Items', color: '#2563eb' },
            ].map(k => (
              <div key={k.label} className="text-right">
                <p className="text-lg font-black leading-none" style={{ color: k.color }}>{k.val}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why Two Databases — always visible strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: 'Aurora PostgreSQL', sub: 'Source of Truth', color: '#059669', light: '#ecfdf5', border: '#a7f3d0', icon: Server,
            points: ['ACID-compliant medical records with FK integrity', 'Idempotent offline sync via conditional UNIQUE indexes', 'Updated-at triggers for full audit trail compliance'] },
          { title: 'DynamoDB', sub: 'Hot-Path Operational Store', color: '#d97706', light: '#fffbeb', border: '#fde68a', icon: Zap,
            points: ['Single-digit-ms telemetry at scale — no joins needed', 'Sharded GSIs (10-shard) eliminate hot partition risk', 'TTL auto-expiry keeps costs minimal — PAY_PER_REQUEST'] },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: s.light, borderColor: s.border }}>
              <div className="w-9 h-9 rounded-xl bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: s.border }}>
                <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{s.title}</p>
                  <span className="text-[9px] font-bold text-slate-400">{s.sub}</span>
                </div>
                <ul className="space-y-1">
                  {s.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: s.color }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-slate-100/80 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <TabBtn id="aurora"   label="Aurora Tables"    icon={Server}    active={tab==='aurora'}   count="12" onClick={setTab} />
        <TabBtn id="dynamo"   label="DynamoDB Tables"  icon={Zap}       active={tab==='dynamo'}   count="5"  onClick={setTab} />
        <TabBtn id="patterns" label="Access Patterns"  icon={Search}    active={tab==='patterns'} count="14" onClick={setTab} />
        <TabBtn id="ttl"      label="TTL Policies"     icon={Clock}     active={tab==='ttl'}      count="5"  onClick={setTab} />
        <TabBtn id="flow"     label="Data Flow"        icon={GitBranch} active={tab==='flow'}            onClick={setTab} />
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >

          {/* AURORA TAB */}
          {tab === 'aurora' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: table list */}
              <div className="lg:col-span-1 space-y-1.5">
                {AURORA_TABLES.map(t => {
                  const c = HIGHLIGHT_COLORS[t.highlight] || HIGHLIGHT_COLORS.slate;
                  const isSelected = selectedTable === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTable(isSelected ? null : t.name)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:shadow-sm"
                      style={{
                        background: isSelected ? c.bg : 'white',
                        borderColor: isSelected ? c.border : '#e2e8f0',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black" style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.dot }}>
                        {t.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-800 font-mono truncate">{t.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{t.badge}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black" style={{ color: c.dot }}>{t.rows}</p>
                        <p className="text-[8px] text-slate-400">rows</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" style={{ color: isSelected ? c.dot : undefined }} />
                    </button>
                  );
                })}
              </div>

              {/* Right: detail / overview */}
              <div className="lg:col-span-2">
                {selectedAurora ? (() => {
                  const c = HIGHLIGHT_COLORS[selectedAurora.highlight] || HIGHLIGHT_COLORS.slate;
                  const cols = AURORA_COLUMNS[selectedAurora.name] || [];
                  return (
                    <motion.div
                      key={selectedAurora.name}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl border shadow-sm overflow-hidden h-full"
                      style={{ borderColor: c.border }}
                    >
                      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${c.dot}, ${c.dot}60)` }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.dot }}>
                              {selectedAurora.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 font-mono">{selectedAurora.name}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: c.dot }}>{selectedAurora.badge}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black" style={{ color: c.dot }}>{selectedAurora.rows}</p>
                            <p className="text-[9px] text-slate-400 font-bold">records</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mb-4">{selectedAurora.purpose}</p>
                        <div className="mb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Schema Columns ({cols.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {cols.map(col => (
                              <span
                                key={col}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
                                style={col.includes('★') || col.includes('(PK)') || col.includes('(FK)')
                                  ? { background: c.bg, borderColor: c.border, color: c.text }
                                  : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }
                                }
                              >
                                {col.replace(' ★', ' 🔑')}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl p-3 text-center border" style={{ background: c.bg, borderColor: `${c.border}80` }}>
                            <p className="text-lg font-black" style={{ color: c.dot }}>{selectedAurora.cols}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Columns</p>
                          </div>
                          <div className="rounded-xl p-3 text-center border" style={{ background: c.bg, borderColor: `${c.border}80` }}>
                            <p className="text-lg font-black" style={{ color: c.dot }}>{selectedAurora.indexes}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Indexes</p>
                          </div>
                          <div className="rounded-xl p-3 text-center border" style={{ background: c.bg, borderColor: `${c.border}80` }}>
                            <p className="text-xs font-black" style={{ color: c.dot }}>ACID</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Guarantee</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })() : (
                  <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
                      <Server className="w-6 h-6 text-emerald-700" />
                    </div>
                    <p className="font-black text-slate-700 text-sm mb-1">Aurora PostgreSQL</p>
                    <p className="text-xs text-slate-500 font-medium mb-4">12 ACID-compliant tables · ap-south-1</p>
                    <p className="text-[10px] text-slate-400 font-medium max-w-xs">
                      Click any table on the left to inspect its schema, column count, indexes, and purpose.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-xs">
                      {[['12', 'Tables'], ['~3K+', 'Total Rows'], ['FK', 'Integrity']].map(([v, l]) => (
                        <div key={l} className="bg-white rounded-xl border border-emerald-200 p-2.5 text-center">
                          <p className="text-base font-black text-emerald-700">{v}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DYNAMO TAB */}
          {tab === 'dynamo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {DYNAMO_TABLES.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-white rounded-2xl border border-amber-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-300/60" />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 font-mono leading-tight">{t.name}</p>
                          <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">{t.billing}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-amber-700">{t.rows}</p>
                        <p className="text-[8px] text-slate-400 font-bold">items</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 font-medium mb-3 leading-relaxed">{t.purpose}</p>

                    {/* Keys */}
                    <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 mb-3">
                      <div className="flex items-center gap-3 text-[9px]">
                        <div>
                          <span className="text-amber-500 font-black uppercase">HASH</span>
                          <span className="ml-1 font-mono font-bold text-slate-700">{t.pk}</span>
                        </div>
                        {t.sk !== '—' && (
                          <>
                            <span className="text-amber-300">·</span>
                            <div>
                              <span className="text-amber-500 font-black uppercase">RANGE</span>
                              <span className="ml-1 font-mono font-bold text-slate-700">{t.sk}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-rose-400" />
                        <span className="font-bold text-slate-600">TTL:</span>
                        <span className="font-mono font-black text-rose-600">{t.ttl}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-slate-600">GSIs:</span>
                        <span className="font-black text-amber-700">{t.gsis}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* GSI summary card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-5 flex flex-col justify-center"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <p className="font-black text-slate-800 text-xs uppercase tracking-wider">GSI Summary</p>
                </div>
                <div className="space-y-2">
                  {DYNAMO_TABLES.map(t => (
                    <div key={t.name} className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-slate-600 w-28 truncate">{t.name.replace('_', '_\u200b')}</span>
                      <div className="flex-1 flex gap-0.5">
                        {Array.from({ length: t.gsis }).map((_, i) => (
                          <div key={i} className="h-3 flex-1 rounded-sm bg-amber-400" />
                        ))}
                        {Array.from({ length: Math.max(0, 3 - t.gsis) }).map((_, i) => (
                          <div key={i} className="h-3 flex-1 rounded-sm bg-slate-100" />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-amber-700 w-3">{t.gsis}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <p className="text-[9px] font-bold text-amber-700 text-center">8 Total GSIs · Sharded to prevent hot partitions</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* ACCESS PATTERNS TAB */}
          {tab === 'patterns' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Search className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span className="font-black text-slate-800 text-sm uppercase tracking-wider">Query Access Patterns</span>
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black uppercase tracking-wider rounded-full ml-1">14 Patterns</span>
                <div className="flex-1" />
                <span className="text-[9px] font-bold text-slate-400">Optimised for each workload</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {['#', 'Access Pattern', 'Store', 'Table', 'Index / GSI', 'Frequency'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACCESS_PATTERNS.map((ap, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * i }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-[9px] font-bold text-slate-300">{i + 1}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{ap.pattern}</td>
                        <td className="px-4 py-3"><StoreBadge store={ap.store} /></td>
                        <td className="px-4 py-3"><code className="text-[9px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{ap.table}</code></td>
                        <td className="px-4 py-3"><code className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{ap.idx}</code></td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                            ap.freq === 'Real-time' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            ap.freq === 'Every 30s' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ap.freq === 'Every auth' || ap.freq === 'Every req' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>{ap.freq}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TTL TAB */}
          {tab === 'ttl' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">DynamoDB TTL Lifecycle Policies</h2>
                  <div className="flex-1 h-px bg-slate-200 ml-2" />
                  <span className="text-[9px] font-bold text-slate-400">Auto-expire · Zero maintenance</span>
                </div>
                <div className="space-y-4">
                  {TTL_POLICIES.map((p, i) => (
                    <motion.div
                      key={p.table}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-36 shrink-0">
                        <p className="text-[9px] font-black font-mono text-slate-700 truncate">{p.table}</p>
                      </div>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.bar}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 * i }}
                          className="h-full rounded-full flex items-center pl-2"
                          style={{ backgroundColor: p.color }}
                        >
                          <span className="text-[8px] font-black text-white whitespace-nowrap">{p.ttl}</span>
                        </motion.div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium w-48 shrink-0">{p.reason}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Shield, color: '#059669', light: '#ecfdf5', border: '#a7f3d0', title: 'DPDP Act Compliant', desc: '7-year retention on security audit logs per India Data Protection rules' },
                  { icon: Activity, color: '#d97706', light: '#fffbeb', border: '#fde68a', title: 'Cost Optimised', desc: 'Automatic item deletion — no Lambda or cron jobs needed for cleanup' },
                  { icon: Cpu, color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', title: 'Purpose-built Retention', desc: 'Each TTL window tuned to the operational lifecycle of that data type' },
                ].map(({ icon: Icon, color, light, border, title, desc }) => (
                  <div key={title} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: light, borderColor: border }}>
                    <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: border }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 mb-0.5">{title}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FLOW TAB */}
          {tab === 'flow' && (
            <div className="space-y-4">
              {/* Pipeline stages */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Data Flow Pipeline</h2>
                  <div className="flex-1 h-px bg-slate-200 ml-2" />
                  <span className="text-[9px] font-bold text-slate-400">Village → Cloud → Dashboard</span>
                </div>
                <div className="flex items-start gap-2 overflow-x-auto pb-2">
                  {FLOW_STAGES.map((stage, i) => (
                    <div key={stage.id} className="flex items-start shrink-0">
                      <div className="w-36">
                        <div className="rounded-2xl border p-3 text-center" style={{ background: stage.light, borderColor: stage.border }}>
                          <div className="w-8 h-8 rounded-xl bg-white border shadow-sm flex items-center justify-center mx-auto mb-2" style={{ borderColor: stage.border }}>
                            <span className="text-sm">{['👩‍⚕️','⚡','🗄️','⚡','🖥️'][i]}</span>
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-800 leading-tight mb-0.5">{stage.label}</p>
                          <p className="text-[8px] font-bold mb-2" style={{ color: stage.color }}>{stage.sub}</p>
                          <div className="space-y-0.5">
                            {stage.items.map(item => (
                              <p key={item} className="text-[8px] font-medium text-slate-600 bg-white/80 rounded px-1 py-0.5 border border-white">{item}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      {i < FLOW_STAGES.length - 1 && (
                        <div className="flex items-center pt-12 px-1">
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Event flows grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Key Event Flows</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { label: 'Village Offline', flow: ['IndexedDB', 'POST /sync-health', 'Aurora PostgreSQL'], type: 'Offline-first sync', color: '#059669', bg: '#ecfdf5' },
                    { label: 'Symptom Check', flow: ['ASHA App', 'Node.js API', 'Aurora + DynamoDB'], type: 'Dual-write', color: '#d97706', bg: '#fffbeb' },
                    { label: 'Outbreak Detected', flow: ['OutbreakAgent', 'DynamoDB outbreak_telemetry', 'SSE → Dashboard'], type: 'AI-driven async', color: '#dc2626', bg: '#fff1f2' },
                    { label: 'Emergency SOS', flow: ['Villager SOS', 'Aurora ambulance_requests', 'DynamoDB emergency_streams'], type: 'ACID + stream', color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'API Key Auth', flow: ['Enterprise Client', 'Aurora api_keys', 'Scoped query'], type: 'Enterprise SaaS', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Audit Log', flow: ['Any action', 'DynamoDB security_audit_logs', 'Aurora audit_logs'], type: 'Dual compliance', color: '#475569', bg: '#f8fafc' },
                  ].map(({ label, flow, type, color, bg }) => (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: bg, borderColor: `${color}30` }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-black text-slate-800">{label}</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>{type}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {flow.map((step, i) => (
                            <span key={step} className="flex items-center gap-1">
                              <code className="text-[8px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-1 py-0.5 rounded">{step}</code>
                              {i < flow.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-300" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Footer ── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <code className="text-[10px] font-mono text-slate-500 flex-1">
          Aurora PostgreSQL <span className="text-emerald-700 font-bold">12 tables</span> ·
          DynamoDB <span className="text-amber-700 font-bold">5 tables, 8 GSIs</span> ·
          Region <span className="text-slate-700 font-bold">ap-south-1</span> ·
          Billing <span className="text-violet-700 font-bold">PAY_PER_REQUEST</span> ·
          Compliance <span className="text-rose-700 font-bold">DPDP Act 7-yr audit retention</span>
        </code>
      </div>

    </div>
  );
}
