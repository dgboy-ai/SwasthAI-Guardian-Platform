import api from './api';

const adminService = {
  getVillages: async () => {
    try {
      const res = await api.get('/admin/villages');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch villages';
    }
  },

  getVillageStatus: async (villageId) => {
    try {
      const res = await api.get(`/admin/village-status?villageId=${villageId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch village status';
    }
  },

  // User Management
  getAllUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch users';
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update user role';
    }
  },

  // Global Health Analytics & Summary
  getAnalytics: async () => {
    try {
      const res = await api.get('/admin/analytics');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch analytics';
    }
  },

  getSummary: async () => {
    try {
      const res = await api.get('/admin/summary');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch summary stats';
    }
  },

  // Outbreaks & Alerts
  getOutbreaks: async () => {
    try {
      const res = await api.get('/admin/outbreaks');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch outbreak events';
    }
  },

  getOutbreaksDynamo: async (days = 7, limit = 20) => {
    try {
      const res = await api.get(`/admin/outbreaks-dynamo?days=${days}&limit=${limit}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch DynamoDB outbreaks';
    }
  },

  getDiseaseTrends: async (disease, days = 7) => {
    try {
      const res = await api.get(`/admin/disease-trends?disease=${encodeURIComponent(disease)}&days=${days}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch disease trends';
    }
  },

  issueOutbreakAlert: async (data) => {
    try {
      const res = await api.post('/admin/outbreak-alert', data);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to dispatch outbreak alert';
    }
  },

  getGlobalAlerts: async () => {
    try {
      const res = await api.get('/admin/alerts');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch global alerts';
    }
  },

  // Ambulances Feed
  getAmbulances: async () => {
    try {
      const res = await api.get('/admin/ambulances');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch dispatches';
    }
  },

  // System Configuration & AI Diagnostics
  getSystemStatus: async () => {
    try {
      const res = await api.get('/admin/status');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch system status';
    }
  },

  getRagTraces: async () => {
    try {
      const res = await api.get('/admin/rag-traces');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch RAG traces';
    }
  },

  // Demo Control & Reports
  seedDemoData: async () => {
    try {
      const res = await api.post('/admin/seed-demo-data');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to trigger demo seeding';
    }
  },

  getReport: async () => {
    try {
      const res = await api.get('/admin/report', { responseType: 'blob' });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to export outbreak report';
    }
  }
};

export default adminService;
