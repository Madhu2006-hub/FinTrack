import { useEffect, useState } from 'react';
import { savingsGoalApi } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { AlertMessage, ConfirmDialog, EmptyState, LoadingSpinner } from '../components/common';
import { formatCurrency, formatDate } from '../utils/format';
import {
  IconSavings,
  IconPlus,
  IconCheckCircle,
  IconDeposit,
  IconWithdraw,
  IconEdit,
  IconTrash,
  IconCalendar,
} from '../components/icons';

const emptyGoalForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
  notes: '',
};

export default function SavingsGoalsPage() {
  const { currencyCode } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState(emptyGoalForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fund Modal (Deposit / Withdraw)
  const [fundModal, setFundModal] = useState({ open: false, type: 'DEPOSIT', goal: null, amount: '' });
  const [fundSubmitting, setFundSubmitting] = useState(false);
  const [fundError, setFundError] = useState('');

  // Delete Dialog
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await savingsGoalApi.list();
      setGoals(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData(emptyGoalForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate || '',
      notes: goal.notes || '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const validateGoalForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Goal name is required.';
    const target = Number(formData.targetAmount);
    if (!formData.targetAmount || isNaN(target) || target <= 0) {
      errs.targetAmount = 'Enter a target amount greater than zero.';
    }
    const current = Number(formData.currentAmount || 0);
    if (isNaN(current) || current < 0) {
      errs.currentAmount = 'Current amount cannot be negative.';
    }
    return errs;
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const errs = validateGoalForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: formData.currentAmount ? Number(formData.currentAmount) : 0,
        targetDate: formData.targetDate || null,
        notes: formData.notes?.trim() || null,
      };

      if (editingGoal) {
        await savingsGoalApi.update(editingGoal.id, payload);
        setNotice('Savings goal updated successfully.');
      } else {
        await savingsGoalApi.create(payload);
        setNotice('Savings goal created successfully.');
      }
      setFormOpen(false);
      await loadGoals();
    } catch (err) {
      setFormErrors({ server: err.response?.data?.message || 'Failed to save savings goal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeposit = (goal) => {
    setFundModal({ open: true, type: 'DEPOSIT', goal, amount: '' });
    setFundError('');
  };

  const openWithdraw = (goal) => {
    setFundModal({ open: true, type: 'WITHDRAW', goal, amount: '' });
    setFundError('');
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(fundModal.amount);
    if (!fundModal.amount || isNaN(amt) || amt <= 0) {
      setFundError('Please enter a valid amount greater than zero.');
      return;
    }

    setFundSubmitting(true);
    setFundError('');
    try {
      if (fundModal.type === 'DEPOSIT') {
        await savingsGoalApi.deposit(fundModal.goal.id, amt);
        setNotice(`Added ${formatCurrency(amt, currencyCode)} to ${fundModal.goal.name}.`);
      } else {
        await savingsGoalApi.withdraw(fundModal.goal.id, amt);
        setNotice(`Withdrew ${formatCurrency(amt, currencyCode)} from ${fundModal.goal.name}.`);
      }
      setFundModal({ open: false, type: 'DEPOSIT', goal: null, amount: '' });
      await loadGoals();
    } catch (err) {
      setFundError(err.response?.data?.message || 'Transaction failed. Please check the amount.');
    } finally {
      setFundSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;
    setDeleteBusy(true);
    try {
      await savingsGoalApi.remove(deletingGoal.id);
      setNotice('Savings goal removed.');
      setDeletingGoal(null);
      await loadGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalSavedAll = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
  const totalTargetAll = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Savings Goals</h1>
          <p className="text-secondary small mb-0">
            Set aside money for future purchases, emergency funds, and long-term milestones.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <IconPlus size={18} /> Create New Goal
        </button>
      </div>

      <AlertMessage variant="success" onClose={() => setNotice('')}>{notice}</AlertMessage>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>

      {/* Summary Highlights */}
      {!loading && goals.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Total Saved</span>
              <div className="stat-value-modern text-income">{formatCurrency(totalSavedAll, currencyCode)}</div>
              <div className="text-secondary small mt-1">Across {goals.length} active goals</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Total Target</span>
              <div className="stat-value-modern text-dark">{formatCurrency(totalTargetAll, currencyCode)}</div>
              <div className="text-secondary small mt-1">Cumulative milestone target</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Goals Completed</span>
              <div className="stat-value-modern text-primary">{completedCount} of {goals.length}</div>
              <div className="text-secondary small mt-1">
                {completedCount === goals.length ? 'All goals reached!' : `${goals.length - completedCount} in progress`}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner label="Loading savings goals..." />}

      {!loading && goals.length === 0 && (
        <EmptyState
          icon={<IconSavings size={32} />}
          title="No savings goals yet"
          message="Create your first goal to track progress toward a vacation, emergency fund, or major milestone."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <IconPlus size={16} /> Create Goal
            </button>
          }
        />
      )}

      {!loading && goals.length > 0 && (
        <div className="row g-4">
          {goals.map((goal) => {
            const percent = Math.min(Number(goal.percentSaved || 0), 100);
            const isCompleted = goal.completed;
            const isOverdue = goal.targetDate && !isCompleted && new Date(goal.targetDate) < new Date();

            return (
              <div className="col-md-6 col-xl-4" key={goal.id}>
                <div className={`card h-100 p-4 ${isCompleted ? 'border-success' : ''}`}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h2 className="h6 fw-bold mb-1 text-dark">{goal.name}</h2>
                      {goal.targetDate && (
                        <div className="d-flex align-items-center gap-1 small text-secondary">
                          <IconCalendar size={14} />
                          <span>Target: {formatDate(goal.targetDate)}</span>
                        </div>
                      )}
                    </div>
                    {isCompleted ? (
                      <span className="badge text-bg-success d-flex align-items-center gap-1 py-1 px-2">
                        <IconCheckCircle size={14} /> Completed
                      </span>
                    ) : isOverdue ? (
                      <span className="badge text-bg-danger py-1 px-2">Overdue</span>
                    ) : (
                      <span className="badge text-bg-light border text-secondary py-1 px-2">
                        {goal.percentSaved}%
                      </span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="my-3">
                    <div className="d-flex justify-content-between align-items-baseline mb-1">
                      <span className="h4 fw-bold mb-0 text-dark">
                        {formatCurrency(goal.currentAmount, currencyCode)}
                      </span>
                      <span className="small text-secondary">
                        of {formatCurrency(goal.targetAmount, currencyCode)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress progress-modern mb-2" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="d-flex justify-content-between small text-secondary">
                      <span>{isCompleted ? 'Target reached!' : `${formatCurrency(goal.remainingAmount, currencyCode)} remaining`}</span>
                      <span>{goal.percentSaved}% saved</span>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-secondary small fst-italic mb-3 bg-light p-2 rounded-2">
                      "{goal.notes}"
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto pt-3 border-top d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => openDeposit(goal)}
                        title="Add funds"
                      >
                        <IconDeposit size={14} /> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openWithdraw(goal)}
                        disabled={Number(goal.currentAmount) <= 0}
                        title="Withdraw funds"
                      >
                        <IconWithdraw size={14} /> Withdraw
                      </button>
                    </div>

                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary p-1 px-2"
                        onClick={() => openEditModal(goal)}
                        title="Edit goal"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1 px-2"
                        onClick={() => setDeletingGoal(goal)}
                        title="Delete goal"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {formOpen && (
        <div className="modal-backdrop-custom" role="presentation">
          <div className="modal-panel-modern" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
            <h2 id="goal-modal-title" className="h5 fw-bold mb-3 text-dark">
              {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
            </h2>

            {formErrors.server && (
              <div className="alert alert-danger py-2 small rounded-3">{formErrors.server}</div>
            )}

            <form onSubmit={handleSaveGoal} noValidate>
              <div className="mb-3">
                <label htmlFor="goal-name" className="form-label">Goal Name</label>
                <input
                  id="goal-name"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Dream Vacation, New Car"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={120}
                />
                {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="goal-target" className="form-label">Target Amount</label>
                  <div className="input-group">
                    <span className="input-group-text">{currencyCode}</span>
                    <input
                      id="goal-target"
                      inputMode="decimal"
                      className={`form-control ${formErrors.targetAmount ? 'is-invalid' : ''}`}
                      placeholder="10000.00"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    />
                  </div>
                  {formErrors.targetAmount && <div className="invalid-feedback d-block">{formErrors.targetAmount}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="goal-current" className="form-label">Current Saved Amount</label>
                  <div className="input-group">
                    <span className="input-group-text">{currencyCode}</span>
                    <input
                      id="goal-current"
                      inputMode="decimal"
                      className={`form-control ${formErrors.currentAmount ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    />
                  </div>
                  {formErrors.currentAmount && <div className="invalid-feedback d-block">{formErrors.currentAmount}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="goal-date" className="form-label">Target Date (optional)</label>
                <input
                  id="goal-date"
                  type="date"
                  className="form-control"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="goal-notes" className="form-label">Notes (optional)</label>
                <textarea
                  id="goal-notes"
                  rows={2}
                  className="form-control"
                  placeholder="Any details, monthly saving plan, or target notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submitting}>
                  {submitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {fundModal.open && (
        <div className="modal-backdrop-custom" role="presentation">
          <div className="modal-panel-modern" role="dialog" aria-modal="true" aria-labelledby="fund-modal-title">
            <h2 id="fund-modal-title" className="h5 fw-bold mb-1 text-dark">
              {fundModal.type === 'DEPOSIT' ? 'Add Funds to Goal' : 'Withdraw Funds from Goal'}
            </h2>
            <p className="text-secondary small mb-3">
              {fundModal.goal?.name} · Current: {formatCurrency(fundModal.goal?.currentAmount, currencyCode)}
            </p>

            {fundError && <div className="alert alert-danger py-2 small rounded-3">{fundError}</div>}

            <form onSubmit={handleFundSubmit}>
              <div className="mb-4">
                <label htmlFor="fund-amount" className="form-label">Amount</label>
                <div className="input-group">
                  <span className="input-group-text">{currencyCode}</span>
                  <input
                    id="fund-amount"
                    inputMode="decimal"
                    autoFocus
                    className="form-control"
                    placeholder="0.00"
                    value={fundModal.amount}
                    onChange={(e) => setFundModal({ ...fundModal, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setFundModal({ open: false, type: 'DEPOSIT', goal: null, amount: '' })}
                  disabled={fundSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-sm px-4 ${fundModal.type === 'DEPOSIT' ? 'btn-success' : 'btn-primary'}`}
                  disabled={fundSubmitting}
                >
                  {fundSubmitting ? 'Processing...' : fundModal.type === 'DEPOSIT' ? 'Add Funds' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deletingGoal)}
        title="Delete savings goal?"
        message={deletingGoal ? `Are you sure you want to delete "${deletingGoal.name}"? Progress and record for this goal will be removed.` : ''}
        confirmLabel="Delete Goal"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingGoal(null)}
        busy={deleteBusy}
      />
    </div>
  );
}
