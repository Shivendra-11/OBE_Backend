import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">OBE</span>
          <span className="navbar-title">Outcome Based Education</span>
        </Link>

        <div className="navbar-actions">
          {user && (
            <>
              <div className="navbar-user">
                <div className="navbar-user-avatar">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{user.name}</span>
                  <span className="navbar-user-role">{user.role}</span>
                </div>
              </div>
              <Button variant="ghost" size="small" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
