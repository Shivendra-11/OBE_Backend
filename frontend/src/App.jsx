import { AuthProvider } from './context/AuthContext';
import AppRouter from './router';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
