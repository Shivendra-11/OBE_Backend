import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './CourseOutcomes.css';

const CourseOutcomes = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [cos, setCos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const [newCO, setNewCO] = useState({
    number: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCOs(selectedCourse);
    } else {
      setCos([]);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const data = await adminAPI.listCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchCOs = async (courseId) => {
    setLoading(true);
    try {
      const data = await adminAPI.listCOs(courseId);
      setCos(data);
    } catch (error) {
      console.error('Error fetching COs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewCO({ ...newCO, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCreateCO = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await adminAPI.createCO({
        courseId: selectedCourse,
        number: Number(newCO.number),
        description: newCO.description
      });
      setIsModalOpen(false);
      setNewCO({ number: '', description: '' });
      fetchCOs(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create CO');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Course Outcomes (COs)</h1>
          <p>Define outcomes for specific courses</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          icon="+" 
          variant="primary"
          disabled={!selectedCourse}
        >
          Add CO
        </Button>
      </div>

      {/* Course Selection */}
      <Card className="mb-6">
        <div className="course-selector">
          <label className="form-label">Select Course:</label>
          {coursesLoading ? (
            <span className="text-secondary ml-2">Loading courses...</span>
          ) : (
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
          )}
        </div>
      </Card>

      {/* CO List */}
      {!selectedCourse ? (
        <div className="text-center py-8 text-secondary">
          Please select a course to view its outcomes
        </div>
      ) : loading ? (
        <Loader size="large" text="Loading COs..." />
      ) : (
        <Card className="co-list-card">
          <div className="table-responsive">
            <table className="co-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>CO No.</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {cos.length > 0 ? (
                  cos.map((co) => (
                    <tr key={co._id}>
                      <td>
                        <span className="co-badge">CO{co.number}</span>
                      </td>
                      <td>
                        <p className="co-description">{co.description}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center py-4">
                      No Course Outcomes defined for this course yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create CO Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Course Outcome"
      >
        <form onSubmit={handleCreateCO} className="create-co-form">
          {error && <div className="form-error">{error}</div>}
          
          <Input
            label="CO Number"
            type="number"
            name="number"
            value={newCO.number}
            onChange={handleInputChange}
            placeholder="e.g. 1 for CO1"
            required
            autoFocus
            min="1"
            max="10"
          />
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={newCO.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Enter the description of the Course Outcome..."
              rows="4"
              required
            />
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createLoading}>
              Create CO
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseOutcomes;
