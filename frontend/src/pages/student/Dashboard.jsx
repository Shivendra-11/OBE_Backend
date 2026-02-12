import { useState, useEffect } from 'react';
import { studentAPI } from '../../api/student.api';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import '../admin/Dashboard.css';

const StudentDashboard = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const data = await studentAPI.getMyMarks();
      setMarks(data);
    } catch (error) {
      console.error('Error fetching marks:', error);
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
        <h1>Student Dashboard</h1>
        <p>Track your academic performance</p>
      </div>

      <div className="dashboard-stats">
        <Card className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>My Courses</h3>
            <p className="stat-value">-</p>
            <span className="stat-link">Enrolled Courses</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Marks</h3>
            <p className="stat-value">{marks.length}</p>
            <a href="/student/marks" className="stat-link">View All Marks →</a>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Attainment</h3>
            <p className="stat-value">-</p>
            <a href="/student/attainment" className="stat-link">View Attainment →</a>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Performance</h3>
            <p className="stat-value">-</p>
            <span className="stat-link">Overall Status</span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Quick Links">
          <div className="quick-actions">
            <a href="/student/marks" className="action-button">
              <span className="action-icon">📝</span>
              <span>View My Marks</span>
            </a>
            <a href="/student/attainment" className="action-button">
              <span className="action-icon">📈</span>
              <span>View Attainment</span>
            </a>
          </div>
        </Card>

        <Card title="Recent Activity">
          {marks.length > 0 ? (
            <div className="course-list">
              {marks.slice(0, 5).map((mark, index) => (
                <div key={index} className="course-item">
                  <div>
                    <strong>{mark.question?.exam?.name || 'Exam'}</strong>
                  </div>
                  <div className="course-meta">
                    Marks: {mark.marksObtained} / {mark.question?.maxMarks}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No marks recorded yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
