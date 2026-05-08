import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { auth, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Quota Management System</h1>
      </div>
      <div className="navbar-user">
        <span>Welcome, {auth.user?.name}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;