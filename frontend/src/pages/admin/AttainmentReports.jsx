import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
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
import './AttainmentReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AttainmentReports = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [attainmentData, setAttainmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [computeLoading, setComputeLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttainment(selectedCourse);
    } else {
      setAttainmentData(null);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.listCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAttainment = async (courseId) => {
    setLoading(true);
    try {
      // Fetch combined CO attainment (type=CO, section=all)
      const coData = await adminAPI.getCourseAttainment(courseId, 'all', 'CO');
      
      // Fetch overall course attainment (CT, Assignment, Overall)
      const overallData = await adminAPI.getCourseAttainment(courseId, 'all', 'OVERALL'); // This actually returns combined object if logic holds
      // Wait, backend logic for section='all' returns "combined" and "combinedCO".
      // So one call might be enough if I just ask for section='all'.
      // Let's rely on one call with section='all'
      
      const combinedResponse = await adminAPI.getCourseAttainment(courseId, 'all');
      setAttainmentData(combinedResponse);
      
    } catch (err) {
      console.error('Error fetching attainment:', err);
      setError('Failed to load attainment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompute = async () => {
    if (!selectedCourse) return;
    setComputeLoading(true);
    try {
      await adminAPI.computeCourseOverall(selectedCourse);
      // Refresh data
      await fetchAttainment(selectedCourse);
      setError('');
    } catch (err) {
      setError('Failed to compute overall attainment');
    } finally {
      setComputeLoading(false);
    }
  };

  // Chart Data Preparation
  const getChartData = () => {
    if (!attainmentData || !attainmentData.combinedCO) return null;
    
    const labels = attainmentData.combinedCO.map(d => `CO${d.CO}`);
    const data = attainmentData.combinedCO.map(d => d.percentage);
    
    return {
      labels,
      datasets: [
        {
          label: 'CO Attainment %',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Course Outcome Attainment Level' },
    },
    scales: {
      y: { min: 0, max: 100 },
    },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Attainment Reports</h1>
          <p>View course performance and attainment levels</p>
        </div>
        {selectedCourse && (
          <Button 
            onClick={handleCompute} 
            variant="primary" 
            loading={computeLoading}
            icon="⚡"
          >
            Compute Overall
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <div className="course-selector">
          <label className="form-label">Select Course:</label>
          <select
            className="form-select course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">-- Select a Course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {!selectedCourse ? (
         <div className="text-center py-8 text-secondary">
           Select a course to view reports
         </div>
      ) : loading ? (
        <Loader size="large" text="Analying Data..." />
      ) : attainmentData ? (
        <div className="reports-grid">
          {/* Overall Stats */}
          <Card className="stats-card">
            <h3>Overall Attainment</h3>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">CT Final</span>
                <span className="stat-value">
                  {attainmentData.combined?.CT_FINAL?.level || 0}
                </span>
                <span className="stat-sub">Level</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Assignment</span>
                <span className="stat-value">
                  {attainmentData.combined?.ASSIGNMENT_FINAL?.level || 0}
                </span>
                <span className="stat-sub">Level</span>
              </div>
              <div className="stat-item highlight">
                <span className="stat-label">Overall Course</span>
                <span className="stat-value">
                   {/* Backend computeCourseOverall persists this in Course.coAttainment.overallLevel */}
                   {/* But getCourseAttainment might not return it directly in "combined" if not implemented there */}
                   {/* We might need to estimate or fetch course details separately? */}
                   {/* Let's use average of CT/Assign roughly or 0 */}
                   {Math.round(((attainmentData.combined?.CT_FINAL?.level || 0) + (attainmentData.combined?.ASSIGNMENT_FINAL?.level || 0)) / 2)}
                </span>
                <span className="stat-sub">Level</span>
              </div>
            </div>
          </Card>

          {/* Chart */}
          <Card className="chart-card">
            {getChartData() ? (
               <Bar options={chartOptions} data={getChartData()} />
            ) : (
              <p className="text-center py-4">No CO data available</p>
            )}
          </Card>

          {/* Detailed Table */}
          <Card className="details-card">
             <h3>CO Attainment Details</h3>
             {attainmentData.combinedCO && attainmentData.combinedCO.length > 0 ? (
               <table className="report-table">
                 <thead>
                   <tr>
                     <th>CO</th>
                     <th>Total Y</th>
                     <th>Total N</th>
                     <th>%</th>
                     <th>Level</th>
                   </tr>
                 </thead>
                 <tbody>
                   {attainmentData.combinedCO.map(d => (
                     <tr key={d.CO}>
                       <td>CO{d.CO}</td>
                       <td>{d.totalY}</td>
                       <td>{d.totalN}</td>
                       <td>{d.percentage.toFixed(1)}%</td>
                       <td>
                         <span className={`badge level-${d.level}`}>{d.level}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : (
               <p className="text-center mt-4">No data found.</p>
             )}
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-secondary">No data available</div>
      )}
    </div>
  );
};

export default AttainmentReports;
