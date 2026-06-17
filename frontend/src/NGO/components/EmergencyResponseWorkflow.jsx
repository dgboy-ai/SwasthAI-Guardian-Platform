import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ambulance, MapPin, Clock, CheckCircle, Navigation, Loader2, Phone, Hospital } from 'lucide-react';

const WORKFLOW_STEPS = [
  { key: 'received', label: 'SOS Received', icon: '🚨', time: '0s' },
  { key: 'identified', label: 'Patient Identified', icon: '👤', time: '15s' },
  { key: 'assigned', label: 'Ambulance Assigned', icon: '🚑', time: '45s' },
  { key: 'eta', label: 'ETA Generated', icon: '⏱️', time: '7min' },
  { key: 'alerted', label: 'Hospital Alerted', icon: '🏥', time: '15min' },
  { key: 'closed', label: 'Case Closed', icon: '✅', time: '25min' },
];

export default function EmergencyResponseWorkflow({ emergency, onDispatch, dispatching, progress }) {
  const [showTimeline, setShowTimeline] = useState(false);

  const currentStepIndex = progress === 0 ? 1 : Math.min(5, Math.floor((progress / 100) * 6));

  const ambulanceData = {
    id: 'AMB-042',
    vehicle: 'MH 12 AB 3042',
    driver: 'Rajesh Kumar',
    phone: '+91-9876543321',
    distance: '2.3 km',
    eta: '7 min',
    hospital: 'PHC Rampur (3.1 km)',
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-red-700 uppercase">{emergency?.condition || 'Emergency'}</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{emergency?.name}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-semibold">
              <MapPin className="w-3 h-3" /> {emergency?.location}
            </div>
          </div>
          <span className="text-[9px] font-black px-2 py-1 rounded-full bg-red-100 text-red-700 uppercase shrink-0">
            CRITICAL
          </span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">Response Workflow</p>
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, i) => {
            const isCompleted = dispatching && i <= currentStepIndex;
            const isActive = dispatching && i === currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white shadow-sm' : isActive ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span className={`text-[7px] font-black uppercase text-center leading-tight max-w-12 ${
                  isCompleted ? 'text-emerald-600' : isActive ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
                <span className="text-[6px] text-slate-400 font-bold">{step.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {dispatching && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Coordinating Dispatch GPS...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Step {Math.min(currentStepIndex + 1, 6)}/6: {WORKFLOW_STEPS[Math.min(currentStepIndex, 5)].label}
          </div>
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Navigation className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800">Nearest Ambulance</p>
            <p className="text-[10px] text-emerald-600 font-semibold">{ambulanceData.vehicle} • {ambulanceData.eta}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/60 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Driver</p>
            <p className="font-bold text-slate-800 text-[11px]">{ambulanceData.driver}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Contact</p>
            <p className="font-bold text-slate-800 text-[11px]">{ambulanceData.phone}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase">ETA</p>
            <p className="font-bold text-emerald-700 text-[11px]">{ambulanceData.eta}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Hospital</p>
            <p className="font-bold text-slate-800 text-[11px]">{ambulanceData.hospital}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={() => onDispatch(emergency?.id)}
          disabled={dispatching}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ambulance className="w-4 h-4" />}
          {dispatching ? 'Dispatching...' : 'Dispatch Ambulance'}
        </button>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {showTimeline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 overflow-hidden"
        >
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Resolution Timeline</p>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2.5 top-1 bottom-0 w-0.5 bg-slate-200" />
            {[
              { time: '0s', event: 'Emergency Alert Received', done: true },
              { time: '15s', event: 'AI Triage Assessment Complete', done: true },
              { time: '45s', event: 'Ambulance Dispatched', done: progress > 20 },
              { time: '7min', event: 'ETC: Arrival at Patient Location', done: progress > 60 },
              { time: '15min', event: 'Patient Loaded & En Route to PHC', done: progress > 80 },
              { time: '25min', event: 'Hospital Arrival & Handover', done: progress === 100 },
            ].map((item, i) => (
              <div key={i} className="relative flex items-center gap-3">
                <div className={`absolute -left-4.5 w-3 h-3 rounded-full border-2 ${
                  item.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                }`} />
                <div className="flex-1 flex justify-between items-center">
                  <span className={`text-[11px] font-semibold ${item.done ? 'text-slate-800' : 'text-slate-400'}`}>
                    {item.event}
                  </span>
                  <span className={`text-[9px] font-bold ${item.done ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
