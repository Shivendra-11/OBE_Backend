import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './CourseManagement.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    semester: '',
    academicYear: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.listCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewCourse({ ...newCourse, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await adminAPI.createCourse(newCourse);
      setIsModalOpen(false);
      setNewCourse({
        code: '',
        name: '',
        semester: '',
        academicYear: ''
      });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Course Management</h1>
          <p>Manage courses and curriculum details</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon="+" variant="primary">
          Create Course
        </Button>
      </div>

      {loading ? (
        <Loader size="large" text="Loading Courses..." />
      ) : (
        <Card className="course-list-card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Semester</th>
                  <th>Academic Year</th>
                  <th>Evaluated</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <span className="course-code-badge">{course.code}</span>
                      </td>
                      <td className="font-medium">{course.name}</td>
                      <td>{course.semester}</td>
                      <td>{course.academicYear}</td>
                      <td>
                        {/* Placeholder for evaluation status or teacher assignment count */}
                        <span className="text-secondary text-sm">
                          {course.sectionTeachers?.length || 0} Sec(s)
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className="create-course-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-row">
            <Input
              label="Course Code"
              name="code"
              value={newCourse.code}
              onChange={handleInputChange}
              placeholder="e.g. CS101"
              required
            />
            <Input
              label="Course Name"
              name="name"
              value={newCourse.name}
              onChange={handleInputChange}
              placeholder="e.g. Intro to CS"
              required
            />
          </div>

          <div className="form-row">
            <Input
              label="Semester"
              type="number"
              name="semester"
              value={newCourse.semester}
              onChange={handleInputChange}
              required
              min="1"
              max="8"
            />
            <Input
              label="Academic Year"
              name="academicYear"
              value={newCourse.academicYear}
              onChange={handleInputChange}
              placeholder="e.g. 2023-2024"
              required
            />
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createLoading}>
              Create Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseManagement;
