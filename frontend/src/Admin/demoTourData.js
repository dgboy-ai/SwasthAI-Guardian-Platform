export const DEMO_STATS = { pregnancies: 126, malnutrition: 248, villages: 4, today_symptoms: 12 };
export const DEMO_SUMMARY = { totalUsers: 3842, totalNgos: 47, emergencyCount: 7, sanitaryCount: 23, totalRequests: 4198 };
export const DEMO_OUTBREAKS = [
  { id: 1, villageId: '47', classification: 'Fever Cluster', symptomPattern: 'High fever + body ache reported in 6 cases', action: 'Deploy ASHA workers to Village 47. Screen all children under 10.', confidence: 0.91, detectedAt: new Date(Date.now() - 480000).toISOString() },
  { id: 2, villageId: '12', classification: 'Diarrheal Signal', symptomPattern: 'Watery stools + dehydration in 4 cases', action: 'Distribute ORS packets. Inspect water sources in Block C.', confidence: 0.78, detectedAt: new Date(Date.now() - 1500000).toISOString() },
  { id: 3, villageId: '8', classification: 'Respiratory Cases', symptomPattern: 'Cough + cold cluster — 5 cases in 12 hours', action: 'Activate TB screening protocol. Refer 2 cases to PHC.', confidence: 0.84, detectedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, villageId: '21', classification: 'Fever Cluster', symptomPattern: 'Malaria-like symptoms in northern zone', action: 'RDT testing for all reported cases. Spray prophylactic.', confidence: 0.76, detectedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 5, villageId: '3', classification: 'Skin Rash Cluster', symptomPattern: 'Rash + itching in 5 children under 5', action: 'Scabies treatment kits required. Hygiene drive needed.', confidence: 0.69, detectedAt: new Date(Date.now() - 10800000).toISOString() }
];
export const DEMO_AMBULANCES = [
  { user_id: 101, name: 'Priya Sharma', type: 'emergency', location: 'Sehore CHC Road, Block B', priority: 'Critical', status: 'in_progress', created_at: new Date(Date.now() - 720000).toISOString() },
  { user_id: 102, name: 'Ramesh Verma', type: 'emergency', location: 'Budhni Village, NH-46', priority: 'High', status: 'assigned', created_at: new Date(Date.now() - 1800000).toISOString() },
  { user_id: 103, name: 'Sunita Patel', type: 'routine', location: 'Nasrullaganj PHC', priority: 'Normal', status: 'completed', created_at: new Date(Date.now() - 3600000).toISOString() },
  { user_id: 104, name: 'Mohan Yadav', type: 'emergency', location: 'Ichhawar Block, Village 12', priority: 'Critical', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString() },
  { user_id: 105, name: 'Geeta Rawat', type: 'routine', location: 'Rehti PHC, District Road', priority: 'Normal', status: 'completed', created_at: new Date(Date.now() - 14400000).toISOString() }
];
export const DEMO_REPORT = {
  villages: { total: 4 },
  maternal: { highRiskPregnancies: 28 },
  emergencies: { ambulanceRequests: 14 },
  outbreakAlerts: { count: 3 }
};

export const DEMO_ASHA_PERFORMANCE = [
  { name: 'Anjali Sharma (ASHA)', villageId: 'v101', referrals_count: 14, pregnancies_tracked: 28, vaccinations_completed: 45, emergencies_reported: 3 },
  { name: 'Sunita Bai (ASHA)', villageId: 'v102', referrals_count: 9, pregnancies_tracked: 18, vaccinations_completed: 32, emergencies_reported: 1 },
  { name: 'Rekha Devi (ASHA)', villageId: 'v103', referrals_count: 12, pregnancies_tracked: 22, vaccinations_completed: 40, emergencies_reported: 2 },
  { name: 'Pooja Patel (ASHA)', villageId: 'v104', referrals_count: 6, pregnancies_tracked: 12, vaccinations_completed: 25, emergencies_reported: 0 }
];

export const DEMO_DISTRICT_KPIS = {
  totalPopulation: 284000,
  activeVillages: 47,
  activeASHAWorkers: 84,
  emergencyCases: 7,
  diseaseAlerts: 5,
  vaccinationProgress: 73,
  maternalHealth: 82,
  childHealth: 78,
  highRiskPatients: 126,
  healthFacilityStatus: 91,
};

export const DEMO_VILLAGE_PERFORMANCE = [
  { name: 'Village V101', population: 5200, healthScore: 82, riskLevel: 'low', pendingTasks: 3, ashaworkers: 4, lastVisit: '1h ago' },
  { name: 'Village V102', population: 3800, healthScore: 67, riskLevel: 'medium', pendingTasks: 7, ashaworkers: 3, lastVisit: '3h ago' },
  { name: 'Village V103', population: 6100, healthScore: 45, riskLevel: 'high', pendingTasks: 12, ashaworkers: 2, lastVisit: '5h ago' },
  { name: 'Village V104', population: 2900, healthScore: 78, riskLevel: 'low', pendingTasks: 2, ashaworkers: 3, lastVisit: '2h ago' },
  { name: 'Village V105', population: 4400, healthScore: 54, riskLevel: 'high', pendingTasks: 9, ashaworkers: 2, lastVisit: '4h ago' },
];

export const DEMO_DISEASE_TRENDS = [
  { month: 'Jan', malaria: 8, dengue: 3, respiratory: 12, diarrhea: 15 },
  { month: 'Feb', malaria: 12, dengue: 5, respiratory: 10, diarrhea: 18 },
  { month: 'Mar', malaria: 15, dengue: 8, respiratory: 7, diarrhea: 14 },
  { month: 'Apr', malaria: 22, dengue: 12, respiratory: 5, diarrhea: 10 },
  { month: 'May', malaria: 28, dengue: 18, respiratory: 3, diarrhea: 8 },
  { month: 'Jun', malaria: 35, dengue: 22, respiratory: 2, diarrhea: 6 },
];

export const DEMO_EMERGENCY_TIMELINE = [
  { time: '2 min ago', type: 'Ambulance Request', patient: 'Lata Devi', location: 'V102', status: 'Dispatched' },
  { time: '15 min ago', type: 'SOS Alert', patient: 'Ram Singh', location: 'V104', status: 'Responding' },
  { time: '45 min ago', type: 'Emergency Referral', patient: 'Sunita Devi', location: 'V101', status: 'Completed' },
  { time: '2h ago', type: 'Fire Response', patient: 'V103 Cluster', location: 'V103', status: 'Resolved' },
  { time: '4h ago', type: 'Medicine Urgent', patient: 'Karan Singh', location: 'V103', status: 'Delivered' },
];

export const DEMO_RESOURCE_ALLOCATION = {
  ambulanceActive: 7,
  ambulanceTotal: 10,
  ashaWorkersDeployed: 84,
  ashaWorkersTotal: 120,
  vaccineStock: 3200,
  vaccineTarget: 5000,
  nutritionKits: 480,
  nutritionKitsTarget: 600,
  medicineStock: 85,
  bedAvailability: 42,
  bedTotal: 120,
};

export const DEMO_MEDICINE_DISTRIBUTION = [
  { medicine: 'ORS Packets', distributed: 2400, target: 3000, reached: '80%' },
  { medicine: 'Iron Folic Acid', distributed: 1800, target: 2500, reached: '72%' },
  { medicine: 'Vitamin A', distributed: 920, target: 1200, reached: '77%' },
  { medicine: 'Anti-Malarial', distributed: 650, target: 800, reached: '81%' },
  { medicine: 'TB Drugs', distributed: 340, target: 400, reached: '85%' },
];

export const DEMO_INFRASTRUCTURE = [
  { name: 'Sehore CHC', type: 'CHC', status: 'operational', beds: 30, doctors: 4, lastInspection: '2 days ago' },
  { name: 'Budhni PHC', type: 'PHC', status: 'operational', beds: 10, doctors: 2, lastInspection: '5 days ago' },
  { name: 'Nasrullaganj PHC', type: 'PHC', status: 'degraded', beds: 6, doctors: 1, lastInspection: '1 week ago', note: 'Doctor shortage' },
  { name: 'Ichhawar SC', type: 'SC', status: 'operational', beds: 4, doctors: 0, lastInspection: '3 days ago', note: 'Staff nurse available' },
  { name: 'Rehti PHC', type: 'PHC', status: 'operational', beds: 8, doctors: 2, lastInspection: '4 days ago' },
  { name: 'Village V103 SC', type: 'SC', status: 'closed', beds: 2, doctors: 0, lastInspection: '2 weeks ago', note: 'Awaiting staff' },
];

export const DEMO_AUDIT_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 120000).toISOString(), user: 'Admin', role: 'admin', action: 'Outbreak Alert Issued', resource: 'Village V103', status: 'success' },
  { id: 2, timestamp: new Date(Date.now() - 300000).toISOString(), user: 'Anjali Sharma', role: 'ngo', action: 'Patient Registered', resource: 'Sunita Devi', status: 'success' },
  { id: 3, timestamp: new Date(Date.now() - 600000).toISOString(), user: 'System', role: 'ai', action: 'Disease Detected', resource: 'Malaria - V101', status: 'success' },
  { id: 4, timestamp: new Date(Date.now() - 1800000).toISOString(), user: 'Admin', role: 'admin', action: 'Ambulance Dispatched', resource: 'Lata Devi - V102', status: 'success' },
  { id: 5, timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'System', role: 'ai', action: 'High-Risk Alert', resource: 'Pregnancy - V101', status: 'success' },
  { id: 6, timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'Sunita Bai', role: 'asha', action: 'Medicine Delivered', resource: 'ORS - V102', status: 'completed' },
  { id: 7, timestamp: new Date(Date.now() - 14400000).toISOString(), user: 'Admin', role: 'admin', action: 'NGO Grant Approved', resource: 'Nutrition Program', status: 'approved' },
  { id: 8, timestamp: new Date(Date.now() - 28800000).toISOString(), user: 'System', role: 'ai', action: 'Vaccination Reminder', resource: '45 children due', status: 'sent' },
];

export const DEMO_IMPACT_METRICS = {
  villagersServed: 284000,
  highRiskPregnanciesDetected: 126,
  livesPotentiallySaved: 142,
  emergencyResponseTime: '4.2 min',
  diseaseDetectionRate: '94%',
  schemesDelivered: 12,
  medicineDistribution: '82%',
  ashaProductivity: 87,
  ngoContribution: '₹12.4Cr',
  districtHealthImprovement: '+18%',
};

export const DEMO_CSR_SUMMARY = {
  totalInvestment: '₹2.8Cr',
  programsActive: 4,
  beneficiaries: 42000,
  partners: 6,
  yearToDate: '₹1.6Cr',
};
