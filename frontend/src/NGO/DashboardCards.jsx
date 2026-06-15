// ─── SwasthAI Guardian – Reusable Dashboard Card Components ──────────────────
import { motion } from 'framer-motion';
import {
  ChevronRight, MapPin, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Wifi, WifiOff,
  Heart, Baby, Shield, Zap, Phone
} from 'lucide-react';

/* ── Fade-in animation preset ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── KPI CARD ─────────────────────────────────────────────────────────── */
export function KPICard({ card, onClick, loading }) {
  const statusStyles = {
    red:    'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-700',
    green:  'bg-green-100 text-green-700',
  };

  const IconEl = getKPIIcon(card.icon, card.bgColor);

  return (
    <motion.div
      {...fadeUp(card._delay || 0)}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
        style={{ backgroundColor: card.bgColor }}
      >
        {IconEl}
      </div>

      {/* Count */}
      {loading ? (
        <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-slate-900 leading-none">{card.count}</p>
      )}

      {/* Label */}
      <p className="text-xs font-semibold text-slate-500 leading-tight">{card.label}</p>

      {/* Status badge */}
      <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyles[card.statusColor] || 'bg-slate-100 text-slate-500'}`}>
        {card.status}
      </span>

      {/* View All */}
      <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-emerald-600 transition-colors mt-auto">
        View All <ChevronRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/* ─── OUTBREAK ALERT BANNER ──────────────────────────────────────────────── */
export function OutbreakAlertBanner({ alert, onViewDetails }) {
  const TrendIcon =
    alert.trendDirection === 'up' ? TrendingUp :
    alert.trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
    >
      {/* Warning icon */}
      <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-1">
          Active Outbreak Alert
        </p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{alert.message}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-[10px] text-slate-500 font-medium">
            {alert.reports} Reports this week
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-500 font-medium">
            {alert.nearby} Nearby Villages
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
            Trend: {alert.trend} <TrendIcon className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* View Details */}
      <button
        onClick={onViewDetails}
        className="shrink-0 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wide px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
      >
        View Details <ChevronRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/* ─── TASK CARD ──────────────────────────────────────────────────────────── */
export function TaskCard({ task, onVisit, onMarkDone }) {
  const priorityStyles = {
    red:    'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-700',
    green:  'bg-green-100 text-green-700',
  };

  const TaskIcon = getTaskIcon(task.icon);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 py-3 ${task.done ? 'opacity-50' : ''}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        {TaskIcon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800 truncate">{task.patientName}</p>
          {task.priority && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${priorityStyles[task.priorityColor] || 'bg-slate-100 text-slate-500'}`}>
              {task.priority}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {task.type}{task.detail ? ` • ${task.detail}` : ''}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] text-slate-400 font-medium">{task.distance}</span>
        </div>
      </div>

      {/* Action */}
      {task.done ? (
        <div className="flex items-center gap-1 text-emerald-600">
          <CheckCircle className="w-5 h-5" />
        </div>
      ) : task.icon === 'vaccination' ? (
        <button
          onClick={() => onMarkDone(task.id)}
          className="shrink-0 px-3 py-2 border-2 border-slate-200 text-slate-700 text-[10px] font-black rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          Mark Done
        </button>
      ) : (
        <button
          onClick={() => onVisit(task.id)}
          className="shrink-0 px-3 py-2 border-2 border-emerald-500 text-emerald-600 text-[10px] font-black rounded-xl hover:bg-emerald-50 transition-colors"
        >
          Visit Now
        </button>
      )}
    </motion.div>
  );
}

/* ─── QUICK ACTION BUTTON ────────────────────────────────────────────────── */
export function QuickActionButton({ action, onClick }) {
  const IconEl = getQuickActionIcon(action.icon, action.color);
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all duration-200 w-full"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${action.color}20` }}
      >
        {IconEl}
      </div>
      <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
        {action.label}
      </span>
    </motion.button>
  );
}

/* ─── SYSTEM HEALTH BAR ──────────────────────────────────────────────────── */
export function SystemHealthBar({ health }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-700">All systems normal</p>
            <p className="text-[10px] text-slate-400 font-medium">
              Last Sync: {health.lastSync} • Offline Queue: {health.offlineQueue} items
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Sync % */}
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{health.syncHealth}%</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sync Health</p>
          </div>
          {/* AWS logo text */}
          <div className="flex items-center gap-1">
            <div className="bg-[#FF9900] rounded px-2 py-0.5">
              <span className="text-white text-[10px] font-black">aws</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── INFO CARD ──────────────────────────────────────────────────────────── */
export function InfoCard({ icon, title, subtitle, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-emerald-600 font-semibold truncate">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── AI RECOMMENDATION CARD ─────────────────────────────────────────────── */
export function AIRecommendationCard({ rec }) {
  const styles = {
    urgent:  { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    label: 'Urgent' },
    warning: { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', label: 'Warning' },
    info:    { bar: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700',  label: 'Info' },
  };
  const s = styles[rec.type] || styles.info;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50`}>
      <div className={`w-1 self-stretch rounded-full shrink-0 ${s.bar}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>
          {s.label}
        </span>
        <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{rec.message}</p>
      </div>
    </div>
  );
}

/* ─── Icon helpers ──────────────────────────────────────────────────────────── */
function getKPIIcon(type, color) {
  const size = 'w-6 h-6 text-white';
  switch (type) {
    case 'ambulance': return <span className="text-xl">🚑</span>;
    case 'pregnancy': return <span className="text-xl">🤰</span>;
    case 'child':     return <span className="text-xl">👶</span>;
    case 'pad':       return <span className="text-xl">💊</span>;
    default:          return <Zap className={size} />;
  }
}

function getTaskIcon(type) {
  switch (type) {
    case 'pregnancy':   return <span className="text-lg">🤰</span>;
    case 'child':       return <span className="text-lg">👶</span>;
    case 'vaccination': return <span className="text-lg">💉</span>;
    default:            return <Heart className="w-5 h-5 text-slate-400" />;
  }
}

function getQuickActionIcon(type, color) {
  const style = { color };
  switch (type) {
    case 'pregnancy': return <span className="text-2xl">🤰</span>;
    case 'child':     return <span className="text-2xl">👶</span>;
    case 'symptoms':  return <span className="text-2xl">🩺</span>;
    case 'emergency': return <span className="text-2xl">🚑</span>;
    default:          return <Zap className="w-6 h-6" style={style} />;
  }
}
