import { useEffect, useState } from 'react';
import { categoryApi, transactionApi } from '../api/services';
import TransactionForm from './TransactionForm';
import { IconX } from './icons';

export default function QuickAddModal({ open, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      setServerError('');
      categoryApi.list()
        .then(setCategories)
        .catch(() => setServerError('Could not load categories. Please check your connection.'));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setServerError('');
    try {
      await transactionApi.create(payload);
      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setSubmitting(false);
      setServerError(err.response?.data?.message || err.message || 'Could not save transaction.');
    }
  };

  return (
    <div className="modal-backdrop-custom" role="presentation">
      <div className="modal-panel-modern" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h2 id="quick-add-title" className="h5 fw-bold mb-0 text-dark">Quick Add Transaction</h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-circle"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            <IconX size={18} />
          </button>
        </div>

        <TransactionForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitting={submitting}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
