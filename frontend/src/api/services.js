import { api } from './client';

const data = (response) => response.data;

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload).then(data),
  login: (payload) => api.post('/api/auth/login', payload).then(data),
  me: () => api.get('/api/auth/me').then(data),
};

export const categoryApi = {
  list: (type) => api.get('/api/categories', { params: type ? { type } : {} }).then(data),
};

export const transactionApi = {
  list: (params) => api.get('/api/transactions', { params }).then(data),
  create: (payload) => api.post('/api/transactions', payload).then(data),
  update: (id, payload) => api.put(`/api/transactions/${id}`, payload).then(data),
  remove: (id) => api.delete(`/api/transactions/${id}`).then(data),
};

export const budgetApi = {
  list: (month) => api.get('/api/budgets', { params: { month } }).then(data),
  create: (payload) => api.post('/api/budgets', payload).then(data),
  updateAmount: (id, amount) => api.put(`/api/budgets/${id}`, { amount }).then(data),
  remove: (id) => api.delete(`/api/budgets/${id}`).then(data),
};

export const dashboardApi = {
  get: (month) => api.get('/api/dashboard', { params: { month } }).then(data),
};

export const reportApi = {
  summary: (from, to) => api.get('/api/reports/summary', { params: { from, to } }).then(data),
};

export const userApi = {
  updatePreferences: (payload) => api.put('/api/user/preferences', payload).then(data),
};

export const savingsGoalApi = {
  list: () => api.get('/api/savings-goals').then(data),
  create: (payload) => api.post('/api/savings-goals', payload).then(data),
  update: (id, payload) => api.put(`/api/savings-goals/${id}`, payload).then(data),
  deposit: (id, amount) => api.post(`/api/savings-goals/${id}/deposit`, { amount }).then(data),
  withdraw: (id, amount) => api.post(`/api/savings-goals/${id}/withdraw`, { amount }).then(data),
  remove: (id) => api.delete(`/api/savings-goals/${id}`).then(data),
};
