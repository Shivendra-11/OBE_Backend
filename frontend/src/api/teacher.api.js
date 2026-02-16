import api from './axios';

export const teacherAPI = {
  // Courses
  getMyCourses: async () => {
    const response = await api.get('/teacher/courses');
    return response.data;
  },

  // Exams
  getExamsByCourse: async (courseId) => {
    const response = await api.get(`/teacher/exams/${courseId}`);
    return response.data;
  },

  getExamDetails: async (examId) => {
    const response = await api.get(`/teacher/exam/${examId}`);
    return response.data;
  },

  createExam: async (data) => {
    const response = await api.post('/teacher/exam', data);
    return response.data;
  },

  createExamWithQuestions: async (data) => {
    const response = await api.post('/teacher/exam-with-questions', data);
    return response.data;
  },

  // Questions
  createQuestion: async (data) => {
    const response = await api.post('/teacher/question', data);
    return response.data;
  },

  createQuestionBulk: async (examId, questions) => {
    const response = await api.post('/teacher/question/bulk', { examId, questions });
    return response.data;
  },

  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/teacher/question/${questionId}`);
    return response.data;
  },

  // Marks
  enterMarks: async (marks, section) => {
    const params = section ? { section } : {};
    const response = await api.post('/teacher/marks', marks, { params });
    return response.data;
  },

  // Marksheet
  getExamMarksheet: async (examId, section) => {
    const params = section ? { section } : {};
    const response = await api.get(`/teacher/marksheet/${examId}`, { params });
    return response.data;
  },

  submitExamMarksheet: async (examId, entries, section) => {
    const params = section ? { section } : {};
    const response = await api.post(`/teacher/marksheet/${examId}`, { entries }, { params });
    return response.data;
  },

  // Attainment Calculation
  calculateExamCO: async (examId, section) => {
    const params = section ? { section } : {};
    const response = await api.post(`/teacher/exam-co/${examId}`, {}, { params });
    return response.data;
  },

  getExamCOAttainment: async (examId, section) => {
    const params = section ? { section } : {};
    const response = await api.get(`/teacher/exam-co/${examId}`, { params });
    return response.data;
  },

  calculateCTFinal: async (courseId, section) => {
    const params = section ? { section } : {};
    const response = await api.post(`/teacher/ct-final/${courseId}`, {}, { params });
    return response.data;
  },

  calculateAssignmentFinal: async (courseId, section) => {
    const params = section ? { section } : {};
    const response = await api.post(`/teacher/assignment-final/${courseId}`, {}, { params });
    return response.data;
  },

  calculateOverall: async (courseId, section) => {
    const params = section ? { section } : {};
    const response = await api.post(`/teacher/overall/${courseId}`, {}, { params });
    return response.data;
  },

  getCourseAttainment: async (courseId, section, type) => {
    const params = {};
    if (section) params.section = section;
    if (type) params.type = type;
    const response = await api.get(`/teacher/course-attainment/${courseId}`, { params });
    return response.data;
  },

  getStudents: async (courseId, section) => {
    const params = { courseId };
    if (section) params.section = section;
    const response = await api.get('/teacher/students', { params });
    return response.data;
  },
  
  getCourseCOs: async (courseId) => {
    const response = await api.get(`/teacher/course-cos/${courseId}`);
    return response.data;
  },
};
