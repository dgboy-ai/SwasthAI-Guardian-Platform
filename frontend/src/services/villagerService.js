import api from './api';

const villagerService = {
  // Symptom Checker & AI Diagnosis (Hits backend POST /symptoms)
  checkSymptoms: async (data) => {
    try {
      const res = await api.post('/symptoms', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Symptom analysis failed';
    }
  },

  // Skin Disease AI Analysis / Telemetry Log (Hits backend POST /skin-log)
  analyzeSkin: async (data) => {
    try {
      const res = await api.post('/skin-log', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Skin analysis failed';
    }
  },

  // Ambulance Request (Hits backend POST /ambulance)
  requestAmbulance: async (location) => {
    try {
      const res = await api.post('/ambulance', { location });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Ambulance request failed';
    }
  },

  // Ambulance Status (Hits backend GET /ambulance-status)
  getAmbulanceStatus: async () => {
    try {
      const res = await api.get('/ambulance-status');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch ambulance status';
    }
  },

  // Get Health Records & History (Hits backend GET /my-history)
  getSymptomHistory: async () => {
    try {
      const res = await api.get('/my-history');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch history';
    }
  },

  // Legacy wrapper mapping to history
  getHealthRecords: async () => {
    return villagerService.getSymptomHistory();
  },

  // Government Schemes
  getSchemes: async () => {
    try {
      const res = await api.get('/schemes');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch schemes';
    }
  },

  getAllSchemes: async () => {
    try {
      const res = await api.get('/schemes/all');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch all schemes';
    }
  },

  getSchemeById: async (id) => {
    try {
      const res = await api.get(`/schemes/${id}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch scheme details';
    }
  },

  // Sanitary Pad Request
  requestPads: async (data) => {
    try {
      const res = await api.post('/villager/pad-request', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Sanitary pad request failed';
    }
  },

  // Sakhi AI Chatbot Assistant
  askHealthAssistant: async (query, history = []) => {
    try {
      const res = await api.post('/health-assistant', { message: query, history });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'AI Assistant failed';
    }
  },

  // Offline Telemetry Data Sync
  syncHealthTelemetry: async (data) => {
    try {
      const res = await api.post('/villager/sync-health', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Offline sync failed';
    }
  },

  // Mental Health Triage Screen (PHQ-2)
  submitPhq2: async (answers) => {
    try {
      const res = await api.post('/villager/phq2', answers);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Mental health screening failed';
    }
  },

  // Emergency Alert trigger
  triggerEmergencyAlert: async (data) => {
    try {
      const res = await api.post('/emergency-alert', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Emergency SOS trigger failed';
    }
  },

  // Profile Management (Hits backend PUT /auth/profile)
  getProfile: async () => {
    try {
      // Profile can be fetched via my-history or custom details,
      // typically user object is in AuthContext but we wrapper here
      const res = await api.get('/my-history');
      return res.data.user || null;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to retrieve profile';
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update profile';
    }
  },

  // Family Health Sync (Backward compatibility)
  syncFamilyData: async (familyId) => {
    try {
      const res = await api.get('/my-history');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Family sync failed';
    }
  }
};

export default villagerService;
