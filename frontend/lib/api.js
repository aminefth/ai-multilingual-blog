import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF token
apiClient.interceptors.request.use(
  (config) => {
    // Add JWT token if available (client-side only)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token for state-changing operations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
        const csrfToken = localStorage.getItem('csrf-token');
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid (client-side only)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

// API Service Classes

export class AuthAPI {
  static async login(email, password, rememberMe = false) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      rememberMe,
    });
    return response.data;
  }

  static async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  static async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  static async refreshToken() {
    const response = await apiClient.post('/auth/refresh-tokens');
    return response.data;
  }

  static async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(token, password) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  }

  static async verifyEmail(token) {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  }

  static async sendVerificationEmail() {
    const response = await apiClient.post('/auth/send-verification-email');
    return response.data;
  }
}

export class BlogAPI {
  static async getPosts(params = {}) {
    const response = await apiClient.get('/blog', { params });
    return response.data;
  }

  static async getPost(slug) {
    const response = await apiClient.get(`/blog/${slug}`);
    return response.data;
  }

  static async createPost(postData) {
    const response = await apiClient.post('/blog', postData);
    return response.data;
  }

  static async updatePost(id, postData) {
    const response = await apiClient.put(`/blog/${id}`, postData);
    return response.data;
  }

  static async deletePost(id) {
    const response = await apiClient.delete(`/blog/${id}`);
    return response.data;
  }

  static async translatePost(id, targetLanguage) {
    const response = await apiClient.post(`/blog/${id}/translate`, {
      targetLanguage,
    });
    return response.data;
  }

  static async updateSEO(id, seoData) {
    const response = await apiClient.put(`/blog/${id}/seo`, seoData);
    return response.data;
  }

  static async trackAffiliateClick(id, clickData) {
    const response = await apiClient.post(`/blog/${id}/affiliate-click`, clickData);
    return response.data;
  }

  static async getPostAnalytics(id, params = {}) {
    const response = await apiClient.get(`/blog/${id}/analytics`, { params });
    return response.data;
  }

  static async getCategories() {
    const response = await apiClient.get('/blog/categories');
    return response.data;
  }

  static async getFeaturedPosts() {
    const response = await apiClient.get('/blog', {
      params: { featured: true, limit: 6, status: 'published' },
    });
    return response.data;
  }

  static async searchPosts(query, params = {}) {
    const response = await apiClient.get('/blog', {
      params: { search: query, ...params },
    });
    return response.data;
  }
}

export class UserAPI {
  static async getProfile() {
    const response = await apiClient.get('/users/profile');
    return response.data;
  }

  static async updateProfile(userData) {
    const response = await apiClient.patch('/users/profile', userData);
    return response.data;
  }

  static async changePassword(currentPassword, newPassword) {
    const response = await apiClient.patch('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  static async deleteAccount() {
    const response = await apiClient.delete('/users/profile');
    return response.data;
  }

  static async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export class SubscriptionAPI {
  static async getPlans() {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  }

  static async getCurrentSubscription() {
    const response = await apiClient.get('/subscriptions/current');
    return response.data;
  }

  static async subscribe(planId, paymentMethodId) {
    const response = await apiClient.post('/subscriptions/subscribe', {
      planId,
      paymentMethodId,
    });
    return response.data;
  }

  static async updateSubscription(planId) {
    const response = await apiClient.patch('/subscriptions/current', {
      planId,
    });
    return response.data;
  }

  static async cancelSubscription() {
    const response = await apiClient.delete('/subscriptions/current');
    return response.data;
  }

  static async createBillingPortalSession() {
    const response = await apiClient.post('/subscriptions/billing-portal');
    return response.data;
  }

  static async getInvoices() {
    const response = await apiClient.get('/subscriptions/invoices');
    return response.data;
  }
}

export class AnalyticsAPI {
  static async trackEvent(eventData) {
    const response = await apiClient.post('/analytics/events', eventData);
    return response.data;
  }

  static async getDashboard(params = {}) {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data;
  }

  static async getRevenueAnalytics(params = {}) {
    const response = await apiClient.get('/analytics/revenue', { params });
    return response.data;
  }

  static async getPostAnalytics(postId, params = {}) {
    const response = await apiClient.get(`/analytics/posts/${postId}`, { params });
    return response.data;
  }

  static async getTopContent(params = {}) {
    const response = await apiClient.get('/analytics/top-content', { params });
    return response.data;
  }
}

export class CSRFAPI {
  static async getToken() {
    const response = await apiClient.get('/csrf/token');
    return response.data;
  }
}

export class SearchAPI {
  static async searchContent(query, filters = {}) {
    const response = await apiClient.get('/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  static async getSearchSuggestions(query) {
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query },
    });
    return response.data;
  }
}

export class AffiliateAPI {
  static async getLinks(params = {}) {
    const response = await apiClient.get('/affiliate/links', { params });
    return response.data;
  }

  static async createLink(linkData) {
    const response = await apiClient.post('/affiliate/links', linkData);
    return response.data;
  }

  static async updateLink(id, linkData) {
    const response = await apiClient.patch(`/affiliate/links/${id}`, linkData);
    return response.data;
  }

  static async deleteLink(id) {
    const response = await apiClient.delete(`/affiliate/links/${id}`);
    return response.data;
  }

  static async getStats(params = {}) {
    const response = await apiClient.get('/affiliate/stats', { params });
    return response.data;
  }
}

export class AdminAPI {
  static async getUsers(params = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  }

  static async updateUserRole(userId, roleData) {
    const response = await apiClient.patch(`/admin/users/${userId}/roles`, roleData);
    return response.data;
  }

  static async approvePost(postId, approvalData) {
    const response = await apiClient.patch(`/admin/approvals/${postId}`, approvalData);
    return response.data;
  }

  static async getSystemSettings() {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  }

  static async updateSystemSettings(settings) {
    const response = await apiClient.patch('/admin/settings', settings);
    return response.data;
  }

  static async clearCache() {
    const response = await apiClient.post('/admin/cache/clear');
    return response.data;
  }
}

// Translation API
export class TranslationAPI {
  static async getTranslations(postId) {
    const response = await apiClient.get(`/translations/${postId}`);
    return response.data;
  }

  static async rejectPost(postId, reason) {
    const response = await apiClient.patch(`/admin/approvals/${postId}`, {
      status: 'rejected',
      reason,
    });
    return response.data;
  }
}

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data.message || 'An error occurred',
      errors: data.errors || [],
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: [],
    };
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      errors: [],
    };
  }
};

export const isApiError = (error) => {
  return error && (error.response || error.request || error.message);
};

// Export the main API client for custom requests
export default apiClient;
