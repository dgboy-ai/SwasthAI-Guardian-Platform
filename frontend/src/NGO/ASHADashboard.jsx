// ─── SwasthAI Guardian — Responsive Dashboard & Command Center ────────────────
// Visual-accurate recreation matching the reference image across all sizes.
// Fully connected to backend APIs (ngoService) and IndexedDB local offline queue.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Wifi, WifiOff, Home, AlertTriangle,
  Plus, Users, MoreHorizontal, ChevronRight,
  MapPin, CheckCircle, RefreshCw, X, Search,
  TrendingUp, TrendingDown, Minus, Zap, Shield,
  Heart, Baby, Activity, Clock, Filter, Settings,
  FileText, BarChart3, Radio, Ambulance, HeartHandshake,
  Send, User, PlusCircle, Check, AlertCircle, Sparkles, Navigation,
  Calendar, Layers, CheckSquare, BookOpen, LogOut
} from 'lucide-react';

import ngoService from '../services/ngoService';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import {
  queueMaternalRecord,
  queueChildRecord,
  queueAmbulanceRequest,
  queueSymptomCheck,
  getQueueStats,
  syncAllQueues
} from '../utils/offlineSyncQueue';

import {
  VILLAGE_INFO,
  ASHA_WORKER,
  OUTBREAK_ALERTS,
  KPI_CARDS,
  TODAY_TASKS,
  QUICK_ACTIONS,
  SYSTEM_HEALTH,
  AI_RECOMMENDATIONS,
  OFFLINE_QUEUE
} from './mockData';

export default function ASHADashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Responsive Layout Detect ────────────────────────────────────────────────
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Core States ─────────────────────────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 min ago');
  const [queueCount, setQueueCount] = useState(0);
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [syncHealth, setSyncHealth] = useState(98);
  const [notifications, setNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' | 'outbreak' | 'sos' | 'pregnancy' | 'system'
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'alerts' | 'patients' | 'records'

  // ─── Interactive Patient Details Modals ──────────────────────────────────────
  const [activeTaskModal, setActiveTaskModal] = useState(null); // Task object
  const [activeKPIModal, setActiveKPIModal] = useState(null); // 'sos' | 'pregnancy' | 'malnutrition' | 'pads' | 'outbreak'
  const [showQuickForm, setShowQuickForm] = useState(null); // 'pregnancy' | 'nutrition' | 'symptoms' | 'emergency'

  // ─── Live Dynamic Telemetry State ───────────────────────────────────────────
  const [tasks, setTasks] = useState(TODAY_TASKS);
  
  // Real Interactive Data Pools for Modals & Workflows
  const [padRequests, setPadRequests] = useState([
    { id: 'P001', patientName: 'Geeta Devi', village: 'Village V101', quantity: 1, status: 'pending', timestamp: '10:30 AM' },
    { id: 'P002', patientName: 'Meena Sharma', village: 'Village V101', quantity: 2, status: 'approved', timestamp: 'Yesterday' },
    { id: 'P003', patientName: 'Aarti Sen', village: 'Village V102', quantity: 1, status: 'completed', timestamp: '2 days ago' },
  ]);

  const [emergencyRequests, setEmergencyRequests] = useState([
    { id: 'E001', name: 'Ram Singh', location: 'Rampur Sector 4', time: '5m ago', condition: 'Chest pain / Breathing issue', status: 'pending' },
    { id: 'E002', name: 'Lata Devi', location: 'Rampur Sector 2', time: '12m ago', condition: 'Pregnancy labour pain', status: 'assigned' },
  ]);

  const [pregnancyPatients, setPregnancyPatients] = useState([
    { id: 'M001', name: 'Sunita Devi', months: 8, bp: '145/95', hb: '10.1', weight: '55', risk: 'High', status: 'Overdue check-up', visits: ['2026-06-12 (Missed)', '2026-06-19 (Upcoming)'] },
    { id: 'M002', name: 'Rani Kumari', months: 5, bp: '120/80', hb: '11.5', weight: '52', risk: 'Medium', status: 'Scheduled visit', visits: ['2026-06-18 (Upcoming)'] },
    { id: 'M003', name: 'Pooja Gupta', months: 3, bp: '118/75', hb: '12.0', weight: '50', risk: 'Low', status: 'Monitored', visits: ['2026-06-25 (Upcoming)'] }
  ]);

  const [malnutritionChildren, setMalnutritionChildren] = useState([
    { id: 'C001', name: 'Raju Kumar', age: '2 Years', weight: '8.5kg', height: '81cm', muac: '11.8', status: 'Severe (SAM)', trend: 'declining', action: 'Immediate therapeutic feeding check' },
    { id: 'C002', name: 'Karan Singh', age: '1.5 Years', weight: '9.4kg', height: '78cm', muac: '12.4', status: 'Moderate (MAM)', trend: 'improving', action: 'Nutrition supplement delivery follow-up' },
  ]);

  const [activeOutbreak, setActiveOutbreak] = useState({
    disease: 'Malaria',
    message: 'Malaria cases are increasing in your area',
    reports: 12,
    nearby: 2,
    trend: 'Increasing',
    trendDirection: 'up',
    riskScore: 87,
    affectedVillages: 3
  });

  const [kpiCounts, setKpiCounts] = useState({ sos: 2, pregnancy: 1, malnutrition: 2, pads: 1 });

  // ─── Form Inputs ─────────────────────────────────────────────────────────────
  const [maternalForm, setMaternalForm] = useState({ name: '', age: '', months: '5', bp: '120/80', hb: '11.5', weight: '55', risk: 'Medium' });
  const [nutritionForm, setNutritionForm] = useState({ name: '', age: '2', weight: '', height: '', muac: '', status: 'Moderate' });
  const [symptomForm, setSymptomForm] = useState({ name: '', temp: '98.6', cough: false, rash: false, breathing: false, vomiting: false, comments: '' });
  const [emergencyForm, setEmergencyForm] = useState({ name: '', type: 'High Fever', location: 'Village V101', comments: '' });

  // ─── Dispatch Ambulance Simulation States ────────────────────────────────────
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchAmbulanceId, setDispatchAmbulanceId] = useState(null);

  // ─── Load Live Backend Data ──────────────────────────────────────────────────
  const fetchBackendTelemetry = useCallback(async () => {
    if (isOffline) return;
    try {
      // Fetch Outbreaks from live outbreak agent telemetry
      const outbreakRes = await ngoService.getOutbreaks(user?.villageId || 'V101');
      if (outbreakRes && outbreakRes.outbreaks && outbreakRes.outbreaks.length > 0) {
        const primary = outbreakRes.outbreaks[0];
        const parts = primary.classification.split(' - ');
        setActiveOutbreak({
          disease: parts[0] || 'Malaria',
          message: parts[1] || 'Outbreak anomalies identified',
          reports: primary.cases || 12,
          nearby: primary.affectedVillages || 2,
          trend: primary.trend || 'Increasing',
          trendDirection: primary.trend === 'increasing' ? 'up' : 'down',
          riskScore: primary.riskScore || 87,
          affectedVillages: primary.affectedVillages || 3
        });
      }

      // Fetch SOS / Ambulance counts
      const ambulanceRequests = await ngoService.getRequests();
      if (ambulanceRequests && ambulanceRequests.length > 0) {
        setEmergencyRequests(ambulanceRequests);
      }
      
      // Fetch Pad Requests
      const padsRes = await ngoService.getPadRequests();
      if (padsRes && padsRes.length > 0) {
        setPadRequests(padsRes);
      }

      // Sync counts
      const pendingSOS = emergencyRequests.filter(r => r.status === 'pending').length;
      const pendingPads = padRequests.filter(r => r.status === 'pending').length;
      const activePregnancy = pregnancyPatients.filter(p => p.risk === 'High').length;
      const activeMalnutrition = malnutritionChildren.length;

      setKpiCounts({
        sos: pendingSOS,
        pregnancy: activePregnancy,
        malnutrition: activeMalnutrition,
        pads: pendingPads
      });

    } catch (err) {
      console.warn('Backend API connection unavailable, falling back to local state:', err.message || err);
    }
  }, [isOffline, user, emergencyRequests, padRequests, pregnancyPatients, malnutritionChildren]);

  // ─── Sync Status & Event Handlers ──────────────────────────────────────────
  const updateQueueStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setQueueCount(stats.totalPending);
    } catch (_) {
      setQueueCount(0);
    }
  }, []);

  const handleSync = async () => {
    if (isOffline) {
      showToast('Cannot sync while offline mode is active', 'error');
      return;
    }
    setSyncing(true);
    showToast('Connecting to AWS Aurora + DynamoDB and replaying queue...', 'info');
    try {
      await syncAllQueues();
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setFailedSyncCount(0);
      await updateQueueStats();
      await fetchBackendTelemetry();
      
      // Push System Sync Notification
      setNotifications(prev => [
        { id: `N-sync-${Date.now()}`, type: 'system', text: 'AWS Sync Success: Local databases are fully consolidated.', time: 'Just now', unread: true },
        ...prev
      ]);
    } catch (err) {
      setFailedSyncCount(prev => prev + 1);
      showToast('Sync failure: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleOffline = () => {
    const nextOffline = !isOffline;
    setIsOffline(nextOffline);
    if (!nextOffline) {
      handleSync();
    } else {
      showToast('Offline Mode Activated: Local IndexedDB database in use', 'info');
      setNotifications(prev => [
        { id: `N-off-${Date.now()}`, type: 'system', text: 'Offline Mode: Write operations will queue locally.', time: 'Just now', unread: true },
        ...prev
      ]);
    }
  };

  // Sync and network recovery check
  useEffect(() => {
    const handleQueueUpdate = () => {
      updateQueueStats();
    };
    window.addEventListener('swasthai_queue_updated', handleQueueUpdate);
    
    const goOnline = () => {
      setIsOffline(false);
      handleSync();
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    updateQueueStats();
    fetchBackendTelemetry();

    // Default notifications matching requirements
    setNotifications([
      { id: 'N1', type: 'outbreak', text: 'AI Outbreak Radar: Malaria cluster anomaly in block sector.', time: '2m ago', unread: true, related: 'outbreak' },
      { id: 'N2', type: 'sos', text: 'Critical SOS: Heavy breathing emergency alert from Lata Devi.', time: '15m ago', unread: true, related: 'sos' },
      { id: 'N3', type: 'pregnancy', text: 'Maternal Health Flag: Sunita Devi missed 8mo check-up.', time: '1h ago', unread: false, related: 'pregnancy' },
      { id: 'N4', type: 'system', text: 'Offline Sync: 3 pending records uploaded successfully.', time: '3h ago', unread: false, related: 'system' }
    ]);

    return () => {
      window.removeEventListener('swasthai_queue_updated', handleQueueUpdate);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [updateQueueStats, fetchBackendTelemetry]);

  // Recalculate KPI counts dynamically whenever databases change
  useEffect(() => {
    const pendingSOS = emergencyRequests.filter(r => r.status === 'pending').length;
    const pendingPads = padRequests.filter(r => r.status === 'pending' || r.status === 'approved').length;
    const activePregnancy = pregnancyPatients.filter(p => p.risk === 'High').length;
    const activeMalnutrition = malnutritionChildren.length;

    setKpiCounts({
      sos: pendingSOS,
      pregnancy: activePregnancy,
      malnutrition: activeMalnutrition,
      pads: pendingPads
    });
  }, [emergencyRequests, padRequests, pregnancyPatients, malnutritionChildren]);

  // ─── Form Submissions ────────────────────────────────────────────────────────
  const submitPregnancyRecord = async (e) => {
    e.preventDefault();
    const data = {
      name: maternalForm.name,
      age: parseInt(maternalForm.age) || 24,
      trimester: Math.ceil((parseInt(maternalForm.months) || 5) / 3),
      dueDate: new Date(Date.now() + (9 - (parseInt(maternalForm.months) || 5)) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vitals: {
        bp: maternalForm.bp,
        hb: maternalForm.hb,
        weight: maternalForm.weight,
        risk: maternalForm.risk
      }
    };

    if (isOffline) {
      await queueMaternalRecord(data);
      showToast('Pregnancy record queued to IndexedDB', 'info');
    } else {
      try {
        await ngoService.trackPregnancy(data);
        showToast('Pregnancy record saved to AWS Aurora', 'success');
      } catch (err) {
        await queueMaternalRecord(data);
        showToast('Network error, record saved to local queue', 'info');
      }
    }
    
    // Add to patient list locally
    setPregnancyPatients(prev => [
      {
        id: `M00${prev.length + 1}`,
        name: data.name,
        months: parseInt(maternalForm.months),
        bp: data.vitals.bp,
        hb: data.vitals.hb,
        weight: data.vitals.weight,
        risk: data.vitals.risk,
        status: data.vitals.risk === 'High' ? 'Needs Visit' : 'Scheduled visit',
        visits: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' (Upcoming)']
      },
      ...prev
    ]);

    setNotifications(prev => [
      { id: `N-mat-${Date.now()}`, type: 'pregnancy', text: `Pregnancy logged: ${data.name} (${data.vitals.risk} Risk)`, time: 'Just now', unread: true, related: 'pregnancy' },
      ...prev
    ]);

    setShowQuickForm(null);
    setMaternalForm({ name: '', age: '', months: '5', bp: '120/80', hb: '11.5', weight: '55', risk: 'Medium' });
    updateQueueStats();
  };

  const submitNutritionRecord = async (e) => {
    e.preventDefault();
    const data = {
      childName: nutritionForm.name,
      ageMonths: parseInt(nutritionForm.age) || 24,
      weight: parseFloat(nutritionForm.weight) || 10,
      height: parseFloat(nutritionForm.height) || 85,
      muac: parseFloat(nutritionForm.muac) || 12.5,
      status: nutritionForm.status
    };

    if (isOffline) {
      await queueChildRecord(data);
      showToast('Nutrition record queued to IndexedDB', 'info');
    } else {
      try {
        await ngoService.submitMalnutritionData(data);
        showToast('Nutrition record saved to AWS database', 'success');
      } catch (err) {
        await queueChildRecord(data);
        showToast('Network error, saved to local queue', 'info');
      }
    }

    setMalnutritionChildren(prev => [
      {
        id: `C00${prev.length + 1}`,
        name: data.childName,
        age: `${(data.ageMonths / 12).toFixed(1)} Years`,
        weight: `${data.weight}kg`,
        height: `${data.height}cm`,
        muac: `${data.muac}cm`,
        status: data.status === 'Severe' ? 'Severe (SAM)' : 'Moderate (MAM)',
        trend: 'stable',
        action: 'Regular checks'
      },
      ...prev
    ]);

    setShowQuickForm(null);
    setNutritionForm({ name: '', age: '2', weight: '', height: '', muac: '', status: 'Moderate' });
    updateQueueStats();
  };

  const submitSymptomRecord = async (e) => {
    e.preventDefault();
    const data = {
      name: symptomForm.name,
      symptoms: `${symptomForm.cough ? 'Cough, ' : ''}${symptomForm.rash ? 'Rash, ' : ''}${symptomForm.breathing ? 'Breathing difficulty, ' : ''}${symptomForm.vomiting ? 'Vomiting, ' : ''}${symptomForm.comments}`.trim().replace(/,$/, ''),
      villageId: user?.villageId || 'V101',
      temp: symptomForm.temp
    };

    if (isOffline) {
      await queueSymptomCheck(data);
      showToast('Symptom check queued to IndexedDB', 'info');
    } else {
      try {
        await api.post('/symptoms', data);
        showToast('Symptom check uploaded to database', 'success');
      } catch (err) {
        await queueSymptomCheck(data);
        showToast('Symptom check saved to offline queue', 'info');
      }
    }

    setShowQuickForm(null);
    setSymptomForm({ name: '', temp: '98.6', cough: false, rash: false, breathing: false, vomiting: false, comments: '' });
    updateQueueStats();
  };

  const submitEmergencyRecord = async (e) => {
    e.preventDefault();
    const data = {
      name: emergencyForm.name,
      location: emergencyForm.location,
      priority: 'high',
      symptoms: emergencyForm.type + ' - ' + emergencyForm.comments
    };

    if (isOffline) {
      await queueAmbulanceRequest(data);
      showToast('Ambulance emergency record queued to IndexedDB', 'info');
    } else {
      try {
        await api.post('/ambulance', data);
        showToast('Emergency SOS alert broadcast to fleet', 'success');
      } catch (err) {
        await queueAmbulanceRequest(data);
        showToast('Emergency alert queued offline', 'info');
      }
    }

    setEmergencyRequests(prev => [
      {
        id: `E00${prev.length + 1}`,
        name: data.name,
        location: data.location,
        time: 'Just now',
        condition: data.symptoms,
        status: 'pending'
      },
      ...prev
    ]);

    setNotifications(prev => [
      { id: `N-sos-${Date.now()}`, type: 'sos', text: `Critical Emergency: SOS alert triggered for ${data.name}.`, time: 'Just now', unread: true, related: 'sos' },
      ...prev
    ]);
    setShowQuickForm(null);
    setEmergencyForm({ name: '', type: 'High Fever', location: 'Village V101', comments: '' });
    updateQueueStats();
  };

  const handleMarkTaskCompleted = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true } : t));
    showToast('Task marked as completed', 'success');
    setActiveTaskModal(null);
  };

  // ─── Dispatch SOS Operations ────────────────────────────────────────────────
  const handleDispatchSOS = (id) => {
    setIsDispatching(true);
    setDispatchAmbulanceId(id);
    setDispatchProgress(0);

    const interval = setInterval(() => {
      setDispatchProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setEmergencyRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'assigned' } : r));
          setIsDispatching(false);
          setDispatchAmbulanceId(null);
          showToast('Ambulance successfully dispatched to location', 'success');
          return 100;
        }
        return p + 20;
      });
    }, 400);
  };

  // ─── Pad Requests Operations ─────────────────────────────────────────────────
  const handleApprovePad = (id) => {
    setPadRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    showToast('Pad request approved for delivery', 'success');
  };

  const handleDeliverPad = (id) => {
    setPadRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    showToast('Pad request marked as successfully delivered', 'success');
  };

  // ─── Filter Notifications ────────────────────────────────────────────────────
  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === 'all') return true;
    return n.type === notificationFilter;
  });

  const handleNotificationClick = (n) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
    setShowNotifs(false);

    if (n.related === 'sos') {
      setActiveKPIModal('sos');
    } else if (n.related === 'pregnancy') {
      setActiveKPIModal('pregnancy');
    } else if (n.related === 'outbreak') {
      setActiveKPIModal('outbreak');
    } else if (n.related === 'system') {
      handleSync();
    }
  };

  // ─── Render Main Dashboard Panels ──────────────────────────────────────────
  const renderDashboardGrid = () => {
    return (
      <div className="space-y-4">
        
        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Village V101 Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#059669]" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-black text-slate-900 leading-tight">Village V101</p>
              <p className="text-[10px] text-[#059669] font-bold mt-0.5 leading-snug truncate">
                Rampur Sector 4, Block Rampur
              </p>
            </div>
          </div>

          {/* ASHA Worker Profile Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ASHA Worker</p>
              <p className="text-sm font-black text-slate-900 leading-tight mt-0.5 truncate">Sunita Devi</p>
            </div>
          </div>

          {/* Offline Mode card */}
          <button
            onClick={handleToggleOffline}
            className={`border rounded-2xl p-4 shadow-xs flex items-center justify-between transition-all w-full text-left active:scale-98 ${
              isOffline ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOffline ? 'bg-red-100' : 'bg-slate-50 border border-slate-100'}`}>
                {isOffline ? <WifiOff className="w-5 h-5 text-red-600" /> : <Wifi className="w-5 h-5 text-[#059669]" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-black leading-tight ${isOffline ? 'text-red-700' : 'text-slate-900'}`}>
                  Offline Mode
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                  Offline Queue: {queueCount} items pending
                </p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isOffline ? 'bg-red-500' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isOffline ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </div>
        {/* Village Health Score Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs mt-4">
          <h3 className="text-sm font-black text-slate-900 mb-2">Village V101 – Health Score</h3>
          <div className="flex items-center mb-2">
            <div className="w-24 h-24 bg-[#ECFDF5] rounded-full flex items-center justify-center">
              <span className="text-2xl font-black text-[#059669]">82/100</span>
            </div>
            <div className="ml-4 text-xs space-y-1">
              <div>Vaccination: 91%</div>
              <div>Maternal Health: 78%</div>
              <div>Nutrition: 74%</div>
              <div>Disease Risk: Medium</div>
            </div>
          </div>
        </div>

        {/* Active Outbreak Alert Banner */}
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs relative overflow-hidden text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow shadow-red-500/20">
              <AlertTriangle className="w-6.5 h-6.5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-[#EF4444] uppercase tracking-widest leading-none">Active Outbreak Alert</p>
              <h4 className="text-base font-black text-slate-900 leading-snug">{activeOutbreak.disease} cases are increasing in your area</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-semibold">
                <span>{activeOutbreak.reports} Reports this week</span>
                <span className="text-slate-300">•</span>
                <span>{activeOutbreak.nearby} Nearby Villages</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-0.5 text-red-600 font-black">
                  Trend: {activeOutbreak.trend} <TrendingUp className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveKPIModal('outbreak')} 
            className="bg-[#DC2626] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-1 transition-colors self-start sm:self-center shadow-lg shadow-red-500/10 active:scale-95"
          >
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* AI Daily Priority Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">AI DAILY PRIORITY</h3>
            <button onClick={() => navigate('/asha/priority')} className="text-xs font-black text-[#059669] hover:underline">Open All</button>
          </div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between"><span>🔴 Visit Sunita Devi (High-Risk Pregnancy)</span><button className="px-3 py-1 border border-[#059669] text-[#059669] rounded-full text-xs" onClick={() => navigate('/asha/case/sunita')}>Open Case</button></li>
            <li className="flex items-center justify-between"><span>🟠 Verify Fever Cluster in Village V101</span><button className="px-3 py-1 border border-[#059669] text-[#059669] rounded-full text-xs" onClick={() => navigate('/asha/case/fever')}>Open Case</button></li>
            <li className="flex items-center justify-between"><span>🟡 Follow-up Malnutrition Case</span><button className="px-3 py-1 border border-[#059669] text-[#059669] rounded-full text-xs" onClick={() => navigate('/asha/case/malnutrition')}>Open Case</button></li>
            <li className="flex items-center justify-between"><span>🟢 Vaccination Due: 3 Children</span><button className="px-3 py-1 border border-[#059669] text-[#059669] rounded-full text-xs" onClick={() => navigate('/asha/vaccination')}>Open Case</button></li>
          </ul>
        </div>

        {/* Health Summary Cards (Grid of 4) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: SOS Alerts */}
          <div 
            onClick={() => setActiveKPIModal('sos')}
            className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5 text-left hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center text-2xl shrink-0 shadow shadow-red-500/10">
              <span>🚑</span>
            </div>
            <div>
              <h3 className="text-4.5xl font-black text-slate-900 leading-none">{kpiCounts.sos}</h3>
              <p className="text-xs font-black text-slate-500 mt-2 leading-snug">SOS Alerts</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full self-start bg-red-100 text-red-700">
              High Priority
            </span>
            <button className="text-[10px] font-black text-red-600 hover:text-red-700 flex items-center gap-0.5 mt-2">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: High Risk Pregnancy */}
          <div 
            onClick={() => setActiveKPIModal('pregnancy')}
            className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5 text-left hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center text-2xl shrink-0 shadow shadow-orange-500/10">
              <span>🤰</span>
            </div>
            <div>
              <h3 className="text-4.5xl font-black text-slate-900 leading-none">{kpiCounts.pregnancy}</h3>
              <p className="text-xs font-black text-slate-500 mt-2 leading-snug">High Risk Pregnancy</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full self-start bg-orange-100 text-orange-700">
              Needs Visit
            </span>
            <button className="text-[10px] font-black text-orange-600 hover:text-orange-700 flex items-center gap-0.5 mt-2">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Malnutrition Cases */}
          <div 
            onClick={() => setActiveKPIModal('malnutrition')}
            className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5 text-left hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center text-2xl shrink-0 shadow shadow-purple-500/10">
              <span>👶</span>
            </div>
            <div>
              <h3 className="text-4.5xl font-black text-slate-900 leading-none">{kpiCounts.malnutrition}</h3>
              <p className="text-xs font-black text-slate-500 mt-2 leading-snug">Malnutrition Cases</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full self-start bg-purple-100 text-purple-700">
              Follow Up
            </span>
            <button className="text-[10px] font-black text-purple-600 hover:text-purple-700 flex items-center gap-0.5 mt-2">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Pad Requests */}
          <div 
            onClick={() => setActiveKPIModal('pads')}
            className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5 text-left hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center text-2xl shrink-0 shadow shadow-emerald-500/10">
              <span>💊</span>
            </div>
            <div>
              <h3 className="text-4.5xl font-black text-slate-900 leading-none">{kpiCounts.pads}</h3>
              <p className="text-xs font-black text-slate-500 mt-2 leading-snug">Pad Requests</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full self-start bg-emerald-100 text-emerald-700">
              No Pending
            </span>
            <button className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 mt-2">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Two-Column Stack on larger layouts */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Today's Tasks */}
          <div className="xl:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-left">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#059669] text-white flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Today's Tasks</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {tasks.filter(t => !t.done).length} Tasks
                </span>
                <button className="text-xs font-black text-[#059669] hover:underline">View All</button>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => setActiveTaskModal(task)}
                  className={`py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 px-2.5 rounded-2xl transition-colors ${task.done ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                      {task.icon === 'pregnancy' ? '🤰' : task.icon === 'child' ? '👶' : '💉'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{task.patientName}</p>
                        {task.priority && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                            task.priorityColor === 'red' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{task.type} {task.detail ? `• ${task.detail}` : ''}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" /> {task.distance}
                      </p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {task.done ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#059669]">
                        <Check className="w-5.5 h-5.5 stroke-[3px]" />
                      </div>
                    ) : task.icon === 'vaccination' ? (
                      <button
                        onClick={() => handleMarkTaskCompleted(task.id)}
                        className="px-4 py-2 border border-[#059669] text-[#059669] hover:bg-[#ECFDF5] text-xs font-black rounded-xl transition-colors active:scale-95 whitespace-nowrap"
                      >
                        Mark Done
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTaskModal(task)}
                        className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-black rounded-xl transition-colors active:scale-95 shadow shadow-emerald-500/10 whitespace-nowrap"
                      >
                        Visit Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-left space-y-4">
            <h3 className="text-xs font-black uppercase text-[#059669] tracking-wider">Quick Add Record</h3>
            
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-2.5">
              {[
                { id: 'pregnancy', label: 'Pregnancy Record', icon: '🤰', color: 'bg-rose-50 border-rose-100 text-rose-600' },
                { id: 'nutrition', label: 'Child Nutrition', icon: '👶', color: 'bg-purple-50 border-purple-100 text-purple-600' },
                { id: 'symptoms', label: 'Symptoms Check', icon: '🩺', color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                { id: 'emergency', label: 'Emergency Record', icon: '🚑', color: 'bg-red-50 border-red-100 text-red-600' },
              ].map(act => (
                <button
                  key={act.id}
                  onClick={() => setShowQuickForm(act.id)}
                  className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs flex flex-row items-center gap-4 text-left hover:shadow active:scale-98 transition-all w-full"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${act.color}`}>
                    {act.icon}
                  </div>
                  <span className="text-xs font-black text-slate-700 leading-snug">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Status Bottom Strip */}
        <div className={`rounded-2xl p-4 border shadow-xs transition-colors ${
          isOffline ? 'bg-red-50 border-red-100 text-red-700' : 'bg-[#ECFDF5] border-[#D1FAE5] text-slate-700'
        } flex flex-col sm:flex-row items-center justify-between gap-3 text-left`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOffline ? 'bg-red-500' : 'bg-[#059669]'}`}>
              <Check className="w-5 h-5 text-white stroke-[3px]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {isOffline ? 'Offline Mode Active — local IndexedDB storage in use' : 'All systems normal'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                Last Sync: {lastSync} • Offline Queue: {queueCount} items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-black text-slate-900 leading-none">{syncHealth}%</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Sync Health</p>
            </div>
            
            {/* AWS Logo style */}
            <div className="bg-[#232F3E] rounded px-2 py-1 flex items-center shrink-0">
              <span className="text-[#FF9900] text-[10px] font-black tracking-tighter uppercase leading-none">aws</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans select-none overflow-x-hidden">
      {isDesktop ? (
        /* ══════════════════════════════════════════════════════════════════════════════
           DESKTOP LAYOUT (>=1024px): COLLAPSIBLE SIDEBAR + TOP NAV
           ══════════════════════════════════════════════════════════════════════════════ */
        <div className="flex h-screen overflow-hidden bg-slate-50">
          
          {/* Sidebar */}
          <aside className={`bg-white border-r border-slate-100 flex flex-col h-full shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            {/* Branding Header */}
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-white justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#059669] rounded-xl flex items-center justify-center shadow shadow-emerald-500/20">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left leading-none">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-black text-slate-900">SwasthAI</span>
                      <span className="text-sm font-black text-[#059669]">GUARDIAN</span>
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">ASHA Field Center</p>
                  </div>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="w-9 h-9 bg-[#059669] rounded-xl flex items-center justify-center mx-auto shadow shadow-emerald-500/20">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              )}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar navigation */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {[
                { label: 'Home', icon: Home, tab: 'home' },
                { label: 'Alerts Logs', icon: AlertTriangle, tab: 'alerts' },
                { label: 'Patients List', icon: Users, tab: 'patients' },
                { label: 'Add Record Logs', icon: PlusCircle, tab: 'records' }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveTab(item.tab);
                      if (item.tab === 'alerts') navigate('/ngo');
                      if (item.tab === 'patients') navigate('/ngo/maternal');
                    }}
                    className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl transition-all border ${
                      isActive 
                        ? 'bg-[#ECFDF5] border-[#D1FAE5] text-[#065F46] font-bold' 
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-880'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#059669]' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Collapsible toggle status */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleToggleOffline}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-black text-xs transition-colors border ${
                  isOffline ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                {!sidebarCollapsed && <span>{isOffline ? 'Go Online' : 'Go Offline'}</span>}
              </button>
            </div>
          </aside>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Topbar */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between z-20 backdrop-blur-md bg-opacity-95">
              <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                ASHA Health Worker Portal
              </h1>

              <div className="flex items-center gap-3">
                {/* Cloud indicators */}
                <button 
                  onClick={handleSync}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all ${
                    isOffline ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#ECFDF5] text-[#065F46] border-[#D1FAE5]'
                  }`}
                >
                  <Wifi className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                  <span>{isOffline ? 'Offline' : 'Synced to AWS'}</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifs && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setShowNotifs(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-40 overflow-hidden text-left"
                        >
                          <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-[#F8FAFC]">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Operational Alerts</p>
                            <button 
                              onClick={() => setNotifications(prev => prev.map(n => ({...n, unread: false})))}
                              className="text-[10px] font-bold text-[#059669] hover:underline"
                            >
                              Mark All Read
                            </button>
                          </div>
                          
                          {/* Filters */}
                          <div className="flex gap-1.5 px-3.5 py-2 border-b border-slate-100 bg-[#F8FAFC]/50 flex-wrap">
                            {['all', 'outbreak', 'sos', 'pregnancy', 'system'].map(filter => (
                              <button
                                key={filter}
                                onClick={() => setNotificationFilter(filter)}
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full transition-colors ${
                                  notificationFilter === filter 
                                    ? 'bg-[#059669] text-white' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>

                          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                            {filteredNotifications.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                                No recent alerts in this category
                              </div>
                            ) : (
                              filteredNotifications.map(n => (
                                <div 
                                  key={n.id} 
                                  onClick={() => handleNotificationClick(n)}
                                  className={`p-4 text-xs transition-colors flex gap-2.5 cursor-pointer hover:bg-slate-50/50 ${n.unread ? 'bg-[#ECFDF5]/35' : ''}`}
                                >
                                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                                  <div>
                                    <p className="font-semibold text-slate-700 leading-snug">{n.text}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">{n.time}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>

            {/* Dashboard content wrapper */}
            <main className="flex-1 p-8 overflow-auto max-w-6.5xl mx-auto w-full">
              {renderDashboardGrid()}
            </main>
          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════════
           MOBILE & TABLET LAYOUTS: PRECISE MATCH TO SCREENSHOT
           ══════════════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col min-h-screen bg-slate-50/50 relative pb-24 overflow-x-hidden">
          
          {/* Header */}
          <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between z-40 shadow-xs">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMenu(true)} 
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 active:scale-95 transition-transform"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              
              {/* Branding */}
              <div className="flex items-center gap-1.5">
                <div className="w-8.5 h-8.5 bg-[#059669] rounded-xl flex items-center justify-center">
                  <Heart className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="leading-none text-left">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-black text-slate-900">SwasthAI</span>
                    <span className="text-sm font-black text-[#059669]">GUARDIAN</span>
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Rural Health Network
                  </p>
                </div>
              </div>
            </div>

            {/* Top Right Cloud Indicator and Notification Bell */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all ${
                  isOffline
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-[#ECFDF5] text-[#065F46] border-[#D1FAE5]'
                }`}
              >
                {isOffline ? (
                  <WifiOff className="w-3.5 h-3.5" />
                ) : (
                  <Wifi className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                )}
                <div className="text-left hidden xs:block">
                  <p className="text-[9px] font-black leading-none">{isOffline ? 'Offline' : 'Synced to AWS'}</p>
                  <p className="text-[8px] font-semibold opacity-75 mt-0.5 leading-none">Last Sync: {lastSync}</p>
                </div>
              </button>

              {/* Notification Bell */}
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 active:scale-95 transition-transform"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 max-w-xl mx-auto w-full">
            {renderDashboardGrid()}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-xl z-40">
            <div className="flex items-center justify-between px-3 py-2 max-w-md mx-auto">
              
              {/* Home Link */}
              <button 
                onClick={() => { setActiveTab('home'); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  activeTab === 'home' ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-black">Home</span>
                {activeTab === 'home' && <div className="w-1.5 h-1.5 bg-[#059669] rounded-full mt-0.5" />}
              </button>

              {/* Alerts Link */}
              <button 
                onClick={() => { navigate('/ngo'); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${
                  activeTab === 'alerts' ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[9px] font-black">Alerts</span>
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>

              {/* Add Record (FAB) */}
              <div className="flex flex-col items-center -mt-7">
                <button
                  onClick={() => setShowQuickForm('pregnancy')}
                  className="w-14 h-14 bg-[#059669] rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-[#047857] transition-all active:scale-90"
                >
                  <Plus className="w-7.5 h-7.5 text-white" />
                </button>
                <span className="text-[9px] font-black text-slate-400 mt-1">Add Record</span>
              </div>

              {/* Patients Link */}
              <button 
                onClick={() => { navigate('/ngo/maternal'); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  activeTab === 'patients' ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[9px] font-black">Patients</span>
              </button>

              {/* More Drawer Link */}
              <button 
                onClick={() => { setShowMenu(true); }}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[9px] font-black">More</span>
              </button>

            </div>
          </nav>

        </div>
      )}

      {/* ─── MODALS & FORMS OVERLAYS (SHARED) ────────────────────────────────────── */}

      {/* Outbreak / Alerts log dropdown overlay */}
      <AnimatePresence>
        {showNotifs && !isDesktop && (
          <>
            <div className="fixed inset-0 bg-black/25 z-40 backdrop-blur-xs" onClick={() => setShowNotifs(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-slate-100 z-50 p-5 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-55 mb-4 text-left bg-white sticky top-0">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Operational Alerts Feed</h4>
                <button onClick={() => setShowNotifs(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 pb-3.5 border-b border-slate-100 flex-wrap">
                {['all', 'outbreak', 'sos', 'pregnancy', 'system'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setNotificationFilter(filter)}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-full transition-colors ${
                      notificationFilter === filter 
                        ? 'bg-[#059669] text-white' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-slate-50 mt-2">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                    No recent alerts in this category
                  </div>
                ) : (
                  filteredNotifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`py-4 flex gap-3 text-left cursor-pointer hover:bg-slate-50/50 px-2 rounded-xl transition-colors ${n.unread ? 'bg-[#ECFDF5]/10' : ''}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-red-500' : 'bg-slate-200'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{n.text}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Outbreak / KPI Count details Modals */}
      <AnimatePresence>
        {activeKPIModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-55 backdrop-blur-xs" onClick={() => setActiveKPIModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[10%] mx-auto max-w-md bg-white border border-slate-100 rounded-3xl z-55 p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 mb-4">
                <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  {activeKPIModal === 'outbreak' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {activeKPIModal === 'sos' && <Ambulance className="w-5 h-5 text-red-500" />}
                  {activeKPIModal === 'pregnancy' && <Heart className="w-5 h-5 text-orange-500" />}
                  {activeKPIModal === 'malnutrition' && <Baby className="w-5 h-5 text-purple-500" />}
                  {activeKPIModal === 'pads' && <Layers className="w-5 h-5 text-emerald-500" />}
                  {activeKPIModal.toUpperCase()} Details
                </h4>
                <button onClick={() => setActiveKPIModal(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {activeKPIModal === 'outbreak' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-800">
                    <AlertTriangle className="w-5.5 h-5.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-black uppercase">Active {activeOutbreak.disease} Outbreak</p>
                      <p className="text-xs font-medium mt-1">Autonomous Outbreak Agent classified anomaly with {activeOutbreak.riskScore}% risk score based on symptom check telemetry.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Risk Score</p>
                      <p className="text-2xl font-black text-red-600 mt-1">{activeOutbreak.riskScore}%</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Affected Villages</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">{activeOutbreak.affectedVillages}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setActiveKPIModal(null); navigate('/ngo'); }}
                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center active:scale-95 transition-transform"
                  >
                    Open Outbreak Radar Monitor
                  </button>
                </div>
              )}

              {activeKPIModal === 'sos' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600 font-semibold">Active Emergencies Queue:</p>
                    <button 
                      onClick={() => setShowQuickForm('emergency')}
                      className="text-[10px] font-black uppercase text-red-600 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Trigger New SOS
                    </button>
                  </div>
                  
                  {isDispatching && (
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-2 border border-slate-800">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="animate-pulse">Coordinating Dispatch GPS...</span>
                        <span>{dispatchProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${dispatchProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {emergencyRequests.map((sos, i) => (
                      <div key={sos.id} className="pt-2 flex justify-between items-center text-xs text-left">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{sos.name} ({sos.location})</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">"{sos.condition}"</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{sos.time}</p>
                        </div>
                        <div className="shrink-0 pl-2">
                          {sos.status === 'pending' ? (
                            <button 
                              onClick={() => handleDispatchSOS(sos.id)}
                              disabled={isDispatching}
                              className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg active:scale-95 disabled:opacity-50 transition-all"
                            >
                              Dispatch
                            </button>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-1.5 rounded bg-emerald-50 text-emerald-700 uppercase border border-emerald-100 flex items-center gap-0.5">
                              <Check className="w-3 h-3 stroke-[3px]" /> En-Route
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => { setActiveKPIModal(null); navigate('/ambulance'); }}
                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow shadow-red-500/10 active:scale-95 transition-transform"
                  >
                    Open Ambulance Fleet Map
                  </button>
                </div>
              )}

              {activeKPIModal === 'pregnancy' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600 font-semibold font-black">Patients List & Upcomings:</p>
                    <button 
                      onClick={() => setShowQuickForm('pregnancy')}
                      className="text-[10px] font-black uppercase text-[#059669] flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Pregnancy
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {pregnancyPatients.map((pat, i) => (
                      <div key={pat.id} className="pt-2.5 text-xs text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800">{pat.name} ({pat.months} Months)</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Visits scheduled: {pat.visits.join(', ')}</p>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            pat.risk === 'High' ? 'bg-red-100 text-red-700' : pat.risk === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {pat.risk} Risk
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1.5 text-[9px] font-black uppercase text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">BP: {pat.bp}</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">Hb: {pat.hb}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => { setActiveKPIModal(null); navigate('/ngo/maternal'); }}
                    className="w-full py-2.5 bg-[#059669] text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow shadow-emerald-500/10 active:scale-95 transition-transform"
                  >
                    Open Maternal Health Module
                  </button>
                </div>
              )}

              {activeKPIModal === 'malnutrition' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600 font-semibold font-black">Child Growth Records:</p>
                    <button 
                      onClick={() => setShowQuickForm('nutrition')}
                      className="text-[10px] font-black uppercase text-purple-600 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Assess Child
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {malnutritionChildren.map((child, i) => (
                      <div key={child.id} className="pt-2 text-xs text-left">
                        <div className="flex justify-between">
                          <p className="font-bold text-slate-800">{child.name} ({child.age})</p>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            child.status.includes('Severe') ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {child.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Growth Vitals: Wt: {child.weight} • Ht: {child.height} • MUAC: {child.muac}</p>
                        <p className="text-[9px] text-[#059669] font-bold mt-1">📋 Followup: {child.action}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => { setActiveKPIModal(null); navigate('/ngo/child-nutrition'); }}
                    className="w-full py-2.5 bg-[#059669] text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow shadow-emerald-500/10 active:scale-95 transition-transform"
                  >
                    Open Child Nutrition Monitor
                  </button>
                </div>
              )}

              {activeKPIModal === 'pads' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 font-semibold">Sanitary Pad Delivery Logs:</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {padRequests.map((req, i) => (
                      <div key={req.id} className="pt-2 flex justify-between items-center text-xs text-left">
                        <div>
                          <p className="font-bold text-slate-800">{req.patientName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{req.village} • qty: {req.quantity} pack</p>
                        </div>
                        <div className="pl-2">
                          {req.status === 'pending' && (
                            <button 
                              onClick={() => handleApprovePad(req.id)}
                              className="bg-[#059669] text-white text-[9px] font-black uppercase px-2 py-1.5 rounded active:scale-95"
                            >
                              Approve
                            </button>
                          )}
                          {req.status === 'approved' && (
                            <button 
                              onClick={() => handleDeliverPad(req.id)}
                              className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-1.5 rounded active:scale-95"
                            >
                              Deliver
                            </button>
                          )}
                          {req.status === 'completed' && (
                            <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded flex items-center gap-0.5">
                              ✓ Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setActiveKPIModal(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-center active:scale-95 transition-transform"
                  >
                    Close Pad Request Center
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Details Modals */}
      <AnimatePresence>
        {activeTaskModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-55 backdrop-blur-xs" onClick={() => setActiveTaskModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[15%] mx-auto max-w-md bg-white border border-slate-100 rounded-3xl z-55 p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
                <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">Patient Task Details</h4>
                <button onClick={() => setActiveTaskModal(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">{activeTaskModal.patientName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeTaskModal.type} • Distance: {activeTaskModal.distance}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5 text-xs text-slate-700">
                  <p><strong>Clinical Reason:</strong> Regular health check-up and vitals assessment.</p>
                  <p><strong>Upcoming Visits:</strong> Today (Schedule Followup)</p>
                  <p><strong>Missed Visits:</strong> 1 (Last week check)</p>
                  <p><strong>Assigned ASHA:</strong> Sunita Devi</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => handleMarkTaskCompleted(activeTaskModal.id)}
                    className="flex-1 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors shadow shadow-emerald-500/10 active:scale-95"
                  >
                    Mark Visited / Complete
                  </button>
                  <button 
                    onClick={() => {
                      const newDays = prompt("Reschedule: Enter days delay (e.g. 1):", "1");
                      if (newDays) {
                        showToast(`Rescheduled task successfully by ${newDays} days`, 'success');
                        setActiveTaskModal(null);
                      }
                    }}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Add Forms Modals */}
      <AnimatePresence>
        {showQuickForm && (
          <>
            <div className="fixed inset-0 bg-black/45 z-55 backdrop-blur-xs" onClick={() => setShowQuickForm(null)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] border-t border-slate-100 z-55 p-6 max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-55 mb-4 max-w-lg mx-auto bg-white sticky top-0 z-10">
                <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                  Create {showQuickForm.toUpperCase()} Record
                </h4>
                <button onClick={() => setShowQuickForm(null)} className="w-8.5 h-8.5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="max-w-lg mx-auto pb-6">
                {showQuickForm === 'pregnancy' && (
                  <form onSubmit={submitPregnancyRecord} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Patient Full Name</label>
                      <input 
                        type="text" required
                        value={maternalForm.name}
                        onChange={(e) => setMaternalForm({...maternalForm, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                        placeholder="e.g. Meena Devi"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Patient Age</label>
                        <input 
                          type="number" required
                          value={maternalForm.age}
                          onChange={(e) => setMaternalForm({...maternalForm, age: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 24"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Trimester (Months)</label>
                        <select 
                          value={maternalForm.months}
                          onChange={(e) => setMaternalForm({...maternalForm, months: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none bg-white font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(m => <option key={m} value={m}>{m} Months</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Blood Pressure</label>
                        <input 
                          type="text" 
                          value={maternalForm.bp}
                          onChange={(e) => setMaternalForm({...maternalForm, bp: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 120/80"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Hemoglobin (g/dL)</label>
                        <input 
                          type="text" 
                          value={maternalForm.hb}
                          onChange={(e) => setMaternalForm({...maternalForm, hb: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 11.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Weight (kg)</label>
                        <input 
                          type="text" 
                          value={maternalForm.weight}
                          onChange={(e) => setMaternalForm({...maternalForm, weight: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 55"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Risk Category (AI Flag)</label>
                      <select 
                        value={maternalForm.risk}
                        onChange={(e) => setMaternalForm({...maternalForm, risk: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none bg-white font-bold"
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95 shadow shadow-emerald-500/10 mt-2"
                    >
                      Save Pregnancy Record
                    </button>
                  </form>
                )}

                {showQuickForm === 'nutrition' && (
                  <form onSubmit={submitNutritionRecord} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Child Full Name</label>
                      <input 
                        type="text" required
                        value={nutritionForm.name}
                        onChange={(e) => setNutritionForm({...nutritionForm, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                        placeholder="e.g. Baby Raju"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Age (Months)</label>
                        <input 
                          type="number" required
                          value={nutritionForm.age}
                          onChange={(e) => setNutritionForm({...nutritionForm, age: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 24"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">MUAC (cm)</label>
                        <input 
                          type="text" required
                          value={nutritionForm.muac}
                          onChange={(e) => setNutritionForm({...nutritionForm, muac: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="Mid-Upper Arm Circumference"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Weight (kg)</label>
                        <input 
                          type="text" required
                          value={nutritionForm.weight}
                          onChange={(e) => setNutritionForm({...nutritionForm, weight: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 10.4"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Height (cm)</label>
                        <input 
                          type="text" required
                          value={nutritionForm.height}
                          onChange={(e) => setNutritionForm({...nutritionForm, height: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 84.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Status (Clinical Assessment)</label>
                      <select 
                        value={nutritionForm.status}
                        onChange={(e) => setNutritionForm({...nutritionForm, status: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none bg-white font-bold"
                      >
                        <option value="Normal">Normal Growth</option>
                        <option value="Moderate">MAM (Moderate Acute Malnutrition)</option>
                        <option value="Severe">SAM (Severe Acute Malnutrition)</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95 shadow shadow-emerald-500/10 mt-2"
                    >
                      Save Nutrition Record
                    </button>
                  </form>
                )}

                {showQuickForm === 'symptoms' && (
                  <form onSubmit={submitSymptomRecord} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Patient Full Name</label>
                      <input 
                        type="text" required
                        value={symptomForm.name}
                        onChange={(e) => setSymptomForm({...symptomForm, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                        placeholder="e.g. Lata Kumari"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Body Temperature (°F)</label>
                        <input 
                          type="text" required
                          value={symptomForm.temp}
                          onChange={(e) => setSymptomForm({...symptomForm, temp: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                          placeholder="e.g. 98.6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-black uppercase block mb-1">Select Checkbox Symptoms</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-2 border border-slate-100 p-3 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold select-none">
                          <input type="checkbox" checked={symptomForm.cough} onChange={(e) => setSymptomForm({...symptomForm, cough: e.target.checked})} className="rounded text-[#059669] focus:ring-[#059669] w-4.5 h-4.5" />
                          <span>Dry Cough</span>
                        </label>
                        <label className="flex items-center gap-2 border border-slate-100 p-3 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold select-none">
                          <input type="checkbox" checked={symptomForm.rash} onChange={(e) => setSymptomForm({...symptomForm, rash: e.target.checked})} className="rounded text-[#059669] focus:ring-[#059669] w-4.5 h-4.5" />
                          <span>Skin Rash</span>
                        </label>
                        <label className="flex items-center gap-2 border border-slate-100 p-3 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold select-none">
                          <input type="checkbox" checked={symptomForm.breathing} onChange={(e) => setSymptomForm({...symptomForm, breathing: e.target.checked})} className="rounded text-[#059669] focus:ring-[#059669] w-4.5 h-4.5" />
                          <span>Difficulty Breathing</span>
                        </label>
                        <label className="flex items-center gap-2 border border-slate-100 p-3 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold select-none">
                          <input type="checkbox" checked={symptomForm.vomiting} onChange={(e) => setSymptomForm({...symptomForm, vomiting: e.target.checked})} className="rounded text-[#059669] focus:ring-[#059669] w-4.5 h-4.5" />
                          <span>Vomiting</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Clinical Observations/Comments</label>
                      <textarea 
                        value={symptomForm.comments}
                        onChange={(e) => setSymptomForm({...symptomForm, comments: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none h-20 resize-none font-bold"
                        placeholder="Describe other clinical observations..."
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95 shadow shadow-emerald-500/10 mt-2"
                    >
                      Save Symptom check
                    </button>
                  </form>
                )}

                {showQuickForm === 'emergency' && (
                  <form onSubmit={submitEmergencyRecord} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Emergency Patient Name</label>
                      <input 
                        type="text" required
                        value={emergencyForm.name}
                        onChange={(e) => setEmergencyForm({...emergencyForm, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                        placeholder="e.g. Geeta Devi"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">SOS Emergency Type</label>
                        <select 
                          value={emergencyForm.type}
                          onChange={(e) => setEmergencyForm({...emergencyForm, type: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none bg-white font-bold"
                        >
                          <option value="High Fever">High Fever / Convulsions</option>
                          <option value="Labour">Pregnancy / Labour Pain</option>
                          <option value="Unconscious">Unconscious / Not Breathing</option>
                          <option value="Accident">Accident / Fracture</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Emergency Location</label>
                        <input 
                          type="text" required
                          value={emergencyForm.location}
                          onChange={(e) => setEmergencyForm({...emergencyForm, location: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Symptom Comments</label>
                      <textarea 
                        value={emergencyForm.comments}
                        onChange={(e) => setEmergencyForm({...emergencyForm, comments: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-[#059669] outline-none h-20 resize-none font-bold"
                        placeholder="Provide details for medical triage dispatch..."
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#EF4444] hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95 shadow shadow-red-500/10 mt-2"
                    >
                      Broadcast SOS Emergency Dispatch
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Side Menu Drawer (PWA mobile) */}
      <AnimatePresence>
        {showMenu && !isDesktop && (
          <>
            <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-xs" onClick={() => setShowMenu(false)} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col text-left"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8.5 h-8.5 bg-[#059669] rounded-xl flex items-center justify-center shadow shadow-emerald-500/20">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-black text-slate-900 leading-none">SwasthAI Guardian</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">ASHA Field Center</p>
                  </div>
                </div>
                <button onClick={() => setShowMenu(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {[
                  { label: 'Field Dashboard', icon: '🏠', route: '/ngo', tab: 'home' },
                  { label: 'Maternal Tracking', icon: '🤰', route: '/ngo/maternal', tab: 'patients' },
                  { label: 'Child Malnutrition', icon: '👶', route: '/ngo/child-nutrition' },
                  { label: 'Symptoms Checker', icon: '🩺', route: '/symptoms' },
                  { label: 'Emergency Center', icon: '🚑', route: '/ambulance' },
                  { label: 'AWS Aurora Sync', icon: '🔄', action: handleSync }
                ].map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowMenu(false);
                      if (m.action) m.action();
                      else {
                        if (m.tab) setActiveTab(m.tab);
                        navigate(m.route);
                      }
                    }}
                    className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-[#059669] font-bold text-slate-700 text-sm text-left transition-colors"
                  >
                    <span className="text-lg leading-none">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                SwasthAI Guardian PWA v1.2.0
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
