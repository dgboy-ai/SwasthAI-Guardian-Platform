import { useState } from 'react';
import { Users, LayoutDashboard, HeartPulse, Activity } from 'lucide-react';
import api from '../services/api';

export default function MalnutritionForm({ onResult }) {
  const [formData, setFormData] = useState({
    childName: '',
    ageMonths: '',
    weight: '',
    height: '',
    villageId: 'v101'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ngo/malnutrition', {
        // Backend reads 'name' — fixed key mismatch from 'childName'
        name: formData.childName,
        age: Number(formData.ageMonths),
        weight: Number(formData.weight),
        height: Number(formData.height),
        villageId: formData.villageId
      });
      onResult(res.data);
      alert(`✅ Child Assessment Complete\nStatus: ${res.data.status}\nBMI: ${res.data.bmi}\nAction: ${res.data.action}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to connect to the Malnutrition AI Server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-2xl w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Check Child Nutrition</h2>
          <p className="text-sm text-slate-500 font-medium">Enter the child's details to check for malnutrition and ensure healthy growth.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Child's Full Name</label>
            <input
              className="input-field"
              placeholder="e.g. Raju Kumar"
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Age (in Months)</label>
            <input
              type="number"
              className="input-field"
              placeholder="0-60 months"
              value={formData.ageMonths}
              onChange={(e) => setFormData({ ...formData, ageMonths: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Weight (in KG)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="Child's weight"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Height (in CM)</label>
            <input
              type="number"
              className="input-field"
              placeholder="Child's height"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-amber-100 bg-amber-500 hover:bg-amber-600 border-amber-600 mt-4">
          {loading ? 'Checking Growth...' : 'Check Nutrition Status'}
        </button>
      </form>
    </div>
  );
}
