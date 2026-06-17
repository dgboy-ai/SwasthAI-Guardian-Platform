import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shield, Wifi, Database, Heart, Zap, Sparkles, ChevronDown, CheckCircle } from 'lucide-react';

const WIN_REASONS = [
  { icon: Shield, label: 'Offline-First Architecture', color: '#059669', desc: 'Full PWA with IndexedDB queue works without internet — critical for rural India where connectivity is unreliable.' },
  { icon: Heart, label: 'AI-Powered Triage & Diagnosis', color: '#F97316', desc: 'Voice-first assistant in Hindi/Marathi with symptom checker, risk assessment, and automated outbreak detection.' },
  { icon: Wifi, label: 'Resilient Sync Engine', color: '#2563EB', desc: 'AWS Aurora + DynamoDB with offline queue, auto-sync on reconnect, and conflict resolution for field data.' },
  { icon: Database, label: 'Real-Time Impact Dashboard', color: '#7C3AED', desc: 'Live counters, health score breakdown, and telemetry that updates as ASHA workers enter data in the field.' },
  { icon: Zap, label: 'Emergency Response System', color: '#EF4444', desc: 'SOS dispatch with GPS tracking, ETA generation, hospital alerts, and end-to-end resolution timeline.' },
  { icon: Trophy, label: 'Judge-Ready Demo Mode', color: '#F59E0B', desc: 'One-click scenarios simulate pregnancy, outbreak, emergency, and offline sync — populating every dashboard widget with realistic data.' },
];

export default function JudgePanel({ className = '' }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/20 rounded-3xl shadow-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Why SwasthAI Guardian Wins</h3>
            <p className="text-[10px] text-amber-400/80 font-semibold">Judge evaluation panel — 6 key differentiators</p>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-amber-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2.5">
              {WIN_REASONS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: item.color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white">{item.label}</p>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-3 text-center">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs font-black text-amber-300">Built for Rural Health, Ready for the Judge</p>
                <p className="text-[10px] text-amber-400/70 font-medium mt-1">SwasthAI Guardian demonstrates production-ready healthcare infrastructure that works where internet doesn't.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
