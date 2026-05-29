import { useState } from 'react';
import { HeartPulse, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function PregnancyTracker({ onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    trimester: 1,
    dueDate: '',
    villageId: 'v101'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // The backend uses /api/ngo/maternal, so we must match it here!
      const res = await api.post('/ngo/maternal', formData);
      onSave(res.data);
      alert(`Maternal Record Saved. Predicted Risk: ${res.data.riskLevel}`);
    } catch (err) {
      console.error(err);
      // Show the user an alert if the AI server is down, instead of doing nothing
      alert(err.response?.data?.error || 'Failed to connect to the Maternal Health AI Server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-2xl w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Register Pregnancy</h2>
          <p className="text-sm text-slate-500 font-medium">Add a new pregnant woman to monitor her health and detect risks early.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mother's Full Name</label>
            <input className="input-field" placeholder="Enter mother's full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mother's Age</label>
            <input type="number" className="input-field" placeholder="Enter age" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Current Pregnancy Stage</label>
            <select className="input-field pr-10" value={formData.trimester} onChange={(e) => setFormData({ ...formData, trimester: Number(e.target.value) })}>
              <option value={1}>1st Trimester (Months 1-3)</option>
              <option value={2}>2nd Trimester (Months 4-6)</option>
              <option value={3}>3rd Trimester (Months 7-9)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Expected Delivery Date</label>
            <input type="date" className="input-field" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-rose-100 bg-rose-600 hover:bg-rose-700 border-rose-700 mt-4">
          {loading ? 'Checking Health Risk...' : 'Save Pregnancy Record'}
        </button>
      </form>
    </div>
  );
}
