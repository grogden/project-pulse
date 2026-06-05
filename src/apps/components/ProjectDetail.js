import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editQuoteData, setEditQuoteData] = useState({ description: '', amount: '' });
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [projectData, setProjectData] = useState({});
  
  // Collapsible sections
  const [showProjectInfo, setShowProjectInfo] = useState(true);
  const [showQuotes, setShowQuotes] = useState(true);
  const [showInvoices, setShowInvoices] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      
      // Fetch project
      const { data: projectDataResponse, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        setLoading(false);
        return;
      }

      setProject(projectDataResponse);
      setProjectData(projectDataResponse);
      document.title = `${projectDataResponse.name} - Project Pulse`;

      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!quotesError) {
        setQuotes(quotesData || []);
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!invoicesError) {
        setInvoices(invoicesData || []);
      }

      setLoading(false);
    };

    fetchProjectData();
  }, [projectId]);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const formatBudgetDisplay = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveProjectChanges = async () => {
    const { error } = await supabase
      .from('projects')
      .update({
        name: projectData.name,
        client: projectData.client,
        phone: projectData.phone || null,
        email: projectData.email || null,
        street_address: projectData.street_address || null,
        city: projectData.city || null,
        state: projectData.state || null,
        zip_code: projectData.zip_code || null,
        country: projectData.country || null,
        status: projectData.status || 'not started',
        start_date: projectData.start_date || null,
        due_date: projectData.due_date || null,
        budget: projectData.budget ? parseFloat(projectData.budget) : null,
        notes: projectData.notes || null
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      alert('Error saving changes');
      return;
    }

    setProject(projectData);
    setEditingProject(false);
    alert('Project updated successfully');
  };

  const handleAddQuote = async () => {
    const desc = document.getElementById('quote-desc').value;
    const amount = document.getElementById('quote-amount').value;

    if (!desc || !amount) return;

    const { data, error } = await supabase
      .from('quotes')
      .insert([
        {
          project_id: projectId,
          description: desc,
          amount: parseFloat(amount)
        }
      ])
      .select();

    if (error) {
      console.error('Error adding quote:', error);
      return;
    }

    setQuotes([data[0], ...quotes]);
    document.getElementById('quote-desc').value = '';
    document.getElementById('quote-amount').value = '';
  };

  const handleEditQuote = (quote) => {
    setEditingQuoteId(quote.id);
    setEditQuoteData({
      description: quote.description,
      amount: quote.amount.toString()
    });
  };

  const handleSaveQuote = async (quoteId) => {
    if (!editQuoteData.description || !editQuoteData.amount) return;

    const { error } = await supabase
      .from('quotes')
      .update({
        description: editQuoteData.description,
        amount: parseFloat(editQuoteData.amount)
      })
      .eq('id', quoteId);

    if (error) {
      console.error('Error updating quote:', error);
      return;
    }

    setQuotes(quotes.map(q => 
      q.id === quoteId 
        ? { ...q, description: editQuoteData.description, amount: parseFloat(editQuoteData.amount) }
        : q
    ));

    setEditingQuoteId(null);
    setEditQuoteData({ description: '', amount: '' });
  };

  const handleCancelEdit = () => {
    setEditingQuoteId(null);
    setEditQuoteData({ description: '', amount: '' });
  };

  const handleDeleteQuote = async (quoteId) => {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) {
      console.error('Error deleting quote:', error);
      return;
    }

    setQuotes(quotes.filter(q => q.id !== quoteId));
    setDeletingQuoteId(null);
  };

  const handleAddInvoice = async () => {
    const desc = document.getElementById('invoice-desc').value;
    const amount = document.getElementById('invoice-amount').value;
    const status = document.getElementById('invoice-status').value;

    if (!desc || !amount) return;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          project_id: projectId,
          invoice_number: invoiceNumber,
          description: desc,
          amount: parseFloat(amount),
          status: status
        }
      ])
      .select();

    if (error) {
      console.error('Error adding invoice:', error);
      return;
    }

    setInvoices([data[0], ...invoices]);
    document.getElementById('invoice-desc').value = '';
    document.getElementById('invoice-amount').value = '';
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      return;
    }

    setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    setDeletingInvoiceId(null);
  };

  if (loading) {
    return <div className="App"><p>Loading...</p></div>;
  }

  if (!project) {
    return <div className="App"><p>Project not found</p></div>;
  }

  return (
    <div className="App">
      <div className="project-detail-header">
        <button className="back-btn" onClick={() => navigate('/quote-builder')}>← Back</button>
        <h1>{project.name}</h1>
      </div>

      {/* PROJECT INFO SECTION - COLLAPSIBLE */}
      <div className="collapsible-section">
        <button 
          className="section-toggle-btn"
          onClick={() => setShowProjectInfo(!showProjectInfo)}
        >
          {showProjectInfo ? '▼' : '▶'} Project Information
          {!editingProject && (
            <button 
              className="pencil-btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditingProject(!editingProject);
              }}
              title="Edit project"
            >
              ✏️
            </button>
          )}
        </button>

        {showProjectInfo && (
          editingProject ? (
            <div className="project-edit-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    placeholder="Project name"
                    value={projectData.name || ''}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Client Name</label>
                  <input
                    type="text"
                    placeholder="Client name"
                    value={projectData.client || ''}
                    onChange={(e) => setProjectData({ ...projectData, client: e.target.value })}
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
                    value={projectData.email || ''}
                    onChange={(e) => setProjectData({ ...projectData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="(123) 456-7890"
                    value={projectData.phone || ''}
                    onChange={(e) => setProjectData({ ...projectData, phone: formatPhoneNumber(e.target.value) })}
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
                    value={projectData.street_address || ''}
                    onChange={(e) => setProjectData({ ...projectData, street_address: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={projectData.city || ''}
                    onChange={(e) => setProjectData({ ...projectData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={projectData.state || ''}
                    onChange={(e) => setProjectData({ ...projectData, state: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    placeholder="Zip code"
                    value={projectData.zip_code || ''}
                    onChange={(e) => setProjectData({ ...projectData, zip_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={projectData.country || ''}
                    onChange={(e) => setProjectData({ ...projectData, country: e.target.value })}
                  />
                </div>
              </div>

              <h3>Project Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={projectData.status || 'not started'} 
                    onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
                  >
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
                    value={projectData.start_date || ''}
                    onChange={(e) => setProjectData({ ...projectData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={projectData.due_date || ''}
                    onChange={(e) => setProjectData({ ...projectData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={projectData.budget || ''}
                    onChange={(e) => setProjectData({ ...projectData, budget: e.target.value })}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: '1' }}>
                  <label>Notes</label>
                  <textarea
                    placeholder="Additional notes"
                    value={projectData.notes || ''}
                    onChange={(e) => setProjectData({ ...projectData, notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button className="save-btn" onClick={handleSaveProjectChanges}>Save Changes</button>
                <button className="cancel-btn" onClick={() => setEditingProject(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="project-info-section">
              <div className="info-grid">
                <div className="info-item">
                  <label>Client:</label>
                  <p>{project.client}</p>
                </div>
                {project.email && (
                  <div className="info-item">
                    <label>Email:</label>
                    <p>{project.email}</p>
                  </div>
                )}
                {project.phone && (
                  <div className="info-item">
                    <label>Phone:</label>
                    <p>{project.phone}</p>
                  </div>
                )}
                {project.street_address && (
                  <div className="info-item">
                    <label>Address:</label>
                    <p>
                      {project.street_address}
                      {project.city && `, ${project.city}`}
                      {project.state && `, ${project.state}`}
                      {project.zip_code && ` ${project.zip_code}`}
                      {project.country && `, ${project.country}`}
                    </p>
                  </div>
                )}
                {project.status && (
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status status-${project.status}`}>{project.status}</span>
                  </div>
                )}
                {project.start_date && (
                  <div className="info-item">
                    <label>Start Date:</label>
                    <p>{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.due_date && (
                  <div className="info-item">
                    <label>Due Date:</label>
                    <p>{new Date(project.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.budget && (
                  <div className="info-item">
                    <label>Budget:</label>
                    <p>${formatBudgetDisplay(project.budget)}</p>
                  </div>
                )}
              </div>
              {project.notes && (
                <div className="notes-section">
                  <label>Notes:</label>
                  <p>{project.notes}</p>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* QUOTES SECTION - COLLAPSIBLE */}
      <div className="collapsible-section">
        <button 
          className="section-toggle-btn"
          onClick={() => setShowQuotes(!showQuotes)}
        >
          {showQuotes ? '▼' : '▶'} Quotes ({quotes.length})
        </button>

        {showQuotes && (
          <div className="quotes-section-content">
            {quotes.length > 0 ? (
              <ul>
                {quotes.map((quote) => (
                  <li key={quote.id} className="quote-item">
                    {editingQuoteId === quote.id ? (
                      <div className="quote-edit-mode">
                        <input
                          type="text"
                          value={editQuoteData.description}
                          onChange={(e) => setEditQuoteData({ ...editQuoteData, description: e.target.value })}
                          placeholder="Quote description"
                        />
                        <input
                          type="number"
                          value={editQuoteData.amount}
                          onChange={(e) => setEditQuoteData({ ...editQuoteData, amount: e.target.value })}
                          placeholder="Amount"
                        />
                        <div className="edit-buttons">
                          <button 
                            className="save-btn"
                            onClick={() => handleSaveQuote(quote.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="quote-header-row">
                          <div className="quote-info">
                            <strong>${formatBudgetDisplay(quote.amount)}</strong>
                            <p>{quote.description}</p>
                            <span className="date">{quote.date ? new Date(quote.date).toLocaleDateString() : ''}</span>
                          </div>
                          <div className="quote-actions">
                            <button 
                              className="pencil-btn"
                              onClick={() => handleEditQuote(quote)}
                              title="Edit quote"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-btn"
                              title="Delete quote"
                              onClick={() => {
                                if (deletingQuoteId === quote.id) {
                                  handleDeleteQuote(quote.id);
                                } else {
                                  setDeletingQuoteId(quote.id);
                                }
                              }}
                            >
                              {deletingQuoteId === quote.id ? '✓' : '🗑️'}
                            </button>
                            {deletingQuoteId === quote.id && (
                              <button 
                                className="cancel-delete-btn"
                                onClick={() => setDeletingQuoteId(null)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No quotes yet.</p>
            )}
            
            <div className="add-quote-form">
              <input 
                type="text" 
                placeholder="Quote description..." 
                id="quote-desc"
              />
              <input 
                type="number" 
                placeholder="Amount ($)" 
                id="quote-amount"
              />
              <button onClick={handleAddQuote}>Add Quote</button>
            </div>
          </div>
        )}
      </div>

      {/* INVOICES SECTION - COLLAPSIBLE */}
      <div className="collapsible-section">
        <button 
          className="section-toggle-btn"
          onClick={() => setShowInvoices(!showInvoices)}
        >
          {showInvoices ? '▼' : '▶'} Invoices ({invoices.length})
        </button>

        {showInvoices && (
          <div className="invoices-section-content">
            {invoices.length > 0 ? (
              <ul>
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="invoice-item">
                    <div className="invoice-header-row">
                      <div className="invoice-info">
                        <strong>Invoice #{invoice.invoice_number}</strong>
                        <p>{invoice.description}</p>
                        <div className="invoice-details">
                          <span className="date">{invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}</span>
                          <span className={`status status-${invoice.status}`}>{invoice.status}</span>
                          <strong className="amount">${formatBudgetDisplay(invoice.amount)}</strong>
                        </div>
                      </div>
                      <div className="invoice-actions">
                        <button 
                          className="delete-btn"
                          title="Delete invoice"
                          onClick={() => {
                            if (deletingInvoiceId === invoice.id) {
                              handleDeleteInvoice(invoice.id);
                            } else {
                              setDeletingInvoiceId(invoice.id);
                            }
                          }}
                        >
                          {deletingInvoiceId === invoice.id ? '✓' : '🗑️'}
                        </button>
                        {deletingInvoiceId === invoice.id && (
                          <button 
                            className="cancel-delete-btn"
                            onClick={() => setDeletingInvoiceId(null)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No invoices yet.</p>
            )}
            
            <div className="add-invoice-form">
              <input 
                type="text" 
                placeholder="Invoice description..." 
                id="invoice-desc"
              />
              <input 
                type="number" 
                placeholder="Amount ($)" 
                id="invoice-amount"
              />
              <select id="invoice-status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
              <button onClick={handleAddInvoice}>Add Invoice</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;