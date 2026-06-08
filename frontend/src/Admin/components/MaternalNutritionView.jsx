import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Baby, ArrowRight } from 'lucide-react';

export default function MaternalNutritionView({ activeView }) {
  return (
    <div className="p-4 lg:p-5 text-left">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          {activeView === 'maternal' ? <Heart className="w-8 h-8 text-white" /> : <Baby className="w-8 h-8 text-white" />}
        </div>
        <h3 className="font-black text-slate-900 text-[18px] mb-2">
          {activeView === 'maternal' ? 'Maternal Health Records' : 'Child Nutrition Monitor'}
        </h3>
        <p className="text-[12px] text-slate-400 font-medium max-w-sm mx-auto mb-6 leading-relaxed">
          {activeView === 'maternal'
            ? 'NGO/ASHA workers log real-time pregnancy vitals with WHO danger threshold alerts. Access full records via the NGO dashboard.'
            : 'WHO Z-score + BMI child growth monitoring by NGO field workers. Access full records via the NGO dashboard.'}
        </p>
        <Link
          to={activeView === 'maternal' ? '/ngo/maternal' : '/ngo/child-nutrition'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[12px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Open NGO Module <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
