import React from 'react';
import { AlertTriangle, MapPin, Thermometer, ClipboardCheck, Shield } from 'lucide-react';

const STATUS_COLORS = {
  Critical: 'text-red-600 bg-red-50 border-red-100',
  High: 'text-orange-600 bg-orange-50 border-orange-100',
  Medium: 'text-amber-600 bg-amber-50 border-amber-100',
  Low: 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

export default function OutbreakResponseCenter({ outbreak, onClose }) {
  const affectedVillages = [
    { name: 'Village V101', cases: 12, risk: 'High', heatLevel: 87 },
    { name: 'Village V102', cases: 5, risk: 'Medium', heatLevel: 54 },
    { name: 'Village V103', cases: 2, risk: 'Low', heatLevel: 22 },
    { name: 'Village V104', cases: 1, risk: 'Low', heatLevel: 15 },
  ];

  const actionPlan = [
    'Deploy ASHA teams for door-to-door screening',
    'Distribute mosquito nets in affected sectors',
    'Set up rapid diagnostic test camps at PHC',
    'Conduct community awareness on symptoms',
    'Report daily case counts to District CMO',
  ];

  const checklist = [
    'All symptomatic patients registered',
    'Fever cases logged in outbreak telemetry',
    'Blood slides collected for lab confirmation',
    'Household vector control measures completed',
    'Health education materials distributed',
    'Referral chain activated for severe cases',
  ];

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black uppercase text-red-700">Active {outbreak.disease} Outbreak</p>
          <p className="text-[11px] font-medium text-slate-700 mt-1">
            Autonomous Outbreak Agent detected anomaly pattern with {outbreak.riskScore}% confidence based on symptom telemetry analysis.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Affected Villages
        </p>
        <div className="space-y-2">
          {affectedVillages.map((v) => (
            <div key={v.name} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-slate-800">{v.name}</p>
                <p className="text-[10px] text-slate-400">{v.cases} reported cases</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-bold text-slate-600">{v.heatLevel}°</span>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLORS[v.risk] ? STATUS_COLORS[v.risk].split(' ')[0] : 'text-slate-600'}`}>
                  {v.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5" /> Suggested Action Plan
        </p>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
          {actionPlan.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-slate-700 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Field Verification Checklist
        </p>
        <div className="space-y-1.5">
          {checklist.map((item, i) => (
            <label key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="rounded text-[#059669] focus:ring-[#059669] w-4 h-4" />
              <span className="text-[11px] text-slate-700 font-medium">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
