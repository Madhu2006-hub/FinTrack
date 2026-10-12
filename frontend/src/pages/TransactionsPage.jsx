import { useEffect, useState } from 'react';
import { categoryApi, transactionApi } from '../api/services';
import TransactionForm from '../components/TransactionForm';
import { AlertMessage, ConfirmDialog, EmptyState, LoadingSpinner } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, titleCase } from '../utils/format';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowUpRight,
  IconArrowDownRight,
} from '../components/icons';

const PAGE_SIZE = 10;
const emptyFilters = { type: '', category: '', from: '', to: '', search: '' };

export default function TransactionsPage() {
  const { currencyCode } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formInitial, setFormInitial] = useState(undefined);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Listen to external Quick Add events
  useEffect(() => {
    const handleTxAdded = () => setReloadKey((k) => k + 1);
    window.addEventListener('fintrack:transactionAdded', handleTxAdded);
    return () => window.removeEventListener('fintrack:transactionAdded', handleTxAdded);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, size: PAGE_SIZE, sortBy: 'date', direction: 'desc' };
    Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
    transactionApi.list(params)
      .then((data) => { if (active) setResult(data); })
      .catch((err) => { if (active) setError(err.message || 'Failed to fetch transactions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, reloadKey]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const openAdd = () => {
    setEditing(null);
    setFormInitial(undefined);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setFormInitial({
      id: tx.id,
      title: tx.title,
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category,
      transactionDate: tx.transactionDate,
      description: tx.description || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setFormSubmitting(true);
    setFormError('');
    try {
      if (editing) {
        await transactionApi.update(editing.id, payload);
        setNotice('Transaction updated.');
      } else {
        await transactionApi.create(payload);
        setNotice('Transaction added.');
      }
      setFormOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      const fieldMessages = Object.values(err.fieldErrors || {});
      setFormError(fieldMessages.length ? fieldMessages.join(' ') : err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await transactionApi.remove(pendingDelete.id);
      setNotice('Transaction deleted.');
      setPendingDelete(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete transaction.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 page-title mb-1">Transactions</h1>
          <p className="text-secondary small mb-0">Record and review your income and expenses.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <IconPlus size={18} /> Add transaction
        </button>
      </div>

      <AlertMessage variant="success" onClose={() => setNotice('')}>{notice}</AlertMessage>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>

      {/* Add / Edit Form Card */}
      {formOpen && (
        <div className="card p-4 mb-4 border-primary">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0 text-dark">
              {editing ? 'Edit transaction' : 'New transaction'}
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setFormOpen(false)}
            />
          </div>
          <TransactionForm
            initialValues={formInitial}
            categories={categories}
            submitting={formSubmitting}
            serverError={formError}
            onSubmit={handleSave}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card p-3 mb-4 shadow-xs">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label htmlFor="filter-search" className="form-label small mb-1">Search by title</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-secondary">
                <IconSearch size={16} />
              </span>
              <input
                id="filter-search"
                className="form-control border-start-0 ps-0"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. Groceries"
              />
            </div>
          </div>
          <div className="col-6 col-md-2">
            <label htmlFor="filter-type" className="form-label small mb-1">Type</label>
            <select
              id="filter-type"
              className="form-select form-select-sm"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label htmlFor="filter-category" className="form-label small mb-1">Category</label>
            <select
              id="filter-category"
              className="form-select form-select-sm"
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label htmlFor="filter-from" className="form-label small mb-1">From</label>
            <input
              id="filter-from"
              type="date"
              className="form-control form-control-sm"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label htmlFor="filter-to" className="form-label small mb-1">To</label>
            <input
              id="filter-to"
              type="date"
              className="form-control form-control-sm"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
            />
          </div>
          {hasFilters && (
            <div className="col-12 text-end pt-1">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-danger p-0"
                onClick={() => { setSearchInput(''); setFilters(emptyFilters); setPage(0); }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner label="Loading transactions..." />}

      {!loading && result && result.content.length === 0 && (
        <EmptyState
          title={hasFilters ? 'No transactions match these filters' : 'No transactions yet'}
          message={hasFilters ? 'Try widening the date range or clearing a filter.' : 'Add your first income or expense to get started.'}
          action={!hasFilters && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
              <IconPlus size={16} /> Add transaction
            </button>
          )}
        />
      )}

      {!loading && result && result.content.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="d-none d-md-block table-responsive card p-0 shadow-xs mb-3 overflow-hidden">
            <table className="table table-hover align-middle mb-0 table-modern">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '130px' }}>Date</th>
                  <th scope="col">Title & Notes</th>
                  <th scope="col" style={{ width: '150px' }}>Category</th>
                  <th scope="col" className="text-end" style={{ width: '150px' }}>Amount</th>
                  <th scope="col" className="text-end" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.content.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-nowrap small text-secondary">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{tx.title}</div>
                      {tx.description && <div className="small text-secondary text-truncate" style={{ maxWidth: '300px' }}>{tx.description}</div>}
                    </td>
                    <td>
                      <span className="badge text-bg-light border text-secondary">
                        {titleCase(tx.category)}
                      </span>
                    </td>
                    <td className="text-end text-nowrap fw-bold">
                      <span className={`badge-soft ${tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type === 'INCOME' ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
                        {tx.type === 'INCOME' ? '+' : '−'}{formatCurrency(tx.amount, currencyCode)}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary p-1 px-2 me-1"
                        onClick={() => openEdit(tx)}
                        title="Edit"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1 px-2"
                        onClick={() => setPendingDelete(tx)}
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="d-md-none d-flex flex-column gap-2 mb-3">
            {result.content.map((tx) => (
              <div key={tx.id} className="card p-3 shadow-xs">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold text-dark">{tx.title}</div>
                    <div className="small text-secondary">
                      {titleCase(tx.category)} · {formatDate(tx.transactionDate)}
                    </div>
                  </div>
                  <span className={`fw-bold ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'INCOME' ? '+' : '−'}{formatCurrency(tx.amount, currencyCode)}
                  </span>
                </div>
                {tx.description && <div className="small text-secondary mb-2 bg-light p-1 rounded-2">{tx.description}</div>}
                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => openEdit(tx)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => setPendingDelete(tx)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="small text-secondary">
              Page {result.page + 1} of {Math.max(result.totalPages, 1)} · {result.totalElements} total
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page + 1 >= result.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete transaction?"
        message={pendingDelete ? `"${pendingDelete.title}" will be permanently removed.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={deleting}
      />
    </div>
  );
}
