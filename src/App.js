import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './AuthContext';
import Login from './Login';
import HomePage from './pages/HomePage';
import QuoteBuilderApp from './apps/QuoteBuilderApp';
import ProjectDetail from './apps/components/ProjectDetail';
import './App.css';

function AppContent() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="App">
        <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          // Not logged in - show login page
          <>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          // Logged in - show app
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/quote-builder" element={<QuoteBuilderApp />} />
            <Route path="/quote-builder/project/:projectId" element={<ProjectDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;