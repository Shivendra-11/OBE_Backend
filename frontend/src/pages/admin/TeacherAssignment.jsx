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
  const [selectedCourses, setSelectedCourses] = useState([]); // Array now
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
    if (selectedCourses.length === 1) {
      const course = courses.find(c => c._id === selectedCourses[0]);
      if (course) {
        setCurrentAssignments(course.sectionTeachers || []);
      }
    } else {
      setCurrentAssignments([]);
    }
  }, [selectedCourses, courses]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [coursesData, teachersData] = await Promise.all([
        adminAPI.listCourses(),
        adminAPI.listUsers('teacher')
      ]);
      // Sort courses by academic year desc, then code
      const sortedCourses = [...coursesData].sort((a, b) => {
        if (b.academicYear !== a.academicYear) return b.academicYear.localeCompare(a.academicYear);
        return a.code.localeCompare(b.code);
      });
      setCourses(sortedCourses);
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
    if (selectedCourses.length === 0 || !section || !selectedTeacher) {
      setError('All fields are required');
      return;
    }

    setAssignLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminAPI.assignTeacher({
        courseIds: selectedCourses,
        sections: section.split(',').map(s => s.trim()).filter(Boolean),
        teacherId: selectedTeacher
      });

      setSuccess(`Assignments updated successfully for ${selectedCourses.length} course(s)!`);
      
      const updatedCourses = await adminAPI.listCourses();
      setCourses(updatedCourses);
      setSection('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign teacher');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCourseToggle = (id) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const getTeacherName = (id) => {
    const t = teachers.find(teacher => teacher._id === id);
    return t ? t.name : 'Unknown Teacher';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Strategic Teacher Assignment</h1>
          <p>Multi-course and multi-section deployment control</p>
        </div>
      </div>

      <div className="assignment-grid">
        <div className="assignment-form-container">
          <Card className="glass">
            <h3 className="card-title mb-4">Assignment Portal</h3>
            {loading ? (
               <Loader text="Synchronizing academic records..." />
            ) : (
              <form onSubmit={handleAssign} className="assign-form">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="form-group mb-4">
                  <label className="form-label">Target Courses (Multi-Select)</label>
                  <div className="course-multi-select" style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-color)',
                    padding: '10px',
                    borderRadius: '8px'
                  }}>
                    {courses.map(c => (
                      <div key={c._id} className="course-select-item" style={{ marginBottom: '5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedCourses.includes(c._id)}
                            onChange={() => handleCourseToggle(c._id)}
                            style={{ marginRight: '10px' }}
                          />
                          <span>
                            <strong>{c.code}</strong> - {c.name} 
                            <small style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
                              ({c.academicYear} | Sem {c.semester})
                            </small>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <small className="text-secondary">{selectedCourses.length} courses selected</small>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Deployment Sections (Comma separated)</label>
                  <Input
                    name="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Faculty Member</label>
                  <select
                    className="form-select"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                  >
                    <option value="">-- Select Faculty --</option>
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
                  style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', border: 'none' }}
                >
                  Deploy Assignments
                </Button>
              </form>
            )}
          </Card>
        </div>

        <div className="current-assignments">
          <Card className="glass">
            <h3 className="card-title mb-4">
              Assignment Matrix {selectedCourses.length === 1 ? `for ${courses.find(c => c._id === selectedCourses[0])?.code}` : ''}
            </h3>
            
            {selectedCourses.length !== 1 ? (
              <p className="text-secondary text-center">Select exactly one course to inspect existing assignments</p>
            ) : currentAssignments.length === 0 ? (
              <p className="text-secondary text-center">No active assignments found.</p>
            ) : (
              <div className="assignments-list">
                {currentAssignments.map((assign, idx) => (
                   <div key={idx} className="assignment-item glass" style={{ marginBottom: '10px', padding: '15px', borderRadius: '12px' }}>
                     <div className="assignment-section">
                       <span className="label">Cohort Section</span>
                       <span className="value" style={{ fontWeight: '800', color: 'var(--primary-600)' }}>{assign.section}</span>
                     </div>
                     <div className="assignment-teacher">
                       <span className="label">Assigned Faculty</span>
                       <span className="value" style={{ fontWeight: '600' }}>{getTeacherName(assign.teacher)}</span>
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
