import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, X, User, Baby, Heart, Thermometer, Ambulance, ChevronRight, CheckCircle, AlertTriangle, Calendar, MapPin, Activity, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';

const RECORD_TYPES = [
  { id: 'pregnancy', label: 'Pregnancy Record', icon: Heart, desc: 'Log a new pregnancy with vitals and risk assessment', color: 'from-rose-50 to-rose-100/50 border-rose-200 text-rose-600', badge: 'Maternal', iconBg: 'bg-rose-100' },
  { id: 'nutrition', label: 'Child Nutrition', icon: Baby, desc: 'Record child malnutrition screening and MUAC data', color: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-600', badge: 'Child', iconBg: 'bg-purple-100' },
  { id: 'symptoms', label: 'Symptoms Check', icon: Thermometer, desc: 'Document patient symptoms for AI-powered triage', color: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-600', badge: 'Triage', iconBg: 'bg-emerald-100' },
  { id: 'emergency', label: 'Emergency Record', icon: Ambulance, desc: 'Create an emergency case and dispatch ambulance', color: 'from-red-50 to-red-100/50 border-red-200 text-red-600', badge: 'Urgent', iconBg: 'bg-red-100' },
];

const FORM_FIELDS = {
  pregnancy: [
    { id: 'name', label: 'Patient Name', type: 'text', placeholder: 'Full name' },
    { id: 'age', label: 'Age (years)', type: 'number', placeholder: 'e.g. 25' },
    { id: 'months', label: 'Months Pregnant', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    { id: 'bp', label: 'Blood Pressure', type: 'text', placeholder: 'e.g. 120/80' },
    { id: 'hb', label: 'Hemoglobin', type: 'text', placeholder: 'e.g. 11.5' },
  ],
  nutrition: [
    { id: 'childName', label: 'Child Name', type: 'text', placeholder: 'Full name' },
    { id: 'ageMonths', label: 'Age (months)', type: 'number', placeholder: 'e.g. 24' },
    { id: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 10.5' },
    { id: 'height', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 85' },
    { id: 'muac', label: 'MUAC (cm)', type: 'number', placeholder: 'e.g. 12.5' },
  ],
  symptoms: [
    { id: 'patientName', label: 'Patient Name', type: 'text', placeholder: 'Full name' },
    { id: 'temperature', label: 'Temperature (°F)', type: 'number', placeholder: 'e.g. 98.6' },
    { id: 'cough', label: 'Cough', type: 'checkbox' },
    { id: 'rash', label: 'Rash', type: 'checkbox' },
    { id: 'breathing', label: 'Breathing Difficulty', type: 'checkbox' },
  ],
  emergency: [
    { id: 'patientName', label: 'Patient Name', type: 'text', placeholder: 'Full name' },
    { id: 'type', label: 'Emergency Type', type: 'select', options: ['High Fever', 'Accident', 'Labour Pain', 'Chest Pain', 'Burns', 'Other'] },
    { id: 'location', label: 'Location', type: 'text', placeholder: 'Village / Area' },
    { id: 'comments', label: 'Additional Comments', type: 'textarea', placeholder: 'Describe the emergency...' },
  ],
};

const STEPS = [
  { num: 1, label: 'Choose Type' },
  { num: 2, label: 'Fill Details' },
  { num: 3, label: 'Confirmation' },
];

export default function NGORecordCreationPage() {
  console.log("NGORecordCreationPage Rendered");
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentStep = !selectedType ? 1 : submitted ? 3 : 2;

  const handleSelect = (id) => {
    setSelectedType(id);
    setFormData({});
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[Record] ${selectedType} submitted:`, formData);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedType(null);
    setFormData({});
    setSubmitted(false);
  };

  const activeFields = selectedType ? FORM_FIELDS[selectedType] : [];
  const selectedTypeData = RECORD_TYPES.find(r => r.id === selectedType);

  if (pageLoading) {
    return (
      <div className="bg-slate-50 min-h-screen font-inter">
        <Navbar role="ngo" />
        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
          <div className="animate-pulse space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-44 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 bg-slate-200 rounded-2xl" />
                    <div className="h-2 w-16 bg-slate-100 rounded mt-1.5" />
                  </div>
                  {i < 3 && <div className="flex-1 h-0.5 mx-3 bg-slate-200 rounded-full" />}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-slate-200 rounded" />
                      <div className="h-3 w-full bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-inter">
      <Navbar role="ngo" />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center shadow-sm">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Add Record</h1>
              <p className="text-xs text-slate-400 font-semibold">Create a new patient record · All data syncs to AWS Aurora</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 scale-110'
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors ${
                      isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}>{step.label}</span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {!selectedType ? (
          /* Step 1: Choose record type */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RECORD_TYPES.map((rt, i) => {
              const Icon = rt.icon;
              return (
                <motion.button key={rt.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => handleSelect(rt.id)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group active:scale-[0.98] bg-gradient-to-br">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200 ${rt.iconBg} ${rt.color.split(' ')[2]}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-base font-black text-slate-900">{rt.label}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${rt.color}`}>{rt.badge}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold leading-snug">{rt.desc}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center shrink-0 mt-1 transition-colors">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          /* Step 2 & 3: Form / Success */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => submitted ? handleReset() : setSelectedType(null)}
                  className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4.5 h-4.5" />
                </button>
                <div>
                  <h2 className="text-base font-black text-slate-900">{selectedTypeData?.label}</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">{submitted ? 'Record created successfully' : 'Fill in the details below'}</p>
                </div>
              </div>
              {selectedTypeData && (
                <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black ${selectedTypeData.color.split(' ').slice(2).join(' ')} ${selectedTypeData.iconBg} border`}>
                  {selectedTypeData.badge}
                </div>
              )}
            </div>

            {submitted ? (
              /* Step 3: Confirmation */
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-200/30">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="font-black text-slate-900 text-2xl">Record Created!</motion.p>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-sm text-slate-400 font-semibold mt-2">Data synced to AWS Aurora</motion.p>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="flex gap-3 mt-8">
                  <button onClick={handleReset}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200/30 active:scale-[0.98]">
                    Add Another Record
                  </button>
                  <button onClick={() => navigate('/ngo')}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]">
                    Back to Dashboard
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              /* Step 2: Fill form */
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {activeFields.map(f => (
                    <div key={f.id}>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">{f.label}</label>
                      {f.type === 'select' ? (
                        <select value={formData[f.id] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.id]: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all">
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === 'checkbox' ? (
                        <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input type="checkbox" checked={formData[f.id] || false} onChange={e => setFormData(prev => ({ ...prev, [f.id]: e.target.checked }))}
                            className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                          <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                        </label>
                      ) : f.type === 'textarea' ? (
                        <textarea value={formData[f.id] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.id]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all resize-none" rows={3} />
                      ) : (
                        <input type={f.type} value={formData[f.id] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.id]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                  <button type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200/30 active:scale-[0.98]">
                    <CheckCircle className="w-4.5 h-4.5 inline mr-1.5" /> Submit Record
                  </button>
                  <button type="button" onClick={() => setSelectedType(null)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        <button onClick={() => navigate('/ngo')}
          className="mt-8 w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 hover:shadow-sm active:scale-[0.98]">
          <ChevronRight className="w-4 h-4" /> Back to Dashboard
        </button>
      </main>
    </div>
  );
}