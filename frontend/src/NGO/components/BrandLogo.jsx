import React from 'react';
import { Heart } from 'lucide-react';

const SIZE_MAP = {
  sm: { icon: 'w-7 h-7', iconInner: 'w-3.5 h-3.5', title: 'text-xs', subtitle: 'text-[8px]', gap: 'gap-1' },
  md: { icon: 'w-8 h-8 sm:w-9 sm:h-9', iconInner: 'w-4 h-4 sm:w-4.5 sm:h-4.5', title: 'text-xs sm:text-sm', subtitle: 'text-[7px] sm:text-[8px]', gap: 'gap-1.5' },
  lg: { icon: 'w-9 h-9', iconInner: 'w-5 h-5', title: 'text-sm', subtitle: 'text-[8px]', gap: 'gap-2' },
};

export default function BrandLogo({ size = 'md', showSubtitle = true, className = '' }) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className={`${s.icon} bg-[#059669] rounded-xl flex items-center justify-center shadow shadow-emerald-500/20 shrink-0`}>
        <Heart className={`${s.iconInner} text-white`} />
      </div>
      <div className="text-left leading-none">
        <div className="flex items-baseline gap-0.5">
          <span className={`${s.title} font-black text-slate-900 leading-none`}>SwasthAI</span>
        </div>
        {showSubtitle && (
          <p className={`${s.subtitle} font-black text-slate-400 uppercase tracking-widest mt-0.5 leading-none`}>
            EMPOWERING RURAL BHARAT
          </p>
        )}
      </div>
    </div>
  );
}
