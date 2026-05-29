import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Activity, Wifi, WifiOff, Users, MapPin, 
  PhoneCall, HeartPulse, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DistrictOutbreakMap({ onNodeSelect, activeVillageId = null }) {
  const { lang } = useLanguage();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // 5 Village Nodes in Uttar Pradesh rural healthcare network
  const [nodes, setNodes] = useState([
    {
      id: 'v101',
      name: 'Rameshwar / रामेश्वर',
      x: 140, y: 110,
      population: 4200,
      pregnant: 68,
      children: 290,
      cases: 2,
      asha: '+91 94150 12345',
      status: 'normal', // 'normal', 'emergency', 'outbreak'
      latestAlert: null
    },
    {
      id: 'v102',
      name: 'Shivpur / शिवपुर',
      x: 320, y: 130,
      population: 5800,
      pregnant: 92,
      children: 410,
      cases: 12,
      asha: '+91 94500 54321',
      status: 'outbreak', // Outbreak spike!
      latestAlert: '⚠️ Dengue Spike: 8 cases in 48h'
    },
    {
      id: 'v103',
      name: 'Kharela / खरेला',
      x: 200, y: 240,
      population: 3100,
      pregnant: 45,
      children: 195,
      cases: 1,
      asha: '+91 94310 98765',
      status: 'normal',
      latestAlert: null
    },
    {
      id: 'v104',
      name: 'Babatpur / बाबतपुर',
      x: 90, y: 210,
      population: 4900,
      pregnant: 73,
      children: 330,
      cases: 0,
      asha: '+91 98890 11223',
      status: 'emergency', // Active ambulance alert
      latestAlert: '🚨 Active SOS: Pregnancy referral dispatch'
    },
    {
      id: 'v105',
      name: 'Chiraigaon / चिरईगाँव',
      x: 360, y: 260,
      population: 6200,
      pregnant: 110,
      children: 480,
      cases: 4,
      asha: '+91 99190 44556',
      status: 'normal',
      latestAlert: null
    }
  ]);

  // Keep synced with parent selection if provided
  useEffect(() => {
    if (activeVillageId) {
      const match = nodes.find(n => n.id === activeVillageId);
      if (match) setSelectedNode(match);
    }
  }, [activeVillageId]);

  // Listen to local outbreak simulations (custom events triggered by MonitoringDashboard)
  useEffect(() => {
    const handleOutbreakSim = (e) => {
      const { villageId, status, alert } = e.detail;
      setNodes(prev => prev.map(node => {
        if (node.id === villageId) {
          return { ...node, status, latestAlert: alert, cases: status === 'outbreak' ? node.cases + 15 : node.cases };
        }
        return node;
      }));
      
      // Auto select the simulated node to show alert
      const match = nodes.find(n => n.id === villageId);
      if (match) {
        setSelectedNode({ ...match, status, latestAlert: alert });
      }
    };

    window.addEventListener('outbreak_simulation_trigger', handleOutbreakSim);
    return () => window.removeEventListener('outbreak_simulation_trigger', handleOutbreakSim);
  }, [nodes]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onNodeSelect) onNodeSelect(node.id);
  };

  const getStatusColor = (status) => {
    if (status === 'outbreak') return 'stroke-rose-500 fill-rose-500';
    if (status === 'emergency') return 'stroke-amber-500 fill-amber-500';
    return 'stroke-emerald-500 fill-emerald-500';
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden flex flex-col lg:flex-row gap-6">
      
      {/* MAP SVG CONTAINER */}
      <div className="flex-1 flex flex-col justify-between relative min-h-[320px] bg-slate-950 rounded-[2rem] overflow-hidden p-6 border border-slate-900 shadow-inner">
        {/* MAP WATERMARK BACKGROUND */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        {/* NETWORK & OFFLINE INDICATOR */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
            {isOnline ? 'Network Hub Active' : 'Offline Protocol Synced'}
          </span>
        </div>

        {/* MAP TITLE Watermark */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col leading-none pointer-events-none">
          <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">Varanasi Division</span>
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">SwasthAI Node Network Map</span>
        </div>

        {/* MAIN SVG CANVAS */}
        <svg viewBox="0 0 450 320" className="w-full h-full relative z-10 select-none">
          {/* STYLIZED DISTRICT OUTLINE PATH (Varanasi division layout mock) */}
          <path 
            d="M 40,60 Q 120,30 200,40 T 380,50 Q 420,120 400,200 T 360,280 Q 240,310 140,280 T 30,160 Z" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="2" 
            strokeDasharray="4 6"
          />

          {/* ROAD/ROUTING CONNECTION DASHES BETWEEN VILLAGE NODES */}
          <g opacity="0.3">
            <line x1="140" y1="110" x2="320" y2="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="140" y1="110" x2="200" y2="240" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="200" y1="240" x2="320" y2="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="90" y1="210" x2="200" y2="240" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="320" y1="130" x2="360" y2="260" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="200" y1="240" x2="360" y2="260" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* VILLAGE NODE DOTS & HOT PULSES */}
          {nodes.map(n => {
            const isSelected = selectedNode?.id === n.id;
            const isHovered = hoveredNode?.id === n.id;
            
            return (
              <g 
                key={n.id} 
                className="cursor-pointer" 
                onClick={() => handleNodeClick(n)}
                onMouseEnter={() => setHoveredNode(n)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Outbreak / Emergency Pulse Ring */}
                {n.status !== 'normal' && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSelected ? 22 : 16}
                    fill="none"
                    className={`stroke-2 ${n.status === 'outbreak' ? 'stroke-rose-500/60 animate-ping' : 'stroke-amber-500/60 animate-pulse'}`}
                  />
                )}

                {/* Outer halo */}
                <circle 
                  cx={n.x} 
                  cy={n.y} 
                  r={isSelected ? 16 : isHovered ? 12 : 8} 
                  fill="none" 
                  stroke={isSelected ? '#34d399' : '#1e293b'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />

                {/* Core Node Center */}
                <circle 
                  cx={n.x} 
                  cy={n.y} 
                  r={isSelected ? 8 : 6} 
                  className={`transition-all duration-300 ${
                    n.status === 'outbreak' ? 'fill-rose-500 animate-pulse' :
                    n.status === 'emergency' ? 'fill-amber-500' : 'fill-emerald-500'
                  }`}
                />

                {/* Village Tag */}
                <text
                  x={n.x}
                  y={n.y - (isSelected ? 22 : 14)}
                  textAnchor="middle"
                  fill={isSelected ? '#34d399' : '#94a3b8'}
                  className="text-[9px] font-black tracking-tight"
                >
                  {n.name.split(' / ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* FLOAT SIDE CARD (REAL-TIME INFORMATION PANEL) */}
      <div className="w-full lg:w-[260px] flex flex-col justify-between shrink-0">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                    {selectedNode.name.split(' / ')[0]}
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {selectedNode.name.split(' / ')[1]}
                  </p>
                </div>
                <span className={`w-3 h-3 rounded-full ${
                  selectedNode.status === 'outbreak' ? 'bg-rose-500 animate-pulse' :
                  selectedNode.status === 'emergency' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`} />
              </div>

              {/* OUTBREAK ALERT BADGE */}
              {selectedNode.status !== 'normal' && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                  selectedNode.status === 'outbreak' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black leading-tight uppercase tracking-wider">
                    {selectedNode.latestAlert || 'Active telemetry event cluster detected.'}
                  </p>
                </div>
              )}

              {/* STATISTICS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Pop</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedNode.population}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1.5 text-rose-500 mb-1">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Preg</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedNode.pregnant}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Active Cases / सक्रिय मामले</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedNode.cases}</p>
                </div>
              </div>

              {/* ASHA WORKER CALL WIDGET */}
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ASHA / आरोग्य दीदी</p>
                <a
                  href={`tel:${selectedNode.asha}`}
                  className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-emerald-800 transition-colors shadow-sm"
                >
                  <span className="text-xs font-black tracking-tight">{selectedNode.asha}</span>
                  <PhoneCall className="w-4 h-4 shrink-0 text-emerald-600" />
                </a>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center h-full min-h-[220px]">
              <MapPin className="w-10 h-10 text-slate-300 animate-bounce mb-3 shrink-0" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select a Node</h4>
              <p className="text-[10px] text-slate-400 font-bold leading-normal mt-2 px-4">
                Tap on any village node on the map to review real-time population, active case tracking, and ASHA contact channels.
              </p>
            </div>
          )}
        </AnimatePresence>

        {/* RE-POOL ALL DATA ACTION */}
        <button
          onClick={() => {
            const list = ['v101', 'v102', 'v103', 'v104', 'v105'];
            const rand = list[Math.floor(Math.random() * list.length)];
            // trigger a mock sync re-pool
            const match = nodes.find(n => n.id === rand);
            if (match) setSelectedNode(match);
          }}
          className="mt-4 w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-slate-900 hover:border-emerald-600"
          style={{ minHeight: '48px' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-poll Telemetry
        </button>
      </div>

    </div>
  );
}
