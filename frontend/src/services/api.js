import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medichain_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on public verify/login, clear token
      if (!window.location.pathname.startsWith('/verify') && window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('medichain_token');
        localStorage.removeItem('medichain_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Modules
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getUsers: () => api.get('/auth/users'),
};

export const batchService = {
  getAll: (params) => api.get('/batches', { params }),
  getById: (batchId) => api.get(`/batches/${batchId}`),
  register: (batchData) => api.post('/batches/register', batchData),
  getHistory: (batchId) => api.get(`/batches/${batchId}/history`),
  recall: (batchId, reason) => api.post(`/batches/${batchId}/recall`, { reason }),
  updateStatus: (batchId, status, notes) => api.patch(`/batches/${batchId}/status`, { status, notes }),
};

export const transferService = {
  initiate: (batchId, data) => api.post(`/transfers/${batchId}/initiate`, data),
  receive: (batchId, notes) => api.post(`/transfers/${batchId}/receive`, { notes }),
  reject: (batchId, reason) => api.post(`/transfers/${batchId}/reject`, { reason }),
  getPending: () => api.get('/transfers/pending'),
};

export const verifyService = {
  verify: (batchId) => api.get(`/verify/${batchId}`),
};

export const explorerService = {
  getOverview: () => api.get('/explorer/overview'),
  getTransactions: () => api.get('/explorer/transactions'),
  getHealth: () => api.get('/explorer/health'),
};

export const analyticsService = {
  getDashboardData: () => api.get('/analytics/dashboard'),
};

export default api;

