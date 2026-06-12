import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DesktopOnlyWrapper({ children, dashboardName = 'Admin Dashboard' }) {
  const [isMobile, setIsMobile] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      // 1024px corresponds to typical Tailwind lg: breakpoint (desktop/laptop viewport)
      setIsMobile(window.innerWidth < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  if (isMobile && !bypassed) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#051612] text-slate-100 p-6 overflow-y-auto font-inter">
        {/* Background Decorative Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative w-full max-w-md bg-[#0b241e]/80 border border-emerald-500/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center">
          {/* Warning Icon Badge */}
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400 mb-6 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
            Laptop / Desktop Experience Recommended
          </h2>
          
          <p className="text-emerald-100/60 text-sm leading-relaxed mb-6">
            The <span className="text-emerald-300 font-semibold">{dashboardName}</span> features complex real-time telemetry charts, heatmaps, and spatial database monitors. For optimal visibility and controls, a laptop or desktop viewport is recommended (min 1024px width).
          </p>

          {/* Visual comparison indicators */}
          <div className="flex justify-center items-center gap-6 mb-8 text-xs text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="w-8 h-8 text-rose-400 opacity-60" />
              <span>Mobile View<br/>(Not Optimized)</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="flex flex-col items-center gap-2 text-emerald-400 font-medium">
              <Monitor className="w-8 h-8 text-emerald-400" />
              <span>Laptop View<br/>(Recommended)</span>
            </div>
          </div>

          {/* Interactive options */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setBypassed(true)}
              className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] transition-all rounded-xl text-sm font-bold text-[#051612] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Proceed to Dashboard <ChevronRight className="w-4 h-4" />
            </button>
            
            <p className="text-[11px] text-emerald-100/40">
              * Rotating your phone to landscape mode may also help fit the graphs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
