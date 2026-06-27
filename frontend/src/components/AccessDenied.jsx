import React from 'react';
import { Shield, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied({ role = 'user', requiredRole = 'admin' }) {
  const navigate = useNavigate();

  const roleDisplay = {
    villager: 'Villager',
    asha: 'ASHA Worker',
    ngo: 'NGO Coordinator',
    admin: 'Administrator',
    superadmin: 'Super Admin',
  };

  const bgGradients = {
    villager: 'from-emerald-50 via-teal-50 to-emerald-50',
    ngo: 'from-blue-50 via-indigo-50 to-blue-50',
    admin: 'from-red-50 via-rose-50 to-red-50',
    asha: 'from-amber-50 via-orange-50 to-amber-50',
  };

  const requiredBg = bgGradients[requiredRole] || 'from-slate-50 via-gray-50 to-slate-50';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${requiredBg} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-1">Access Denied</h1>
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-xs font-bold text-amber-600">403 Forbidden</p>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">
          Your account is registered as <strong className="text-slate-800">{roleDisplay[role] || role}</strong>.
        </p>
        <p className="text-sm text-slate-500 font-medium mb-6">
          This area requires <strong className="text-emerald-700">{roleDisplay[requiredRole] || requiredRole}</strong> privileges.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
