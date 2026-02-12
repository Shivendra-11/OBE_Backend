import api from './axios';

export const adminAPI = {
  // Program Outcomes
  listPOs: async () => {
    const response = await api.get('/admin/po');
    return response.data;
  },

  createPO: async (data) => {
    const response = await api.post('/admin/po', data);
    return response.data;
  },

  createPOBulk: async (pos) => {
    const response = await api.post('/admin/po/bulk', { pos });
    return response.data;
  },

  // Courses
  createCourse: async (data) => {
    const response = await api.post('/admin/course', data);
    return response.data;
  },

  listCourses: async () => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  // User Management
  listUsers: async (role) => {
    const params = role ? { role } : {};
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Course Outcomes
  createCO: async (data) => {
    const response = await api.post('/admin/co', data);
    return response.data;
  },

  createCOBulk: async (courseId, courseCode, cos) => {
    const response = await api.post('/admin/co/bulk', { courseId, courseCode, cos });
    return response.data;
  },

  listCOs: async (courseId) => {
    const response = await api.get(`/admin/co/${courseId}`);
    return response.data;
  },

  // CO-PO Mapping
  mapCOPO: async (data) => {
    const response = await api.post('/admin/map', data);
    return response.data;
  },

  mapCOPOBulk: async (courseId, courseCode, mappings) => {
    const response = await api.post('/admin/map/bulk', { courseId, courseCode, mappings });
    return response.data;
  },

  listMappings: async (courseId) => {
    const params = courseId ? { courseId } : {};
    const response = await api.get('/admin/mappings', { params });
    return response.data;
  },

  // Teacher Assignment
  assignTeacher: async (data) => {
    const response = await api.post('/admin/assign-teacher', data);
    return response.data;
  },

  // Attainment
  getExamCOAttainment: async (examId, section) => {
    const params = section ? { section } : {};
    const response = await api.get(`/admin/exam-co/${examId}`, { params });
    return response.data;
  },

  getCourseAttainment: async (courseId, section, type) => {
    const params = {};
    if (section) params.section = section;
    if (type) params.type = type;
    const response = await api.get(`/admin/course-attainment/${courseId}`, { params });
    return response.data;
  },

  computeCourseOverall: async (courseId) => {
    const response = await api.post(`/admin/course-attainment/${courseId}/compute-overall`);
    return response.data;
  },
};
