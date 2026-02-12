import api from './axios';

export const authAPI = {
  // Student signup
  signup: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Admin: Create user with specific role
  createUser: async (userData) => {
    const response = await api.post('/auth/create', userData);
    return response.data;
  },

  // Admin: Bulk create users
  createBulkUsers: async (users) => {
    const response = await api.post('/auth/create-bulk', { users });
    return response.data;
  },
};
