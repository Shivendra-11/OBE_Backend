import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './TeacherAssignment.css';

const TeacherAssignment = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [section, setSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Course details for display (current assignments)
  const [currentAssignments, setCurrentAssignments] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const course = courses.find(c => c._id === selectedCourse);
      if (course) {
        setCurrentAssignments(course.sectionTeachers || []);
      }
    } else {
      setCurrentAssignments([]);
    }
  }, [selectedCourse, courses]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [coursesData, teachersData] = await Promise.all([
        adminAPI.listCourses(),
        adminAPI.listUsers('teacher')
      ]);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load courses or teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !section || !selectedTeacher) {
      setError('All fields are required');
      return;
    }

    setAssignLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminAPI.assignTeacher({
        courseId: selectedCourse,
        section: section,
        teacherId: selectedTeacher
      });

      setSuccess('Teacher assigned successfully!');
      
      // refresh course list to update assignments view
      const updatedCourses = await adminAPI.listCourses();
      setCourses(updatedCourses);
      
      // Clear section selection but keep course/teacher for rapid entry?
      // Better to clear section to avoid accidental overwrite
      setSection('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign teacher');
    } finally {
      setAssignLoading(false);
    }
  };

  const getTeacherName = (id) => {
    const t = teachers.find(teacher => teacher._id === id);
    return t ? t.name : 'Unknown Teacher';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Teacher Assignment</h1>
          <p>Assign teachers to specific course sections</p>
        </div>
      </div>

      <div className="assignment-grid">
        {/* Assignment Form */}
        <div className="assignment-form-container">
          <Card>
            <h3 className="card-title mb-4">Assign Teacher</h3>
            {loading ? (
               <Loader text="Loading data..." />
            ) : (
              <form onSubmit={handleAssign} className="assign-form">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    required
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Section</label>
                  <Input
                    name="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Teacher</label>
                  <select
                    className="form-select"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  loading={assignLoading}
                  className="w-full mt-4"
                >
                  Assign Teacher
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Current Assignments Display */}
        <div className="current-assignments">
          <Card>
            <h3 className="card-title mb-4">
              Current Assignments {selectedCourse ? `for ${courses.find(c => c._id === selectedCourse)?.code}` : ''}
            </h3>
            
            {!selectedCourse ? (
              <p className="text-secondary text-center">Select a course to view assignments</p>
            ) : currentAssignments.length === 0 ? (
              <p className="text-secondary text-center">No teachers assigned yet.</p>
            ) : (
              <div className="assignments-list">
                {currentAssignments.map((assign, idx) => (
                   <div key={idx} className="assignment-item">
                     <div className="assignment-section">
                       <span className="label">Section</span>
                       <span className="value">{assign.section}</span>
                     </div>
                     <div className="assignment-teacher">
                       <span className="label">Teacher</span>
                       <span className="value">{getTeacherName(assign.teacher)}</span>
                     </div>
                   </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignment;
