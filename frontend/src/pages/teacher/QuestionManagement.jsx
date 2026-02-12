import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './QuestionManagement.css';

const QuestionManagement = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [cos, setCos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const [newQuestion, setNewQuestion] = useState({
    CO: '',
    maxMarks: ''
  });

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await teacherAPI.getExamDetails(examId);
      setExam(data.exam);
      setQuestions(data.questions);

      // Fetch COs for this course
      if (data.exam && data.exam.course) {
        const cosData = await adminAPI.listCOs(data.exam.course._id);
        setCos(cosData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.CO || !newQuestion.maxMarks) {
      setError('Please fill all fields');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      await teacherAPI.createQuestion({
        examId,
        CO: Number(newQuestion.CO),
        maxMarks: Number(newQuestion.maxMarks)
      });
      
      // Refresh questions
      const data = await teacherAPI.getExamDetails(examId);
      setQuestions(data.questions);
      
      // Reset form
      setNewQuestion({ CO: '', maxMarks: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question? Associated marks will also be deleted.')) return;
    try {
      await teacherAPI.deleteQuestion(id);
      // Refresh
      const data = await teacherAPI.getExamDetails(examId);
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  };

  if (!examId) {
     return <div className="p-4">Invalid Exam ID</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
           {exam && (
             <Button variant="outline" onClick={() => navigate(`/teacher/exams?courseId=${exam.course._id}`)} className="mb-2">
               ← Back to Exams
             </Button>
           )}
           <h1>Question Management</h1>
           <p>{exam ? `${exam.name} (${exam.course.code})` : 'Loading...'}</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
             Total Marks: <strong>{calculateTotalMarks()}</strong>
          </div>
          <div className="stat-badge">
             Questions: <strong>{questions.length}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader size="large" text="Loading Questions..." />
      ) : (
        <div className="questions-layout">
          {/* Question List */}
          <div className="questions-list-section">
             <Card>
               <h3>Questions</h3>
               {questions.length === 0 ? (
                 <p className="text-secondary text-center py-4">No questions added yet.</p>
               ) : (
                 <div className="question-items">
                   {questions.map((q, idx) => (
                     <div key={q._id} className="question-item">
                       <div className="q-content">
                         <div className="q-number">Q{idx + 1}</div>
                         <div className="q-details">
                           <span className="q-co">CO{q.CO}</span>
                           <span className="q-marks">{q.maxMarks} Marks</span>
                         </div>
                       </div>
                       <Button 
                         variant="danger" 
                         className="delete-btn"
                         onClick={() => handleDeleteQuestion(q._id)}
                       >
                         🗑️
                       </Button>
                     </div>
                   ))}
                 </div>
               )}
             </Card>
          </div>

          {/* Add Question Form */}
          <div className="add-question-section">
            <Card className="sticky-card">
              <h3>Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="add-question-form">
                {error && <div className="form-error">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">Course Outcome (CO)</label>
                  <select
                    className="form-select"
                    value={newQuestion.CO}
                    onChange={(e) => setNewQuestion({ ...newQuestion, CO: e.target.value })}
                    required
                  >
                    <option value="">-- Select CO --</option>
                    {cos.map(co => (
                      <option key={co._id} value={co.number}>
                        CO{co.number} - {co.description.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <Input
                    type="number"
                    value={newQuestion.maxMarks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, maxMarks: e.target.value })}
                    placeholder="e.g. 5"
                    required
                    min="1"
                  />
                </div>

                <Button variant="primary" type="submit" loading={createLoading} className="w-full">
                  Add Question
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
