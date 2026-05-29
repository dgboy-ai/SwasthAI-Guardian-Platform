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

  // Pregnancy Tracker
  trackPregnancy: async (data) => {
    try {
      const res = await api.post('/ngo/pregnancy-tracker', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to track pregnancy';
    }
  },

  // Village Health Data
  updateVillageData: async (villageId, data) => {
    try {
      const res = await api.put(`/ngo/village/${villageId}`, data);
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

  // Get Assigned Residents
  getAssignedResidents: async () => {
    try {
      const res = await api.get('/ngo/residents');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch residents';
    }
  },

  // Get Live Ambulance Requests (reads from ambulance_requests table — same table villagers write to)
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
  }
};

export default ngoService;
