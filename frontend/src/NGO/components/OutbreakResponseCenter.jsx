import React, { useState } from 'react';
import { AlertTriangle, MapPin, Thermometer, ClipboardCheck, Shield, Activity, Radio, Eye } from 'lucide-react';

const STATUS_COLORS = {
  Critical: 'text-red-600 bg-red-50 border-red-100',
  High: 'text-orange-600 bg-orange-50 border-orange-100',
  Medium: 'text-amber-600 bg-amber-50 border-amber-100',
  Low: 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

const HEAT_LEVEL_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-amber-500',
  safe: 'bg-emerald-500',
};

export default function OutbreakResponseCenter({ outbreak, onClose }) {
  const [containmentStatus, setContainmentStatus] = useState(35);
  const [activeTab, setActiveTab] = useState('villages');

  const affectedVillages = [
    { name: 'Village V101', cases: 12, risk: 'High', heatLevel: 87, trend: 'increasing' },
    { name: 'Village V102', cases: 5, risk: 'Medium', heatLevel: 54, trend: 'stable' },
    { name: 'Village V103', cases: 2, risk: 'Low', heatLevel: 22, trend: 'declining' },
    { name: 'Village V104', cases: 1, risk: 'Low', heatLevel: 15, trend: 'declining' },
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

  const totalCases = affectedVillages.reduce((s, v) => s + v.cases, 0);
  const highRiskVillages = affectedVillages.filter(v => v.risk === 'High' || v.risk === 'Critical').length;

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

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-slate-900">{totalCases}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Total Cases</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-slate-900">{affectedVillages.length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Villages</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-orange-600">{highRiskVillages}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">High Risk</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> Containment Progress
          </p>
          <span className="text-[10px] font-bold text-slate-600">{containmentStatus}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
            style={{ width: `${containmentStatus}%` }}
          />
        </div>
        <button
          onClick={() => setContainmentStatus(prev => Math.min(100, prev + 15))}
          className="mt-1.5 text-[9px] font-bold text-[#059669] hover:underline"
        >
          + Update Containment Progress
        </button>
      </div>

      <div className="flex gap-1.5 border-b border-slate-100 pb-2">
        {['villages', 'actions', 'checklist'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all ${
              activeTab === tab ? 'bg-[#059669] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab === 'villages' ? '📍 Villages' : tab === 'actions' ? '📋 Actions' : '✅ Checklist'}
          </button>
        ))}
      </div>

      {activeTab === 'villages' && (
        <div className="space-y-2">
          {affectedVillages.map((v) => (
            <div key={v.name} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-slate-800">{v.name}</p>
                <p className="text-[10px] text-slate-400">{v.cases} reported cases • {v.trend}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-bold text-slate-600">{v.heatLevel}°</span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${v.heatLevel > 70 ? 'bg-red-500' : v.heatLevel > 40 ? 'bg-orange-500' : 'bg-amber-500'}`} />
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${v.heatLevel > 70 ? 'bg-red-50 text-red-700' : v.heatLevel > 40 ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'}`}>
                  {v.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
          {actionPlan.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-slate-700 font-medium">{item}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-1.5">
          {checklist.map((item, i) => (
            <label key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="rounded text-[#059669] focus:ring-[#059669] w-4 h-4" />
              <span className="text-[11px] text-slate-700 font-medium">{item}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
