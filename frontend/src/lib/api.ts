import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Normalize API URL - remove trailing slash and ensure it's valid
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  // Remove trailing slash if present
  return url.replace(/\/+$/, '');
};

const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);
console.log('🔗 API Base URL:', `${API_URL}/api`);

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and logging
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error - Cannot connect to backend');
      console.error('Error message:', error.message);
      console.error('API URL:', API_URL);
      console.error('Full error:', error);
      
      // Show more helpful error message
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Please check if backend is running and Ngrok tunnel is active.');
      }
    } else {
      console.error('❌ Response Error:', error.response?.status, error.config?.url);
      console.error('Error details:', error.response?.data);
    }
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          Cookies.set('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  getCredits: () => api.get('/users/credits'),
  getApiKeys: () => api.get('/users/api-keys'),
  saveApiKey: (type: 'google_gemini' | 'openai' | 'huggingface', apiKey: string) =>
    api.post('/users/api-keys', { type, apiKey }),
  verifyApiKey: (type: 'google_gemini' | 'openai' | 'huggingface', apiKey: string) =>
    api.post('/users/api-keys/verify', { type, apiKey }),
  deleteApiKey: (type: 'google_gemini' | 'openai' | 'huggingface') =>
    api.delete(`/users/api-keys/${type}`),
  getAvailableModels: () => api.get('/users/api-keys/models'),
  testModel: (type: 'google_gemini' | 'openai' | 'huggingface', model: string) =>
    api.post('/users/api-keys/models/test', { type, model }),
  saveSelectedModel: (type: 'google_gemini' | 'openai' | 'huggingface', model: string) =>
    api.post('/users/api-keys/models/select', { type, model }),
  getTemplates: () => api.get('/users/templates'),
  getStoreTemplates: () => api.get('/users/templates/store'),
  purchaseTemplate: (templateId: string) => api.post(`/users/templates/${templateId}/purchase`),
  getPurchasedTemplates: () => api.get('/users/templates/purchased'),
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMySubscription: () => api.get('/subscriptions/my-subscription'),
  createCheckout: (planName: string) =>
    api.post('/subscriptions/checkout', { planName }),
  createPortal: () => api.post('/subscriptions/portal'),
  cancel: () => api.post('/subscriptions/cancel'),
};

// AI API
export const aiApi = {
  generateImage: (prompt: string) => api.post('/ai/generate-image', { topic: prompt }),
  generateVideo: (prompt: string) => api.post('/ai/generate-video', { topic: prompt }),
};

// Contents API
export const contentsApi = {
  getAll: (type?: string) => api.get('/contents', { params: { type } }),
  getById: (id: string) => api.get(`/contents/${id}`),
  delete: (id: string) => api.delete(`/contents/${id}`),
  getStats: () => api.get('/contents/stats'),
};

// Payments API
export const paymentsApi = {
  getHistory: () => api.get('/payments/history'),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (page = 1, limit = 20) =>
    api.get('/admin/users', { params: { page, limit } }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUserCredits: (id: string, seoCredits?: number, reelCredits?: number) =>
    api.put(`/admin/users/${id}/credits`, { seoCredits, reelCredits }),
  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getPlans: () => api.get('/admin/plans'),
  updatePlan: (id: string, data: any) => api.put(`/admin/plans/${id}`, data),
  getContents: (page = 1, limit = 20) =>
    api.get('/admin/contents', { params: { page, limit } }),
  deleteContent: (id: string) => api.delete(`/admin/contents/${id}`),
  getPayments: (startDate?: string, endDate?: string) =>
    api.get('/admin/payments', { params: { startDate, endDate } }),
  getWebhooks: (page = 1, limit = 50) =>
    api.get('/admin/webhooks', { params: { page, limit } }),
  getTemplates: () => api.get('/admin/templates'),
  getTemplateById: (id: string) => api.get(`/admin/templates/${id}`),
  createTemplate: (data: any) => api.post('/admin/templates', data),
  updateTemplate: (id: string, data: any) =>
    api.put(`/admin/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/admin/templates/${id}`),
};

