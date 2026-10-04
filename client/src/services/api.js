import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error catching
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Auto logout if token expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(customError);
  }
);

// API methods
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.put(`/auth/reset-password/${token}`, { newPassword }),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (formData) =>
    api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const lostService = {
  create: (formData) =>
    api.post('/lost', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/lost', { params }),
  getById: (id) => api.get(`/lost/${id}`),
  getMy: () => api.get('/lost/my'),
  update: (id, formData) =>
    api.put(`/lost/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/lost/${id}`),
};

export const foundService = {
  create: (formData) =>
    api.post('/found', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/found', { params }),
  getById: (id) => api.get(`/found/${id}`),
  getMy: () => api.get('/found/my'),
  update: (id, formData) =>
    api.put(`/found/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/found/${id}`),
};

export const matchService = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  runBatch: () => api.post('/matches/run'),
};

export const claimService = {
  create: (claimData) => api.post('/claims', claimData),
  getAll: (params) => api.get('/claims', { params }),
  getById: (id) => api.get(`/claims/${id}`),
};

export const handoverService = {
  create: (handoverData) => api.post('/handover', handoverData),
  verify: (verificationData) => api.post('/handover/verify', verificationData),
  getAll: () => api.get('/handover'),
  getById: (id) => api.get(`/handover/${id}`),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserBlock: (id) => api.put(`/admin/users/${id}/status`),
  approveClaim: (id, data) => api.put(`/admin/claims/${id}/approve`, data),
  rejectClaim: (id, data) => api.put(`/admin/claims/${id}/reject`, data),
  requestClaimInfo: (id, data) => api.put(`/admin/claims/${id}/request-info`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const searchService = {
  search: (params) => api.get('/search', { params }),
};

export default api;
