import api from './api';

const ngoService = {
  // Malnutrition Monitoring
  submitMalnutritionData: async (data) => {
    try {
      const res = await api.post('/ngo/malnutrition', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to submit malnutrition data';
    }
  },

  // Pregnancy Tracker (backend: POST /api/ngo/maternal)
  trackPregnancy: async (data) => {
    try {
      const res = await api.post('/ngo/maternal', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to track pregnancy';
    }
  },

  // Village Health Data (backend: POST /api/ngo/village — upsert by villageId)
  updateVillageData: async (villageId, data) => {
    try {
      const res = await api.post('/ngo/village', { villageId, ...data });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update village data';
    }
  },

  // Get NGO Stats
  getStats: async () => {
    try {
      const res = await api.get('/ngo/stats');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch statistics';
    }
  },

  getWorkloadQueue: async () => {
    try {
      const res = await api.get('/ngo/workload');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch ASHA workload queue';
    }
  },

  // Get Assigned Residents
  getAssignedResidents: async () => {
    try {
      const res = await api.get('/ngo/residents');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch residents';
    }
  },

  // Get Live Ambulance Requests
  getRequests: async () => {
    try {
      const res = await api.get('/ngo/ambulances');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch ambulance requests';
    }
  },

  // Update Ambulance Request Status
  updateRequestStatus: async (id, status) => {
    try {
      const res = await api.put(`/ngo/ambulances/${id}/status`, { status });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update request status';
    }
  },

  // Get Sanitary Pad Requests
  getPadRequests: async () => {
    try {
      const res = await api.get('/ngo/pads');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch pad requests';
    }
  },

  // Referrals Management
  createReferral: async (data) => {
    try {
      const res = await api.post('/ngo/referral', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to dispatch care referral';
    }
  },

  getReferrals: async () => {
    try {
      const res = await api.get('/ngo/referrals');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch referrals';
    }
  },

  updateReferralStatus: async (id, status) => {
    try {
      const res = await api.patch(`/ngo/referrals/${id}/status`, { status });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update referral status';
    }
  },

  updateReferralOutcome: async (id, outcomeData) => {
    try {
      const res = await api.put(`/ngo/referrals/${id}/outcome`, outcomeData);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to log referral outcome';
    }
  },

  // Mission Indradhanush Immunization Tracking
  createVaccinationRecord: async (data) => {
    try {
      const res = await api.post('/ngo/vaccinations', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to log immunization record';
    }
  },

  getVaccinations: async () => {
    try {
      const res = await api.get('/ngo/vaccinations');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch vaccination logs';
    }
  },

  // Scoped Outbreaks
  getOutbreaks: async (villageId) => {
    try {
      const params = villageId ? `?villageId=${encodeURIComponent(villageId)}` : '';
      const res = await api.get(`/ngo/outbreaks${params}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch outbreak telemetry';
    }
  },

  // Predictive Village Risk Intelligence
  getVillageRisk: async (villageId) => {
    try {
      const params = villageId ? `?villageId=${encodeURIComponent(villageId)}` : '';
      const res = await api.get(`/ngo/village-risk${params}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch village risk forecast';
    }
  },

  // Impact Analytics Monthly Report
  getImpactReport: async () => {
    try {
      const res = await api.get('/ngo/impact-report');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to generate impact report';
    }
  }
};

export default ngoService;
