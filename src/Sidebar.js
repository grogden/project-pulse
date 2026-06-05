import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Sidebar.css';

function Sidebar({ appName = 'Project Pulse' }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useContext(AuthContext);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      closeSidebar();
      navigate('/');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>{appName}</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-link"
            onClick={() => handleNavigation('/')}
          >
            📊 Home
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavigation('/quote-builder')}
          >
            💼 Projects
          </button>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <>
              <div className="user-info">
                <p className="user-email">{user.email}</p>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            </>
          )}
        </div>
      </aside>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}

export default Sidebar;