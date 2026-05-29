import api from './api';

const adminService = {
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

  // Global Health Analytics
  getAnalytics: async () => {
    try {
      const res = await api.get('/admin/analytics');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch analytics';
    }
  },

  // System Configuration
  getSystemStatus: async () => {
    try {
      const res = await api.get('/admin/status');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch system status';
    }
  },

  // Critical Alerts Management
  getGlobalAlerts: async () => {
    try {
      const res = await api.get('/admin/alerts');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch global alerts';
    }
  }
};

export default adminService;
