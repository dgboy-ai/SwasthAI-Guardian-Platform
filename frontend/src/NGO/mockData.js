// ─── SwasthAI Guardian – Mock Healthcare Dataset ──────────────────────────────
// Realistic rural healthcare data for IEEE YESIST12 demonstration

export const VILLAGE_INFO = {
  id: 'V101',
  name: 'Village V101',
  location: 'Rampur Sector 4, Block Rampur',
  district: 'Rampur',
  state: 'Uttar Pradesh',
  population: 1240,
  households: 248,
};

export const ASHA_WORKER = {
  id: 'ASHA-001',
  name: 'Sunita Devi',
  phone: '+91-9876543210',
  villageId: 'V101',
  yearsActive: 6,
  avatar: null,
};

export const OUTBREAK_ALERTS = [
  {
    id: 'OB-001',
    type: 'Malaria',
    message: 'Malaria cases are increasing in your area',
    severity: 'HIGH',
    reports: 12,
    nearby: 2,
    trend: 'Increasing',
    trendDirection: 'up',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'OB-002',
    type: 'Dengue',
    message: 'Dengue risk elevated – stagnant water detected',
    severity: 'MEDIUM',
    reports: 5,
    nearby: 1,
    trend: 'Stable',
    trendDirection: 'stable',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'OB-003',
    type: 'Heatwave',
    message: 'Heatwave warning – max temp 44°C expected',
    severity: 'MEDIUM',
    reports: 3,
    nearby: 0,
    trend: 'Decreasing',
    trendDirection: 'down',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const KPI_CARDS = [
  {
    id: 'sos',
    label: 'SOS Alerts',
    count: 3,
    status: 'High Priority',
    statusColor: 'red',
    icon: 'ambulance',
    bgColor: '#FF6B6B',
    route: '/ngo/sos',
  },
  {
    id: 'pregnancy',
    label: 'High Risk Pregnancy',
    count: 1,
    status: 'Needs Visit',
    statusColor: 'orange',
    icon: 'pregnancy',
    bgColor: '#FF9F43',
    route: '/ngo/maternal',
  },
  {
    id: 'malnutrition',
    label: 'Malnutrition Cases',
    count: 2,
    status: 'Follow Up',
    statusColor: 'purple',
    icon: 'child',
    bgColor: '#A29BFE',
    route: '/ngo/child-nutrition',
  },
  {
    id: 'pads',
    label: 'Pad Requests',
    count: 0,
    status: 'No Pending',
    statusColor: 'green',
    icon: 'pad',
    bgColor: '#55EFC4',
    route: '/ngo/pads',
  },
];

export const TODAY_TASKS = [
  {
    id: 'T001',
    patientName: 'Sunita Devi',
    type: 'Pregnancy',
    detail: '8 Months',
    priority: 'High Risk',
    priorityColor: 'red',
    distance: '1.2 km',
    icon: 'pregnancy',
    done: false,
  },
  {
    id: 'T002',
    patientName: 'Raju Kumar',
    type: 'Malnutrition',
    detail: '2 Years',
    priority: 'Moderate',
    priorityColor: 'orange',
    distance: '0.8 km',
    icon: 'child',
    done: false,
  },
  {
    id: 'T003',
    patientName: 'Vaccination Follow-up',
    type: '3 children due',
    detail: null,
    priority: null,
    priorityColor: null,
    distance: '2.1 km',
    icon: 'vaccination',
    done: false,
  },
];

export const QUICK_ACTIONS = [
  { id: 'pregnancy', label: 'Pregnancy Record', icon: 'pregnancy', color: '#FF6B6B', route: '/ngo/maternal' },
  { id: 'nutrition', label: 'Child Nutrition', icon: 'child', color: '#A29BFE', route: '/ngo/child-nutrition' },
  { id: 'symptoms', label: 'Symptoms Check', icon: 'symptoms', color: '#00B894', route: '/symptoms' },
  { id: 'emergency', label: 'Emergency Record', icon: 'emergency', color: '#FF7675', route: '/ambulance' },
];

export const SYSTEM_HEALTH = {
  syncHealth: 98,
  offlineQueue: 3,
  lastSync: '2 min ago',
  awsStatus: 'connected',
  isNormal: true,
};

export const AI_RECOMMENDATIONS = [
  {
    id: 'REC-001',
    type: 'urgent',
    message: 'Visit Village V101 immediately due to rising malaria cases.',
    action: 'Schedule Visit',
  },
  {
    id: 'REC-002',
    type: 'warning',
    message: 'Sunita Devi (8 months pregnant) has not been visited in 14 days. High-risk flag.',
    action: 'Visit Now',
  },
  {
    id: 'REC-003',
    type: 'info',
    message: '3 children overdue for polio vaccination in your sector.',
    action: 'Schedule',
  },
];

export const OFFLINE_QUEUE = [
  { id: 'Q001', type: 'Pregnancy Record', patient: 'Meena Devi', timestamp: '10:30 AM' },
  { id: 'Q002', type: 'SOS Alert', patient: 'Ram Singh', timestamp: '11:15 AM' },
  { id: 'Q003', type: 'Nutrition Log', patient: 'Baby Arjun', timestamp: '12:05 PM' },
];

// ─── AI Risk Engine (Mock Scoring) ─────────────────────────────────────────────
export function computeRiskScore(type, data = {}) {
  const scores = {
    malaria: { base: 68, trend: 'increasing', level: 'HIGH' },
    dengue: { base: 42, trend: 'stable', level: 'MEDIUM' },
    pregnancy: { base: 85, trend: 'increasing', level: 'CRITICAL' },
    malnutrition: { base: 55, trend: 'stable', level: 'MEDIUM' },
    heatwave: { base: 30, trend: 'decreasing', level: 'LOW' },
  };
  return scores[type] || { base: 20, trend: 'stable', level: 'LOW' };
}
