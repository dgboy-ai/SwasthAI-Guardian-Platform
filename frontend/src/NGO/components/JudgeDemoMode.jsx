import React, { useState } from 'react';
import { Play, CheckCircle, Clock, Activity, Loader2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

const SIMULATION_STEPS = [
  { id: 'pregnancy', label: 'New Pregnancy Case', emoji: '🤰', desc: 'Register 28yr old with 7mo pregnancy, high BP' },
  { id: 'outbreak', label: 'New Fever Outbreak', emoji: '🔥', desc: '8 new fever cases in Village V103 cluster' },
  { id: 'sos', label: 'Emergency SOS', emoji: '🚑', desc: 'Trigger ambulance dispatch for chest pain patient' },
  { id: 'sync', label: 'Offline Sync Recovery', emoji: '🔄', desc: 'Simulate network restore with 5 queued records' },
];

export default function JudgeDemoMode({ onSimulate }) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [currentStep, setCurrentStep] = useState('');

  const runAllSimulations = async () => {
    setRunning(true);
    setCompleted([]);

    for (const step of SIMULATION_STEPS) {
      setCurrentStep(step.label);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (onSimulate) onSimulate(step.id);
      setCompleted((prev) => [...prev, step.id]);
      showToast(`Simulated: ${step.label}`, 'success');
    }

    setCurrentStep('');
    setRunning(false);
    showToast('Demo complete! All dashboards populated.', 'success');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Judge Demo Mode</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Hackathon evaluation simulation</p>
          </div>
        </div>
        {!running && (
          <button
            onClick={runAllSimulations}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4" /> Run Live Demo
          </button>
        )}
      </div>

      {running && (
        <div className="space-y-2 mb-4">
          {SIMULATION_STEPS.map((step) => {
            const done = completed.includes(step.id);
            const active = currentStep === step.label && !done;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                  done ? 'bg-emerald-900/30 text-emerald-300' : active ? 'bg-blue-900/30 text-blue-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <span className="text-base">{step.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{step.label}</p>
                  <p className="text-[10px] opacity-70">{step.desc}</p>
                </div>
                {done && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {active && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {!running && completed.length === 0 && (
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
          Click "Run Live Demo" to simulate real-world scenarios and auto-populate all dashboard sections.
          Perfect for hackathon judging.
        </p>
      )}

      {!running && completed.length > 0 && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
          <CheckCircle className="w-4 h-4" />
          All {SIMULATION_STEPS.length} scenarios simulated successfully
        </div>
      )}
    </div>
  );
}
