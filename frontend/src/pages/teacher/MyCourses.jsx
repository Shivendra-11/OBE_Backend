import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './MyCourses.css';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await teacherAPI.getMyCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path, courseId) => {
    navigate(`${path}?courseId=${courseId}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p>Manage your assigned courses and evaluations</p>
        </div>
      </div>

      {loading ? (
        <Loader size="large" text="Loading your courses..." />
      ) : courses.length === 0 ? (
        <Card className="text-center py-12">
          <h3>No courses assigned</h3>
          <p className="text-secondary mt-2">
            You haven't been assigned to any courses yet.
            Please contact the administrator.
          </p>
        </Card>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <Card key={course._id} className="course-card">
              <div className="course-header">
                <span className="course-code">{course.code}</span>
                <span className="course-semester">Sem {course.semester}</span>
              </div>
              
              <h3 className="course-name">{course.name}</h3>
              
              <div className="course-details">
                <div className="detail-item">
                  <span className="label">Academic Year</span>
                  <span className="value">{course.academicYear}</span>
                </div>
                <div className="detail-item">
                  <span className="label">My Sections</span>
                  <div className="sections-badges">
                    {course.sections && course.sections.length > 0 ? (
                      course.sections.map((sec, idx) => (
                        <span key={idx} className="section-badge">{sec}</span>
                      ))
                    ) : (
                      <span className="text-secondary text-sm">Legacy Assignment</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="course-actions">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => handleNavigate('/teacher/exams', course._id)}
                >
                  📝 Exams
                </Button>
                <div className="action-row">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleNavigate('/teacher/marksheet', course._id)}
                  >
                    📊 Marks
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleNavigate('/teacher/attainment', course._id)}
                  >
                    📈 Attainment
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
