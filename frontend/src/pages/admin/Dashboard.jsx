import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/admin.api';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './Dashboard.css';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.listCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader size="large" text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your OBE system</p>
      </div>

      <div className="dashboard-stats">
        <Card className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Users</h3>
            <p className="stat-value">-</p>
            <Link to="/admin/users" className="stat-link">Manage Users →</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Courses</h3>
            <p className="stat-value">{courses.length}</p>
            <Link to="/admin/courses" className="stat-link">Manage Courses →</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Program Outcomes</h3>
            <p className="stat-value">-</p>
            <Link to="/admin/program-outcomes" className="stat-link">Manage POs →</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Attainment Reports</h3>
            <p className="stat-value">-</p>
            <Link to="/admin/attainment-reports" className="stat-link">View Reports →</Link>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Quick Actions">
          <div className="quick-actions">
            <Link to="/admin/users" className="action-button">
              <span className="action-icon">👤</span>
              <span>Create User</span>
            </Link>
            <Link to="/admin/courses" className="action-button">
              <span className="action-icon">📚</span>
              <span>Create Course</span>
            </Link>
            <Link to="/admin/program-outcomes" className="action-button">
              <span className="action-icon">🎯</span>
              <span>Add Program Outcome</span>
            </Link>
            <Link to="/admin/teacher-assignment" className="action-button">
              <span className="action-icon">👨‍🏫</span>
              <span>Assign Teacher</span>
            </Link>
          </div>
        </Card>

        <Card title="Recent Courses">
          {courses.length > 0 ? (
            <div className="course-list">
              {courses.slice(0, 5).map((course) => (
                <div key={course._id} className="course-item">
                  <div>
                    <strong>{course.code}</strong> - {course.name}
                  </div>
                  <div className="course-meta">
                    Semester {course.semester} | {course.academicYear}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No courses yet. Create your first course!</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
