import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
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
  const [success, setSuccess] = useState('');

  const [newQuestion, setNewQuestion] = useState({
    CO: '',
    maxMarks: '',
    description: ''
  });

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherAPI.getExamDetails(examId);
      setExam(data.exam);
      setQuestions(data.questions);

      // Fetch COs for this course
      if (data.exam && data.exam.course) {
        // Use the course ID from the populated course object
        // Handle both object and string just in case
        const courseId = typeof data.exam.course === 'object' ? data.exam.course._id : data.exam.course;
        const cosData = await teacherAPI.getCourseCOs(courseId);
        setCos(cosData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.CO || !newQuestion.maxMarks) {
      setError('Please select a CO and enter max marks');
      return;
    }

    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      await teacherAPI.createQuestion({
        examId,
        CO: Number(newQuestion.CO),
        maxMarks: Number(newQuestion.maxMarks),
        description: newQuestion.description
      });
      
      setSuccess('Question added successfully!');
      
      // Refresh questions
      const data = await teacherAPI.getExamDetails(examId);
      setQuestions(data.questions);
      
      // Reset form
      setNewQuestion({ CO: '', maxMarks: '', description: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question? Associated marks will also be removed.')) return;
    
    setError('');
    try {
      await teacherAPI.deleteQuestion(id);
      setSuccess('Question deleted');
      
      // Refresh
      const data = await teacherAPI.getExamDetails(examId);
      setQuestions(data.questions);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  };

  const getCODescription = (coNumber) => {
    const co = cos.find(c => c.number === coNumber);
    return co ? co.description : '';
  };

  if (!examId) {
     return (
       <div className="page-container">
         <Card className="text-center py-10">
           <h2>Invalid Exam Context</h2>
           <p className="mb-6">Please navigate back to courses to select an exam.</p>
           <Button onClick={() => navigate('/teacher/courses')}>Go to My Courses</Button>
         </Card>
       </div>
     );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
           {exam && (
             <Button 
               variant="outline" 
               onClick={() => navigate(`/teacher/exams/${exam.course._id || exam.course}`)} 
               className="mb-2"
             >
               ← Back to Exams
             </Button>
           )}
           <h1>Manage Questions</h1>
           <div className="header-meta">
             <span className="exam-type-badge-large">{exam?.type}</span>
             <span className="exam-course-info">{exam ? `${exam.name} - ${exam.course.code}` : 'Loading...'}</span>
           </div>
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
        <Loader size="large" text="Syncing question inventory..." />
      ) : (
        <div className="questions-layout">
          {/* Question List */}
          <div className="questions-list-section">
             <Card className="glass questions-card">
               <div className="card-header-flex">
                 <h3>Established Questions</h3>
                 {success && <div className="inline-success">{success}</div>}
               </div>
               
               {questions.length === 0 ? (
                 <div className="empty-questions">
                   <div className="empty-icon">📂</div>
                   <p>No questions have been defined for this evaluation.</p>
                   <p className="text-sm">Use the form on the right to begin adding questions.</p>
                 </div>
               ) : (
                 <div className="question-items">
                   {questions.map((q, idx) => (
                     <div key={q._id} className="question-item-v2">
                       <div className="q-main">
                         <div className="q-index">Q{idx + 1}</div>
                         <div className="q-info">
                           <div className="q-core-info">
                             <span className="q-co-tag">CO{q.CO}</span>
                             <span className="q-marks-tag">{q.maxMarks} Marks</span>
                           </div>
                           {q.description && <p className="q-text-desc">{q.description}</p>}
                           <p className="q-co-desc">{getCODescription(q.CO)}</p>
                         </div>
                       </div>
                       <button 
                         className="q-delete-action"
                         onClick={() => handleDeleteQuestion(q._id)}
                         title="Delete Question"
                       >
                         🗑️
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </Card>
          </div>

          {/* Add Question Form */}
          <div className="add-question-section">
            <Card className="sticky-card-v2 glass">
              <h3>Add New Question</h3>
              <p className="text-sm text-secondary mb-4">Questions are automatically indexed in the order they are added.</p>
              
              <form onSubmit={handleAddQuestion} className="add-question-form">
                {error && <div className="form-error mb-4">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">Mapped Course Outcome</label>
                  <select
                    className="form-select"
                    value={newQuestion.CO}
                    onChange={(e) => setNewQuestion({ ...newQuestion, CO: e.target.value })}
                    required
                  >
                    <option value="">-- Choose CO --</option>
                    {cos.map(co => (
                      <option key={co._id} value={co.number}>
                        CO{co.number}: {co.description.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Awardable Marks</label>
                  <Input
                    type="number"
                    value={newQuestion.maxMarks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, maxMarks: e.target.value })}
                    placeholder="Enter value (e.g. 10)"
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text / Description</label>
                  <textarea
                    className="form-select"
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                    placeholder="e.g. Briefly describe the steps of the BFS algorithm..."
                    rows="3"
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>

                <Button variant="primary" type="submit" loading={createLoading} className="w-full mt-2">
                  Add to Exam
                </Button>
              </form>
            </Card>
            
            <div className="quick-help glass">
               <h4>Quick Tips</h4>
               <ul>
                 <li>Questions are linked to COs for attainment logic.</li>
                 <li>Total marks should match the exam's intended max marks.</li>
                 <li>Deleting a question will remove all student marks for it.</li>
               </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
