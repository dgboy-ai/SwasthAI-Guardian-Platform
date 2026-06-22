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

  /** Outbreak + symptom alerts (backend has no /admin/alerts — uses outbreaks feed) */
  getGlobalAlerts: async () => {
    try {
      const res = await api.get('/admin/outbreaks');
      return res.data?.outbreaks ?? res.data ?? [];
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

  // Full stack status for evaluation verification (backend: GET /api/health/detailed)
  getSystemStatus: async () => {
    try {
      const res = await api.get('/health/detailed');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch system status';
    }
  },

  getDynamoFeed: async () => {
    try {
      const res = await api.get('/admin/dynamo-feed');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch DynamoDB feed';
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

  getDistrictReport: async (month) => {
    try {
      const params = month ? `?month=${encodeURIComponent(month)}` : '';
      const res = await api.get(`/admin/district-report${params}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch district report';
    }
  },

  exportDistrictReport: async (month) => {
    try {
      const query = new URLSearchParams({ format: 'csv' });
      if (month) query.set('month', month);
      const res = await api.get(`/admin/district-report?${query.toString()}`, { responseType: 'blob' });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to export district report';
    }
  },

  getAshaPerformance: async () => {
    try {
      const res = await api.get('/admin/asha-performance');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch ASHA performance';
    }
  },

  getDistrictConfig: async (districtId = 'district_main') => {
    try {
      const res = await api.get(`/admin/district-config/${encodeURIComponent(districtId)}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch district config';
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
  },

  getAuditLogs: async (page = 1, limit = 50) => {
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch audit logs';
    }
  },

  // Predictive Village Risk Intelligence
  getDistrictRiskHeatmap: async () => {
    try {
      const res = await api.get('/admin/district-risk-heatmap');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch district risk heatmap';
    }
  },

  getVillageRiskDetail: async (villageId) => {
    try {
      const res = await api.get(`/admin/village-risk/${encodeURIComponent(villageId)}`);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch village risk detail';
    }
  },

  getHeatmapData: async () => {
    try {
      const res = await api.get('/admin/heatmap-data');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch heatmap data';
    }
  },

  getAgentScans: async () => {
    try {
      const res = await api.get('/admin/agent-scans');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch agent scans';
    }
  }
};

export default adminService;

