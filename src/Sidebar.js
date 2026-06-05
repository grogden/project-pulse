import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ appName }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>{appName}</h2>
          <button 
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className="nav-link"
            onClick={() => handleNavigation('/')}
          >
            🏠 Home
          </button>
          <button 
            className="nav-link active"
            onClick={() => handleNavigation('/quote-builder')}
          >
            📋 Quote Builder
          </button>
          <button 
            className="nav-link disabled"
            disabled
          >
            📄 Invoicing (Coming Soon)
          </button>
          <button 
            className="nav-link disabled"
            disabled
          >
            👥 Subcontractors (Coming Soon)
          </button>
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;