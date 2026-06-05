import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [invoices, setInvoices] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddProject, setShowAddProject] = useState(true);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editQuoteData, setEditQuoteData] = useState({ description: '', amount: '' });
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

  // Fetch projects when app loads
  useEffect(() => {
    document.title = 'Project Pulse';
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

  // QUOTES FUNCTIONS
  const fetchQuotes = async (projectId) => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching quotes:', error);
      return;
    }

    setQuotes({
      ...quotes,
      [projectId]: data || []
    });
  };

  const handleAddQuote = async (projectId) => {
    const desc = document.getElementById(`desc-${projectId}`).value;
    const amount = document.getElementById(`amount-${projectId}`).value;

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

    setQuotes({
      ...quotes,
      [projectId]: [...(quotes[projectId] || []), data[0]]
    });

    document.getElementById(`desc-${projectId}`).value = '';
    document.getElementById(`amount-${projectId}`).value = '';
  };

  const handleEditQuote = (quote) => {
    setEditingQuoteId(quote.id);
    setEditQuoteData({
      description: quote.description,
      amount: quote.amount.toString()
    });
  };

  const handleSaveQuote = async (projectId, quoteId) => {
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

    setQuotes({
      ...quotes,
      [projectId]: quotes[projectId].map(q => 
        q.id === quoteId 
          ? { ...q, description: editQuoteData.description, amount: parseFloat(editQuoteData.amount) }
          : q
      )
    });

    setEditingQuoteId(null);
    setEditQuoteData({ description: '', amount: '' });
  };

  const handleCancelEdit = () => {
    setEditingQuoteId(null);
    setEditQuoteData({ description: '', amount: '' });
  };

  const handleDeleteQuote = async (projectId, quoteId) => {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) {
      console.error('Error deleting quote:', error);
      return;
    }

    setQuotes({
      ...quotes,
      [projectId]: quotes[projectId].filter(q => q.id !== quoteId)
    });
    setDeletingQuoteId(null);
  };

  // INVOICES FUNCTIONS
  const fetchInvoices = async (projectId) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }

    setInvoices({
      ...invoices,
      [projectId]: data || []
    });
  };

  const handleAddInvoice = async (projectId) => {
    const desc = document.getElementById(`inv-desc-${projectId}`).value;
    const amount = document.getElementById(`inv-amount-${projectId}`).value;
    const status = document.getElementById(`inv-status-${projectId}`).value;

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

    setInvoices({
      ...invoices,
      [projectId]: [...(invoices[projectId] || []), data[0]]
    });

    document.getElementById(`inv-desc-${projectId}`).value = '';
    document.getElementById(`inv-amount-${projectId}`).value = '';
  };

  const handleDeleteInvoice = async (projectId, invoiceId) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      return;
    }

    setInvoices({
      ...invoices,
      [projectId]: invoices[projectId].filter(inv => inv.id !== invoiceId)
    });
    setDeletingInvoiceId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddProject();
    }
  };

  const toggleProject = (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    } else {
      setSelectedProjectId(projectId);
      fetchQuotes(projectId);
      fetchInvoices(projectId);
    }
  };

  return (
    <div className="App">
      <h1>Project Pulse</h1>

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
              <div key={project.id}>
                <li>
                  <div 
                    className="project-item"
                    onClick={() => toggleProject(project.id)}
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

                {selectedProjectId === project.id && (
                  <>
                    {/* QUOTES SECTION */}
                    <div className="quotes-section">
                      <h3>Quotes for {project.name}</h3>
                      {quotes[project.id] && quotes[project.id].length > 0 ? (
                        <ul>
                          {quotes[project.id].map((quote) => (
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
                                      onClick={() => handleSaveQuote(project.id, quote.id)}
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
                                  <strong>${quote.amount}</strong>
                                  <p>{quote.description}</p>
                                  <span className="date">{quote.date ? new Date(quote.date).toLocaleDateString() : ''}</span>
                                  <div className="quote-actions">
                                    <button 
                                      className="edit-btn"
                                      onClick={() => handleEditQuote(quote)}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="delete-btn"
                                      title="Delete quote"
                                      onClick={() => {
                                        if (deletingQuoteId === quote.id) {
                                          handleDeleteQuote(project.id, quote.id);
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
                          id={`desc-${project.id}`}
                        />
                        <input 
                          type="number" 
                          placeholder="Amount ($)" 
                          id={`amount-${project.id}`}
                        />
                        <button onClick={() => handleAddQuote(project.id)}>
                          Add Quote
                        </button>
                      </div>
                    </div>

                    {/* INVOICES SECTION */}
                    <div className="invoices-section">
                      <h3>Invoices for {project.name}</h3>
                      {invoices[project.id] && invoices[project.id].length > 0 ? (
                        <ul>
                          {invoices[project.id].map((invoice) => (
                            <li key={invoice.id} className="invoice-item">
                              <div>
                                <strong>Invoice #{invoice.invoice_number}</strong>
                                <p>{invoice.description}</p>
                                <div className="invoice-details">
                                  <span className="date">{invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}</span>
                                  <span className={`status status-${invoice.status}`}>{invoice.status}</span>
                                  <strong className="amount">${invoice.amount}</strong>
                                </div>
                              </div>
                              <div className="delete-actions">
                                <button 
                                  className="delete-btn"
                                  title="Delete invoice"
                                  onClick={() => {
                                    if (deletingInvoiceId === invoice.id) {
                                      handleDeleteInvoice(project.id, invoice.id);
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
                          id={`inv-desc-${project.id}`}
                        />
                        <input 
                          type="number" 
                          placeholder="Amount ($)" 
                          id={`inv-amount-${project.id}`}
                        />
                        <select id={`inv-status-${project.id}`} defaultValue="draft">
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                        </select>
                        <button onClick={() => handleAddInvoice(project.id)}>
                          Add Invoice
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;