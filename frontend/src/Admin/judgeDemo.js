export const DEMO_STATS = { pregnancies: 126, malnutrition: 248, villages: 4, today_symptoms: 12 };
export const DEMO_SUMMARY = { totalUsers: 3842, totalNgos: 47, emergencyCount: 7, sanitaryCount: 23, totalRequests: 4198 };
export const DEMO_OUTBREAKS = [
  { id: 1, villageId: '47',  classification: 'Fever Cluster',     symptomPattern: 'High fever + body ache reported in 6 cases', action: 'Deploy ASHA workers to Village 47. Screen all children under 10.', confidence: 0.91, detectedAt: new Date(Date.now() - 480000).toISOString()  },
  { id: 2, villageId: '12',  classification: 'Diarrheal Signal',  symptomPattern: 'Watery stools + dehydration in 4 cases',       action: 'Distribute ORS packets. Inspect water sources in Block C.',       confidence: 0.78, detectedAt: new Date(Date.now() - 1500000).toISOString() },
  { id: 3, villageId: '8',   classification: 'Respiratory Cases', symptomPattern: 'Cough + cold cluster — 5 cases in 12 hours',   action: 'Activate TB screening protocol. Refer 2 cases to PHC.',           confidence: 0.84, detectedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, villageId: '21',  classification: 'Fever Cluster',     symptomPattern: 'Malaria-like symptoms in northern zone',        action: 'RDT testing for all reported cases. Spray prophylactic.',         confidence: 0.76, detectedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 5, villageId: '3',   classification: 'Skin Rash Cluster', symptomPattern: 'Rash + itching in 5 children under 5',         action: 'Scabies treatment kits required. Hygiene drive needed.',           confidence: 0.69, detectedAt: new Date(Date.now() - 10800000).toISOString()}
];
export const DEMO_AMBULANCES = [
  { user_id: 101, name: 'Priya Sharma',  type: 'emergency', location: 'Sehore CHC Road, Block B',   priority: 'Critical', status: 'in_progress', created_at: new Date(Date.now() - 720000).toISOString()   },
  { user_id: 102, name: 'Ramesh Verma',  type: 'emergency', location: 'Budhni Village, NH-46',       priority: 'High',     status: 'assigned',    created_at: new Date(Date.now() - 1800000).toISOString()  },
  { user_id: 103, name: 'Sunita Patel',  type: 'routine',   location: 'Nasrullaganj PHC',            priority: 'Normal',   status: 'completed',   created_at: new Date(Date.now() - 3600000).toISOString()  },
  { user_id: 104, name: 'Mohan Yadav',   type: 'emergency', location: 'Ichhawar Block, Village 12',  priority: 'Critical', status: 'pending',     created_at: new Date(Date.now() - 7200000).toISOString()  },
  { user_id: 105, name: 'Geeta Rawat',   type: 'routine',   location: 'Rehti PHC, District Road',    priority: 'Normal',   status: 'completed',   created_at: new Date(Date.now() - 14400000).toISOString() }
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
