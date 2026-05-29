import { useState } from 'react';
import { MapPin, Users, HeartPulse, UserPlus, Info } from 'lucide-react';
import api from '../services/api';

export default function VillageForm({ onSave }) {
  const [formData, setFormData] = useState({
    villageId: '',
    name: '',
    district: '',
    population: '',
    ashaContact: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real app we'd call /api/ngo/village
      // For now we'll mock success
      onSave(formData);
      alert('Village initialized successfully!');
    } catch (err) {
      console.error(err);
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Village Identifier</label>
            <input 
              className="input-field" 
              placeholder="e.g. V-1024" 
              value={formData.villageId}
              onChange={(e) => setFormData({...formData, villageId: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Village Name</label>
            <input 
              className="input-field" 
              placeholder="e.g. Rampur" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
            onChange={(e) => setFormData({...formData, district: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Population axis</label>
            <input 
              type="number"
              className="input-field" 
              placeholder="Total residents" 
              value={formData.population}
              onChange={(e) => setFormData({...formData, population: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">ASHA Primary Contact</label>
            <input 
              className="input-field" 
              placeholder="+91-0000000000" 
              value={formData.ashaContact}
              onChange={(e) => setFormData({...formData, ashaContact: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-indigo-100 mt-4">
           Submit Village Data Node
        </button>
      </form>
    </div>
  );
}
