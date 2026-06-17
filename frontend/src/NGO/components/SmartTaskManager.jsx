import React, { useState } from 'react';
import { CheckCircle, Calendar, ArrowUpCircle, UserPlus, Loader2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

export default function SmartTaskManager({ task, onComplete, onClose }) {
  const [actionLoading, setActionLoading] = useState('');

  const handleAction = async (action) => {
    setActionLoading(action);
    await new Promise((r) => setTimeout(r, 800));
    
    switch (action) {
      case 'complete':
        showToast(`Task completed: ${task.patientName}`, 'success');
        onComplete(task.id);
        break;
      case 'reschedule':
        showToast(`Rescheduled: ${task.patientName} moved to tomorrow`, 'info');
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-900">{task.patientName}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{task.type} • Distance: {task.distance}</p>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5 text-xs text-slate-700">
        <p><strong className="text-slate-800">Clinical Reason:</strong> Regular health check-up and vitals assessment.</p>
        <p><strong className="text-slate-800">Upcoming Visits:</strong> Today (Schedule Followup)</p>
        <p><strong className="text-slate-800">Missed Visits:</strong> 1 (Last week check)</p>
        <p><strong className="text-slate-800">Assigned ASHA:</strong> Sunita Devi</p>
        {task.priority && (
          <p>
            <strong className="text-slate-800">Priority:</strong>{' '}
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              task.priorityColor === 'red' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>{task.priority}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleAction('complete')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'complete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Complete
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
          onClick={() => handleAction('escalate')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'escalate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
          Escalate
        </button>
        <button
          onClick={() => handleAction('followup')}
          disabled={actionLoading !== ''}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {actionLoading === 'followup' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Assign Follow-up
        </button>
      </div>
    </div>
  );
}
