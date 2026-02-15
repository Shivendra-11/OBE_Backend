import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Unauthorized from './pages/Unauthorized';
import Loader from './components/common/Loader';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import ProgramOutcomes from './pages/admin/ProgramOutcomes';
import CourseOutcomes from './pages/admin/CourseOutcomes';
import COPOMapping from './pages/admin/COPOMapping';
import TeacherAssignment from './pages/admin/TeacherAssignment';
import AttainmentReports from './pages/admin/AttainmentReports';
import AIMapping from './pages/admin/AIMapping';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import MyCourses from './pages/teacher/MyCourses';
import ExamManagement from './pages/teacher/ExamManagement';
import Marksheet from './pages/teacher/Marksheet';
import TeacherAttainment from './pages/teacher/AttainmentCalculation';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import MyMarks from './pages/student/MyMarks';
import MyAttainment from './pages/student/MyAttainment';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loader size="large" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader size="large" text="Loading application..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Admin Routes */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/program-outcomes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProgramOutcomes />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/course-outcomes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseOutcomes />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/co-po-mapping"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <COPOMapping />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/teacher-assignment"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TeacherAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/attainment-reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AttainmentReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/ai-mapping"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AIMapping />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/courses"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/exams"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <ExamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/marksheet"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <Marksheet />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/attainment"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherAttainment />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/marks"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                <MyMarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/attainment"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                <MyAttainment />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* Default redirect based on role */}
        <Route path="/" element={<RootRedirect />} />

        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

export default AppRouter;
