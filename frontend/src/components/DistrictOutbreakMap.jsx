import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Activity, Wifi, WifiOff, Users, MapPin, 
  PhoneCall, HeartPulse, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import adminService from '../services/adminService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VILLAGE_COORDS = {
  v101: [25.3300, 82.9500],
  v102: [25.3500, 83.0200],
  v103: [25.2900, 82.9800],
  v104: [25.3100, 82.9200],
  v105: [25.3400, 83.0800],
};

const getVillageCoords = (villageId, index) => {
  if (VILLAGE_COORDS[villageId]) return VILLAGE_COORDS[villageId];
  // Deterministic coordinate within Varanasi area for dynamically uploaded villages
  const hash = Array.from(villageId || 'unknown').reduce((a, c) => a + c.charCodeAt(0), 0);
  const lat = 25.28 + (hash % 100) / 1000 + (index % 3) * 0.02;
  const lng = 82.90 + (hash % 150) / 1000 + Math.floor(index / 3) * 0.02;
  return [lat, lng];
};

const DEFAULT_NODES = [
  { id: 'v101', name: 'Rampur / रामपुर', population: 4200, pregnant: 68, children: 290, cases: 2, asha: '+91 94150 12345', status: 'normal', latestAlert: null, outbreakScore: 15 },
  { id: 'v102', name: 'Shivpur / शिवपुर', population: 5800, pregnant: 92, children: 410, cases: 12, asha: '+91 94500 54321', status: 'outbreak', latestAlert: '⚠️ Dengue Spike: 8 cases in 48h', outbreakScore: 88 },
  { id: 'v103', name: 'Kharela / खरेला', population: 3100, pregnant: 45, children: 195, cases: 1, asha: '+91 94310 98765', status: 'normal', latestAlert: null, outbreakScore: 5 },
  { id: 'v104', name: 'Babatpur / बाबतपुर', population: 4900, pregnant: 73, children: 330, cases: 0, asha: '+91 98890 11223', status: 'emergency', latestAlert: '🚨 Active SOS: Pregnancy referral dispatch', outbreakScore: 45 },
  { id: 'v105', name: 'Chiraigaon / चिरईगाँव', population: 6200, pregnant: 110, children: 480, cases: 4, asha: '+91 99190 44556', status: 'normal', latestAlert: null, outbreakScore: 12 },
];

export default function DistrictOutbreakMap({ onNodeSelect, activeVillageId = null }) {
  const { lang } = useLanguage();
  const [selectedNode, setSelectedNode] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [isPolling, setIsPolling] = useState(false);
  const [pollSuccess, setPollSuccess] = useState(false);
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered around Varanasi with performance options
    const map = L.map(mapContainerRef.current, {
      center: [25.32, 82.98],
      zoom: 11,
      minZoom: 10,
      maxZoom: 14,
      zoomControl: false,
      renderer: L.canvas(), // HUGE speed boost for vector circles/boundaries rendering
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      updateWhenIdle: true, // Only load tiles when panning stops for snappy responsiveness
      updateWhenZooming: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // GeoJSON district boundary for Varanasi
    const varanasiBoundary = {
      "type": "Feature",
      "properties": { "name": "Varanasi" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [82.80, 25.42],
          [83.18, 25.42],
          [83.18, 25.20],
          [82.80, 25.20],
          [82.80, 25.42]
        ]]
      }
    };

    L.geoJSON(varanasiBoundary, {
      style: {
        color: '#10b981',
        weight: 1.5,
        fillColor: '#10b981',
        fillOpacity: 0.04,
        dashArray: '4, 6'
      }
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load live villages from DB
  useEffect(() => {
    const loadVillages = async () => {
      try {
        let heatmapList = [];
        try {
          const heatmapRes = await adminService.getHeatmapData();
          heatmapList = heatmapRes?.heatmap || [];
        } catch (he) {
          console.warn("Failed to load heatmap data, using fallback defaults", he);
        }

        const data = await adminService.getVillages();
        const villages = Array.isArray(data) ? data : [];
        if (!villages.length) return;

        setNodes(villages.map((v, i) => {
          const alert = v.outbreakAlert || v.outbreakalert;
          const heatItem = heatmapList.find(h => h.villageId === v.villageId);
          const score = heatItem ? heatItem.outbreakScore : (alert ? 85 : 15);
          return {
            id: v.villageId,
            name: v.name || v.villageId,
            population: v.population ?? 0,
            pregnant: v.pregnant_women ?? 0,
            children: v.children_under_5 ?? 0,
            cases: v.malnutrition_cases ?? 0,
            asha: v.asha_phone || v.asha_contact || '—',
            status: alert ? 'outbreak' : (score > 40 ? 'emergency' : 'normal'),
            latestAlert: alert,
            outbreakScore: score
          };
        }));
      } catch (_) {
        /* Keep default/mock nodes on failure or offline mode */
      }
    };

    loadVillages();
  }, []);

  // Sync markers onto Leaflet Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    nodes.forEach((n, index) => {
      const coords = getVillageCoords(n.id, index);
      const isSelected = selectedNode?.id === n.id;
      const score = n.outbreakScore || 0;

      // Draw Glowing Heat Map Aura/Circle
      let heatColor = '#10b981'; // green
      if (score >= 80) heatColor = '#ef4444'; // red
      else if (score >= 50) heatColor = '#f97316'; // orange/amber
      else if (score >= 20) heatColor = '#eab308'; // yellow

      L.circle(coords, {
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: 0.15 + (score / 100) * 0.4,
        radius: 600 + (score / 100) * 1400,
        weight: 1.5,
        dashArray: score > 50 ? '4, 4' : null
      }).addTo(markersLayerRef.current);

      let markerHtml = '';
      if (n.status === 'outbreak') {
        markerHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-rose-500 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border border-white shadow-md"></span>
          </div>
        `;
      } else if (n.status === 'emergency') {
        markerHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 animate-pulse rounded-full bg-amber-500 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-white shadow-md"></span>
          </div>
        `;
      } else {
        markerHtml = `
          <div class="relative flex items-center justify-center">
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white shadow-md"></span>
          </div>
        `;
      }

      if (isSelected) {
        markerHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-12 w-12 rounded-full border-2 border-emerald-400 animate-pulse"></span>
            ${markerHtml}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(coords, { icon: customIcon });
      marker.on('click', () => {
        handleNodeClick(n);
      });

      marker.bindTooltip(n.name.split(' / ')[0], {
        permanent: false,
        direction: 'top',
        className: 'leaflet-tooltip-custom bg-white text-slate-800 border border-slate-200 font-black text-[10px] rounded px-2.5 py-1.5 shadow-md'
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [nodes, selectedNode]);

  // Keep synced with parent selection if provided
  useEffect(() => {
    if (activeVillageId) {
      const match = nodes.find(n => n.id === activeVillageId);
      if (match) setSelectedNode(match);
    }
  }, [activeVillageId, nodes]);

  // Center view on selected node coordinates
  useEffect(() => {
    if (selectedNode && mapInstanceRef.current) {
      const match = nodes.find(n => n.id === selectedNode.id);
      if (match) {
        const index = nodes.indexOf(match);
        const coords = getVillageCoords(match.id, index);
        mapInstanceRef.current.setView(coords, 12, { animate: true });
      }
    }
  }, [selectedNode, nodes]);

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

  const handleRecenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([25.32, 82.98], 11, { animate: true });
    }
  };

  const handleRePollTelemetry = async () => {
    if (!selectedNode || isPolling) return;
    setIsPolling(true);
    setPollSuccess(false);
    try {
      // Satisfying artificial delay to show real-time network transaction to the user
      await new Promise(resolve => setTimeout(resolve, 800));
      const statusData = await adminService.getVillageStatus(selectedNode.id);
      setNodes(prev => prev.map(n => {
        if (n.id === selectedNode.id) {
          const alert = statusData.outbreakAlert;
          return {
            ...n,
            population: statusData.population ?? n.population,
            pregnant: statusData.pregnant_women ?? n.pregnant,
            children: statusData.children_under_5 ?? n.children,
            cases: statusData.malnutrition_cases ?? n.cases,
            status: statusData.nodeState?.status || (alert ? 'outbreak' : 'normal'),
            latestAlert: alert,
          };
        }
        return n;
      }));
      setSelectedNode(prev => {
        const alert = statusData.outbreakAlert;
        return {
          ...prev,
          population: statusData.population ?? prev.population,
          pregnant: statusData.pregnant_women ?? prev.pregnant,
          children: statusData.children_under_5 ?? prev.children,
          cases: statusData.malnutrition_cases ?? prev.cases,
          status: statusData.nodeState?.status || (alert ? 'outbreak' : 'normal'),
          latestAlert: alert,
        };
      });
      setPollSuccess(true);
      setTimeout(() => setPollSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to re-poll telemetry:", err);
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden flex flex-col lg:flex-row gap-6">
      
      {/* MAP CONTAINER */}
      <div className="flex-1 flex flex-col justify-between relative min-h-[460px] lg:min-h-[520px] bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.08)]">

        {/* Leaflet DOM attachment */}
        <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" style={{ minHeight: '100%', height: '100%' }} />
        
        {/* NETWORK & OFFLINE INDICATOR */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-full border border-emerald-500/20 shadow-lg">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest leading-none">
            {isOnline ? 'Network Hub Active' : 'Offline Protocol Synced'}
          </span>
        </div>

        {/* RE-CENTER MAP ACTION */}
        <button
          onClick={handleRecenterMap}
          title="Recenter Map"
          className="absolute top-4 right-4 z-20 p-2.5 bg-slate-900/90 hover:bg-emerald-600 text-emerald-300 hover:text-white backdrop-blur-md rounded-xl border border-emerald-500/20 hover:border-emerald-500 shadow-lg active:scale-95 transition-all flex items-center justify-center"
        >
          <MapPin className="w-4 h-4" />
        </button>

        {/* MAP TITLE Watermark */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col leading-none pointer-events-none bg-slate-950/80 backdrop-blur-sm px-3.5 py-2.5 rounded-2xl border border-slate-900 shadow-md">
          <span className="text-xl font-black text-slate-100 opacity-90 tracking-tighter uppercase">Varanasi Division</span>
          <span className="text-[8px] font-black text-emerald-400 opacity-90 uppercase tracking-widest mt-1">SwasthAI Node Network Map</span>
        </div>
      </div>

      {/* FLOAT SIDE CARD (REAL-TIME INFORMATION PANEL) */}
      <div className="w-full lg:w-[260px] flex flex-col justify-between shrink-0 z-20">
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
                    {selectedNode.name.split(' / ')[1] || 'Varanasi'}
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
                    {!selectedNode.latestAlert || selectedNode.latestAlert.toLowerCase().includes('undefined')
                      ? 'Active telemetry event cluster detected.'
                      : selectedNode.latestAlert}
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
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Heatmap Risk Score</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-800">{(selectedNode.outbreakScore || 0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (selectedNode.outbreakScore || 0) >= 80 ? 'bg-rose-500' :
                        (selectedNode.outbreakScore || 0) >= 50 ? 'bg-amber-500' :
                        (selectedNode.outbreakScore || 0) >= 20 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${selectedNode.outbreakScore || 0}%` }}
                    />
                  </div>
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
          onClick={handleRePollTelemetry}
          disabled={!selectedNode || isPolling}
          className={`mt-4 w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 border ${
            pollSuccess
              ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
              : isPolling
              ? 'bg-slate-800 text-slate-400 border-slate-800 cursor-wait'
              : selectedNode 
              ? 'bg-slate-900 hover:bg-emerald-600 text-white border-slate-900 hover:border-emerald-600 cursor-pointer' 
              : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
          }`}
          style={{ minHeight: '48px' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
          {pollSuccess ? 'Telemetry Synced ✓' : isPolling ? 'Polling Telemetry...' : 'Re-poll Telemetry'}
        </button>
      </div>

    </div>
  );
}
