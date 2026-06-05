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
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editQuoteData, setEditQuoteData] = useState({ description: '', amount: '' });
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        setLoading(false);
        return;
      }

      setProject(projectData);
      document.title = `${projectData.name} - Project Pulse`;

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
        <div>
          <h1>{project.name}</h1>
          <p className="project-meta">Client: {project.client}</p>
        </div>
      </div>

      {/* QUOTES SECTION */}
      <div className="quotes-section">
        <h2>Quotes ({quotes.length})</h2>
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

      {/* INVOICES SECTION */}
      <div className="invoices-section">
        <h2>Invoices ({invoices.length})</h2>
        {invoices.length > 0 ? (
          <ul>
            {invoices.map((invoice) => (
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
    </div>
  );
}

export default ProjectDetail;