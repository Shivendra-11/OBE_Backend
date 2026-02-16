import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { teacherAPI } from '../../api/teacher.api';
import '../admin/Dashboard.css';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    courses: 0,
    exams: 0,
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await teacherAPI.getMyCourses();
        setCourses(data);
        setStats(prev => ({ ...prev, courses: data.length }));
        
        // Count exams across all courses
        let totalExams = 0;
        for (const course of data) {
          const exams = await teacherAPI.getExamsByCourse(course._id);
          totalExams += exams.length;
        }
        setStats(prev => ({ ...prev, exams: totalExams }));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loader size="large" text="Initialising your dashboard..." />;
  }

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <h1 style={{ 
          background: 'linear-gradient(135deg, var(--primary-600), var(--accent-500))', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontSize: 'var(--text-4xl)',
          fontWeight: '800'
        }}>
          Teacher Excellence Portal
        </h1>
        <p>Strategic Management of Learning Outcomes & Assessments</p>
      </div>

      <div className="dashboard-stats">
        <Card className="stat-card glass">
          <div className="stat-icon" style={{ background: 'var(--primary-100)' }}>📚</div>
          <div className="stat-content">
            <h3>My Assignments</h3>
            <p className="stat-value">{stats.courses}</p>
            <a href="/teacher/courses" className="stat-link">Manage Courses →</a>
          </div>
        </Card>

        <Card className="stat-card glass">
          <div className="stat-icon" style={{ background: 'var(--accent-100)' }}>📝</div>
          <div className="stat-content">
            <h3>Evaluations</h3>
            <p className="stat-value">{stats.exams}</p>
            <a href="/teacher/exams" className="stat-link">Detailed Analytics →</a>
          </div>
        </Card>

        <Card className="stat-card glass">
          <div className="stat-icon" style={{ background: 'var(--success-100)' }}>✍️</div>
          <div className="stat-content">
            <h3>Pending Marks</h3>
            <p className="stat-value">Actionable</p>
            <a href="/teacher/marksheet" className="stat-link">Entry Portal →</a>
          </div>
        </Card>

        <Card className="stat-card glass">
          <div className="stat-icon" style={{ background: 'var(--warning-100)' }}>📈</div>
          <div className="stat-content">
            <h3>OBE Attainment</h3>
            <p className="stat-value">Visionary</p>
            <a href="/teacher/attainment" className="stat-link">Global Impact →</a>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Strategic Actions" className="glass">
          <div className="quick-actions">
            <a href="/teacher/exams" className="action-button">
              <span className="action-icon">📝</span>
              <span>Define Assessment</span>
            </a>
            <a href="/teacher/marksheet" className="action-button">
              <span className="action-icon">✍️</span>
              <span>Evaluation Entry</span>
            </a>
            <a href="/teacher/attainment" className="action-button">
              <span className="action-icon">📊</span>
              <span>Attainment Logic</span>
            </a>
            <a href="/teacher/courses" className="action-button">
              <span className="action-icon">📚</span>
              <span>Academic Portfolio</span>
            </a>
          </div>
        </Card>

        <Card title="My Research & Assignments" className="glass">
          <div className="course-list">
            {courses.length === 0 ? (
              <p className="empty-state">No courses assigned for this session.</p>
            ) : (
              courses.map(course => (
                <div key={course._id} className="course-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--primary-600)' }}>{course.name}</strong>
                    <span className="course-code" style={{ 
                      fontSize: '0.75rem', 
                      background: 'var(--primary-50)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      color: 'var(--primary-700)',
                      fontWeight: '700'
                    }}>
                      {course.code}
                    </span>
                  </div>
                  <div className="course-meta">
                    <span style={{ fontWeight: '500' }}>Session: {course.academicYear}</span>
                    <span style={{ margin: '0 8px', color: 'var(--divider-color)' }}>|</span>
                    <span style={{ fontWeight: '500' }}>Semester: {course.semester}</span>
                    {course.sections && course.sections.length > 0 && (
                      <>
                        <span style={{ margin: '0 8px', color: 'var(--divider-color)' }}>|</span>
                        <span style={{ fontWeight: '500' }}>Sections: {course.sections.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
