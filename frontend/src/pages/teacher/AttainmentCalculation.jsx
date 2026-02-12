import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './TeacherAttainment.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TeacherAttainment = () => {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [section, setSection] = useState('');
  const [attainmentData, setAttainmentData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [computeLoading, setComputeLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (courseIdParam) {
      fetchCourseAndSections();
    }
  }, [courseIdParam]);

  useEffect(() => {
    if (course && (section || (course.sections && course.sections.length === 1))) {
      fetchAttainment();
    }
  }, [course, section]);

  const fetchCourseAndSections = async () => {
    setLoading(true);
    try {
      const courses = await teacherAPI.getMyCourses();
      const currentCourse = courses.find(c => c._id === courseIdParam);
      
      if (currentCourse) {
        setCourse(currentCourse);
        // Auto-select section if only one
        if (currentCourse.sections && currentCourse.sections.length === 1) {
          setSection(currentCourse.sections[0]);
        }
      } else {
        setError('Course not found in your assignments');
      }
    } catch (err) {
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttainment = async () => {
    // Logic: If multiple sections, wait for selection.
    if (course.sections && course.sections.length > 1 && !section) return;

    // Use selected section or legacy marker or the single section
    const secToUse = section || (course.sections && course.sections.length === 1 ? course.sections[0] : null);

    setLoading(true);
    try {
      const data = await teacherAPI.getCourseAttainment(course._id, secToUse);
      setAttainmentData(data);
    } catch (err) {
      console.error(err);
      // Don't show error if it's just "no data yet"
    } finally {
      setLoading(false);
    }
  };

  const handleCompute = async () => {
    setComputeLoading(true);
    setNotification('');
    try {
      const secToUse = section || (course.sections && course.sections.length === 1 ? course.sections[0] : null);
      
      // We need to run calculation sequence: CT_FINAL -> ASSIGNMENT_FINAL -> OVERALL
      await teacherAPI.calculateCTFinal(course._id, secToUse);
      await teacherAPI.calculateAssignmentFinal(course._id, secToUse);
      await teacherAPI.calculateOverall(course._id, secToUse);

      setNotification('Calculations complete! Refreshing data...');
      fetchAttainment();
    } catch (err) {
      setNotification('Failed to compute attainment. Ensure all marks are entered.');
    } finally {
      setComputeLoading(false);
    }
  };

  // Chart
  const getChartData = () => {
    if (!attainmentData || !attainmentData.data) return null;
    
    // Filter for CO type
    const coRecords = attainmentData.data.filter(d => d.type === 'CO').sort((a,b) => a.CO - b.CO);
    if (coRecords.length === 0) return null;

    const labels = coRecords.map(d => `CO${d.CO}`);
    const data = coRecords.map(d => d.percentage);
    
    return {
      labels,
      datasets: [
        {
          label: 'Attainment %',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  if (!courseIdParam) return <div className="p-4">No Course Selected</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
           <Button variant="outline" onClick={() => navigate('/teacher/courses')} className="mb-2">
             ← Back to Courses
           </Button>
           <h1>Attainment & Analytics</h1>
           <p>{course ? `${course.code} - ${course.name}` : 'Loading...'}</p>
        </div>
        <div>
           <Button 
             onClick={handleCompute} 
             variant="primary" 
             loading={computeLoading}
             icon="⚡"
             disabled={!attainmentData}
           >
             Compute Overall
           </Button>
        </div>
      </div>

      {notification && <div className="alert alert-info mb-4">{notification}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Section Selector if multiple */}
      {course && course.sections && course.sections.length > 1 && (
        <Card className="mb-6">
          <label className="form-label">Select Section:</label>
          <select 
            className="form-select"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">-- Select Section --</option>
            {course.sections.map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </Card>
      )}

      {loading ? (
        <Loader size="large" text="Analying Attainment..." />
      ) : attainmentData && attainmentData.data && attainmentData.data.length > 0 ? (
         <div className="reports-grid">
           <Card className="chart-card">
              <h3>CO Attainment Levels</h3>
              {getChartData() ? (
                <Bar options={{ responsive: true, scales: { y: { min: 0, max: 100 } } }} data={getChartData()} />
              ) : (
                <p className="text-center py-4">No CO data calculated yet.</p>
              )}
           </Card>

           <Card className="stats-card">
              <h3>Final Attainment</h3>
              <div className="stats-list">
                 {attainmentData.data.filter(d => ['CT_FINAL', 'ASSIGNMENT_FINAL', 'OVERALL'].includes(d.type)).map(d => (
                   <div key={d.type} className={`stat-box ${d.type}`}>
                      <span className="label">{d.type.replace('_', ' ')}</span>
                      <span className="value">{d.level}</span>
                      <span className="percentage">({d.percentage.toFixed(1)}%)</span>
                   </div>
                 ))}
                 {attainmentData.data.filter(d => ['CT_FINAL', 'ASSIGNMENT_FINAL', 'OVERALL'].includes(d.type)).length === 0 && (
                   <p className="text-secondary">Overall attainment not calculated.</p>
                 )}
              </div>
           </Card>
         </div>
      ) : (
        <Card className="text-center py-8">
          <h3>No Attainment Data Found</h3>
          <p className="text-secondary mt-2">
            Ensures exams are created, marks are entered, and "Calculate Attainment" is clicked in the Marksheet.
            Then click "Compute Overall" here.
          </p>
        </Card>
      )}
    </div>
  );
};

export default TeacherAttainment;
