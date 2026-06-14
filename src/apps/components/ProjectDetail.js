import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/quotes-table-styles.css';
import '../../styles/tabs-styles.css';

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(true);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editQuoteData, setEditQuoteData] = useState({ code: '', description: '', amount: '' });
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editInvoiceData, setEditInvoiceData] = useState({ description: '', amount: '', status: '' });
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [projectData, setProjectData] = useState({});
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState(null);
  const [uploadingNewInvoice, setUploadingNewInvoice] = useState(false);
  const [selectedInvoiceFile, setSelectedInvoiceFile] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('quotes');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'

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
        .order('code', { ascending: true });

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

  // Auto-save projectData changes
  useEffect(() => {
    if (!project || !projectData.name || !projectData.client) return;

    // Check if projectData has actually changed from project
    const hasChanges = 
      projectData.name !== project.name ||
      projectData.client !== project.client ||
      projectData.email !== project.email ||
      projectData.phone !== project.phone ||
      projectData.street_address !== project.street_address ||
      projectData.city !== project.city ||
      projectData.state !== project.state ||
      projectData.zip_code !== project.zip_code ||
      projectData.country !== project.country ||
      projectData.status !== project.status ||
      projectData.start_date !== project.start_date ||
      projectData.due_date !== project.due_date ||
      projectData.budget !== project.budget ||
      projectData.gc_percentage !== project.gc_percentage ||
      projectData.notes !== project.notes;

    if (!hasChanges) return;

    // Set saving status
    setSaveStatus('saving');

    // Debounce the save - wait 1 second after last change
    const saveTimeout = setTimeout(async () => {
      try {
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
            gc_percentage: projectData.gc_percentage ? parseFloat(projectData.gc_percentage) : 0,
            notes: projectData.notes || null
          })
          .eq('id', projectId);

        if (error) {
          console.error('Error saving project:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('saved'), 2000);
        } else {
          setProject(projectData);
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Error:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('saved'), 2000);
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [projectData, project, projectId]);

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

  const formatCurrencyInput = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const formatCurrencyDisplay = (value) => {
    if (!value) return '$0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate quote totals
  const calculateQuoteTotals = () => {
    const subtotal = quotes.reduce((sum, quote) => sum + (parseFloat(quote.quote_amount) || 0), 0);
    const gcPercentage = parseFloat(projectData.gc_percentage) || 0;
    const gcFee = subtotal * (gcPercentage / 100);
    const total = subtotal + gcFee;

    return {
      subtotal,
      gcFee,
      gcPercentage,
      total
    };
  };

  const handleAddQuote = async () => {
    const code = document.getElementById('quote-code').value;
    const desc = document.getElementById('quote-desc').value;
    const amount = document.getElementById('quote-amount').value;

    if (!desc || !amount) return;

    const { data, error } = await supabase
      .from('quotes')
      .insert([
        {
          project_id: projectId,
          code: code || null,
          description: desc,
          quote_amount: parseFloat(amount)
        }
      ])
      .select();

    if (error) {
      console.error('Error adding quote:', error);
      return;
    }

    setQuotes([...quotes, data[0]].sort((a, b) => {
      if (!a.code || !b.code) return 0;
      return a.code.localeCompare(b.code);
    }));
    document.getElementById('quote-code').value = '';
    document.getElementById('quote-desc').value = '';
    document.getElementById('quote-amount').value = '';
  };

  const handleEditQuote = (quote) => {
    setEditingQuoteId(quote.id);
    setEditQuoteData({
      code: quote.code || '',
      description: quote.description,
      amount: quote.quote_amount.toString()
    });
  };

  const handleSaveQuote = async (quoteId) => {
    if (!editQuoteData.description || !editQuoteData.amount) return;

    const { error } = await supabase
      .from('quotes')
      .update({
        code: editQuoteData.code || null,
        description: editQuoteData.description,
        quote_amount: parseFloat(editQuoteData.amount)
      })
      .eq('id', quoteId);

    if (error) {
      console.error('Error updating quote:', error);
      return;
    }

    const updatedQuotes = quotes.map(q =>
      q.id === quoteId
        ? { ...q, code: editQuoteData.code || null, description: editQuoteData.description, quote_amount: parseFloat(editQuoteData.amount) }
        : q
    ).sort((a, b) => {
      if (!a.code || !b.code) return 0;
      return a.code.localeCompare(b.code);
    });

    setQuotes(updatedQuotes);
    setEditingQuoteId(null);
    setEditQuoteData({ code: '', description: '', amount: '' });
  };

  const handleCancelEdit = () => {
    setEditingQuoteId(null);
    setEditQuoteData({ code: '', description: '', amount: '' });
  };

  // Debounced auto-save for quote changes
  const handleQuickSaveQuote = (quoteId, quoteData) => {
    const saveTimeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('quotes')
          .update({
            code: quoteData.code || null,
            description: quoteData.description,
            quote_amount: parseFloat(quoteData.quote_amount) || 0
          })
          .eq('id', quoteId);

        if (error) {
          console.error('Error saving quote:', error);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setEditInvoiceData({
      description: invoice.description,
      amount: invoice.amount.toString(),
      status: invoice.status
    });
  };

  const handleSaveInvoice = async (invoiceId) => {
    if (!editInvoiceData.description || !editInvoiceData.amount) return;

    const { error } = await supabase
      .from('invoices')
      .update({
        description: editInvoiceData.description,
        amount: parseFloat(editInvoiceData.amount),
        status: editInvoiceData.status
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice:', error);
      return;
    }

    setInvoices(invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, description: editInvoiceData.description, amount: parseFloat(editInvoiceData.amount), status: editInvoiceData.status }
        : inv
    ));

    setEditingInvoiceId(null);
    setEditInvoiceData({ description: '', amount: '', status: '' });
  };

  const handleCancelInvoiceEdit = () => {
    setEditingInvoiceId(null);
    setEditInvoiceData({ description: '', amount: '', status: '' });
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
    const paymentLink = document.getElementById('invoice-payment-link').value;

    if (!desc || !amount) return;

    setUploadingNewInvoice(true);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    let fileUrl = null;
    let fileName = null;

    // Upload file if selected
    if (selectedInvoiceFile) {
      try {
        const fileExt = selectedInvoiceFile.name.split('.').pop();
        const fileStorageName = `${projectId}_${invoiceNumber}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('invoice-files')
          .upload(fileStorageName, selectedInvoiceFile);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Error uploading file: ' + uploadError.message);
          setUploadingNewInvoice(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('invoice-files')
          .getPublicUrl(fileStorageName);

        fileUrl = publicUrl;
        fileName = selectedInvoiceFile.name;
      } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file: ' + error.message);
        setUploadingNewInvoice(false);
        return;
      }
    }

    // Create invoice
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          project_id: projectId,
          invoice_number: invoiceNumber,
          description: desc,
          amount: parseFloat(amount),
          status: status,
          payment_link: paymentLink || null,
          file_url: fileUrl,
          file_name: fileName
        }
      ])
      .select();

    if (error) {
      console.error('Error adding invoice:', error);
      alert('Error adding invoice: ' + error.message);
      setUploadingNewInvoice(false);
      return;
    }

    setInvoices([data[0], ...invoices]);
    document.getElementById('invoice-desc').value = '';
    document.getElementById('invoice-amount').value = '';
    document.getElementById('invoice-payment-link').value = '';
    setSelectedInvoiceFile(null);
    document.getElementById('invoice-file-input').value = '';
    setUploadingNewInvoice(false);
  };

  const handleFileUpload = async (invoiceId, file) => {
    if (!file) return;

    setUploadingInvoiceId(invoiceId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}_${invoiceId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert('Error uploading file: ' + uploadError.message);
        setUploadingInvoiceId(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('invoice-files')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          file_url: publicUrl,
          file_name: file.name
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
        alert('Error saving file reference: ' + updateError.message);
        setUploadingInvoiceId(null);
        return;
      }

      setInvoices(invoices.map(inv =>
        inv.id === invoiceId
          ? { ...inv, file_url: publicUrl, file_name: file.name }
          : inv
      ));

      setUploadingInvoiceId(null);
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file: ' + error.message);
      setUploadingInvoiceId(null);
    }
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

  const totals = calculateQuoteTotals();

  return (
    <div className="App">
      <div className="project-detail-header">
        <button className="back-btn" onClick={() => navigate('/quote-builder')}>← Back</button>
        <h1>{project.name}</h1>
      </div>

      {/* STICKY TABS NAVIGATION */}
      <div className="tabs-navigation">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'project-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('project-info')}
          >
            Project Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quotes')}
          >
            Quotes ({quotes.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="tabs-content">
        {/* PROJECT INFO TAB */}
        {activeTab === 'project-info' && (
          <div className="tab-pane">
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
                  <div className="form-group">
                    <label>GC Percentage (%)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={projectData.gc_percentage || ''}
                      onChange={(e) => setProjectData({ ...projectData, gc_percentage: e.target.value })}
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
              </div>
            </div>
        )}

        {/* QUOTES TAB */}
        {activeTab === 'quotes' && (
          <div className="tab-pane">
            {quotes.length > 0 ? (
              <div className="quotes-table-wrapper">
                <table className="quotes-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th className="amount-col">Amount</th>
                      <th className="actions-col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="editing-row">
                        <td>
                          <input
                            type="text"
                            value={quote.code || ''}
                            onChange={(e) => {
                              const updatedQuotes = quotes.map(q => 
                                q.id === quote.id ? { ...q, code: e.target.value } : q
                              );
                              setQuotes(updatedQuotes);
                              handleQuickSaveQuote(quote.id, { ...quote, code: e.target.value });
                            }}
                            placeholder="Code"
                            className="quote-code-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={quote.description}
                            onChange={(e) => {
                              const updatedQuotes = quotes.map(q => 
                                q.id === quote.id ? { ...q, description: e.target.value } : q
                              );
                              setQuotes(updatedQuotes);
                              handleQuickSaveQuote(quote.id, { ...quote, description: e.target.value });
                            }}
                            placeholder="Description"
                            className="quote-description-input"
                          />
                        </td>
                        <td className="amount-col">
                          <div className="currency-input-wrapper">
                            <span className="currency-symbol">$</span>
                            <input
                              type="text"
                              value={quote.quote_amount ? parseFloat(quote.quote_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                const updatedQuotes = quotes.map(q => 
                                  q.id === quote.id ? { ...q, quote_amount: cleaned } : q
                                );
                                setQuotes(updatedQuotes);
                                handleQuickSaveQuote(quote.id, { ...quote, quote_amount: cleaned });
                              }}
                              placeholder="0.00"
                              className="currency-input"
                            />
                          </div>
                        </td>
                        <td className="actions-col">
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
                              title="Cancel delete"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* QUOTE TOTALS */}
                <div className="quote-totals">
                  <div className="totals-row">
                    <span className="totals-label">Subtotal:</span>
                    <span className="totals-amount">{formatCurrencyDisplay(totals.subtotal)}</span>
                  </div>
                  {totals.gcPercentage > 0 && (
                    <div className="totals-row gc-fee">
                      <span className="totals-label">GC Fee ({totals.gcPercentage.toFixed(2)}%):</span>
                      <span className="totals-amount">{formatCurrencyDisplay(totals.gcFee)}</span>
                    </div>
                  )}
                  <div className="totals-row total">
                    <span className="totals-label">Total:</span>
                    <span className="totals-amount">{formatCurrencyDisplay(totals.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>No quotes yet.</p>
            )}

            {/* ADD QUOTE FORM */}
            <div className="add-quote-form">
              <input
                type="text"
                placeholder="Code (e.g., 10-200)"
                id="quote-code"
                maxLength="50"
              />
              <input
                type="text"
                placeholder="Quote description..."
                id="quote-desc"
              />
              <div className="currency-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  id="quote-amount"
                  onChange={(e) => {
                    const newValue = formatCurrencyInput(e.target.value);
                    e.target.value = newValue;
                  }}
                  className="currency-input"
                />
              </div>
              <button onClick={handleAddQuote}>Add Quote</button>
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="tab-pane">
            {invoices.length > 0 ? (
              <ul>
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="invoice-item">
                    {editingInvoiceId === invoice.id ? (
                      <div className="invoice-edit-mode">
                        <input
                          type="text"
                          value={editInvoiceData.description}
                          onChange={(e) => setEditInvoiceData({ ...editInvoiceData, description: e.target.value })}
                          placeholder="Invoice description"
                        />
                        <div className="currency-input-wrapper">
                          <span className="currency-symbol">$</span>
                          <input
                            type="text"
                            value={editInvoiceData.amount}
                            onChange={(e) => setEditInvoiceData({ ...editInvoiceData, amount: formatCurrencyInput(e.target.value) })}
                            placeholder="0.00"
                            className="currency-input"
                          />
                        </div>
                        <select
                          value={editInvoiceData.status}
                          onChange={(e) => setEditInvoiceData({ ...editInvoiceData, status: e.target.value })}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                        </select>
                        <div className="edit-buttons">
                          <button
                            className="save-btn"
                            onClick={() => handleSaveInvoice(invoice.id)}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={handleCancelInvoiceEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="invoice-header-row">
                          <div className="invoice-info">
                            <strong>Invoice #{invoice.invoice_number}</strong>
                            <p>{invoice.description}</p>
                            <div className="invoice-details">
                              <span className="date">{invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}</span>
                              <span className={`status status-${invoice.status}`}>{invoice.status}</span>
                              <strong className="amount">{formatCurrencyDisplay(invoice.amount)}</strong>
                            </div>

                            {/* PAYMENT LINK */}
                            {invoice.payment_link && (
                              <a
                                href={invoice.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="payment-link-btn"
                              >
                                💳 Pay Now
                              </a>
                            )}

                            {/* FILE UPLOAD & DISPLAY */}
                            <div className="invoice-file-section">
                              <div className="file-display">
                                {invoice.file_name && (
                                  <>
                                    <a
                                      href={invoice.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="file-link"
                                    >
                                      📄 {invoice.file_name}
                                    </a>
                                  </>
                                )}
                              </div>

                              {uploadingInvoiceId === invoice.id ? (
                                <span className="uploading">Uploading...</span>
                              ) : (
                                <label className="file-upload-label">
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      if (e.target.files[0]) {
                                        handleFileUpload(invoice.id, e.target.files[0]);
                                      }
                                    }}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                    style={{ display: 'none' }}
                                  />
                                  📎 {invoice.file_name ? 'Replace File' : 'Attach File'}
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="invoice-actions">
                            <button
                              className="pencil-btn"
                              onClick={() => handleEditInvoice(invoice)}
                              title="Edit invoice"
                            >
                              ✏️
                            </button>
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
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No invoices yet.</p>
            )}

            {/* ADD INVOICE FORM */}
            <div className="add-invoice-form">
              <input
                type="text"
                placeholder="Invoice description..."
                id="invoice-desc"
              />
              <div className="currency-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  id="invoice-amount"
                  onChange={(e) => {
                    const newValue = formatCurrencyInput(e.target.value);
                    e.target.value = newValue;
                  }}
                  className="currency-input"
                />
              </div>
              <input
                type="url"
                placeholder="Payment link (optional)"
                id="invoice-payment-link"
              />
              <select id="invoice-status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
              <label className="invoice-file-input-label">
                <input
                  type="file"
                  id="invoice-file-input"
                  onChange={(e) => setSelectedInvoiceFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                />
                📎 {selectedInvoiceFile ? selectedInvoiceFile.name : 'Choose File (Optional)'}
              </label>
              <button onClick={handleAddInvoice} disabled={uploadingNewInvoice}>
                {uploadingNewInvoice ? 'Adding Invoice...' : 'Add Invoice'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;