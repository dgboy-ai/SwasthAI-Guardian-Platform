import { useState } from 'react';
import { MapPin } from 'lucide-react';
import api from '../services/api';

export default function VillageForm({ onSave }) {
  const [formData, setFormData] = useState({
    villageId: '',
    name: '',
    district: '',
    population: '',
    ashaContact: '',
    pregnant: 0,
    children: 0,
    malnutrition: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/ngo/village', {
        villageId: formData.villageId.trim(),
        name: formData.name.trim(),
        population: parseInt(formData.population, 10) || 0,
        pregnant: parseInt(formData.pregnant, 10) || 0,
        children: parseInt(formData.children, 10) || 0,
        malnutrition: parseInt(formData.malnutrition, 10) || 0,
        contact: formData.ashaContact.trim(),
        district: formData.district.trim(),
      });
      onSave?.(formData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to register village.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-2xl w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Initialize Village Node</h2>
          <p className="text-sm text-slate-500 font-medium">Register a new rural health unit in the district.</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Village Identifier</label>
            <input
              className="input-field"
              placeholder="e.g. v101"
              value={formData.villageId}
              onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Village Name</label>
            <input
              className="input-field"
              placeholder="e.g. Rampur"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">District Name</label>
          <input
            className="input-field"
            placeholder="e.g. Varanasi"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Population</label>
            <input
              type="number"
              className="input-field"
              placeholder="Total residents"
              value={formData.population}
              onChange={(e) => setFormData({ ...formData, population: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">ASHA Primary Contact</label>
            <input
              className="input-field"
              placeholder="+91-0000000000"
              value={formData.ashaContact}
              onChange={(e) => setFormData({ ...formData, ashaContact: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-indigo-100 mt-4 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Submit Village Data Node'}
        </button>
      </form>
    </div>
  );
}
