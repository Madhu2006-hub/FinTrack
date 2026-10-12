import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateTransaction } from '../utils/validation';
import { IconArrowUpRight, IconArrowDownRight } from './icons';

const emptyValues = {
  title: '',
  amount: '',
  type: 'EXPENSE',
  category: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
};

/**
 * Add or edit form. Categories are filtered to the chosen type, and the category resets
 * when the type changes so an invalid pair can't be submitted.
 */
export default function TransactionForm({ initialValues, categories = [], onSubmit, onCancel, submitting, serverError }) {
  const { currencyCode } = useAuth();
  const [values, setValues] = useState({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({ ...emptyValues, ...initialValues });
    setErrors({});
  }, [initialValues]);

  const typeCategories = categories.filter((c) => c.type === values.type);

  const handleTypeChange = (newType) => {
    const stillValid = categories.some((c) => c.type === newType && c.name === values.category);
    setValues((prev) => ({
      ...prev,
      type: newType,
      category: stillValid ? prev.category : '',
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'type') {
      handleTypeChange(value);
      return;
    }
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateTransaction(values, typeCategories);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      title: values.title.trim(),
      amount: Number(values.amount),
      type: values.type,
      category: values.category,
      transactionDate: values.transactionDate,
      description: values.description?.trim() || null,
    });
  };

  const isEdit = Boolean(initialValues?.id);

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit transaction' : 'Add transaction'}>
      {serverError && (
        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
          {serverError}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-3">
          <label htmlFor="tx-type" className="form-label">Type</label>
          <select
            id="tx-type"
            name="type"
            className="form-select"
            value={values.type}
            onChange={handleChange}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>

        <div className="col-md-5">
          <label htmlFor="tx-title" className="form-label">Title</label>
          <input
            id="tx-title"
            name="title"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            placeholder="e.g. Weekly Groceries"
            value={values.title}
            onChange={handleChange}
            maxLength={120}
          />
          {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="tx-amount" className="form-label">Amount</label>
          <div className="input-group">
            <span className="input-group-text">{currencyCode || 'USD'}</span>
            <input
              id="tx-amount"
              name="amount"
              inputMode="decimal"
              className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
              placeholder="0.00"
              value={values.amount}
              onChange={handleChange}
            />
          </div>
          {errors.amount && <div className="invalid-feedback d-block">{errors.amount}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="tx-category" className="form-label">Category</label>
          <select
            id="tx-category"
            name="category"
            className={`form-select ${errors.category ? 'is-invalid' : ''}`}
            value={values.category}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            {typeCategories.map((c) => (
              <option key={c.name} value={c.name}>{c.label}</option>
            ))}
          </select>
          {errors.category && <div className="invalid-feedback d-block">{errors.category}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="tx-date" className="form-label">Date</label>
          <input
            id="tx-date"
            type="date"
            name="transactionDate"
            className={`form-control ${errors.transactionDate ? 'is-invalid' : ''}`}
            value={values.transactionDate}
            onChange={handleChange}
          />
          {errors.transactionDate && <div className="invalid-feedback d-block">{errors.transactionDate}</div>}
        </div>

        <div className="col-12">
          <label htmlFor="tx-description" className="form-label">Description (optional)</label>
          <textarea
            id="tx-description"
            name="description"
            rows={2}
            className="form-control"
            placeholder="Add details, payment method, or notes..."
            value={values.description || ''}
            onChange={handleChange}
            maxLength={500}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
