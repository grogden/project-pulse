import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Project Pulse';
  }, []);

  const modules = [
    {
      id: 'quote-builder',
      title: 'Quote Builder',
      description: 'Create and manage project quotes',
      icon: '📋',
      path: '/quote-builder'
    },
    {
      id: 'invoicing',
      title: 'Invoicing',
      description: 'Coming Soon',
      icon: '📄',
      path: '#',
      disabled: true
    },
    {
      id: 'subcontractors',
      title: 'Subcontractors',
      description: 'Coming Soon',
      icon: '👥',
      path: '#',
      disabled: true
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Coming Soon',
      icon: '📊',
      path: '#',
      disabled: true
    }
  ];

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Project Pulse</h1>
          <p>Construction Project Management</p>
        </div>

        <div className="modules-grid">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`module-card ${module.disabled ? 'disabled' : ''}`}
              onClick={() => !module.disabled && navigate(module.path)}
              style={{ cursor: module.disabled ? 'not-allowed' : 'pointer' }}
            >
              <div className="module-icon">{module.icon}</div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              {module.disabled && <span className="coming-soon">Coming Soon</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;