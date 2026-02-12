import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    else if (user?.role === 'teacher') navigate('/teacher/dashboard');
    else if (user?.role === 'student') navigate('/student/dashboard');
    else navigate('/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-primary)'
    }}>
      <Card className="glass" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ color: 'var(--danger-500)', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          You do not have permission to access this page. Please return to your dashboard.
        </p>
        <Button variant="primary" onClick={handleGoBack}>
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default Unauthorized;
