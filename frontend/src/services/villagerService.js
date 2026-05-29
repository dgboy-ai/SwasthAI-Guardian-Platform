import api from './api';

const villagerService = {
  // Symptom Checker & AI Diagnosis
  checkSymptoms: async (symptoms) => {
    try {
      const res = await api.post('/villager/check-symptoms', { symptoms });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Symptom analysis failed';
    }
  },

  // Skin Disease AI Analysis
  analyzeSkin: async (imageData) => {
    try {
      const res = await api.post('/villager/analyze-skin', { image: imageData });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Skin analysis failed';
    }
  },

  // Ambulance Request
  requestAmbulance: async (location) => {
    try {
      const res = await api.post('/villager/request-ambulance', { location });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Ambulance request failed';
    }
  },

  // Get Health Records
  getHealthRecords: async () => {
    try {
      const res = await api.get('/villager/health-records');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch records';
    }
  },

  // Family Health Sync
  syncFamilyData: async (familyId) => {
    try {
      const res = await api.get(`/villager/family/${familyId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Family sync failed';
    }
  }
};

export default villagerService;
