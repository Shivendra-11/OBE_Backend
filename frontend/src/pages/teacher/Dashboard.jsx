import Card from '../../components/common/Card';
import '../admin/Dashboard.css';

const TeacherDashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <p>Manage your courses and assessments</p>
      </div>

      <div className="dashboard-stats">
        <Card className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>My Courses</h3>
            <p className="stat-value">-</p>
            <a href="/teacher/courses" className="stat-link">View Courses →</a>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Exams</h3>
            <p className="stat-value">-</p>
            <a href="/teacher/exams" className="stat-link">Manage Exams →</a>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <h3>Marksheets</h3>
            <p className="stat-value">-</p>
            <a href="/teacher/marksheet" className="stat-link">Enter Marks →</a>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Attainment</h3>
            <p className="stat-value">-</p>
            <a href="/teacher/attainment" className="stat-link">Calculate →</a>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Quick Actions">
          <div className="quick-actions">
            <a href="/teacher/exams" className="action-button">
              <span className="action-icon">📝</span>
              <span>Create Exam</span>
            </a>
            <a href="/teacher/marksheet" className="action-button">
              <span className="action-icon">✍️</span>
              <span>Enter Marks</span>
            </a>
            <a href="/teacher/attainment" className="action-button">
              <span className="action-icon">📊</span>
              <span>Calculate CO Attainment</span>
            </a>
            <a href="/teacher/courses" className="action-button">
              <span className="action-icon">📚</span>
              <span>View My Courses</span>
            </a>
          </div>
        </Card>

        <Card title="Getting Started">
          <div className="course-list">
            <div className="course-item">
              <strong>Step 1:</strong> View your assigned courses
            </div>
            <div className="course-item">
              <strong>Step 2:</strong> Create exams with questions
            </div>
            <div className="course-item">
              <strong>Step 3:</strong> Enter student marks
            </div>
            <div className="course-item">
              <strong>Step 4:</strong> Calculate CO attainment
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
