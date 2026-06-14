import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AuthContext } from '../../AuthContext';
import '../../pages/project-grid-styles.css';

function ProjectList() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    'not started': true,
    'in progress': true,
    'completed': false,
    'on hold': false
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = projects;

      // Apply status filter
      const selectedStatuses = Object.keys(statusFilters).filter(status => statusFilters[status]);
      if (selectedStatuses.length > 0) {
        filtered = filtered.filter(project => selectedStatuses.includes(project.status));
      }

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(project =>
          project.name.toLowerCase().includes(term) ||
          project.client.toLowerCase().includes(term) ||
          (project.email && project.email.toLowerCase().includes(term)) ||
          (project.phone && project.phone.includes(term)) ||
          (project.city && project.city.toLowerCase().includes(term)) ||
          (project.state && project.state.toLowerCase().includes(term))
        );
      }

      setFilteredProjects(filtered);
    };

    applyFilters();
  }, [projects, searchTerm, statusFilters]);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleAddProject = async () => {
    const name = document.getElementById('project-name').value;
    const client = document.getElementById('project-client').value;
    const email = document.getElementById('project-email').value;
    const phone = document.getElementById('project-phone').value;
    const streetAddress = document.getElementById('project-street').value;
    const city = document.getElementById('project-city').value;
    const state = document.getElementById('project-state').value;
    const zipCode = document.getElementById('project-zip').value;
    const country = document.getElementById('project-country').value;
    const status = document.getElementById('project-status').value;
    const startDate = document.getElementById('project-start-date').value;
    const dueDate = document.getElementById('project-due-date').value;
    const budget = document.getElementById('project-budget').value;
    const notes = document.getElementById('project-notes').value;

    if (!name || !client) {
      alert('Please enter project name and client name');
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name,
          client,
          email: email || null,
          phone: phone || null,
          street_address: streetAddress || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          country: country || null,
          contractor_id: user.id,
          status: status || 'not started',
          start_date: startDate || null,
          due_date: dueDate || null,
          budget: budget ? parseFloat(budget) : null,
          notes: notes || null
        }
      ])
      .select();

    if (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
      return;
    }

    setProjects([data[0], ...projects]);
    // Clear form
    document.getElementById('project-name').value = '';
    document.getElementById('project-client').value = '';
    document.getElementById('project-email').value = '';
    document.getElementById('project-phone').value = '';
    document.getElementById('project-street').value = '';
    document.getElementById('project-city').value = '';
    document.getElementById('project-state').value = '';
    document.getElementById('project-zip').value = '';
    document.getElementById('project-country').value = '';
    document.getElementById('project-status').value = 'not started';
    document.getElementById('project-start-date').value = '';
    document.getElementById('project-due-date').value = '';
    document.getElementById('project-budget').value = '';
    document.getElementById('project-notes').value = '';
    setShowAddForm(false);
  };

  const handleDeleteProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('contractor_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return;
    }

    setProjects(projects.filter(p => p.id !== projectId));
    setDeletingProjectId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilters({
      'not started': true,
      'in progress': true,
      'completed': false,
      'on hold': false
    });
  };

  const formatBudgetDisplay = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2>My Projects</h2>
        <button
          className="toggle-add-project-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Close' : '+ Add New Project'}
        </button>
      </div>

      {/* ADD PROJECT SECTION */}
      {showAddForm && (
        <div className="add-project-container">
          <div className="add-project-form">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  id="project-name"
                  placeholder="Project name..."
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  id="project-client"
                  placeholder="Client name..."
                  maxLength="100"
                />
              </div>
            </div>

            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  id="project-email"
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  id="project-phone"
                  placeholder="(123) 456-7890"
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                  }}
                />
              </div>
            </div>

            <h3>Address</h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: '2' }}>
                <label>Street Address</label>
                <input
                  type="text"
                  id="project-street"
                  placeholder="Street address"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input type="text" id="project-city" placeholder="City" />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" id="project-state" placeholder="State" />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input type="text" id="project-zip" placeholder="Zip code" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  id="project-country"
                  placeholder="Country"
                />
              </div>
            </div>

            <h3>Project Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select id="project-status" defaultValue="not started">
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">On Hold</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" id="project-start-date" />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" id="project-due-date" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Budget</label>
                <input
                  type="number"
                  id="project-budget"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: '1' }}>
                <label>Notes</label>
                <textarea
                  id="project-notes"
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>
            </div>

            <button className="submit-btn" onClick={handleAddProject}>
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* FILTER SECTION */}
      <div className="filter-section">
        <button
          className="toggle-filter-btn"
          onClick={() => setShowFilter(!showFilter)}
        >
          {showFilter ? '▼ Hide Filters' : '▶ Show Filters'}
        </button>

        {showFilter && (
          <div className="filter-content">
            <div className="filter-header">
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>

            <div className="filter-group">
              <label className="filter-label">Search Projects</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by name, client, email, phone, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="status-checkboxes">
                {['not started', 'in progress', 'completed', 'on hold'].map(status => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={statusFilters[status]}
                      onChange={(e) =>
                        setStatusFilters({
                          ...statusFilters,
                          [status]: e.target.checked
                        })
                      }
                    />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROJECTS TABLE */}
      <div className="projects-table-section">
        {loading ? (
          <div className="loading-message">
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-message">
            <p>
              {projects.length === 0
                ? 'No projects yet. Create one to get started!'
                : 'No projects match your filters.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id} className="project-row">
                    <td className="project-name-cell">
                      <span
                        className="project-name-link"
                        onClick={() => navigate(`/quote-builder/project/${project.id}`)}
                        title="View project"
                      >
                        {project.name}
                      </span>
                    </td>
                    <td>{project.client}</td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      {project.city && project.state 
                        ? `${project.city}, ${project.state}`
                        : project.city || project.state || '—'
                      }
                    </td>
                    <td className="budget-cell">
                      {project.budget ? `$${formatBudgetDisplay(project.budget)}` : '—'}
                    </td>
                    <td className="date-cell">
                      {formatDateDisplay(project.start_date) || '—'}
                    </td>
                    <td className="date-cell">
                      {formatDateDisplay(project.due_date) || '—'}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => navigate(`/quote-builder/project/${project.id}`)}
                          title="View project"
                        >
                          View
                        </button>
                        <button
                          className="delete-btn"
                          title="Delete project"
                          onClick={() => {
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
                            onClick={() => setDeletingProjectId(null)}
                            title="Cancel delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectList;