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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    semester: '',
    section: '',
    academicYear: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const role = filterRole === 'all' ? null : filterRole;
      const data = await adminAPI.listUsers(role);
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
          <h1>User Management</h1>
          <p>Create and manage system users</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon="+" variant="primary">
          Create User
        </Button>
      </div>

      {/* Filters */}
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

      {/* User List */}
      {loading ? (
        <Loader size="large" text="Loading users..." />
      ) : (
        <Card className="user-list-card">
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Details</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id}>
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
                          <span className="text-secondary text-sm">
                            Sem {user.semester} • Sec {user.section}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-secondary text-sm">
                        {new Date().toLocaleDateString()} {/* Placeholder for createdAt if missing */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No users found
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
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="create-user-form">
          {error && <div className="form-error">{error}</div>}
          
          <Input
            label="Name"
            name="name"
            value={newUser.name}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Email"
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            required
          />

          <div className="form-group">
            <label className="form-label">Role</label>
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

          {newUser.role === 'student' && (
            <>
              <div className="form-row">
                <Input
                  label="Semester"
                  type="number"
                  name="semester"
                  value={newUser.semester}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Section"
                  name="section"
                  value={newUser.section}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Input
                label="Academic Year"
                name="academicYear"
                value={newUser.academicYear}
                onChange={handleInputChange}
                placeholder="e.g. 2023-2024"
                required
              />
            </>
          )}

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createLoading}>
              Create {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
