import { Database, Server, GitBranch, ArrowRight, Clock, Hash, BarChart3, Shield, Zap, Layers, Table, Search, Globe, TrendingUp, Activity, Users } from 'lucide-react';

const AURORA_TABLES = [
  { name: 'village_health', purpose: 'Master registry of 84 villages with health demographics, GPS, and ASHA contacts.', cols: ['id (PK)', 'villageId (UNIQUE)', 'name', 'population', 'pregnant_women', 'children_under_5', 'malnutrition_cases', 'outbreakAlert', 'districtId', 'lat', 'lng'], indexes: ['villageId UNIQUE'], rowEstimate: '84 villages' },
  { name: 'users', purpose: 'User registry (villager, ASHA/ngo, admin) with Aadhaar masking and role-based access.', cols: ['id (PK)', 'phone (UNIQUE)', 'email (UNIQUE)', 'name', 'role', 'villageId (FK)', 'gender', 'age', 'economic_status', 'aadhaar_hash'], indexes: ['phone UNIQUE', 'email UNIQUE'], rowEstimate: '1,200+ users' },
  { name: 'pregnancy_data', purpose: 'Maternal health records with vitals, AI risk assessment, offline-sync dedup.', cols: ['id (PK)', 'name', 'age', 'trimester', 'dueDate', 'riskLevel', 'villageId', 'systolic_bp', 'diastolic_bp', 'bs', 'body_temp', 'heart_rate', 'client_request_id (UNIQUE)'], indexes: ['idx_pregnancy_village', 'idx_pregnancy_client_request'], rowEstimate: '380+ pregnancies' },
  { name: 'malnutrition_data', purpose: 'Child malnutrition tracking with WHO Z-score based assessment.', cols: ['id (PK)', 'childName', 'ageMonths', 'weight', 'height', 'status', 'villageId', 'client_request_id (UNIQUE)'], indexes: ['idx_malnut_village', 'idx_malnutrition_client_request'], rowEstimate: '248+ cases' },
  { name: 'symptoms', purpose: 'Disease symptom check records driving outbreak detection clustering.', cols: ['id (PK)', 'userId', 'villageId', 'symptoms', 'prediction', 'disease', 'confidence', 'model_used', 'client_request_id (UNIQUE)'], indexes: ['idx_symptoms_villageid', 'idx_symptoms_userid', 'idx_symptoms_createdat'], rowEstimate: '890+ records' },
  { name: 'ambulance_requests', purpose: 'Unified ambulance + pad request table with priority triaging.', cols: ['id (PK)', 'user_id', 'name', 'location', 'priority', 'type', 'request_type', 'status', 'client_request_id (UNIQUE)'], indexes: ['idx_ambulance_userid', 'idx_ambulance_status'], rowEstimate: '450+ requests' },
  { name: 'vaccination_records', purpose: 'Child vaccination tracking against Mission Indradhanush schedule.', cols: ['id (PK)', 'child_name', 'parent_phone', 'vaccine_name', 'scheduled_date', 'given_date', 'status', 'villageId (FK)', 'recorded_by (FK)', 'client_request_id (UNIQUE)'], indexes: ['idx_vaccination_client_request'], rowEstimate: '200+ records' },
  { name: 'referrals', purpose: 'Patient referral tracking from ASHA to PHC/hospital with full lifecycle.', cols: ['id (PK)', 'patient_name', 'villageId', 'referred_by', 'referred_to', 'reason', 'priority', 'status', 'outcome', 'client_request_id (UNIQUE)'], indexes: ['idx_referrals_village', 'idx_referrals_status'], rowEstimate: '150+ referrals' },
  { name: 'audit_logs', purpose: 'Application-level audit trail for compliance with India DPDP Act.', cols: ['id (PK)', 'user_id', 'action', 'resource', 'resource_id', 'ip_address', 'trace_id', 'created_at'], indexes: [], rowEstimate: '5,000+ logs' },
  { name: 'asha_performance', purpose: 'Monthly ASHA performance metrics for NGO impact reports.', cols: ['id (PK)', 'asha_id (FK)', 'month', 'referrals_count', 'pregnancies_tracked', 'vaccinations_completed', 'emergencies_reported'], indexes: ['UNIQUE(asha_id, month)'], rowEstimate: '60+ records' },
  { name: 'government_schemes', purpose: 'Catalog of 20 verified Indian government healthcare schemes.', cols: ['id (PK)', 'name (UNIQUE)', 'name_hi', 'description', 'benefit', 'category', 'min_age', 'max_age', 'gender_eligibility', 'caste_eligibility', 'economic_status_eligibility', 'required_documents', 'steps', 'official_url'], indexes: ['name UNIQUE'], rowEstimate: '20 schemes' },
  { name: 'api_keys', purpose: 'B2B API key management with per-tenant scoping and usage tracking.', cols: ['id (PK)', 'key_id (UNIQUE)', 'name', 'tenant_id', 'created_by (FK)', 'last_used_at', 'expires_at', 'is_active', 'permissions', 'usage_count'], indexes: ['key_id UNIQUE'], rowEstimate: 'Enterprise feature' },
];

const DYNAMO_TABLES = [
  { name: 'outbreak_telemetry', purpose: 'Primary outbreak/symptom telemetry store. Powers disease surveillance, time-series scan, and district-level queries.', pk: 'villageId (HASH)', sk: 'detectedAt (RANGE)', ttl: '90 days', billing: 'PAY_PER_REQUEST', rowEstimate: '98+ events', gsis: [
    { name: 'gsikey-time-index', pk: '_gsikey (10 shards)', sk: 'detectedAt', purpose: 'Parallel time-series scan across all villages. Sharded to avoid hot partitions.' },
    { name: 'disease-index', pk: 'disease', sk: 'detectedAt', purpose: 'Query all outbreaks of a specific disease within a time range.' },
    { name: 'district-time-index', pk: 'districtId', sk: 'detectedAt', purpose: 'Query all outbreaks in a specific district.' },
  ]},
  { name: 'sync_queues', purpose: 'Device sync status and offline-to-online replay queue. Servers as telemetry log for fleet management.', pk: 'deviceId (HASH)', sk: 'queuedAt (RANGE)', ttl: '30 days', billing: 'PAY_PER_REQUEST', rowEstimate: '256K+ items', gsis: [
    { name: 'status-index', pk: 'status', sk: 'queuedAt', purpose: 'Query failed/telemetry/synced items across entire fleet.' },
  ]},
  { name: 'village_node_state', purpose: 'Per-village heartbeat/state store for real-time offline village monitoring.', pk: 'villageId (HASH)', sk: '— (HASH only)', ttl: '7 days', billing: 'PAY_PER_REQUEST', rowEstimate: '84 villages', gsis: [
    { name: 'all-nodes-index', pk: '_gsiPk (sharded)', sk: '—', purpose: 'List all village node states via sharded partition key for aggregate queries.' },
  ]},
  { name: 'emergency_streams', purpose: 'Real-time emergency event stream for ambulance dispatches and maternal alerts.', pk: 'districtId (HASH)', sk: 'streamId (RANGE)', ttl: '365 days', billing: 'PAY_PER_REQUEST', rowEstimate: '200+ events', gsis: [
    { name: 'priority-index', pk: 'priority', sk: 'streamId', purpose: 'Filter emergency events by priority (Critical/High/Medium) for triage.' },
    { name: 'district-date-index', pk: 'districtDateBucket', sk: 'timestamp', purpose: 'Query emergencies in district X on date Y with parallel day-bucket queries.' },
  ]},
  { name: 'security_audit_logs', purpose: 'Security audit trail for DPDP Act compliance with 7-year retention.', pk: 'actor (HASH)', sk: 'timestamp (RANGE)', ttl: '2,555 days (~7 yr)', billing: 'PAY_PER_REQUEST', rowEstimate: '1,000+ logs', gsis: []},
];

const ACCESS_PATTERNS = [
  { pattern: 'List recent outbreaks (all villages)', store: 'DynamoDB', table: 'outbreak_telemetry', idx: 'gsikey-time-index', freq: 'Every 30s' },
  { pattern: 'Outbreaks by disease', store: 'DynamoDB', table: 'outbreak_telemetry', idx: 'disease-index', freq: 'On demand' },
  { pattern: 'Outbreaks by district', store: 'DynamoDB', table: 'outbreak_telemetry', idx: 'district-time-index', freq: 'On demand' },
  { pattern: 'Patient medical records by village', store: 'Aurora PostgreSQL', table: 'pregnancy, malnutrition, symptoms', idx: 'village indexes', freq: 'Every request' },
  { pattern: 'Ambulance requests by status', store: 'Aurora PostgreSQL', table: 'ambulance_requests', idx: 'idx_ambulance_status', freq: 'Every 30s' },
  { pattern: 'User lookup by phone', store: 'Aurora PostgreSQL', table: 'users', idx: 'phone UNIQUE', freq: 'Every auth' },
  { pattern: 'Village health demographics', store: 'Aurora PostgreSQL', table: 'village_health', idx: 'villageId UNIQUE', freq: 'Dashboard load' },
  { pattern: 'Emergencies by district + date', store: 'DynamoDB', table: 'emergency_streams', idx: 'district-date-index', freq: 'On demand' },
  { pattern: 'Critical emergencies only', store: 'DynamoDB', table: 'emergency_streams', idx: 'priority-index', freq: 'SSE real-time' },
  { pattern: 'Sync pending items by device', store: 'DynamoDB', table: 'sync_queues', idx: '(deviceId, queuedAt)', freq: 'Every sync' },
  { pattern: 'Village offline/online status', store: 'DynamoDB', table: 'village_node_state', idx: 'villageId', freq: 'Every 30s' },
  { pattern: 'Monthly ASHA performance', store: 'Aurora PostgreSQL', table: 'asha_performance', idx: 'UNIQUE(asha_id, month)', freq: 'Monthly' },
  { pattern: 'Audit trail', store: 'DynamoDB + Aurora', table: 'security_audit_logs + audit_logs', idx: '(actor, timestamp)', freq: 'Compliance' },
  { pattern: 'API key lookup by key_id', store: 'Aurora PostgreSQL', table: 'api_keys', idx: 'key_id UNIQUE', freq: 'Every API call' },
];

const TTL_POLICIES = [
  { table: 'outbreak_telemetry', ttl: '90 days', reason: 'Outbreak data older than a quarter is not actionable.' },
  { table: 'sync_queues', ttl: '30 days', reason: 'Stale sync items should not be retried after a month.' },
  { table: 'village_node_state', ttl: '7 days', reason: 'Auto-expire inactive villages. Heartbeat refreshes on activity.' },
  { table: 'emergency_streams', ttl: '365 days', reason: 'Emergency records kept for annual compliance review.' },
  { table: 'security_audit_logs', ttl: '2,555 days (~7 yr)', reason: 'Medical audit trails require long retention per DPDP Act.' },
];

const DATA_FLOW_STEPS = [
  { from: 'Villager Offline', to: 'IndexedDB Queue', label: 'Store Local', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { from: 'IndexedDB Queue', to: 'POST /sync-health', label: 'Replay', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { from: 'POST /sync-health', to: 'Aurora PostgreSQL', label: 'ACID Write', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { from: 'Sync Handler', to: 'DynamoDB sync_queues', label: 'Telemetry', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { from: 'EventEmitter', to: 'DynamoDB outbreak_telemetry', label: 'Async Write', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { from: 'DynamoDB stream', to: 'Admin Dashboard SSE', label: 'Real-time', color: 'bg-rose-100 border-rose-300 text-rose-800' },
  { from: 'OutbreakAgent', to: 'DynamoDB outbreak_telemetry', label: 'AI Detection', color: 'bg-violet-100 border-violet-300 text-violet-800' },
  { from: 'Villager Emergency', to: 'Aurora PostgreSQL', label: 'ACID Write', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { from: 'Emergency Handler', to: 'DynamoDB emergency_streams', label: 'Stream', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { from: 'B2B API Call', to: 'Aurora PostgreSQL api_keys', label: 'Auth + Query', color: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
];

const STORE_ARCH = [
  { icon: '🗄️', title: 'Aurora PostgreSQL', sub: 'Source of Truth', items: ['ACID-compliant medical records (pregnancies, malnutrition, symptoms, referrals)', 'Relational integrity via foreign keys across 12 tables', 'Conditional unique indexes for idempotent offline sync deduplication', 'Updated-at triggers on all tables for full audit trail'], bg: 'from-emerald-50 to-white border-emerald-200', iconBg: 'bg-emerald-100' },
  { icon: '⚡', title: 'DynamoDB', sub: 'Hot-Path Operational Store', items: ['Single-digit-millisecond time-series outbreak telemetry across 5 tables', 'Sharded GSIs (10-shard) prevent hot partitions on high-volume scans', 'TTL-based auto-expiry (7d–7yr) reduces storage costs automatically', '256K+ sync queue items with PAY_PER_REQUEST billing'], bg: 'from-amber-50 to-white border-amber-200', iconBg: 'bg-amber-100' },
];

export default function DatabaseArchitectureView() {
  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 border border-emerald-700/40 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-black text-white tracking-wide uppercase">Database Architecture</p>
              <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Aurora PostgreSQL + DynamoDB · Purpose-Built Dual-Store</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { label: 'Aurora Tables', val: '12', sub: 'ACID records' },
              { label: 'DynamoDB Tables', val: '5', sub: 'Telemetry & streams' },
              { label: 'GSIs Created', val: '8', sub: 'Purpose-built' },
              { label: 'TTL Policies', val: '5', sub: 'Auto-expire' },
              { label: 'Total Items', val: '256K+', sub: 'DynamoDB items' },
              { label: 'Region', val: 'ap-south-1', sub: 'Mumbai, India' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <p className="text-lg font-black text-white">{s.val}</p>
                <p className="text-[9px] font-black text-white/70 uppercase tracking-wider mt-0.5">{s.label}</p>
                <p className="text-[10px] text-white/40 font-medium mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Architecture Philosophy ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Why Two Databases?</p>
          <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-auto">Deliberate Design</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STORE_ARCH.map(store => (
            <div key={store.title} className={`bg-gradient-to-br ${store.bg} border rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${store.iconBg}`}>{store.icon}</div>
                <p className="font-black text-slate-900 text-xs uppercase tracking-wider">{store.title}</p>
                <span className="text-[9px] font-bold text-slate-400 ml-auto">{store.sub}</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-700 leading-relaxed">
                {store.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Flow Pipeline ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <GitBranch className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Data Flow Pipeline</p>
          <span className="text-[9px] text-slate-400 font-semibold ml-auto">Village → Cloud → Dashboard</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {[
            { icon: '👩‍⚕️', label: 'Villager / ASHA', sub: 'Offline-first mobile', items: ['Symptom check', 'Maternal record', 'Emergency SOS', 'Sync queue'] },
            { icon: '⚡', label: 'Node.js API', sub: 'Express + EventEmitter', items: ['ACID write → Aurora', 'Async write → DynamoDB', 'SSE broadcast', 'DLQ retry'] },
            { icon: '🗄️', label: 'Aurora PostgreSQL', sub: 'Source of Truth', items: ['12 tables', 'Medical records', 'Users & villages', 'FK integrity'] },
            { icon: '⚡', label: 'DynamoDB', sub: 'Operational Store', items: ['5 tables, 8 GSIs', 'Telemetry & streams', '256K+ items', 'TTL auto-expire'] },
            { icon: '🖥️', label: 'Admin Dashboard', sub: 'Real-time SSE', items: ['Command Center', 'Outbreak Radar', 'Risk Intel', 'System Status'] },
          ].map((stage, i) => (
            <div key={stage.label} className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-3 text-center relative hover:bg-slate-100/70 transition-colors">
              {i > 0 && <span className="hidden lg:block absolute -left-2.5 top-1/2 -translate-y-1/2 text-emerald-300 text-sm font-bold">→</span>}
              <span className="text-xl mb-1 block">{stage.icon}</span>
              <p className="font-black text-slate-800 text-[10px] uppercase tracking-wider">{stage.label}</p>
              <p className="text-[10px] text-slate-400 font-bold mb-2">{stage.sub}</p>
              <div className="space-y-0.5">{stage.items.map(item => <span key={item} className="block px-1 py-0.5 bg-white/70 border border-slate-100 rounded text-[10px] font-medium text-slate-500">{item}</span>)}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Flows</p>
          <div className="space-y-0.5">
            {DATA_FLOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px]">
                <span className="text-slate-300 font-bold w-4 shrink-0 text-right">{i + 1}.</span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold border ${step.color}`}>{step.from}</span>
                <span className="text-slate-300">→</span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold border ${step.color}`}>{step.to}</span>
                <span className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DynamoDB Tables ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-amber-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">DynamoDB · 5 Tables</p>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase">NoSQL · Key-Value + Document</span>
          <span className="text-[10px] text-slate-400 font-semibold ml-auto">PAY_PER_REQUEST billing · ap-south-1</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {DYNAMO_TABLES.map(t => (
            <div key={t.name} className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-300/70 transition-all duration-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center shrink-0"><Table className="w-3.5 h-3.5 text-amber-700" /></div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-wider truncate">{t.name}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">DynamoDB</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{t.rowEstimate}</span>
              </div>
              <p className="text-[9px] text-slate-600 leading-relaxed mb-2">{t.purpose}</p>
              <div className="space-y-1 mb-2 bg-amber-50/50 border border-amber-100/50 rounded-xl p-2">
                <div className="flex items-center gap-1.5 text-[9px]">
                  <Hash className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="font-mono font-bold text-amber-800">{t.pk}</span>
                  <span className="text-amber-300">·</span>
                  <span className="font-mono font-bold text-amber-800">{t.sk}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="font-bold">TTL:</span>
                  <span className="font-mono">{t.ttl}</span>
                  <span className="text-slate-300 mx-1">·</span>
                  <BarChart3 className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{t.billing}</span>
                </div>
              </div>
              {t.gsis.length > 0 && (
                <div className="space-y-1 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">GSIs ({t.gsis.length})</p>
                  {t.gsis.map(g => (
                    <div key={g.name} className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-1.5">
                      <div className="flex items-center gap-1 text-[9px]">
                        <Search className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span className="font-black text-amber-800 font-mono">{g.name}</span>
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium ml-4">
                        <span>HASH: <span className="font-mono font-bold">{g.pk}</span></span>
                        {g.sk !== '—' && <span> · RANGE: <span className="font-mono font-bold">{g.sk}</span></span>}
                      </div>
                      <p className="text-[10px] text-amber-600 mt-0.5 ml-4 italic">{g.purpose}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Aurora PostgreSQL Tables ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Aurora PostgreSQL · 12 Tables</p>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase">ACID · Relational</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {AURORA_TABLES.map(t => (
            <div key={t.name} className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300/70 transition-all duration-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center shrink-0"><Table className="w-3.5 h-3.5 text-emerald-700" /></div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-wider truncate">{t.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Aurora PostgreSQL</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{t.rowEstimate}</span>
              </div>
              <p className="text-[9px] text-slate-600 leading-relaxed mb-2">{t.purpose}</p>
              <div className="space-y-0.5 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Columns</p>
                <div className="flex flex-wrap gap-0.5">
                  {t.cols.map(c => <span key={c} className="px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600">{c}</span>)}
                </div>
              </div>
              {t.indexes.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indexes</p>
                  <div className="flex flex-wrap gap-0.5">
                    {t.indexes.map(i => <span key={i} className="px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-mono text-emerald-700">{i}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Access Pattern Matrix ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Search className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Access Pattern Matrix</p>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-black uppercase ml-auto">14 Patterns</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                {['Access Pattern', 'Store', 'Table / Collection', 'Index / GSI', 'Frequency'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ACCESS_PATTERNS.map((ap, i) => (
                <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-3 py-2.5 text-[10px] font-bold text-slate-800">{ap.pattern}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${ap.store === 'DynamoDB' ? 'bg-amber-50 text-amber-700 border-amber-200' : ap.store.includes('Aurora') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                      {ap.store}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] font-mono text-slate-600">{ap.table}</td>
                  <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{ap.idx}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{ap.freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TTL Policies ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-emerald-600" />
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">TTL Policies · Automatic Data Lifecycle</p>
          <span className="text-[9px] text-slate-400 font-semibold ml-auto">DynamoDB time-to-live</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mb-3">Every DynamoDB table has a purpose-built TTL. Aurora relies on application-level archiving for medical record retention.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TTL_POLICIES.map(p => (
            <div key={p.table} className="bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/60 rounded-xl p-3 hover:border-rose-200/60 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-rose-500" />
                <p className="font-black text-slate-800 text-[10px] uppercase tracking-wider font-mono">{p.table}</p>
              </div>
              <p className="text-lg font-black text-rose-600">{p.ttl}</p>
              <p className="text-[9px] text-slate-500 font-medium mt-1 italic">{p.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-4 text-center">
        <p className="text-[10px] font-bold text-emerald-800">
          Dual-store architecture deliberately separates ACID-guaranteed medical records (Aurora PostgreSQL) from high-velocity operational telemetry (DynamoDB).
          Event-driven async writes ensure non-blocking API responses while maintaining data integrity in the source of truth.
        </p>
        <p className="text-[9px] text-emerald-500 font-bold mt-2">
          AWS ap-south-1 · Aurora PostgreSQL + DynamoDB · PAY_PER_REQUEST · 17 tables · 8 GSIs · 5 TTL policies
        </p>
      </div>

    </div>
  );
}
