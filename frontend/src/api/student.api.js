import api from './axios';

export const studentAPI = {
  // Get my marks
  getMyMarks: async () => {
    const response = await api.get('/student/marks/me');
    return response.data;
  },

  // Get my attainment
  getMyAttainment: async () => {
    const response = await api.get('/student/attainment/me');
    return response.data;
  },
};
