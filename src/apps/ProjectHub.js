import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../Sidebar';
import ProjectList from '../components/ProjectList';
import ProjectDetail from '../components/ProjectDetail';

function ProjectHubApp() {
  return (
    <div className="app-container">
      <Sidebar appName="Project Pulse" />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Routes>
      </div>
    </div>
  );
}

export default ProjectHubApp;