import React, { useState } from 'react';
import { CheckCircle, Calendar, ArrowUpCircle, UserPlus, Loader2, Clock, MapPin, Route, Brain, Navigation } from 'lucide-react';
import { showToast } from '../../utils/toast';

export default function SmartTaskManager({ task, onComplete, onClose }) {
  const [actionLoading, setActionLoading] = useState('');

  const taskDetails = {
    ...task,
    dueTime: task.dueTime || '2:30 PM',
    distance: task.distance || '1.2 km',
    suggestedRoute: task.suggestedRoute || 'Village V101 → Rampur Sector 4',
    aiRecommendation: task.aiRecommendation || 'Urgent: BP 150/95. Visit within 2 hours. Carry antihypertensive if available.',
    clinicalNote: task.clinicalNote || 'Regular health check-up and vitals assessment recommended.',
    priority: task.priority || 'Normal',
    priorityColor: task.priorityColor || 'blue',
  };

  const handleAction = async (action) => {
    setActionLoading(action);
    await new Promise((r) => setTimeout(r, 800));

    switch (action) {
      case 'complete':
        showToast(`Task completed: ${taskDetails.patientName}`, 'success');
        onComplete(taskDetails.id);
        break;
      case 'reschedule':
        showToast(`Rescheduled: ${taskDetails.patientName} moved to tomorrow`, 'info');
        break;
      case 'escalate':
        showToast(`Escalated to PHC Medical Officer`, 'info');
        break;
      case 'followup':
        showToast(`Follow-up assigned to ASHA Priya`, 'success');
        break;
    }
    setActionLoading('');
    if (action === 'complete') onClose();
  };

  const priorityColors = {
    'HIGH RISK': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'HIGH': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'FOLLOW-UP': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    'URGENT': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'NORMAL': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  };

  const pc = priorityColors[taskDetails.priority] || priorityColors.NORMAL;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">{taskDetails.patientName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{taskDetails.type}</p>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${pc.bg} ${pc.text} flex items-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
          {taskDetails.priority}
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <strong className="text-slate-800">Due:</strong>
          <span className="font-bold text-slate-800">{taskDetails.dueTime}</span>
          {task.priority === 'HIGH RISK' && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 ml-auto">Due Soon</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <strong className="text-slate-800">Distance:</strong>
          <span className="font-bold text-slate-800">{taskDetails.distance}</span>
        </div>
        <div className="flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-slate-400" />
          <strong className="text-slate-800">Suggested Route:</strong>
          <span className="text-slate-600">{taskDetails.suggestedRoute}</span>
        </div>
        <div className="flex items-start gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-500 mt-0.5" />
          <div>
            <strong className="text-slate-800">AI Recommendation:</strong>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{taskDetails.aiRecommendation}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleAction('complete')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'complete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Start Visit
        </button>
        <button
          onClick={() => handleAction('reschedule')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'reschedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
          Reschedule
        </button>
        <button
          onClick={() => handleAction('complete')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'complete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          Mark Complete
        </button>
        <button
          onClick={() => handleAction('escalate')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'escalate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
          Escalate
        </button>
      </div>
    </div>
  );
}
