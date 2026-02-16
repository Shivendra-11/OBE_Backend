import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal'; // Import Modal
import './MyCourses.css';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  
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

  const openRoster = async (course, section = '') => {
    setSelectedCourse(course);
    setSelectedSection(section || (course.sections?.length === 1 ? course.sections[0] : ''));
    setStudents([]);
    setIsModalOpen(true);
    
    // If we have a definite section or if it's a single section course, fetch immediately
    const effectiveSection = section || (course.sections?.length === 1 ? course.sections[0] : '');
    if (effectiveSection || (!course.sections || course.sections.length === 0)) {
       fetchStudents(course._id, effectiveSection);
    }
  };

  const fetchStudents = async (courseId, section) => {
    setRosterLoading(true);
    try {
      const data = await teacherAPI.getStudents(courseId, section);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Academic Courses</h1>
          <p>Excellence in Outcomes-Based Education</p>
        </div>
      </div>

      {loading ? (
        <Loader size="large" text="Fetching your academic profile..." />
      ) : courses.length === 0 ? (
        <div className="animate-fade-in">
          <Card className="text-center py-20 glass">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
            <h3>No Academic Assignments</h3>
            <p className="text-secondary mt-2">
              You haven't been assigned to any courses for the current academic session.
              Please reach out to the Department Head or Administrator.
            </p>
          </Card>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course, index) => (
            <div key={course._id} className="course-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="course-header">
                <span className="course-code">{course.code}</span>
                <span className="course-semester">Semester {course.semester}</span>
              </div>
              
              <h3 className="course-name">{course.name}</h3>
              
              <div className="course-details">
                <div className="detail-item">
                  <span className="label">Academic Session</span>
                  <span className="value">{course.academicYear}</span>
                </div>
                <div className="detail-item roster-trigger">
                  <span className="label">Student Enrollment</span>
                  <div className="sections-badges clickable">
                    {course.sections && course.sections.length > 0 ? (
                      course.sections.map((sec, idx) => (
                        <span key={idx} className="section-badge roster-link" onClick={() => openRoster(course, sec)}>{sec}</span>
                      ))
                    ) : (
                      <span className="text-secondary text-sm roster-link" onClick={() => openRoster(course)}>View Roster</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="course-actions">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleNavigate('/teacher/exams', course._id)}
                  style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', border: 'none' }}
                >
                  📝 Manage Evaluations
                </Button>
                <div className="action-row">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleNavigate('/teacher/marksheet', course._id)}
                  >
                    📊 Marksheet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleNavigate('/teacher/attainment', course._id)}
                  >
                    📈 Analytics
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Roster Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCourse ? `Enrolled Students: ${selectedCourse.name}` : 'Student Roster'}
      >
        <div className="roster-modal-content">
          {selectedCourse?.sections?.length > 1 && (
            <div className="roster-section-picker glass p-4 mb-4">
              <label className="text-sm font-semibold mb-2 block text-secondary uppercase">Select Assigned Section</label>
              <div className="flex gap-2 flex-wrap">
                {selectedCourse.sections.map((sec) => (
                  <button
                    key={sec}
                    className={`filter-chip ${selectedSection === sec ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSection(sec);
                      fetchStudents(selectedCourse._id, sec);
                    }}
                  >
                    Section {sec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rosterLoading ? (
            <Loader text="Retrieving student data..." />
          ) : students.length > 0 ? (
            <div className="table-wrapper glass">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="roll-no-cell">{student.studentId || 'N/A'}</td>
                      <td className="student-name-cell">{student.name}</td>
                      <td className="student-email-cell">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              {selectedCourse?.sections?.length > 1 && !selectedSection ? (
                <p className="text-secondary">Please select a section to view the roster.</p>
              ) : (
                <p className="text-secondary">No students found for this {selectedSection ? 'section' : 'course'}.</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyCourses;
