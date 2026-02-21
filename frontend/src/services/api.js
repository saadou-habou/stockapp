import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Injection de token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirection pour login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Stock
export const stockAPI = {
  getDashboard: () => api.get('/stock/dashboard'),
  getEntries: (params) => api.get('/stock/entries', { params }),
  createEntry: (data) => api.post('/stock/entries', data),
  getExits: (params) => api.get('/stock/exits', { params }),
  createExit: (data) => api.post('/stock/exits', data),
  getHistory: (productId, params) => api.get(`/stock/history/${productId}`, { params }),
};

// Orders
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMy: () => api.get('/orders/my'),
  getAll: (params) => api.get('/orders', { params }),
  getStats: () => api.get('/orders/stats'),
  approve: (id, data) => api.put(`/orders/${id}/approve`, data),
  reject: (id, data) => api.put(`/orders/${id}/reject`, data),
};

// Suppliers
export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
};

export default api;
