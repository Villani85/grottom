import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Crea istanza axios di base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token JWT
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Funzioni API per autenticazione
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
  
  getMe: () => apiClient.get('/api/auth/me'),
};

// Funzioni API per utenti
export const usersAPI = {
  getUser: (id: string) => apiClient.get(`/api/users/${id}`),
  
  getUserActivity: (id: string) => apiClient.get(`/api/users/${id}/activity`),
};

// Funzioni API per live events
export const liveEventsAPI = {
  getLiveEvents: (params?: { status?: string; upcoming?: boolean }) =>
    apiClient.get('/api/live-events', { params }),
  
  getLiveEvent: (id: string) => apiClient.get(`/api/live-events/${id}`),
  
  getLiveEventsByStatus: (status: string) =>
    apiClient.get(`/api/live-events/status/${status}`),
};

// Funzioni API per community
export const communityAPI = {
  getPosts: () => apiClient.get('/api/community/posts'),
  
  getPost: (id: string) => apiClient.get(`/api/community/posts/${id}`),
  
  createPost: (data: { content: string }) =>
    apiClient.post('/api/community/posts', data),
  
  deletePost: (id: string) => apiClient.delete(`/api/community/posts/${id}`),
  
  likePost: (id: string) => apiClient.post(`/api/community/posts/${id}/like`),
  
  unlikePost: (id: string) => apiClient.delete(`/api/community/posts/${id}/like`),
  
  getUserLikes: (userId: string) => apiClient.get(`/api/community/users/${userId}/likes`),
};

// Funzioni API per gamification
export const gamificationAPI = {
  getLevels: () => apiClient.get('/api/gamification/levels'),
  
  getMyProgress: () => apiClient.get('/api/gamification/my-progress'),
  
  getUserAchievements: (userId: string) =>
    apiClient.get(`/api/gamification/${userId}/achievements`),
};

// Funzioni API per abbonamenti
export const subscriptionsAPI = {
  getMySubscription: () => apiClient.get('/api/subscriptions/my-subscription'),
  
  checkFeature: (feature: string) =>
    apiClient.get(`/api/subscriptions/check-feature/${feature}`),
  
  subscribe: (data: { tier: string }) =>
    apiClient.post('/api/subscriptions/subscribe', data),
};

// Helper per gestire token
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export default apiClient;
