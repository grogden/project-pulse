import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('not started');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState(['not started', 'in progress']); // Default: open projects
  const [searchName, setSearchName] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchState, setSearchState] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Quote Builder - Project Pulse';
    fetchProjects();
  }, []);

  // Apply filters whenever projects or filter criteria change
  useEffect(() => {
    let filtered = projects;

    // Filter by status
    if (filterStatus.length > 0) {
      filtered = filtered.filter(p => filterStatus.includes(p.status));
    }

    // Search filters (case-insensitive, partial match)
    if (searchName) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchClient) {
      filtered = filtered.filter(p => 
        p.client.toLowerCase().includes(searchClient.toLowerCase())
      );
    }

    if (searchEmail) {
      filtered = filtered.filter(p => 
        p.email && p.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (searchPhone) {
      filtered = filtered.filter(p => 
        p.phone && p.phone.replace(/\D/g, '').includes(searchPhone.replace(/\D/g, ''))
      );
    }

    if (searchCity) {
      filtered = filtered.filter(p => 
        p.city && p.city.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    if (searchState) {
      filtered = filtered.filter(p => 
        p.state && p.state.toLowerCase().includes(searchState.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, filterStatus, searchName, searchClient, searchEmail, searchPhone, searchCity, searchState]);

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

  const handleStatusToggle = (statusValue) => {
    setFilterStatus(prev => {
      if (prev.includes(statusValue)) {
        return prev.filter(s => s !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const clearAllFilters = () => {
    setFilterStatus(['not started', 'in progress']); // Reset to default
    setSearchName('');
    setSearchClient('');
    setSearchEmail('');
    setSearchPhone('');
    setSearchCity('');
    setSearchState('');
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleAddProject = async () => {
    if (projectName.trim() === '' || clientName.trim() === '') {
      alert('Project name and client name are required');
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectName,
          client: clientName,
          phone: phone || null,
          email: email || null,
          street_address: streetAddress || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          country: country || null,
          status: status,
          start_date: startDate || null,
          due_date: dueDate || null,
          budget: budget ? parseFloat(budget) : null,
          notes: notes || null
        }
      ])
      .select();

    if (error) {
      console.error('Error adding project:', error);
      alert('Error adding project');
      return;
    }

    setProjects([data[0], ...projects]);
    
    // Reset form
    setProjectName('');
    setClientName('');
    setPhone('');
    setEmail('');
    setStreetAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('');
    setStatus('not started');
    setStartDate('');
    setDueDate('');
    setBudget('');
    setNotes('');
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
          <div className="form-section add-project-form">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                />
              </div>
            </div>

            <h3>Address</h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: '2' }}>
                <label>Street Address</label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  placeholder="Zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>

            <h3>Project Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">On Hold</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Budget</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: '1' }}>
                <label>Notes</label>
                <textarea
                  placeholder="Additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>
            </div>

            <button onClick={handleAddProject} className="submit-btn">Add Project</button>
          </div>
        )}
      </div>

      {/* COLLAPSIBLE FILTER SECTION */}
      <div className="filter-section">
        <button 
          className="toggle-filter-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '▼ Hide Filters' : '▶ Show Filters'}
        </button>

        {showFilters && (
          <div className="filter-content">
            <div className="filter-header">
              <button className="clear-filters-btn" onClick={clearAllFilters}>Clear All Filters</button>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="status-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filterStatus.includes('not started')}
                    onChange={() => handleStatusToggle('not started')}
                  />
                  Not Started
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filterStatus.includes('in progress')}
                    onChange={() => handleStatusToggle('in progress')}
                  />
                  In Progress
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filterStatus.includes('completed')}
                    onChange={() => handleStatusToggle('completed')}
                  />
                  Completed
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filterStatus.includes('on hold')}
                    onChange={() => handleStatusToggle('on hold')}
                  />
                  On Hold
                </label>
              </div>
            </div>

            {/* Search Filters */}
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">Project Name</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Client</label>
                <input
                  type="text"
                  placeholder="Search by client..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Email</label>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Phone</label>
                <input
                  type="text"
                  placeholder="Search by phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">City</label>
                <input
                  type="text"
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">State</label>
                <input
                  type="text"
                  placeholder="Search by state..."
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="projects-section">
        <h2>Projects ({filteredProjects.length})</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : filteredProjects.length === 0 ? (
          <p>No projects match your filters.</p>
        ) : (
          <ul>
            {filteredProjects.map((project) => (
              <li key={project.id}>
                <div 
                  className="project-item"
                  onClick={() => navigate(`/quote-builder/project/${project.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-header">
                    <div>
                      <strong>{project.name}</strong>
                      <span className="date">Client: {project.client}</span>
                      {project.status && <span className={`status status-${project.status}`}>{project.status}</span>}
                    </div>
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