// ─── Named constant exports used by ASHADashboard.jsx ───────────────────────

export const VILLAGE_INFO = {
  name: 'Village Sundarnagar',
  district: 'Pune Rural',
  population: 1240,
  households: 248,
  lastUpdated: new Date().toLocaleDateString('en-IN'),
};

export const ASHA_WORKER = {
  name: 'Priya Sharma',
  id: 'ASHA-2024-001',
  zone: 'Zone B',
  phone: '+91-9876543210',
  experience: '5 years',
  rating: 4.8,
};

export const OUTBREAK_ALERTS = [
  {
    id: 1,
    disease: 'Dengue',
    severity: 'high',
    cases: 12,
    village: 'V103',
    trend: 'increasing',
    message: 'Dengue spike detected — 12 new cases in last 48 hours',
  },
  {
    id: 2,
    disease: 'Malaria',
    severity: 'medium',
    cases: 5,
    village: 'V101',
    trend: 'stable',
    message: 'Malaria cases stable — continue monitoring',
  },
];

export const KPI_CARDS = [
  { id: 1, label: 'Families Covered', value: 248, icon: '🏠', color: '#6366f1' },
  { id: 2, label: 'Visits This Month', value: 84, icon: '🩺', color: '#10b981' },
  { id: 3, label: 'High-Risk Cases', value: 7, icon: '⚠️', color: '#ef4444' },
  { id: 4, label: 'Vaccinations Done', value: 132, icon: '💉', color: '#f59e0b' },
];

export const TODAY_TASKS = [
  {
    id: 1,
    icon: 'pregnancy',
    patientName: 'Sunita Devi',
    type: 'Pregnancy',
    detail: '8 Months',
    distance: '1.2 km',
    priority: 'HIGH RISK',
    priorityColor: 'red',
    done: false,
  },
  {
    id: 2,
    icon: 'child',
    patientName: 'Raju Kumar',
    type: 'Malnutrition',
    detail: '2 Years',
    distance: '0.8 km',
    priority: 'FOLLOW-UP',
    priorityColor: 'orange',
    done: false,
  },
  {
    id: 3,
    icon: 'vaccination',
    patientName: 'Vaccination Follow-up',
    type: '3 children due',
    detail: '',
    distance: '2.1 km',
    priority: null,
    priorityColor: null,
    done: false,
  },
];

export const QUICK_ACTIONS = [
  { id: 1, label: 'Report Symptom', icon: '🩺', action: 'report_symptom' },
  { id: 2, label: 'Dispatch Ambulance', icon: '🚑', action: 'dispatch_ambulance' },
  { id: 3, label: 'Create Referral', icon: '📋', action: 'create_referral' },
  { id: 4, label: 'Sync Data', icon: '🔄', action: 'sync_data' },
];

export const SYSTEM_HEALTH = {
  syncStatus: 'Online',
  lastSync: '2 min ago',
  pendingUploads: 3,
  batteryMode: false,
  offlineRecords: 0,
};

export const AI_RECOMMENDATIONS = [
  { id: 1, priority: 'high', text: 'Visit 3 high-risk pregnancies today', icon: '🔴' },
  { id: 2, priority: 'medium', text: 'Malaria trend increasing by 12% — deploy awareness', icon: '🟠' },
  { id: 3, priority: 'medium', text: 'Vaccination camp recommended for Village V104', icon: '🟡' },
  { id: 4, priority: 'low', text: '5 malnutrition follow-ups overdue', icon: '🟢' },
];

export const OFFLINE_QUEUE = [
  { id: 1, type: 'symptom_report', patient: 'Meena Kumari', time: '09:15', synced: false },
  { id: 2, type: 'visit_log', patient: 'Raju (3yr)', time: '10:30', synced: false },
  { id: 3, type: 'referral', patient: 'Sunita Devi', time: '11:00', synced: true },
];

// ─── Async fetch helpers used by ASHAApp.jsx ────────────────────────────────

export const fetchDailyPriority = async () => [
  { id: 1, icon: '🔴', title: 'Visit Sunita Devi (High-Risk Pregnancy)', urgency: 'high' },
  { id: 2, icon: '🟠', title: 'Verify Fever Cluster in Village V101', urgency: 'medium' },
  { id: 3, icon: '🟡', title: 'Follow-up Malnutrition Case', urgency: 'low' },
  { id: 4, icon: '🟢', title: 'Vaccination Camp: 3 doses', urgency: 'info' },
];

export const fetchVillageScore = async () => ({
  score: 84,
  riskLevel: 'moderate',
  details: { vaccination: 78, nutrition: 69, pregnancyRisk: 12 },
});

export const fetchLiveFeed = async () => [
  { id: 1, time: '08:12', msg: '🩺 New symptom report from Village V103' },
  { id: 2, time: '08:45', msg: '🚑 Ambulance dispatched for emergency labor' },
  { id: 3, time: '09:03', msg: '⚠️ Outbreak alert: Dengue spikes in District Pune Rural' },
  { id: 4, time: '09:20', msg: '📦 Sync completed – 23 records uploaded' },
];

export const fetchVoiceAssistant = async () => ({
  message: 'You have 2 vaccinations due this week and 1 high-risk pregnancy to follow up.',
});

export const fetchEmergencyNearYou = async () => [
  { id: 1, time: '10:05', msg: '🚨 Child birth emergency in Village V102' },
  { id: 2, time: '10:30', msg: '🔥 Fire reported near Village V104' },
];

export const fetchSmartTasks = async () => [
  { id: 1, icon: '🔴', title: 'Attend high-risk pregnancy', urgency: 'high' },
  { id: 2, icon: '🟠', title: 'Check fever cluster', urgency: 'medium' },
  { id: 3, icon: '🟡', title: 'Follow-up nutrition case', urgency: 'low' },
];

export const fetchDailyImpact = async () => ({
  visitsCompleted: 25,
  childrenScreened: 40,
  pregnancyFollowUps: 12,
  emergenciesHandled: 3,
  villagersHelped: 150,
  impactScore: 88,
});

export const fetchAICopilotData = async () => ({
  greeting: 'Good Morning ASHA Worker',
  missionScore: 92,
  actions: [
    { icon: '🔴', text: 'High-Risk Pregnancy Follow-up' },
    { icon: '🟠', text: 'Fever Cluster Verification' },
    { icon: '🟡', text: 'Malnutrition Screening' },
    { icon: '🟢', text: 'Vaccination Follow-up' },
  ],
  expectedImpact: '14 Villagers Helped Today',
});

export const fetchSmartRouteData = async () => ({
  route: ['Sunita Devi', 'Raju Kumar', 'Vaccination Camp'],
  distance: 4.1,
  estimatedTime: 52,
  timeSaved: 28,
});

export const fetchDiseaseForecast = async () => ({
  disease: 'Malaria',
  today: 32,
  threeDays: 48,
  sevenDays: 71,
  recommendation: ['Deploy Awareness Drive', 'Schedule Village Screening'],
});

export const fetchEmergencyTriage = async () => [
  { patient: 'Asha Sharma', distance: '2 km', condition: 'Critical', action: 'Dispatch Ambulance', eta: '10 min' },
  { patient: 'Ramesh Patel', distance: '3.5 km', condition: 'High', action: 'Notify PHC', eta: '20 min' },
];

export const fetchReferralTracking = async () =>
  ['Case Created', 'PHC Assigned', 'Doctor Reviewed', 'Treatment Started', 'Follow-Up', 'Closed'];

export const fetchTodayImpact = async () => ({
  visitsCompleted: 25,
  childrenScreened: 40,
  pregnancyFollowUps: 12,
  emergenciesHandled: 3,
  villagersHelped: 150,
  impactScore: 88,
});

export const fetchVillageRiskMap = async () => [
  { village: 'Village A', risk: 'Low', color: '#10b981' },
  { village: 'Village B', risk: 'Medium', color: '#f59e0b' },
  { village: 'Village C', risk: 'High', color: '#ef4444' },
];

export const fetchJudgeDemo = async () => {
  console.log('Judge Demo started');
  return true;
};
