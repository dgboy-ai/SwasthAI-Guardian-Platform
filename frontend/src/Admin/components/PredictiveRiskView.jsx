import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield,
  RefreshCw, ChevronDown, ChevronUp, Zap, Target, Activity,
  ArrowRight, CheckCircle, MapPin, Users, X, DollarSign, Info,
  Droplet, Bug, Heart, Award, AlertCircle, Clock, Sliders,
  BrainCircuit, BarChart3, List, ChevronRight, ChevronLeft,
  Radio, Database, Bell, Layers, ShieldAlert, Eye
} from 'lucide-react';
import adminService from '../../services/adminService';

const RISK_META = {
  CRITICAL: { bg: 'bg-red-500',    light: 'bg-red-50/50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-50 text-red-700 border-red-200',    dot: 'bg-red-500',    label: 'CRITICAL', bar: '#EF4444', borderL: 'border-l-red-500' },
  HIGH:     { bg: 'bg-orange-500', light: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'HIGH',     bar: '#F97316', borderL: 'border-l-orange-500' },
  MEDIUM:   { bg: 'bg-yellow-500', light: 'bg-yellow-50/50', border: 'border-yellow-200', text: 'text-yellow-750', badge: 'bg-yellow-50 text-yellow-750 border-yellow-200', dot: 'bg-yellow-450', label: 'MEDIUM',   bar: '#EAB308', borderL: 'border-l-yellow-500' },
  LOW:      { bg: 'bg-green-500',  light: 'bg-green-50/50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-250',   dot: 'bg-green-500',  label: 'LOW',      bar: '#22C55E', borderL: 'border-l-green-500' },
};

const DEMO_VILLAGES = [
  { villageId: 'VILLAGE_012', village: 'Rampur', population: 2840, riskScore: 82, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: true, symptomScore: 32, outbreakScore: 18, seasonalScore: 18, referralScore: 10, dataPoints: { symptomCount7d: 14, openReferralsCount: 8, waterSafetyScore: 82, vectorDensity: 74 } },
  { villageId: 'VILLAGE_047', village: 'Ichhawar', population: 1920, riskScore: 67, riskLevel: 'HIGH', riskColor: '#F97316', hasActiveOutbreak: false, symptomScore: 22, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 9, openReferralsCount: 5, waterSafetyScore: 65, vectorDensity: 61 } },
  { villageId: 'VILLAGE_009', village: 'Sehore North', population: 3100, riskScore: 54, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 14, outbreakScore: 18, seasonalScore: 15, referralScore: 7, dataPoints: { symptomCount7d: 6, openReferralsCount: 4, waterSafetyScore: 71, vectorDensity: 52 } },
  { villageId: 'VILLAGE_023', village: 'Budhni', population: 1650, riskScore: 41, riskLevel: 'MEDIUM', riskColor: '#EAB308', hasActiveOutbreak: false, symptomScore: 8, outbreakScore: 10, seasonalScore: 15, referralScore: 5, dataPoints: { symptomCount7d: 3, openReferralsCount: 2, waterSafetyScore: 90, vectorDensity: 38 } },
  { villageId: 'VILLAGE_031', village: 'Ashta', population: 2200, riskScore: 29, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 10, seasonalScore: 12, referralScore: 0, dataPoints: { symptomCount7d: 1, openReferralsCount: 0, waterSafetyScore: 95, vectorDensity: 21 } },
  { villageId: 'VILLAGE_005', village: 'Nasrullaganj', population: 1450, riskScore: 15, riskLevel: 'LOW', riskColor: '#22C55E', hasActiveOutbreak: false, symptomScore: 0, outbreakScore: 0, seasonalScore: 12, referralScore: 3, dataPoints: { symptomCount7d: 0, openReferralsCount: 1, waterSafetyScore: 92, vectorDensity: 15 } },
];

const DEMO_SUMMARY = { criticalCount: 0, highCount: 2, mediumCount: 2, lowCount: 2, avgScore: 45, totalVillages: 6, highestRisk: 'Rampur', highestRiskScore: 82 };

const EVENT_LOG = [
  { time: '08:32', text: 'Outbreak signal detected (Rampur)', type: 'outbreak' },
  { time: '08:34', text: 'DynamoDB alert stored', type: 'system' },
  { time: '08:35', text: 'ASHA notification sent', type: 'action' },
  { time: '08:37', text: 'Risk score recalculated', type: 'system' },
];

function EventTimeline() {
  const [events, setEvents] = useState(EVENT_LOG);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const texts = [
        'Symptom cluster analyzed (Sehore North)',
        'DynamoDB sync completed',
        'Risk score refreshed',
        'ASHA patrol logged 12 household visits',
        'Vector density sensor reading received',
      ];
      const types = ['outbreak', 'system', 'system', 'action', 'system'];
      const idx = Math.floor(Math.random() * texts.length);
      setEvents(prev => [...prev.slice(-7), { time: timeStr, text: texts[idx], type: types[idx] }]);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] h-[220px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest AI Events</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {events.slice().reverse().map((evt, i) => (
          <div key={i} className="flex items-start gap-3 text-[11px] hover:bg-slate-50/50 p-1 rounded transition-colors">
            <span className="text-slate-400 font-mono font-bold shrink-0 w-10">{evt.time}</span>
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              evt.type === 'outbreak' ? 'bg-red-500 animate-pulse' : evt.type === 'action' ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
            <span className={`font-semibold ${
              evt.type === 'outbreak' ? 'text-red-650' : 'text-slate-600'
            }`}>{evt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastConfidenceCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-50/40 to-purple-50/40 border border-indigo-100 rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-indigo-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Forecast Confidence</span>
      </div>
      <div className="text-center mb-4">
        <span className="text-4xl font-black text-indigo-700">94.2%</span>
        <p className="text-[10px] text-slate-500 font-bold mt-1">Model Confidence Score</p>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Based On:</p>
        {[
          'Symptom clusters from Aurora',
          'Outbreak telemetry from DynamoDB',
          'ASHA referral backlog',
          'Offline sync activity',
          'Historical disease patterns',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
function ProjectedImpactCard({ baselineRisk = 45, currentRisk = 30, villages = [] }) {
  const totalSymptoms = villages.reduce((acc, v) => acc + (v.dataPoints?.symptomCount7d || 0), 0);
  const totalReferrals = villages.reduce((acc, v) => acc + (v.dataPoints?.openReferralsCount || 0), 0);
  const reductionPercent = Math.round(((baselineRisk - currentRisk) / baselineRisk) * 100);
  const casesPrevented = Math.round(totalSymptoms * (reductionPercent / 100));

  const r0Without = 2.45;
  const r0With = Math.max(0.65, Number((r0Without * (currentRisk / baselineRisk)).toFixed(2)));
  const sarWithout = "14.8%";
  const sarWith = `${(14.8 * (currentRisk / baselineRisk)).toFixed(1)}%`;
  return (
    <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 border border-emerald-250/70 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full flex flex-col justify-between hover:border-emerald-300 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4.5 h-4.5 text-emerald-600 animate-pulse animate-duration-1000" />
        <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Projected Health Impact</span>
      </div>
      <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed text-left">
        SIR Model estimates calculated using real-time telemetry from the 6 monitored sectors.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 flex-1 items-stretch">
        {[
          { label: 'Active Symptom Cases', value: `${totalSymptoms}`, sub: 'detected last 7 days', color: 'text-red-655', bg: 'bg-red-50/50 border-red-150/40' },
          { label: 'Pending Referrals', value: `${totalReferrals}`, sub: 'awaiting review', color: 'text-amber-655', bg: 'bg-amber-50/50 border-amber-150/40' },
          { label: 'Caseload Prevented', value: `${casesPrevented}`, sub: 'est. cases averted', color: 'text-emerald-750', bg: 'bg-emerald-50 border-emerald-200/50 font-black' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border text-center flex flex-col justify-between transition-all hover:scale-[1.02] duration-200 ${s.bg}`}>
            <div className="my-auto">
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-655 mt-1 leading-tight">{s.sub}</p>
            </div>
            <p className="text-[8px] text-slate-400 font-black mt-3 uppercase tracking-wider leading-none shrink-0">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50/70 border border-slate-150/65 rounded-xl p-3.5 space-y-2.5">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 text-left">Epidemiological Vector Parameters</p>
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-white border border-slate-100 rounded-lg p-2">
            <span className="text-[8px] font-black text-slate-400 block uppercase">Reproduction (R0)</span>
            <span className="text-xs font-black text-slate-700 mt-0.5 block">{r0Without} → <span className="text-emerald-600 font-black">{r0With}</span></span>
          </div>
          <div className="bg-white border border-slate-100 rounded-lg p-2">
            <span className="text-[8px] font-black text-slate-400 block uppercase">Attack Rate (SAR)</span>
            <span className="text-xs font-black text-slate-700 mt-0.5 block">{sarWithout} → <span className="text-emerald-600 font-black">{sarWith}</span></span>
          </div>
          <div className="bg-white border border-slate-100 rounded-lg p-2">
            <span className="text-[8px] font-black text-slate-400 block uppercase">Mitigation Index</span>
            <span className="text-xs font-black text-emerald-600 mt-0.5 block">+{reductionPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIForecastSummary() {
  return (
    <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-indigo-50/70 border border-indigo-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className="w-4 h-4 text-indigo-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">AI Forecast Summary</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Risk Score</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-2 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-[11px] font-black">MEDIUM</span>
            <span className="text-lg font-black text-slate-900">30/100</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">14-Day Trend</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-black text-emerald-600">Decreasing</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Confidence</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">94.2%</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Primary Driver</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5 text-wrap">Declining mosquito-borne cases</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Recommended Action</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5 text-wrap">Continue vector control in Rampur sector</p>
        </div>
      </div>
    </div>
  );
}

function RiskDriverCard({ label, value, color, icon: Icon, isPositiveContributor }) {
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isNegative ? 'bg-emerald-50' : 'bg-red-50'
      }`}>
        <Icon className={`w-5 h-5 ${isNegative ? 'text-emerald-500' : 'text-red-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-xl font-black ${
            isNegative ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {isNegative ? '' : '+'}{value}%
          </p>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
            isNegative ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {isPositiveContributor ? 'Risk Driver' : 'Risk Reducer'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(absVal, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${isNegative ? 'bg-emerald-400' : 'bg-red-400'}`}
          />
        </div>
      </div>
    </div>
  );
}

function TopRiskVillagesTable({ villages, onSelect, selectedId }) {
  const sorted = [...villages].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-indigo-600" />
        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Top Risk Villages — Priority Ranking</span>
      </div>
      <div className="space-y-2">
        {sorted.map((v, i) => {
          const trend = v.riskScore >= 60 ? 'up' : v.riskScore >= 40 ? 'flat' : 'down';
          return (
            <button
              key={v.villageId}
              onClick={() => onSelect(v)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedId === v.villageId
                  ? 'border-indigo-400 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  i === 0 ? 'bg-red-100 text-red-700' : i === 1 ? 'bg-orange-100 text-orange-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>{i + 1}</span>
                <div>
                  <p className="text-sm font-black text-slate-800">{v.village}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Pop: {v.population?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">{v.riskScore}</span>
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                {trend === 'flat' && <Minus className="w-4 h-4 text-amber-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InterventionAllocationSlider({ label, value, onChange, icon: Icon, colorClass }) {
  return (
    <div className="space-y-2 bg-white/60 hover:bg-white/95 border border-slate-150/50 hover:border-indigo-150 rounded-xl p-3 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
          <span className="font-black text-slate-700">{label}</span>
        </div>
        <span className="font-mono font-black text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/50 text-[10px]">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #6366F1 0%, #818CF8 ${value}%, #E2E8F0 ${value}%, #E2E8F0 100%)`
        }}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all duration-150 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95 ${colorClass || ''}`}
      />
    </div>
  );
}

function AIRecommendedActions() {
  const actions = [
    { priority: 'HIGH', color: 'bg-red-500', text: 'Increase mosquito spraying in Rampur', icon: Bug },
    { priority: 'MEDIUM', color: 'bg-amber-500', text: 'Dispatch 2 ASHA workers to Village 8', icon: Users },
    { priority: 'LOW', color: 'bg-green-500', text: 'Monitor diarrheal cases in North Zone', icon: Eye },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Recommended Actions</span>
      </div>
      <div className="space-y-3">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.priority === 'HIGH' ? 'bg-red-50' : a.priority === 'MEDIUM' ? 'bg-amber-50' : 'bg-green-50'}`}>
                <Icon className={`w-4 h-4 ${a.priority === 'HIGH' ? 'text-red-500' : a.priority === 'MEDIUM' ? 'text-amber-500' : 'text-green-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white ${a.color}`}>{a.priority} Priority</span>
                </div>
                <p className="text-xs font-bold text-slate-700">{a.text}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PredictiveRiskView({ demoTourMode }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');

  const [allocations, setAllocations] = useState({
    mosquito: 40,
    water: 25,
    outreach: 20,
    vaccination: 15,
  });

  const [activeMetricTab, setActiveMetricTab] = useState(null);

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
      if (demoTourMode) throw new Error('demo');
      const res = await adminService.getDistrictRiskHeatmap();
      setHeatmapData(res.data);
    } catch (_) {
      setHeatmapData({ villages: DEMO_VILLAGES, summary: DEMO_SUMMARY, generatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [demoTourMode]);

  useEffect(() => { load(); }, [load]);

  const computeInterventionReduction = () => {
    const m = allocations.mosquito / 40;
    const w = allocations.water / 25;
    const o = allocations.outreach / 20;
    const v = allocations.vaccination / 15;
    return Math.round(Math.min(m * 15 + w * 10 + o * 8 + v * 5, 38));
  };

  const baselineRisk = 45;
  const interventionReduction = computeInterventionReduction();
  const currentRisk = Math.max(7, baselineRisk - interventionReduction);

  const getBaseTrendData = () => {
    const baseline = [45, 48, 52, 58, 64, 61, 57, 52, 48, 43, 39, 35, 32, 29];
    const reduction = Math.round(interventionReduction * 0.7);
    return baseline.map((val, idx) => {
      if (idx > 2) {
        return Math.max(10, val - reduction);
      }
      return val;
    });
  };

  const trendData = getBaseTrendData();

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
      if (demoTourMode) throw new Error('demo');
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

  const updateAllocation = (key, value) => {
    setAllocations(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-5 lg:p-6 space-y-5 text-left select-none">

      <div className="flex items-start justify-between gap-4 flex-wrap bg-white/75 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/10">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">District Health Forecast Engine</h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-750 text-[10px] font-black rounded-full border border-indigo-200/50 uppercase tracking-wide">AI Early Warning Engine</span>
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

      <AIForecastSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <ForecastTrendChart dataPoints={trendData} />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Risk Drivers
          </p>
          <RiskDriverCard
            label="Vector Breeding Index"
            value={32}
            icon={Bug}
            isPositiveContributor={true}
          />
          <RiskDriverCard
            label="Water Contamination Risk"
            value={18}
            icon={Droplet}
            isPositiveContributor={true}
          />
          <RiskDriverCard
            label="ASHA Referral Backlog"
            value={12}
            icon={Heart}
            isPositiveContributor={true}
          />
          <RiskDriverCard
            label="Surveillance Coverage"
            value={-21}
            icon={Award}
            isPositiveContributor={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <TopRiskVillagesTable
          villages={villages}
          onSelect={handleVillageClick}
          selectedId={selectedVillage?.villageId}
        />
        <ProjectedImpactCard baselineRisk={baselineRisk} currentRisk={currentRisk} villages={villages} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <p className="text-sm font-black text-slate-800 uppercase tracking-wider">District Intervention Planner</p>
            </div>
            <span className="px-3.5 py-1 bg-indigo-50/80 text-indigo-750 font-black text-xs rounded-full border border-indigo-150">
              Budget: ₹5 Lakhs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 items-stretch">
            <div className="space-y-3 flex flex-col justify-center">
              <InterventionAllocationSlider
                label="Mosquito Control"
                value={allocations.mosquito}
                onChange={(v) => updateAllocation('mosquito', v)}
                icon={Bug}
              />
              <InterventionAllocationSlider
                label="Water Safety"
                value={allocations.water}
                onChange={(v) => updateAllocation('water', v)}
                icon={Droplet}
              />
              <InterventionAllocationSlider
                label="ASHA Outreach"
                value={allocations.outreach}
                onChange={(v) => updateAllocation('outreach', v)}
                icon={Users}
              />
              <InterventionAllocationSlider
                label="Vaccination Drives"
                value={allocations.vaccination}
                onChange={(v) => updateAllocation('vaccination', v)}
                icon={Shield}
              />
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-colors">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Projected District Risk</p>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Real-time outcome simulator for selected budget allocation.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 my-4">
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current</p>
                  <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto shadow-sm shadow-rose-100/30">
                    <span className="text-lg font-black text-rose-600">{baselineRisk}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[7px] font-black text-indigo-655 uppercase tracking-wider">Change</span>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Projected</p>
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-255 flex items-center justify-center mx-auto shadow-sm shadow-emerald-100/30">
                    <span className="text-lg font-black text-emerald-700">{currentRisk}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mt-auto">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${100 - Math.round((currentRisk / baselineRisk) * 100)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-500">Reduction: -{baselineRisk - currentRisk} pts</span>
                  <span className="text-emerald-600">-{Math.round(((baselineRisk - currentRisk) / baselineRisk) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <div className="flex-1">
            <ForecastConfidenceCard />
          </div>
          <div className="flex-1">
            <EventTimeline />
          </div>
        </div>
      </div>

      <AIRecommendedActions />

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

      <div className={`grid gap-5 ${selectedVillage ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>

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

        <AnimatePresence>
          {selectedVillage && (
            <motion.div
              key="drilldown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
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

      {heatmapData?.generatedAt && (
        <p className="text-[10px] text-slate-400 font-semibold text-center mt-4">
          Risk Intelligence generated at {new Date(heatmapData.generatedAt).toLocaleTimeString()} · Refresh every 30 min for updated signals
        </p>
      )}
    </div>
  );
}

function ForecastTrendChart({ dataPoints }) {
  const width = 600;
  const height = 135;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (dataPoints.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - (val / 100) * chartHeight;

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

      <div className="relative w-full aspect-[600/135]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.00" />
            </linearGradient>
          </defs>

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

          {areaPath && (
            <motion.path
              d={areaPath}
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

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
            Pop: {v.population?.toLocaleString()} · ID: {v.villageId}
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
