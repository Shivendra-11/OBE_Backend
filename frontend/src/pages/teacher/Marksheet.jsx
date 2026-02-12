import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './Marksheet.css';

const Marksheet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');
  const courseIdParam = searchParams.get('courseId');
  const navigate = useNavigate();

  const [examId, setExamId] = useState(examIdParam || '');
  const [exams, setExams] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Marks state: { studentId: { questionId: value } }
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (examId) {
      fetchMarksheet();
    } else if (courseIdParam) {
      fetchExams();
    }
  }, [examId, courseIdParam]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const result = await teacherAPI.getExamsByCourse(courseIdParam);
      setExams(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarksheet = async () => {
    setLoading(true);
    try {
      const result = await teacherAPI.getExamMarksheet(examId);
      setData(result);
      
      // Initialize marks state from result
      const initialMarks = {};
      result.students.forEach(student => {
        initialMarks[student.studentId] = { ...student.marks };
      });
      setMarks(initialMarks);
    } catch (err) {
      console.error('Error fetching marksheet:', err);
      setError('Failed to load marksheet');
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = (id) => {
    setExamId(id);
    setSearchParams({ examId: id }); // Update URL
  };

  const handleMarkChange = (studentId, questionId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [questionId]: value
      }
    }));
    setSuccess(''); 
  };

  const calculateStudentTotal = (studentId) => {
    const studentMarks = marks[studentId] || {};
    return Object.values(studentMarks).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Transform state to payload
      // entries: [{ studentId, marks: { qId: val } }]
      const entries = Object.entries(marks).map(([studentId, studentMarks]) => ({
        studentId,
        marks: studentMarks
      }));

      await teacherAPI.submitExamMarksheet(examId, entries);
      setSuccess('Marks saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await teacherAPI.calculateExamCO(examId);
      setSuccess('Attainment calculated successfully! Check Reports.');
    } catch (err) {
      setError('Failed to calculate attainment');
    } finally {
      setCalculating(false);
    }
  };

  if (!examId && !courseIdParam) {
    return <div className="p-4">No Exam or Course Selected</div>;
  }

  // Exam Selection View
  if (!examId && exams.length > 0) {
    return (
      <div className="page-container">
        <div className="page-header">
           <Button variant="outline" onClick={() => navigate('/teacher/courses')}>
             ← Back to Courses
           </Button>
           <h1>Select Exam to Grade</h1>
        </div>
        <div className="exams-list-card">
           <Card>
             <h3>Available Exams</h3>
             <ul className="exam-list">
               {exams.map(exam => (
                 <li key={exam._id} className="exam-list-item">
                   <div className="exam-info">
                     <span className="font-bold">{exam.name}</span>
                     <span className="text-secondary text-sm ml-2">({exam.type})</span>
                   </div>
                   <Button onClick={() => handleExamSelect(exam._id)}>
                     Select
                   </Button>
                 </li>
               ))}
             </ul>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
           {data && (
             <Button 
               variant="outline" 
               onClick={() => {
                 setExamId(''); // Clear to go back to list
                 setSearchParams({ courseId: data.course.id });
               }} 
               className="mb-2"
             >
               ← Back to Exam List
             </Button>
           )}
           <h1>Marksheet</h1>
           <p>{data ? `${data.exam.name} - ${data.course.code}` : 'Loading...'}</p>
        </div>
        <div className="header-actions">
           <Button 
             onClick={handleCalculate} 
             variant="outline"
             loading={calculating}
             disabled={loading}
           >
             ⚡ Calculate Attainment
           </Button>
           <Button 
             onClick={handleSave} 
             variant="primary" 
             loading={saving}
             icon="💾"
             disabled={loading}
           >
             Save Marks
           </Button>
        </div>
      </div>

      {loading ? (
        <Loader size="large" text="Loading Marksheet..." />
      ) : data ? (
        <>
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          {success && <div className="alert alert-success mb-4">{success}</div>}

          <Card className="marksheet-card">
            <div className="table-responsive">
              <table className="marksheet-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Student</th>
                    {data.questions.map((q, idx) => (
                      <th key={q._id} className="text-center">
                        <div className="q-header">
                          <span>Q{idx + 1}</span>
                          <span className="q-meta">CO{q.CO}</span>
                          <span className="q-meta">({q.maxMarks})</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.length > 0 ? (
                    data.students.map((student) => (
                      <tr key={student.studentId}>
                        <td className="sticky-col">
                          <div className="student-info">
                            <span className="student-name">{student.name}</span>
                            <span className="student-email">{student.email}</span>
                          </div>
                        </td>
                        {data.questions.map((q) => {
                          const val = marks[student.studentId]?.[q._id];
                          const displayVal = val !== undefined && val !== null ? val : '';
                          return (
                            <td key={q._id}>
                              <input
                                type="number"
                                className="mark-input"
                                value={displayVal}
                                onChange={(e) => handleMarkChange(student.studentId, q._id, e.target.value)}
                                min="0"
                                max={q.maxMarks}
                                onWheel={(e) => e.target.blur()} // Prevent scroll change
                              />
                            </td>
                          );
                        })}
                        <td className="text-center font-bold">
                          {calculateStudentTotal(student.studentId)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={data.questions.length + 1} className="text-center py-8">
                        No students found in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="text-center py-8 text-secondary">Marksheet data unavailable</div>
      )}
    </div>
  );
};

export default Marksheet;
