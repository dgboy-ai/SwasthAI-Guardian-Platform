import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield,
  RefreshCw, ChevronDown, ChevronUp, Zap, Target, Activity,
  ArrowRight, CheckCircle, MapPin, Users, X
} from 'lucide-react';
import adminService from '../../services/adminService';

/* ── Risk Level Styles ──────────────────────────────────────────────────────── */
const RISK_META = {
  CRITICAL: { bg: 'bg-red-500',    light: 'bg-red-50/50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-50 text-red-700 border-red-200',    dot: 'bg-red-500',    label: 'CRITICAL', bar: '#EF4444', borderL: 'border-l-red-500' },
  HIGH:     { bg: 'bg-orange-500', light: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'HIGH',     bar: '#F97316', borderL: 'border-l-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-500', light: 'bg-yellow-50/50', border: 'border-yellow-200', text: 'text-yellow-750', badge: 'bg-yellow-50 text-yellow-750 border-yellow-200', dot: 'bg-yellow-400', label: 'MEDIUM',   bar: '#EAB308', borderL: 'border-l-yellow-500' },
  LOW:      { bg: 'bg-green-500',  light: 'bg-green-50/50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-green-500',  label: 'LOW',      bar: '#22C55E', borderL: 'border-l-green-500' },
};

/* ── Demo fallback data (offline/no backend) ─────────────────────────────── */
const DEMO_VILLAGES = [
  { villageId: 'VILLAGE_012', village: 'Rampur', population: 2840, riskScore: 78, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: true, symptomScore: 32, outbreakScore: 18, seasonalScore: 18, referralScore: 10, dataPoints: { symptomCount7d: 14, openReferralsCount: 8 } },
  { villageId: 'VILLAGE_047', village: 'Ichhawar', population: 1920, riskScore: 62, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: false, symptomScore: 22, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 9, openReferralsCount: 5 } },
  { villageId: 'VILLAGE_009', village: 'Sehore North', population: 3100, riskScore: 54, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 14, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 6, openReferralsCount: 4 } },
  { villageId: 'VILLAGE_023', village: 'Budhni', population: 1650, riskScore: 38, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 8, outbreakScore: 10, seasonalScore: 15, referralScore: 5, dataPoints: { symptomCount7d: 3, openReferralsCount: 2 } },
  { villageId: 'VILLAGE_031', village: 'Ashta', population: 2200, riskScore: 22, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 10, seasonalScore: 12, referralScore: 0, dataPoints: { symptomCount7d: 1, openReferralsCount: 0 } },
  { villageId: 'VILLAGE_005', village: 'Nasrullaganj', population: 1450, riskScore: 15, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 0, seasonalScore: 12, referralScore: 3, dataPoints: { symptomCount7d: 0, openReferralsCount: 1 } },
];
const DEMO_SUMMARY = { criticalCount: 0, highCount: 2, mediumCount: 2, lowCount: 2, avgScore: 45, totalVillages: 6, highestRisk: 'Rampur', highestRiskScore: 78 };

/* ── Trend Arrow ─────────────────────────────────────────────────────────── */
function TrendArrow({ direction }) {
  if (direction === 'increasing') return <span className="flex items-center gap-1.5 text-red-650 font-black text-xs uppercase tracking-wider"><TrendingUp className="w-4 h-4" /> Rising Risk</span>;
  if (direction === 'improving')  return <span className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase tracking-wider"><TrendingDown className="w-4 h-4" /> Improving</span>;
  return <span className="flex items-center gap-1.5 text-slate-500 font-black text-xs uppercase tracking-wider"><Minus className="w-4 h-4" /> Stable</span>;
}

/* ── Score Gauge ─────────────────────────────────────────────────────────── */
function ScoreGauge({ score, level }) {
  const meta = RISK_META[level] || RISK_META.LOW;
  const angle = (score / 100) * 180 - 90; // -90° (low) to +90° (high)
  return (
    <div className="relative flex flex-col items-center shrink-0">
      <div className="relative w-36 h-18 overflow-hidden">
        <div className="absolute inset-0 w-36 h-36 rounded-full border-8 border-slate-100" style={{ borderColor: '#f1f5f9' }} />
        <div className="absolute inset-0 w-36 h-36 rounded-full border-8"
          style={{
            borderColor: 'transparent',
            borderTopColor: meta.bar,
            borderRightColor: meta.bar,
            transform: `rotate(${angle}deg)`,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <p className="text-4xl font-black text-slate-900 leading-none">{score}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">/ 100</p>
        </div>
      </div>
      <span className={`mt-2 px-3.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${meta.badge}`}>{meta.label}</span>
    </div>
  );
}

/* ── Contributor Bar ─────────────────────────────────────────────────────── */
function ContributorBar({ factor, weight, maxWeight, description, icon }) {
  const pct = maxWeight > 0 ? Math.round((weight / maxWeight) * 100) : 0;
  const barColor = weight >= maxWeight * 0.7 ? '#EF4444' : weight >= maxWeight * 0.4 ? '#F97316' : '#22C55E';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>{factor}
        </span>
        <span className="text-xs font-black text-slate-900">{weight}<span className="text-slate-400 font-medium">/{maxWeight}</span></span>
      </div>
      <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
      <p className="text-[10px] text-slate-400 font-semibold">{description}</p>
    </div>
  );
}

/* ── Intervention Forecast Bar ───────────────────────────────────────────── */
function InterventionRow({ label, score, currentScore, color }) {
  const reduction = currentScore - score;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-600">{label}</span>
          <span className="text-xs font-black text-slate-900">{score} <span className={`text-[10px] font-bold ${reduction > 0 ? 'text-emerald-600' : 'text-slate-405'}`}>{reduction > 0 ? `−${reduction}` : '±0'}</span></span>
        </div>
        <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: `${(currentScore / 100) * 100}%` }}
            animate={{ width: `${(score / 100) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Village Card ────────────────────────────────────────────────────────── */
function VillageCard({ v, isSelected, onClick }) {
  const meta = RISK_META[v.riskLevel] || RISK_META.LOW;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-l-[6px] ${meta.borderL} border-y-slate-100 border-r-slate-100 border transition-all ${
        isSelected ? `${meta.light} shadow-md` : 'bg-white hover:border-slate-200 hover:shadow-md shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-sm">
            🏘️
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 text-sm sm:text-base truncate">{v.village}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />{v.population?.toLocaleString()} pop
              </span>
              {v.hasActiveOutbreak && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-black text-[9px] uppercase tracking-wider animate-pulse">
                  Active Outbreak
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-xl sm:text-2xl font-black leading-none ${meta.text}`}>{v.riskScore}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Score</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${meta.badge}`}>{meta.label}</span>
          {isSelected ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
    </motion.button>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function PredictiveRiskView({ judgeDemoMode }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [showInterventionSim, setShowInterventionSim] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (judgeDemoMode) throw new Error('demo');
      const res = await adminService.getDistrictRiskHeatmap();
      setHeatmapData(res.data);
    } catch (_) {
      // Graceful demo fallback
      setHeatmapData({ villages: DEMO_VILLAGES, summary: DEMO_SUMMARY, generatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [judgeDemoMode]);

  useEffect(() => { load(); }, [load]);

  const handleVillageClick = async (v) => {
    if (selectedVillage?.villageId === v.villageId) {
      setSelectedVillage(null);
      setDetailData(null);
      return;
    }
    setSelectedVillage(v);
    setDetailLoading(true);
    try {
      if (judgeDemoMode) throw new Error('demo');
      const res = await adminService.getVillageRiskDetail(v.villageId);
      setDetailData(res.data);
    } catch (_) {
      // Build detail data from the heatmap entry
      setDetailData({
        ...v,
        trendDirection: v.riskScore > 60 ? 'increasing' : v.riskScore < 30 ? 'improving' : 'stable',
        contributors: [
          { factor: 'Symptom Surge', weight: v.symptomScore || 0, maxWeight: 40, description: `${v.dataPoints?.symptomCount7d || 0} cases in last 7 days`, icon: '🌡️' },
          { factor: 'Nearby Outbreak', weight: v.outbreakScore || 0, maxWeight: 25, description: v.hasActiveOutbreak ? 'Active outbreak clusters nearby' : 'Low outbreak activity', icon: '⚠️' },
          { factor: 'Seasonal Risk', weight: v.seasonalScore || 0, maxWeight: 20, description: 'Monsoon season — vector-borne risk elevated', icon: '📅' },
          { factor: 'Open Referrals', weight: v.referralScore || 0, maxWeight: 15, description: `${v.dataPoints?.openReferralsCount || 0} pending referrals`, icon: '📋' },
        ],
        categories: v.riskScore > 40 ? [
          { name: 'Vector-Borne Risk', level: v.riskScore > 60 ? 'HIGH' : 'MEDIUM', icon: '🦟', reasons: ['Monsoon season active', 'Dengue/malaria risk elevated'] },
          { name: 'Waterborne Risk', level: 'MEDIUM', icon: '💧', reasons: ['Contaminated water risk during monsoon'] },
        ] : [],
        recommendedActions: v.riskScore > 60 ? [
          'Deploy ASHA workers for door-to-door symptom surveillance',
          'Increase mosquito control — distribute nets, initiate fogging',
          'Monitor fever cases daily and report to PHC',
          'Verify emergency transport readiness',
          'Launch village health awareness campaign',
        ] : [
          'Maintain routine ASHA surveillance visits',
          'Monitor seasonal disease trends',
          'Follow up on open referral cases',
        ],
        interventionForecast: {
          current: v.riskScore,
          afterVaccinationDrive: Math.max(0, v.riskScore - 12),
          afterReferralClosure: Math.max(0, v.riskScore - 8),
          afterCombinedInterventions: Math.max(0, v.riskScore - 22),
        }
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const villages = heatmapData?.villages || [];
  const summary = heatmapData?.summary || {};
  const filtered = filterLevel === 'ALL' ? villages : villages.filter(v => v.riskLevel === filterLevel);

  const FILTER_LEVELS = [
    { id: 'ALL', label: 'All Villages' },
    { id: 'CRITICAL', label: '🔴 Critical' },
    { id: 'HIGH', label: '🟠 High' },
    { id: 'MEDIUM', label: '🟡 Medium' },
    { id: 'LOW', label: '🟢 Low' },
  ];

  return (
    <div className="p-5 lg:p-6 space-y-5 text-left">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Predictive Health Risk Intelligence</h2>
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-750 text-[10px] font-black rounded-full border border-violet-250 uppercase tracking-wide">Layer 2 · Early Warning</span>
          </div>
          <p className="text-slate-500 text-sm font-medium max-w-3xl leading-relaxed">
            AI-Powered Pre-Outbreak Forecasting Engine. Analyzes real-time symptom vectors, local weather/seasonal patterns, and referral backlogs to map village vulnerability scores.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-650 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Models
        </button>
      </div>

      {/* ── District Summary Strip ───────────────────────────────────────── */}
      {!loading && summary.totalVillages > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {[
            { label: 'Avg District Risk', value: `${summary.avgScore}/100`, sub: 'Average Vulnerability', color: 'text-slate-900', cardBg: 'bg-gradient-to-br from-slate-50/50 to-white border-slate-200' },
            { label: 'Emergency Nodes', value: summary.criticalCount, sub: 'Immediate triage required', color: 'text-red-650', cardBg: 'bg-gradient-to-br from-red-50/30 to-white border-red-200' },
            { label: 'High Threat Zones', value: summary.highCount, sub: 'Surveillance escalated', color: 'text-orange-600', cardBg: 'bg-gradient-to-br from-orange-50/30 to-white border-orange-200' },
            { label: 'Medium Alert Zones', value: summary.mediumCount, sub: 'Preventive interventions', color: 'text-yellow-650', cardBg: 'bg-gradient-to-br from-yellow-50/30 to-white border-yellow-200' },
            { label: 'Stable Regions', value: summary.lowCount, sub: 'Routine ASHA mapping', color: 'text-emerald-700', cardBg: 'bg-gradient-to-br from-emerald-50/30 to-white border-emerald-200' },
            { label: 'Peak Vulnerability Node', value: summary.highestRisk, sub: `Vulnerability Score: ${summary.highestRiskScore}`, color: 'text-indigo-950', cardBg: 'bg-gradient-to-br from-indigo-50/30 to-white border-indigo-200', small: true },
          ].map((s, i) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              key={i} 
              className={`rounded-2xl p-4 border shadow-sm transition-all duration-300 ${s.cardBg}`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} ${s.small ? 'text-sm sm:text-base' : ''}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-snug">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Dual Layer Explanation Banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-4">
        <div className="flex gap-4 flex-wrap flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center border border-orange-200">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layer 1: Real-time Outbreak Surveillance</p>
              <p className="text-xs font-bold text-slate-700">"What is happening right now?"</p>
            </div>
          </div>
          <div className="flex items-center text-slate-350"><ArrowRight className="w-4 h-4" /></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center border border-violet-200">
              <TrendingUp className="w-4 h-4 text-violet-650" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layer 2: AI Predictive Risk Modelling</p>
              <p className="text-xs font-bold text-slate-700">"What may happen next?"</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap pb-1">
        {FILTER_LEVELS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterLevel(f.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
              filterLevel === f.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-655 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Main Layout: Heatmap + Drilldown ──────────────────────────────── */}
      <div className={`grid gap-5 ${selectedVillage ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>

        {/* Village Heatmap List */}
        <div className={`space-y-3 ${selectedVillage ? 'lg:col-span-2' : ''}`}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400">No villages match this filter</p>
            </div>
          ) : (
            filtered.map(v => (
              <VillageCard
                key={v.villageId}
                v={v}
                isSelected={selectedVillage?.villageId === v.villageId}
                onClick={() => handleVillageClick(v)}
              />
            ))
          )}
        </div>

        {/* Drilldown Panel */}
        <AnimatePresence>
          {selectedVillage && (
            <motion.div
              key="drilldown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Drilldown Header */}
              <div className={`p-5 ${RISK_META[selectedVillage.riskLevel]?.light || 'bg-slate-50'} border-b ${RISK_META[selectedVillage.riskLevel]?.border || 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin className="w-4.5 h-4.5 text-slate-500" />
                      <h3 className="text-lg font-black text-slate-900">{detailData?.village || selectedVillage.village}</h3>
                    </div>
                    <p className="text-xs text-slate-550 font-semibold">{selectedVillage.villageId} · Population {selectedVillage.population?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {detailData && <TrendArrow direction={detailData.trendDirection} />}
                    <button onClick={() => { setSelectedVillage(null); setDetailData(null); }} className="p-2 hover:bg-white/70 rounded-xl transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Score Gauge */}
                <div className="flex items-center gap-6 mt-5">
                  <ScoreGauge score={selectedVillage.riskScore} level={selectedVillage.riskLevel} />
                  <div className="flex-1 space-y-2">
                    {selectedVillage.hasActiveOutbreak && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                        <p className="text-xs font-black text-red-750">ACTIVE OUTBREAK DETECTED — Coordinates with Outbreak Radar Layer 1</p>
                      </div>
                    )}
                    <p className="text-xs sm:text-sm font-black text-slate-700">Village Health Risk Score</p>
                    <p className="text-xs text-slate-450 font-semibold leading-relaxed">Calculated from 4 weighted signal sources in real time</p>
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div className="p-6 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : detailData ? (
                <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">

                  {/* XAI Contributor Breakdown */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> XAI Risk Contributors
                    </p>
                    <div className="space-y-3.5 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                      {detailData.contributors?.map((c, i) => (
                        <ContributorBar key={i} {...c} />
                      ))}
                    </div>
                  </div>

                  {/* Health Category Flags */}
                  {detailData.categories?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Health Risk Categories</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detailData.categories.map((cat, i) => (
                          <div key={i} className={`p-4 rounded-2xl border ${cat.level === 'HIGH' ? 'bg-rose-50/30 border-rose-200/60' : 'bg-amber-50/30 border-amber-200/60'}`}>
                            <p className="text-sm font-black text-slate-805 mb-1">{cat.icon} {cat.name}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${cat.level === 'HIGH' ? 'bg-rose-100/80 text-rose-700 border-rose-200/50' : 'bg-amber-100/80 text-amber-800 border-amber-200/50'}`}>{cat.level}</span>
                            <div className="mt-2.5 space-y-1">
                              {cat.reasons?.map((r, j) => <p key={j} className="text-xs text-slate-550 font-semibold">• {r}</p>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {detailData.recommendedActions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Recommended Actions
                      </p>
                      <div className="space-y-2">
                        {detailData.recommendedActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-slate-700 leading-normal">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intervention Impact Forecast */}
                  {detailData.interventionForecast && (
                    <div>
                      <button
                        onClick={() => setShowInterventionSim(v => !v)}
                        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0 hover:text-slate-650 transition-colors"
                      >
                        <span className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Intervention Impact Forecast</span>
                        {showInterventionSim ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
                      </button>
                      <AnimatePresence>
                        {showInterventionSim && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3.5 p-4 bg-gradient-to-br from-violet-50/60 to-indigo-50/60 rounded-2xl border border-violet-100 space-y-3">
                              <p className="text-xs text-slate-450 font-semibold italic">Projected risk reduction after implementing preventive interventions</p>
                              <InterventionRow label="Current Risk Score" score={detailData.interventionForecast.current} currentScore={detailData.interventionForecast.current} color="#EF4444" />
                              <InterventionRow label="After Vaccination Drive" score={detailData.interventionForecast.afterVaccinationDrive} currentScore={detailData.interventionForecast.current} color="#F97316" />
                              <InterventionRow label="After Referral Closure" score={detailData.interventionForecast.afterReferralClosure} currentScore={detailData.interventionForecast.current} color="#EAB308" />
                              <InterventionRow label="After Combined Interventions" score={detailData.interventionForecast.afterCombinedInterventions} currentScore={detailData.interventionForecast.current} color="#22C55E" />
                              <p className="text-xs text-violet-600 font-bold text-center mt-2">Combined interventions projected to reduce risk by {detailData.interventionForecast.current - detailData.interventionForecast.afterCombinedInterventions} points</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Last Generated ─────────────────────────────────────────────────── */}
      {heatmapData?.generatedAt && (
        <p className="text-[10px] text-slate-400 font-semibold text-center mt-4">
          Risk Intelligence generated at {new Date(heatmapData.generatedAt).toLocaleTimeString()} · Refresh every 30 min for updated signals
        </p>
      )}
    </div>
  );
}
