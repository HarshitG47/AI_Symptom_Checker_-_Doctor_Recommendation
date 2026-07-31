import api from './api';

const assessmentService = {
  // Create new assessment
  createAssessment: async (data) => {
    const response = await api.post('/assessments', data);
    return response.data;
  },

  // Get all assessments with optional filters
  getAssessments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);
    const response = await api.get(`/assessments?${params.toString()}`);
    return response.data;
  },

  // Get single assessment
  getAssessmentById: async (id) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  },

  // Delete assessment
  deleteAssessment: async (id) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  },

  // Send chat follow-up message
  chatFollowUp: async (id, message) => {
    const response = await api.post(`/assessments/${id}/chat`, { message });
    return response.data;
  },

  // Get reminders
  getReminders: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },

  // Toggle reminder status
  toggleReminder: async (id) => {
    const response = await api.put(`/reminders/${id}`);
    return response.data;
  },

  // Create custom reminder
  createReminder: async (reminderData) => {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  },

  // Delete reminder
  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },

  // Get Health Timeline
  getTimeline: async () => {
    const response = await api.get('/analytics/timeline');
    return response.data;
  },

  // Get Lab Trends
  getTrends: async () => {
    const response = await api.get('/analytics/trends');
    return response.data;
  },

  // Get Health Summary
  getSummary: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  }
};

export default assessmentService;
