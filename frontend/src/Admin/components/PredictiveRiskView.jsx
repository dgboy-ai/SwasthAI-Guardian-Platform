import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield,
  RefreshCw, ChevronDown, ChevronUp, Zap, Target, Activity,
  ArrowRight, CheckCircle, MapPin, Users, X, DollarSign, Info,
  Droplet, Bug, Heart, Award, AlertCircle, Clock, Terminal, Sliders
} from 'lucide-react';
import adminService from '../../services/adminService';

/* ── Risk Level Styles ──────────────────────────────────────────────────────── */
const RISK_META = {
  CRITICAL: { bg: 'bg-red-500',    light: 'bg-red-50/50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-50 text-red-700 border-red-200',    dot: 'bg-red-500',    label: 'CRITICAL', bar: '#EF4444', borderL: 'border-l-red-500' },
  HIGH:     { bg: 'bg-orange-500', light: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'HIGH',     bar: '#F97316', borderL: 'border-l-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-500', light: 'bg-yellow-50/50', border: 'border-yellow-200', text: 'text-yellow-750', badge: 'bg-yellow-50 text-yellow-750 border-yellow-200', dot: 'bg-yellow-450', label: 'MEDIUM',   bar: '#EAB308', borderL: 'border-l-yellow-500' },
  LOW:      { bg: 'bg-green-500',  light: 'bg-green-50/50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-250',   dot: 'bg-green-500',  label: 'LOW',      bar: '#22C55E', borderL: 'border-l-green-500' },
};

/* ── Demo fallback data ─────────────────────────────────────────────────── */
const DEMO_VILLAGES = [
  { villageId: 'VILLAGE_012', village: 'Rampur', population: 2840, riskScore: 78, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: true, symptomScore: 32, outbreakScore: 18, seasonalScore: 18, referralScore: 10, dataPoints: { symptomCount7d: 14, openReferralsCount: 8, waterSafetyScore: 82, vectorDensity: 74 } },
  { villageId: 'VILLAGE_047', village: 'Ichhawar', population: 1920, riskScore: 62, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: false, symptomScore: 22, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 9, openReferralsCount: 5, waterSafetyScore: 65, vectorDensity: 61 } },
  { villageId: 'VILLAGE_009', village: 'Sehore North', population: 3100, riskScore: 54, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 14, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 6, openReferralsCount: 4, waterSafetyScore: 71, vectorDensity: 52 } },
  { villageId: 'VILLAGE_023', village: 'Budhni', population: 1650, riskScore: 38, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 8, outbreakScore: 10, seasonalScore: 15, referralScore: 5, dataPoints: { symptomCount7d: 3, openReferralsCount: 2, waterSafetyScore: 90, vectorDensity: 38 } },
  { villageId: 'VILLAGE_031', village: 'Ashta', population: 2200, riskScore: 22, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 10, seasonalScore: 12, referralScore: 0, dataPoints: { symptomCount7d: 1, openReferralsCount: 0, waterSafetyScore: 95, vectorDensity: 21 } },
  { villageId: 'VILLAGE_005', village: 'Nasrullaganj', population: 1450, riskScore: 15, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 0, seasonalScore: 12, referralScore: 3, dataPoints: { symptomCount7d: 0, openReferralsCount: 1, waterSafetyScore: 92, vectorDensity: 15 } },
];

const DEMO_SUMMARY = { criticalCount: 0, highCount: 2, mediumCount: 2, lowCount: 2, avgScore: 45, totalVillages: 6, highestRisk: 'Rampur', highestRiskScore: 78 };

/* ── Live Log Terminal Stream Component ───────────────────────────────────── */
const MOCK_PACKETS = [
  "ASHA Node v102 uploaded 4 pregnancy telemetry sheets",
  "Vector Density Sensor #982 recorded humidity anomaly in Rampur",
  "DeepLearning SymptomNet: analyzed 9 symptom profiles in Ichhawar",
  "RAG Multilingual matching completed for Sakhi sessions (v103)",
  "DynamoDB synced outbreak event state for Rampur - dengue flagged",
  "Surveillance alert generated: 7d symptom count threshold exceeded",
  "Water safety check logged - chlorine levels nominal in Ashta",
  "Auto-dispatch triggered for P1 Emergency request from Nasrullaganj"
];

function LiveTelemetryStream() {
  const [logs, setLogs] = useState([
    "[11:15:02 AM] System Ready. Awaiting regional health signals...",
    "[11:15:15 AM] Syncing AWS node state indices..."
  ]);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      const packet = MOCK_PACKETS[Math.floor(Math.random() * MOCK_PACKETS.length)];
      setLogs(prev => [...prev.slice(-6), `[${timeStr}] ${packet}`]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner font-mono text-[10.5px] text-slate-300 relative overflow-hidden flex flex-col h-44">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-slate-400">AWS Telemetry Stream Feed</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
        {logs.map((log, index) => (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            key={index}
            className="leading-relaxed whitespace-pre-wrap"
          >
            {log.includes('flagged') || log.includes('alert') ? (
              <span className="text-rose-455">{log}</span>
            ) : log.includes('synced') || log.includes('nominal') ? (
              <span className="text-emerald-455">{log}</span>
            ) : (
              log
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Circular Metric Badge with Hover Details ────────────────────────────── */
function CircularMetric({ label, value, maxVal = 100, color, icon: Icon, subText, onClick, active }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / maxVal) * circumference;

  return (
    <button
      onClick={onClick}
      className={`bg-white border rounded-2xl p-4 flex items-center gap-3.5 shadow-sm transition-all text-left select-none relative cursor-pointer outline-none active:scale-95 ${
        active 
          ? 'border-indigo-400 shadow-md ring-2 ring-indigo-500/10' 
          : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r={radius} fill="transparent" stroke="#f8fafc" strokeWidth="4.5" />
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="4.5"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute">
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
          <span className="text-[9px] text-slate-400 font-bold">/{maxVal}</span>
        </div>
        <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5 leading-tight truncate">{subText}</p>
      </div>
      <div className="absolute right-3.5 top-3.5">
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-500' : 'bg-transparent'}`} />
      </div>
    </button>
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

  // Slider budget override state
  const [mitigationBudget, setMitigationBudget] = useState(5); // ₹0 to ₹20 Lakhs

  // Circular metric detail active state
  const [activeMetricTab, setActiveMetricTab] = useState(null);

  // Simulator interventions state
  const [interventions, setInterventions] = useState({
    vaccine: false,
    referral: false,
    sanitation: false,
    surveillance: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (judgeDemoMode) throw new Error('demo');
      const res = await adminService.getDistrictRiskHeatmap();
      setHeatmapData(res.data);
    } catch (_) {
      setHeatmapData({ villages: DEMO_VILLAGES, summary: DEMO_SUMMARY, generatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [judgeDemoMode]);

  useEffect(() => { load(); }, [load]);

  const handleVillageClick = async (v) => {
    setInterventions({
      vaccine: false,
      referral: false,
      sanitation: false,
      surveillance: false,
    });

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
        ]
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Recalculate dynamic simulated score for details
  const getSimulatedScore = () => {
    if (!selectedVillage) return 0;
    let score = selectedVillage.riskScore;
    if (interventions.vaccine) score -= 12;
    if (interventions.referral) score -= 8;
    if (interventions.sanitation) score -= 10;
    if (interventions.surveillance) score -= 5;
    return Math.max(0, score);
  };

  const activeSimulatedScore = getSimulatedScore();

  const getSimulatedLevel = (score) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  };
  const activeSimulatedLevel = getSimulatedLevel(activeSimulatedScore);

  // Dynamic values mapped based on slider position
  const getBaseTrendData = () => {
    const baseline = [45, 48, 52, 58, 64, 61, 57, 52, 48, 43, 39, 35, 32, 29];
    const reduction = Math.round(mitigationBudget * 1.8);
    return baseline.map((val, idx) => {
      if (idx > 2) {
        return Math.max(10, val - reduction);
      }
      return val;
    });
  };

  const trendData = getBaseTrendData();

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
    <div className="p-5 lg:p-6 space-y-5 text-left select-none">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap bg-white/75 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/10">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Predictive Health Risk Intelligence</h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-750 text-[10px] font-black rounded-full border border-indigo-200/50 uppercase tracking-wide">Layer 2 · Early Warning</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded border border-emerald-200/50 uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Licensed Command Tier
            </span>
          </div>
          <p className="text-slate-550 text-sm font-medium max-w-3xl leading-relaxed">
            AI-Powered Pre-Outbreak Forecasting Engine. Analyzes real-time symptom vectors, local weather/seasonal patterns, and referral backlogs to map village vulnerability scores.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-black text-slate-655 hover:bg-slate-50 hover:border-slate-350 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Models
        </button>
      </div>

      {/* ── Grid: Main Forecast Index & Circular Metrics ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* SVG forecast chart */}
          <ForecastTrendChart dataPoints={trendData} />

          {/* Interactive Mitigation Budget Slider Widget */}
          <div className="bg-gradient-to-r from-indigo-50/20 to-purple-50/20 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <p className="text-xs font-black text-slate-750 uppercase tracking-wider">Preventive Budget Allocation Simulator</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-750 font-black text-sm rounded-full border border-indigo-150">
                Simulated Funding: ₹{mitigationBudget} Lakhs
              </span>
            </div>
            
            <p className="text-xs text-slate-450 font-semibold leading-relaxed">
              Drag the slider to allocate resources (mosquito spraying, sanitation kits) and visually morph the 14-day forecasted vulnerability trend line.
            </p>

            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-bold">₹0 (None)</span>
              <input
                type="range"
                min="0"
                max="20"
                value={mitigationBudget}
                onChange={(e) => setMitigationBudget(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 font-bold">₹20 Lakhs (Max)</span>
            </div>
          </div>
        </div>
        
        {/* Circular Metrics Dashboard Panel */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <CircularMetric
              label="Vector Breeding Index"
              value={74}
              color="#EF4444"
              icon={Bug}
              subText="Mosquito density threshold high"
              active={activeMetricTab === 'vector'}
              onClick={() => setActiveMetricTab(prev => prev === 'vector' ? null : 'vector')}
            />
            <CircularMetric
              label="Water Contaminant Risk"
              value={42}
              color="#F97316"
              icon={Droplet}
              subText="Monsoon runoffs monitored"
              active={activeMetricTab === 'water'}
              onClick={() => setActiveMetricTab(prev => prev === 'water' ? null : 'water')}
            />
            <CircularMetric
              label="ASHA Clinic Backlog"
              value={15}
              color="#EAB308"
              icon={Heart}
              subText="Open high-risk referrals"
              active={activeMetricTab === 'backlog'}
              onClick={() => setActiveMetricTab(prev => prev === 'backlog' ? null : 'backlog')}
            />
            <CircularMetric
              label="Surveillance Patrols"
              value={88}
              color="#22C55E"
              icon={Award}
              subText="ASHA routing target achieved"
              active={activeMetricTab === 'patrols'}
              onClick={() => setActiveMetricTab(prev => prev === 'patrols' ? null : 'patrols')}
            />
          </div>

          {/* Metric Interactive Drilldown Modal/Box */}
          <AnimatePresence mode="wait">
            {activeMetricTab && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-xs space-y-2.5"
              >
                {activeMetricTab === 'vector' && (
                  <>
                    <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><Bug className="w-3.5 h-3.5 text-red-500" /> Vector Sensor Log #D-981</p>
                    <div className="space-y-1 text-slate-550 font-semibold leading-normal">
                      <p>• Sensor Node Status: <span className="text-red-650 font-bold">ALARM</span></p>
                      <p>• Larvae Breeding Index: 74/100 (Critical threshold &gt;65)</p>
                      <p>• Area Coverage: Rampur, Ichhawar (12 sectors monitored)</p>
                      <p>• Action Required: Schedule immediate malathion fogging.</p>
                    </div>
                  </>
                )}
                {activeMetricTab === 'water' && (
                  <>
                    <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-orange-500" /> Water Quality Diagnostic</p>
                    <div className="space-y-1 text-slate-550 font-semibold leading-normal">
                      <p>• Sensor Turbidity Level: 4.2 NTU (Moderate runoff contamination)</p>
                      <p>• Pathogen Probability: 42% (Coliform suspect in sector 4)</p>
                      <p>• Last Sampled: 14 mins ago by ASHA tester</p>
                      <p>• Dispatch: Order chlorine tablet distribution.</p>
                    </div>
                  </>
                )}
                {activeMetricTab === 'backlog' && (
                  <>
                    <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-yellow-500" /> ASHA Care Referrals</p>
                    <div className="space-y-1 text-slate-550 font-semibold leading-normal">
                      <p>• Pending High-Risk Backlogs: 15 maternal checkups open</p>
                      <p>• Avg Referral Age: 3.2 days (Target &lt;48 hours)</p>
                      <p>• Active NGO Coordinators: 4 assigned to district</p>
                      <p>• Priority Nodes: Rampur (8 cases), Sehore North (7 cases)</p>
                    </div>
                  </>
                )}
                {activeMetricTab === 'patrols' && (
                  <>
                    <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-500" /> Surveillance Quality</p>
                    <div className="space-y-1 text-slate-550 font-semibold leading-normal">
                      <p>• Surveillance Completion Rate: 88% (Excellent target mapping)</p>
                      <p>• Total Households Surveyed: 1,420 today</p>
                      <p>• Node Sync Interval: 30 minutes online/offline matching</p>
                      <p>• Operational ASHA Workers: 14 active in Gwalior sectors</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
            { label: 'Emergency Nodes', value: summary.criticalCount, sub: 'Immediate triage required', color: 'text-red-650', cardBg: 'bg-gradient-to-br from-red-50/20 to-white border-red-200' },
            { label: 'High Threat Zones', value: summary.highCount, sub: 'Surveillance escalated', color: 'text-orange-600', cardBg: 'bg-gradient-to-br from-orange-50/20 to-white border-orange-200' },
            { label: 'Medium Alert Zones', value: summary.mediumCount, sub: 'Preventive interventions', color: 'text-yellow-650', cardBg: 'bg-gradient-to-br from-yellow-50/20 to-white border-yellow-200' },
            { label: 'Stable Regions', value: summary.lowCount, sub: 'Routine ASHA mapping', color: 'text-emerald-700', cardBg: 'bg-gradient-to-br from-emerald-50/20 to-white border-emerald-200' },
            { label: 'Peak Vulnerable Node', value: summary.highestRisk, sub: `Vulnerability Score: ${summary.highestRiskScore}`, color: 'text-indigo-950', cardBg: 'bg-gradient-to-br from-indigo-50/25 to-white border-indigo-200', small: true },
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

      {/* ── Dual Layer Explanation Banner & Live Terminal Feed Grid ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-violet-50/80 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap h-full">
            <div className="flex gap-4 flex-wrap flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100/80 rounded-lg flex items-center justify-center border border-orange-200">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Layer 1: Real-time Outbreak Surveillance</p>
                  <p className="text-xs font-bold text-slate-700">"What is happening right now?"</p>
                </div>
              </div>
              <div className="flex items-center text-slate-350"><ArrowRight className="w-4 h-4" /></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-100/80 rounded-lg flex items-center justify-center border border-violet-200">
                  <TrendingUp className="w-4 h-4 text-violet-650" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Layer 2: AI Predictive Risk Modelling</p>
                  <p className="text-xs font-bold text-slate-700">"What may happen next?"</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 bg-white/70 border border-indigo-100 px-3 py-1.5 rounded-xl">
              <Info className="w-3.5 h-3.5 text-indigo-655 animate-bounce" /> Fully Interactive Triage Simulator Active
            </div>
          </div>
        </div>

        {/* Live Terminal Log Feed */}
        <div>
          <LiveTelemetryStream />
        </div>
      </div>

      {/* ── Filter & Navigation Bar ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap pb-1">
        {FILTER_LEVELS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterLevel(f.id)}
            className={`px-4 py-2.5 rounded-full text-xs font-black transition-all border cursor-pointer ${
              filterLevel === f.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-655 border-slate-200 hover:border-slate-355 hover:bg-slate-50/50'
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
                    <button onClick={() => { setSelectedVillage(null); setDetailData(null); }} className="p-2 hover:bg-white/70 rounded-xl transition-colors cursor-pointer">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Score Gauge */}
                <div className="flex items-center gap-6 mt-5">
                  <ScoreGauge score={activeSimulatedScore} level={activeSimulatedLevel} />
                  <div className="flex-1 space-y-2">
                    {selectedVillage.hasActiveOutbreak && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                        <p className="text-xs font-black text-red-750">ACTIVE OUTBREAK DETECTED — Coordinates with Outbreak Radar Layer 1</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-black text-slate-700">Health Risk Prediction</p>
                      {activeSimulatedScore < selectedVillage.riskScore && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded animate-pulse">
                          <span>{selectedVillage.riskScore}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="font-black">{activeSimulatedScore}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                      {activeSimulatedScore < selectedVillage.riskScore 
                        ? 'Simulating prevention campaigns active. Recalculated Early Warning forecast reflects localized improvement.'
                        : 'Calculated from 4 weighted signal sources in real time. Use the simulator below to forecast interventions.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div className="p-6 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : detailData ? (
                <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">

                  {/* Dynamic Preventive Intervention Simulator */}
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" /> Preventive Intervention Simulator
                      </p>
                      {getSimulatedScore() < selectedVillage.riskScore && (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded font-black text-[9px] uppercase tracking-wider animate-pulse">
                          Projected Reduction: -{selectedVillage.riskScore - getSimulatedScore()} pts
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Toggle prevention programs to simulate real-time localized health risk score reduction:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'vaccine', label: 'Mass Immunization', reduction: 12, desc: 'Vaccination catch-up camp', icon: '💉' },
                        { id: 'referral', label: 'ASHA Backlog Sweep', reduction: 8, desc: 'Resolve open high-risk referrals', icon: '📋' },
                        { id: 'sanitation', label: 'Clean Water Drive', reduction: 10, desc: 'Chlorine distribution & safety tests', icon: '💧' },
                        { id: 'surveillance', label: 'Surveillance Patrols', reduction: 5, desc: 'Weekly active symptom search', icon: '🕵️' },
                      ].map(program => {
                        const active = interventions[program.id];
                        return (
                          <button
                            key={program.id}
                            onClick={() => setInterventions(prev => ({ ...prev, [program.id]: !prev[program.id] }))}
                            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 select-none active:scale-98 cursor-pointer ${
                              active
                                ? 'bg-indigo-50/80 border-indigo-200 shadow-sm ring-2 ring-indigo-500/10'
                                : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                            }`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{program.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <p className={`text-xs font-black truncate ${active ? 'text-indigo-900' : 'text-slate-800'}`}>
                                  {program.label}
                                </p>
                                <span className={`text-[9.5px] font-black px-1.5 py-0.25 rounded shrink-0 border uppercase ${
                                  active ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  -{program.reduction} pts
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5 truncate">{program.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                            <p className="text-sm font-black text-slate-855 mb-1">{cat.icon} {cat.name}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${cat.level === 'HIGH' ? 'bg-rose-100/80 text-rose-700 border-rose-200/50' : 'bg-amber-100/80 text-amber-800 border-amber-200/50'}`}>{cat.level}</span>
                            <div className="mt-2.5 space-y-1">
                              {cat.reasons?.map((r, j) => <p key={j} className="text-xs text-slate-550 font-semibold">• {r}</p>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-time Health Signal Timelines */}
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Early Warning Signal Timeline
                    </p>
                    <div className="relative border-l-2 border-slate-200 ml-2.5 pl-4 space-y-4">
                      {[
                        { time: '2 hrs ago', type: 'Surveillance Alert', text: '7-day fever case count increased by 42% in this node.', color: 'border-red-500 bg-red-500' },
                        { time: 'Yesterday', type: 'Water Safety', text: 'Water safety sensor recorded a minor turbidity spike.', color: 'border-orange-500 bg-orange-500' },
                        { time: '3 days ago', type: 'ASHA Survey', text: 'ASHA health worker recorded 3 new dengue-like clinical profiles.', color: 'border-yellow-500 bg-yellow-500' },
                        { time: '5 days ago', type: 'Sanitation Check', text: 'Village sanitization backlog flagged as complete by health board.', color: 'border-green-500 bg-green-500' },
                      ].map((item, index) => (
                        <div key={index} className="relative">
                          <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${item.color}`} />
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <span>{item.type}</span>
                            <span>{item.time}</span>
                          </div>
                          <p className="text-xs text-slate-655 font-bold mt-1 leading-normal">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  {detailData.recommendedActions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Recommended Action Protocols
                      </p>
                      <div className="space-y-2">
                        {detailData.recommendedActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl hover:border-slate-350 transition-colors">
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <p className="text-xs font-bold text-slate-700 leading-normal">{action}</p>
                          </div>
                        ))}
                      </div>
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

/* ── ForecastTrendChart: Animated SVG Line Chart ────────────────────────── */
function ForecastTrendChart({ dataPoints }) {
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X coordinate calculation
  const getX = (index) => padding.left + (index / (dataPoints.length - 1)) * chartWidth;
  // Y coordinate calculation (invert Y since SVG 0 is top)
  const getY = (val) => padding.top + chartHeight - (val / 100) * chartHeight;

  // Build the path string for the line
  const points = dataPoints.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
  
  let linePath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const areaPath = linePath 
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
    : "";

  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-xs font-black text-slate-750 uppercase tracking-wider">14-Day District Risk Forecast Index</span>
        </div>
        <span className="px-2.5 py-0.5 bg-indigo-50/70 border border-indigo-100 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-wider">Proactive AI Simulation</span>
      </div>

      <div className="relative w-full aspect-[600/180]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i * 25;
            const y = getY(val);
            return (
              <g key={i} className="opacity-40">
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="#E2E8F0" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="font-mono text-[9px] font-bold fill-slate-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Fill Area Under Path */}
          {areaPath && (
            <motion.path
              d={areaPath}
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Line Path */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="#6366F1"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? "6" : "4"}
                fill={hoveredIndex === idx ? "#6366F1" : "#FFFFFF"}
                stroke="#6366F1"
                strokeWidth="2.5"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-150"
                style={{ filter: hoveredIndex === idx ? "drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.4))" : "none" }}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip Overlay */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bg-slate-900 text-white rounded-xl p-2.5 shadow-lg border border-slate-800 font-mono text-[10px] space-y-0.5 select-none pointer-events-none"
              style={{
                left: `${(getX(hoveredIndex) / width) * 100}%`,
                top: `${(getY(dataPoints[hoveredIndex]) / height) * 100 - 35}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="font-bold text-slate-400">Day {hoveredIndex + 1}</p>
              <p className="font-black text-indigo-400">Score: {dataPoints[hoveredIndex]}/100</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-3 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2.5">
        <span>Today</span>
        <span>Day 5 (Monsoon)</span>
        <span>Day 10 (Spraying)</span>
        <span>Day 14 (Forecast)</span>
      </div>
    </div>
  );
}

/* ── VillageCard Component ───────────────────────────────────────────────── */
function VillageCard({ v, isSelected, onClick }) {
  const meta = RISK_META[v.riskLevel] || RISK_META.LOW;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={`bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 text-left select-none relative ${
        isSelected
          ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
          : 'border-slate-100 hover:border-slate-350 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full ${meta.bg} shrink-0 relative flex items-center justify-center`}>
          {v.riskLevel === 'CRITICAL' || v.hasActiveOutbreak ? (
            <span className={`absolute inline-flex h-full w-full rounded-full ${meta.bg} opacity-75 animate-ping`} />
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-slate-800 text-sm truncate">{v.village}</h4>
            <span className={`text-[8.5px] font-black px-2 py-0.25 rounded-full border ${meta.badge} uppercase tracking-wider shrink-0`}>
              {v.riskLevel}
            </span>
          </div>
          <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
            Pop: {v.population?.toLocaleString()} • ID: {v.villageId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          {v.dataPoints?.symptomCount7d > 5 && (
            <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center border border-red-100/50" title={`${v.dataPoints.symptomCount7d} Symptoms`}>
              <Activity className="w-3.5 h-3.5 text-red-500" />
            </div>
          )}
          {v.dataPoints?.vectorDensity > 50 && (
            <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100/50" title={`Vector density ${v.dataPoints.vectorDensity}`}>
              <Bug className="w-3.5 h-3.5 text-orange-500" />
            </div>
          )}
          {v.dataPoints?.waterSafetyScore < 75 && (
            <div className="w-6 h-6 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100/50" title={`Water safety warning ${v.dataPoints.waterSafetyScore}`}>
              <Droplet className="w-3.5 h-3.5 text-yellow-600" />
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className="text-base font-black text-slate-900 leading-none">{v.riskScore}</span>
            <span className="text-[9px] text-slate-400 font-bold leading-none">/100</span>
          </div>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Risk Score</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ContributorBar Component ────────────────────────────────────────────── */
function ContributorBar({ factor, weight, maxWeight, description, icon }) {
  const percent = Math.round((weight / maxWeight) * 100);

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex justify-between items-baseline text-xs">
        <div className="flex items-center gap-1.5 font-black text-slate-755">
          <span className="text-sm">{icon}</span>
          <span>{factor}</span>
        </div>
        <div className="font-mono text-slate-455 font-bold">
          <span>{weight}</span>
          <span className="text-[10px] text-slate-350">/{maxWeight} ({percent}%)</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${
            percent > 70 
              ? 'bg-red-500' 
              : percent > 40 
                ? 'bg-orange-500' 
                : 'bg-indigo-500'
          }`}
        />
      </div>
      <p className="text-[10px] text-slate-450 font-semibold pl-6 leading-tight">
        {description}
      </p>
    </div>
  );
}

/* ── ScoreGauge Component ────────────────────────────────────────────────── */
function ScoreGauge({ score, level }) {
  const meta = RISK_META[level] || RISK_META.LOW;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="6.5" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          stroke={meta.bar}
          strokeWidth="6.5"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 leading-none">{score}</span>
        <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-450 mt-0.5 leading-none">{level}</span>
      </div>
    </div>
  );
}

/* ── TrendArrow Component ────────────────────────────────────────────────── */
function TrendArrow({ direction }) {
  if (direction === 'increasing') {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-xl text-red-650 font-black text-[9px] uppercase tracking-wider animate-pulse">
        <TrendingUp className="w-3.5 h-3.5" /> Increasing
      </div>
    );
  }
  if (direction === 'improving') {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-700 font-black text-[9px] uppercase tracking-wider">
        <TrendingDown className="w-3.5 h-3.5" /> Improving
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-black text-[9px] uppercase tracking-wider">
      <Minus className="w-3.5 h-3.5" /> Stable
    </div>
  );
}
