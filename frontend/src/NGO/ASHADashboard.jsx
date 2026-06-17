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
  Calendar, Layers, CheckSquare, BookOpen, LogOut,
  Database, HardDrive, Mic, MicOff, Thermometer, Stethoscope,
  ArrowUpCircle, UserPlus, Play, Loader2
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

import HealthScoreBreakdown from './components/HealthScoreBreakdown';
import LiveFieldImpact from './components/LiveFieldImpact';
import LiveImpactCounter from './components/LiveImpactCounter';
import VoiceAssistantFAB from './components/VoiceAssistantFAB';
import JudgeDemoMode from './components/JudgeDemoMode';
import JudgePanel from './components/JudgePanel';
import EmergencyResponseWorkflow from './components/EmergencyResponseWorkflow';
import OutbreakResponseCenter from './components/OutbreakResponseCenter';
import SmartTaskManager from './components/SmartTaskManager';
import OfflineFirstHealth from './components/OfflineFirstHealth';

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

  // ─── Loading & Voice & Demo States ──────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [voiceResult, setVoiceResult] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoScenario, setDemoScenario] = useState(null);
  const [demoMetrics] = useState([
    { label: 'Pregnancies Monitored', value: 24, icon: Heart, color: '#F97316', bg: '#FFF7ED', change: '+2 this week' },
    { label: 'Children Screened', value: 156, icon: Baby, color: '#8B5CF6', bg: '#F5F3FF', change: '+12 this week' },
    { label: 'Symptoms Checked', value: 18, icon: Stethoscope, color: '#059669', bg: '#ECFDF5', change: 'Today' },
    { label: 'Emergency Responses', value: 7, icon: Ambulance, color: '#EF4444', bg: '#FEF2F2', change: '3 active' },
    { label: 'Villagers Served / Month', value: 412, icon: Users, color: '#2563EB', bg: '#EFF6FF', change: '+18% vs last month' },
  ]);

  // ─── Flip loading after mount ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // ─── Handle voice assistant results ─────────────────────────────────────────
  const handleVoiceResult = useCallback((result) => {
    setVoiceResult(result);
    if (result.action === 'symptom') {
      setSymptomForm(prev => ({ ...prev, name: result.text, comments: `[Voice: ${result.lang}] ${result.text}` }));
      setShowQuickForm('symptoms');
    } else if (result.action === 'pregnancy') {
      setMaternalForm(prev => ({ ...prev, name: result.text }));
      setShowQuickForm('pregnancy');
    } else if (result.action === 'nutrition') {
      setNutritionForm(prev => ({ ...prev, name: result.text }));
      setShowQuickForm('nutrition');
    }
    showToast(`Voice captured in ${result.lang}`, 'success');
  }, []);

  // ─── Handle judge demo simulation ────────────────────────────────────────────
  const handleDemoSimulation = useCallback((stepId) => {
    setDemoMode(true);
    if (stepId === 'pregnancy') {
      setPregnancyPatients(prev => [{
        id: `M-D${Date.now()}`,
        name: 'Demo Patient (Pregnancy)',
        months: 7,
        bp: '150/95',
        hb: '9.8',
        weight: '58',
        risk: 'High',
        status: 'Needs Visit',
        visits: ['2026-06-20 (Urgent)']
      }, ...prev]);
    } else if (stepId === 'malnutrition') {
      setMalnutritionChildren(prev => [
        { id: `C-D${Date.now()}`, name: 'Demo SAM Child', age: '1.5 Years', weight: '7.2kg', height: '72cm', muac: '10.5', status: 'Severe (SAM)', trend: 'declining', action: 'Immediate therapeutic feeding' },
        { id: `C-D${Date.now()+1}`, name: 'Demo MAM Child', age: '2 Years', weight: '8.8kg', height: '80cm', muac: '11.8', status: 'Moderate (MAM)', trend: 'improving', action: 'Nutrition supplement delivery' },
        ...prev
      ]);
      setNotifications(prev => [{ id: `N-mal-${Date.now()}`, type: 'pregnancy', text: 'Malnutrition alert: 3 new SAM/MAM cases detected in Village V101', time: 'Just now', unread: true, related: 'malnutrition' }, ...prev]);
    } else if (stepId === 'outbreak') {
      setActiveOutbreak(prev => ({
        ...prev,
        reports: prev.reports + 8,
        riskScore: Math.min(99, prev.riskScore + 5),
        affectedVillages: prev.affectedVillages + 1
      }));
      setNotifications(prev => [{ id: `N-out-${Date.now()}`, type: 'outbreak', text: `Outbreak escalated: ${activeOutbreak.disease} cases rising — ${activeOutbreak.reports + 8} total`, time: 'Just now', unread: true, related: 'outbreak' }, ...prev]);
    } else if (stepId === 'sos') {
      setEmergencyRequests(prev => [{
        id: `E-D${Date.now()}`,
        name: 'Demo Emergency Patient',
        location: 'Village V103 Sector 2',
        time: 'Just now',
        condition: 'Severe chest pain / breathing difficulty',
        status: 'pending'
      }, ...prev]);
    } else if (stepId === 'sync') {
      handleSync();
      setLastSync('Just now');
      setSyncHealth(99);
    }
    setDemoScenario(stepId);
  }, []);

  // ─── Clean up voice results after use ────────────────────────────────────────
  useEffect(() => {
    if (voiceResult) {
      const timer = setTimeout(() => setVoiceResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [voiceResult]);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-auto">
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
        {/* Executive Healthcare Intelligence Card */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-xs mt-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Village V101 – Health Score</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Risk: Medium
              </span>
            </div>
          </div>

          {/* 4 KPI Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 sm:px-5 pb-3">
            {[
              { label: 'Population Served', value: '1,428', icon: Users, color: '#059669' },
              { label: 'High Risk Cases', value: '12', icon: AlertTriangle, color: '#EF4444' },
              { label: 'Vaccination Coverage', value: '91%', icon: Shield, color: '#8B5CF6' },
              { label: 'Active Alerts', value: '3', icon: Bell, color: '#F97316' },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-slate-50 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: kpi.color + '15' }}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: kpi.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-none">{kpi.value}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 leading-tight mt-0.5 truncate">{kpi.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score Ring + Trend + Progress Bars Row */}
          <div className="flex flex-col xs:flex-row gap-3 px-4 sm:px-5 pb-4 sm:pb-5">
            {/* Score Ring */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px]">
                <svg className="w-16 h-16 sm:w-[72px] sm:h-[72px] -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                  <circle
                    cx="36" cy="36" r="30" fill="none" stroke="#059669" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - 82 / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-black text-[#059669]">82</span>
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-black text-slate-900">Overall Health</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" /> +4
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">This month</p>
              </div>
            </div>

            {/* Compact Progress Bars */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 min-w-0">
              {[
                { label: 'Vaccination', value: 91, color: '#059669' },
                { label: 'Maternal Health', value: 78, color: '#D97706' },
                { label: 'Child Nutrition', value: 74, color: '#7C3AED' },
                { label: 'Disease Risk', value: 32, color: '#DC2626', inverse: true },
              ].map((bar) => (
                <div key={bar.label} className="min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 truncate">{bar.label}</span>
                    <span className="text-[9px] sm:text-[10px] font-black" style={{ color: bar.inverse ? (bar.value > 50 ? '#DC2626' : '#059669') : bar.color }}>
                      {bar.inverse ? `${100 - bar.value}%` : `${bar.value}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${bar.inverse ? 100 - bar.value : bar.value}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer: Last Updated */}
          <div className="border-t border-slate-50 px-4 sm:px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
              <Clock className="w-3 h-3" />
              Last updated: Today, 10:30 AM
            </div>
            <span className="text-[9px] font-bold text-slate-300">V101 · Rampur Sector 4</span>
          </div>
        </div>

        {/* Health Score Breakdown (enhanced below existing health score) */}
        <HealthScoreBreakdown score={82} />

        {/* Active Outbreak Alert Banner */}
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 shadow-xs relative overflow-hidden text-left">
          <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow shadow-red-500/20">
              <AlertTriangle className="w-5 h-5 sm:w-6.5 sm:h-6.5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-black text-[#EF4444] uppercase tracking-widest leading-none">Active Outbreak Alert</p>
              <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{activeOutbreak.disease} cases are increasing in your area</h4>
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-slate-500 font-semibold">
                <span>{activeOutbreak.reports} Reports</span>
                <span className="text-slate-300 hidden xs:inline">•</span>
                <span className="hidden xs:inline">{activeOutbreak.nearby} Nearby Villages</span>
                <span className="flex items-center gap-0.5 text-red-600 font-black">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {activeOutbreak.trend}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveKPIModal('outbreak')} 
            className="bg-[#DC2626] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors self-start sm:self-center shadow-lg shadow-red-500/10 active:scale-95 w-full sm:w-auto"
          >
            View Details <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
        {/* AI Health Assistant Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#059669] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-black text-slate-900">AI Health Assistant</h3>
            </div>
            <button onClick={() => navigate('/asha/priority')} className="text-xs font-black text-[#059669] hover:underline">View All</button>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">
            Daily priorities generated from village health data
          </p>
          <ul className="space-y-2 text-xs">
            {[
              { emoji: '🔴', text: 'Visit high-risk pregnancy patient (Sunita Devi)', action: 'Visit Now', color: 'red' },
              { emoji: '🟠', text: 'Verify fever outbreak cluster in Village V101', action: 'Verify', color: 'orange' },
              { emoji: '🟡', text: 'Follow-up malnutrition case (Raju Kumar)', action: 'Follow-up', color: 'amber' },
              { emoji: '🟢', text: 'Vaccination due list: 3 children pending', action: 'Check List', color: 'emerald' },
            ].map((item, i) => (
              <li key={i} className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 py-2 border-b border-slate-50 last:border-0">
                <span className="font-medium text-slate-700 text-[11px] xs:text-xs leading-snug"><span className="mr-1.5">{item.emoji}</span>{item.text}</span>
                <button
                  onClick={() => {
                    if (i === 0) setActiveKPIModal('pregnancy');
                    else if (i === 1) setActiveKPIModal('outbreak');
                    else if (i === 2) setActiveKPIModal('malnutrition');
                    else showToast('Vaccination list loaded', 'info');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 shrink-0 self-start xs:self-auto ${
                    item.color === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                    item.color === 'orange' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                    item.color === 'amber' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                    'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {item.action}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Health Summary Cards (Grid of 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

        {/* Live Field Impact Dashboard */}
        <LiveFieldImpact />

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
                  className={`py-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 px-2.5 rounded-2xl transition-colors ${task.done ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3.5 w-full xs:w-auto">
                    <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                      {task.icon === 'pregnancy' ? '🤰' : task.icon === 'child' ? '👶' : '💉'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[160px] xs:max-w-none">{task.patientName}</p>
                        {task.priority && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded shrink-0 ${
                            task.priorityColor === 'red' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5 truncate">{task.type} {task.detail ? `• ${task.detail}` : ''}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" /> <span className="truncate">{task.distance}</span>
                      </p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="self-end xs:self-auto w-full xs:w-auto">
                    {task.done ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#059669] ml-auto">
                        <Check className="w-5.5 h-5.5 stroke-[3px]" />
                      </div>
                    ) : task.icon === 'vaccination' ? (
                      <button
                        onClick={() => handleMarkTaskCompleted(task.id)}
                        className="w-full xs:w-auto px-4 py-2.5 xs:py-2 border border-[#059669] text-[#059669] hover:bg-[#ECFDF5] text-xs font-black rounded-xl transition-colors active:scale-95 whitespace-nowrap"
                      >
                        Mark Done
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTaskModal(task)}
                        className="w-full xs:w-auto px-4 py-2.5 xs:py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-black rounded-xl transition-colors active:scale-95 shadow shadow-emerald-500/10 whitespace-nowrap"
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
          <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-xs text-left space-y-4">
            <h3 className="text-xs font-black uppercase text-[#059669] tracking-wider">Quick Add Record</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
              {[
                { id: 'pregnancy', label: 'Pregnancy Record', icon: '🤰', color: 'bg-rose-50 border-rose-100 text-rose-600' },
                { id: 'nutrition', label: 'Child Nutrition', icon: '👶', color: 'bg-purple-50 border-purple-100 text-purple-600' },
                { id: 'symptoms', label: 'Symptoms Check', icon: '🩺', color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                { id: 'emergency', label: 'Emergency Record', icon: '🚑', color: 'bg-red-50 border-red-100 text-red-600' },
              ].map(act => (
                <button
                  key={act.id}
                  onClick={() => setShowQuickForm(act.id)}
                  className="bg-white border border-slate-100 rounded-2xl p-3.5 sm:p-4.5 shadow-xs flex flex-row items-center gap-3 sm:gap-4 text-left hover:shadow active:scale-98 transition-all w-full min-h-[56px]"
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${act.color}`}>
                    {act.icon}
                  </div>
                  <span className="text-xs font-black text-slate-700 leading-snug">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Status Bottom Strip */}
        <div className={`rounded-2xl p-3 sm:p-4 border shadow-xs transition-colors ${
          isOffline ? 'bg-red-50 border-red-100 text-red-700' : 'bg-[#ECFDF5] border-[#D1FAE5] text-slate-700'
        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-left`}>
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isOffline ? 'bg-red-500' : 'bg-[#059669]'}`}>
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-black text-slate-800 leading-snug">
                {isOffline ? 'Offline Mode Active' : 'All systems normal'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                Last Sync: {lastSync} • Queue: {queueCount} items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
            <div className="text-right">
              <p className="text-base sm:text-lg font-black text-slate-900 leading-none">{syncHealth}%</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Sync Health</p>
            </div>
            
            {/* AWS Logo style */}
            <div className="bg-[#232F3E] rounded px-2 py-1 flex items-center shrink-0">
              <span className="text-[#FF9900] text-[10px] font-black tracking-tighter uppercase leading-none">aws</span>
            </div>
          </div>
        </div>

        {/* Offline-First Healthcare Status */}
        <OfflineFirstHealth isOffline={isOffline} lastSync={lastSync} onSync={handleSync} demoData={{ active: demoMode }} />

        {/* Live Impact Counter with animated stats */}
        <LiveImpactCounter />

        {/* Judge Demo Mode — clickable scenarios */}
        <JudgeDemoMode onSimulate={handleDemoSimulation} isSimulating={!!demoScenario} lastScenario={demoScenario} />

        {/* Why SwasthAI Wins — Judge Panel */}
        <JudgePanel />

      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans select-none overflow-x-hidden">
      {pageLoading && (
        <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 animate-pulse">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="h-3 w-36 bg-slate-100 rounded-full mx-auto mb-2 animate-pulse" />
            <div className="h-2 w-24 bg-slate-50 rounded-full mx-auto animate-pulse" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Loading ASHA Dashboard...</p>
          </div>
        </div>
      )}
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
              className="fixed inset-x-3 sm:inset-x-4 top-[5%] sm:top-[10%] mx-auto max-w-md bg-white border border-slate-100 rounded-3xl z-55 p-4 sm:p-6 shadow-2xl text-left overflow-y-auto max-h-[90vh]"
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
                <OutbreakResponseCenter outbreak={activeOutbreak} onClose={() => setActiveKPIModal(null)} />
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

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {emergencyRequests.map((sos) => (
                      <div key={sos.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                        <EmergencyResponseWorkflow
                          emergency={sos}
                          onDispatch={handleDispatchSOS}
                          dispatching={isDispatching && dispatchAmbulanceId === sos.id}
                          progress={dispatchProgress}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setActiveKPIModal(null); navigate('/ambulance'); }}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center active:scale-95 transition-transform shadow shadow-red-500/10"
                    >
                      Open Ambulance Fleet Map
                    </button>
                    <button 
                      onClick={() => setActiveKPIModal(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      Close
                    </button>
                  </div>
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
              className="fixed inset-x-3 sm:inset-x-4 top-[5%] sm:top-[15%] mx-auto max-w-md bg-white border border-slate-100 rounded-3xl z-55 p-4 sm:p-6 shadow-2xl text-left overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
                <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">Patient Task Details</h4>
                <button onClick={() => setActiveTaskModal(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <SmartTaskManager
                task={activeTaskModal}
                onComplete={handleMarkTaskCompleted}
                onClose={() => setActiveTaskModal(null)}
              />
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] border-t border-slate-100 z-55 p-4 sm:p-6 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-slate-55 mb-4 max-w-lg mx-auto bg-white sticky top-0 z-10">
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

      {/* Floating Voice Assistant */}
      <VoiceAssistantFAB onVoiceResult={handleVoiceResult} />

    </div>
  );
}
