import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/courses', label: 'Courses', icon: '📚' },
    { to: '/admin/program-outcomes', label: 'Program Outcomes', icon: '🎯' },
    { to: '/admin/course-outcomes', label: 'Course Outcomes', icon: '📝' },
    { to: '/admin/co-po-mapping', label: 'CO-PO Mapping', icon: '🔗' },
    { to: '/admin/teacher-assignment', label: 'Teacher Assignment', icon: '👨‍🏫' },
    { to: '/admin/attainment-reports', label: 'Attainment Reports', icon: '📈' },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/teacher/courses', label: 'My Courses', icon: '📚' },
    { to: '/teacher/exams', label: 'Exams', icon: '📝' },
    { to: '/teacher/marksheet', label: 'Marksheet', icon: '✍️' },
    { to: '/teacher/attainment', label: 'Attainment', icon: '📈' },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/student/marks', label: 'My Marks', icon: '📝' },
    { to: '/student/attainment', label: 'My Attainment', icon: '📈' },
  ];

  let links = [];
  if (isAdmin) links = adminLinks;
  else if (isTeacher) links = teacherLinks;
  else if (isStudent) links = studentLinks;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
