import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 animate-pulse ${className}`}>
      {/* Icon / Shape Placeholder */}
      <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
      
      <div className="space-y-2">
        {/* Title Placeholder */}
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        
        {/* Description Placeholders */}
        <div className="h-3 bg-slate-150 rounded w-full" />
        <div className="h-3 bg-slate-150 rounded w-5/6" />
      </div>

      {/* Button / Action Placeholder */}
      <div className="h-10 bg-slate-200 rounded-xl w-1/2 pt-1" />
    </div>
  );
}
