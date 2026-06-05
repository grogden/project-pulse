import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddProject, setShowAddProject] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Quote Builder - Project Pulse';
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
      return;
    }
    setProjects(data || []);
    setLoading(false);
  };

  const handleAddProject = async () => {
    if (projectName.trim() === '') return;

    const clientInput = document.getElementById('clientInput').value;

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectName,
          client: clientInput || 'Not specified'
        }
      ])
      .select();

    if (error) {
      console.error('Error adding project:', error);
      return;
    }

    setProjects([data[0], ...projects]);
    setProjectName('');
    document.getElementById('clientInput').value = '';
    setShowAddProject(false);
  };

  const handleDeleteProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return;
    }

    setProjects(projects.filter(p => p.id !== projectId));
    setDeletingProjectId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddProject();
    }
  };

  return (
    <div className="App">
      <h1>Projects</h1>

      {/* COLLAPSIBLE ADD PROJECT SECTION */}
      <div className="add-project-container">
        <button 
          className="toggle-add-project-btn"
          onClick={() => setShowAddProject(!showAddProject)}
        >
          {showAddProject ? '▼ Hide' : '▶ Add Project'}
        </button>

        {showAddProject && (
          <div className="form-section">
            <input
              type="text"
              placeholder="Project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <input
              type="text"
              placeholder="Client name..."
              id="clientInput"
            />
            <button onClick={handleAddProject}>Add Project</button>
          </div>
        )}
      </div>

      <div className="projects-section">
        <h2>Projects ({projects.length})</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : projects.length === 0 ? (
          <p>No projects yet. Add one to get started!</p>
        ) : (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <div 
                  className="project-item"
                  onClick={() => navigate(`/quote-builder/project/${project.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-header">
                    <strong>{project.name}</strong>
                    <span className="date">Client: {project.client} | {project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="delete-actions">
                    <button 
                      className="delete-btn"
                      title="Delete project"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (deletingProjectId === project.id) {
                          handleDeleteProject(project.id);
                        } else {
                          setDeletingProjectId(project.id);
                        }
                      }}
                    >
                      {deletingProjectId === project.id ? '✓' : '🗑️'}
                    </button>
                    {deletingProjectId === project.id && (
                      <button 
                        className="cancel-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProjectId(null);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ProjectList;