import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MenstrualCycleTracker() {
  const { t } = useLanguage();
  const [lastPeriod, setLastPeriod] = useState(localStorage.getItem('swasthai_last_period') || '');
  const [cycleLength] = useState(28); // defaulting to 28 days for rural simplicity

  const calculateNext = () => {
    if (!lastPeriod) return null;
    const date = new Date(lastPeriod);
    date.setDate(date.getDate() + cycleLength);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleSave = (e) => {
    const val = e.target.value;
    setLastPeriod(val);
    localStorage.setItem('swasthai_last_period', val);
  };

  const nextPeriod = calculateNext();

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.cycle_tracker || 'Cycle Tracker'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.cycle_desc || 'Track your periods to know when your next one is coming so you can be prepared.'}</p>
      </div>

      <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 text-center">
        <label className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-3">
          First day of your last period
        </label>
        <input 
          type="date" 
          value={lastPeriod} 
          onChange={handleSave}
          className="w-full max-w-xs mx-auto px-4 py-3 rounded-xl border border-rose-200 bg-white text-slate-700 font-bold focus:ring-4 focus:ring-rose-500/20 outline-none transition-all shadow-sm block"
        />
        
        {nextPeriod && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-200/50 border border-rose-100 mb-4">
              <Calendar className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">Expected Next Period</p>
            <p className="text-3xl font-black text-rose-900">{nextPeriod}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-rose-500 text-sm font-medium">
              <span className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
              <span>Based on a standard 28-day cycle</span>
            </div>
          </div>
        )}

        {!nextPeriod && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl border border-rose-100/50">
            <p className="text-rose-800/60 font-semibold text-sm">Select a date above to see your next expected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
