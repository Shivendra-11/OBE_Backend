import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './ExamManagement.css';

const ExamManagement = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const [newExam, setNewExam] = useState({
    name: '',
    type: 'CT1' // Default
  });

  const examTypes = ['PRE_CT', 'CT1', 'CT2', 'CT3', 'PUE', 'ASSIGNMENT', 'OTHER'];

  useEffect(() => {
    if (courseId) {
      fetchExams();
    }
  }, [courseId]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await teacherAPI.getExamsByCourse(courseId);
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await teacherAPI.createExam({
        ...newExam,
        courseId
      });
      setIsModalOpen(false);
      setNewExam({ name: '', type: 'CT1' });
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleManageQuestions = (examId) => {
    // Navigate to Question Management
    // We assume a route /teacher/questions exists or we use a modal here?
    // The plan had QuestionManagement.jsx
    navigate(`/teacher/questions?examId=${examId}`);
  };

  const handleViewMarksheet = (examId) => {
    navigate(`/teacher/marksheet?examId=${examId}`);
  };

  if (!courseId) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          No Course Selected. Please go back to <Button variant="link" onClick={() => navigate('/teacher/courses')}>My Courses</Button> and select a course.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Button variant="outline" onClick={() => navigate('/teacher/courses')} className="mb-2">
            ← Back to Courses
          </Button>
          <h1>Exam Management</h1>
          <p>Create and manage exams for this course</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon="+" variant="primary">
          Create Exam
        </Button>
      </div>

      {loading ? (
        <Loader size="large" text="Loading Exams..." />
      ) : exams.length === 0 ? (
        <Card className="text-center py-12">
          <h3>No Exams Created</h3>
          <p className="text-secondary mt-2">
            Create your first exam relative to this course (CT, Assignment, etc.)
          </p>
          <Button 
            className="mt-4" 
            variant="primary" 
            onClick={() => setIsModalOpen(true)}
          >
            Create Exam
          </Button>
        </Card>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <Card key={exam._id} className="exam-card">
              <div className="exam-header">
                <span className={`exam-type-badge ${exam.type.toLowerCase()}`}>
                  {exam.type}
                </span>
                <span className="exam-date">
                  {new Date(exam.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="exam-name">{exam.name}</h3>
              
              <div className="exam-actions">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => handleManageQuestions(exam._id)}
                >
                  📝 Manage Questions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewMarksheet(exam._id)}
                >
                  📊 Marksheet
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exam"
      >
        <form onSubmit={handleCreateExam} className="create-exam-form">
          {error && <div className="form-error">{error}</div>}
          
          <Input
            label="Exam Name"
            name="name"
            value={newExam.name}
            onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
            placeholder="e.g. Class Test 1"
            required
            autoFocus
          />
          
          <div className="form-group">
            <label className="form-label">Exam Type</label>
            <select
              className="form-select"
              value={newExam.type}
              onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}
              required
            >
              {examTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createLoading}>
              Create Exam
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamManagement;
