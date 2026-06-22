import React, { useState } from 'react';
import { Play, CheckCircle, Clock, Activity, Loader2, MousePointerClick, Brain } from 'lucide-react';
import { showToast } from '../../utils/toast';

const SCENARIOS = [
  {
    id: 'pregnancy',
    label: 'High Risk Pregnancy',
    emoji: '🤰',
    desc: 'Register 28yr old with 7mo pregnancy, high BP (150/95), Hb 9.8, urgent visit needed',
    color: 'orange',
    bgFrom: 'from-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  {
    id: 'malnutrition',
    label: 'Malnutrition Crisis',
    emoji: '👶',
    desc: 'Add 3 new SAM children with declining MUAC, trigger nutrition alert',
    color: 'purple',
    bgFrom: 'from-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  {
    id: 'outbreak',
    label: 'Disease Outbreak',
    emoji: '🔥',
    desc: '8 new fever cases detected in Village V103 cluster, risk score rises to 92',
    color: 'red',
    bgFrom: 'from-red-500/10',
    borderColor: 'border-red-500/20'
  },
  {
    id: 'sos',
    label: 'Emergency SOS',
    emoji: '🚑',
    desc: 'Trigger ambulance dispatch for chest pain patient, GPS coordination + ETA',
    color: 'red',
    bgFrom: 'from-red-500/10',
    borderColor: 'border-red-500/20'
  },
  {
    id: 'sync',
    label: 'Offline Sync',
    emoji: '🔄',
    desc: 'Simulate network restore with 5 queued records, sync to AWS Aurora',
    color: 'blue',
    bgFrom: 'from-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
];

const COLOR_MAP = {
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', btn: 'bg-orange-500 hover:bg-orange-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', btn: 'bg-purple-500 hover:bg-purple-400' },
  red: { bg: 'bg-red-100', text: 'text-red-700', btn: 'bg-red-500 hover:bg-red-400' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', btn: 'bg-blue-500 hover:bg-blue-400' },
};

export default function JudgeDemoMode({ onSimulate, lastScenario, isSimulating }) {
  const [runningScenario, setRunningScenario] = useState('');
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const handleScenario = async (scenarioId) => {
    if (runningScenario) return;
    setRunningScenario(scenarioId);
    setShowAll(true);
    showToast(`Simulating: ${SCENARIOS.find(s => s.id === scenarioId).label}...`, 'info');

    await new Promise((resolve) => setTimeout(resolve, 600));
    if (onSimulate) onSimulate(scenarioId);
    setCompletedScenarios(prev => prev.includes(scenarioId) ? prev : [...prev, scenarioId]);
    showToast(`Scenario complete: ${SCENARIOS.find(s => s.id === scenarioId).label}`, 'success');
    setRunningScenario('');
  };

  const handleRunAll = async () => {
    setShowAll(true);
    for (const scenario of SCENARIOS) {
      if (runningScenario) break;
      await handleScenario(scenario.id);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    showToast('All scenarios simulated! Dashboard fully populated.', 'success');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Evaluation Demo Mode</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Evaluation and demo simulation — click any scenario</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            {showAll ? 'Collapse' : 'Show All'}
          </button>
          <button
            onClick={handleRunAll}
            disabled={!!runningScenario}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {runningScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {(!showAll ? SCENARIOS.slice(0, 3) : SCENARIOS).map((scenario) => {
          const isRunning = runningScenario === scenario.id;
          const isDone = completedScenarios.includes(scenario.id);
          const colors = COLOR_MAP[scenario.color];

          return (
            <button
              key={scenario.id}
              onClick={() => handleScenario(scenario.id)}
              disabled={!!runningScenario || isDone}
              className={`relative bg-gradient-to-br ${scenario.bgFrom} ${scenario.borderColor} border rounded-2xl p-3.5 text-left transition-all active:scale-98 hover:bg-slate-700/50 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${
                isDone ? 'border-emerald-500/30 bg-emerald-900/10' : ''
              }`}
            >
              {isDone && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{scenario.emoji}</span>
                <span className={`text-xs font-black text-white ${isDone ? 'text-emerald-300' : ''}`}>
                  {scenario.label}
                </span>
                {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 ml-auto" />}
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{scenario.desc}</p>

              {isRunning && (
                <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {completedScenarios.length === 0 && !runningScenario && (
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-3">
          Click any scenario card above (or "Run All") to simulate real-world events and populate all dashboard sections with realistic data. Perfect for evaluation and review.
        </p>
      )}

      {completedScenarios.length > 0 && !runningScenario && (
        <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-black">
          <CheckCircle className="w-4 h-4" />
          {completedScenarios.length}/{SCENARIOS.length} scenarios simulated
        </div>
      )}
    </div>
  );
}
