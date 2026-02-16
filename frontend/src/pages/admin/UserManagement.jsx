import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { authAPI } from '../../api/auth.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  
  // Advanced Student Filters
  const [advFilters, setAdvFilters] = useState({
    semester: '',
    section: '',
    academicYear: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '', // Added roll number
    semester: '',
    section: '',
    academicYear: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filterRole, advFilters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        role: filterRole === 'all' ? null : filterRole,
        ...advFilters
      };
      const data = await adminAPI.listUsers(params);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAdvFilterChange = (e) => {
    setAdvFilters({ ...advFilters, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await authAPI.createUser(newUser);
      setIsModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'student',
        studentId: '',
        semester: '',
        section: '',
        academicYear: ''
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>User & Student Management</h1>
          <p>Deploy and organize academic cohorts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon="+" variant="primary">
          Register User
        </Button>
      </div>

      <div className="management-controls">
        {/* Role Filters */}
        <div className="filter-bar">
          {['all', 'admin', 'teacher', 'student'].map((role) => (
            <button
              key={role}
              className={`filter-chip ${filterRole === role ? 'active' : ''}`}
              onClick={() => setFilterRole(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}s
            </button>
          ))}
        </div>

        {/* Student Specific Filters */}
        {filterRole === 'student' && (
          <div className="advanced-filters glass" style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)'
          }}>
            <div className="filter-group">
              <label className="text-xs font-semibold uppercase text-secondary">Semester</label>
              <select 
                name="semester" 
                value={advFilters.semester} 
                onChange={handleAdvFilterChange}
                className="form-select-sm"
              >
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="text-xs font-semibold uppercase text-secondary">Section</label>
              <Input 
                name="section" 
                value={advFilters.section} 
                onChange={handleAdvFilterChange}
                placeholder="All Sections"
                className="input-sm"
              />
            </div>
            <div className="filter-group">
              <label className="text-xs font-semibold uppercase text-secondary">Academic Year</label>
              <Input 
                name="academicYear" 
                value={advFilters.academicYear} 
                onChange={handleAdvFilterChange}
                placeholder="202X-202Y"
                className="input-sm"
              />
            </div>
            <Button variant="secondary" onClick={() => setAdvFilters({ semester: '', section: '', academicYear: '' })}>
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* User List */}
      {loading ? (
        <Loader size="large" text="Retrieving academic directory..." />
      ) : (
        <Card className="user-list-card glass">
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Faculty/Student Name</th>
                  <th>Primary Email</th>
                  <th>Role</th>
                  <th>Cohort Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
                        {user.studentId || '-'}
                      </td>
                      <td>
                        <div className="user-name">
                          <div className="user-avatar-sm">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.role === 'student' ? (
                          <div className="text-sm">
                            <span className="font-semibold">Sem {user.semester}</span>
                            <span style={{ margin: '0 5px', color: 'var(--divider-color)' }}>|</span>
                            <span>Sec {user.section}</span>
                            <div className="text-xs text-secondary">{user.academicYear}</div>
                          </div>
                        ) : 'Staff Assignment'}
                      </td>
                      <td>
                        <span className="status-indicator active">Active</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No matching records in the directory
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New System Participant"
      >
        <form onSubmit={handleCreateUser} className="create-user-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-row">
            <Input
              label="Full Name"
              name="name"
              value={newUser.name}
              onChange={handleInputChange}
              required
            />
            <div className="form-group">
              <label className="form-label">Role Definition</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Institutional Email"
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Security Password"
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            required
          />

          {newUser.role === 'student' && (
            <div className="glass-section p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', padding: '15px' }}>
              <Input
                label="Roll Number / Student ID"
                name="studentId"
                value={newUser.studentId}
                onChange={handleInputChange}
                required
              />
              <div className="form-row mt-3">
                <Input
                  label="Current Semester"
                  type="number"
                  name="semester"
                  value={newUser.semester}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Cohort Section"
                  name="section"
                  value={newUser.section}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Input
                label="Academic Session (Year)"
                name="academicYear"
                value={newUser.academicYear}
                onChange={handleInputChange}
                placeholder="e.g. 2024-2025"
                required
                className="mt-3"
              />
            </div>
          )}

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Discard
            </Button>
            <Button variant="primary" type="submit" loading={createLoading} style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
              Finalize Registration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
