import { useCallback, useEffect, useState } from 'react';
import { budgetApi, categoryApi } from '../api/services';
import BudgetProgress from '../components/BudgetProgress';
import { AlertMessage, ConfirmDialog, EmptyState, LoadingSpinner, MonthSelect } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, recentMonths, toMonthString, titleCase } from '../utils/format';
import { validateBudget } from '../utils/validation';
import {
  IconBudgets,
  IconPlus,
  IconAlertTriangle,
  IconEdit,
  IconTrash,
} from '../components/icons';

export default function BudgetsPage() {
  const { currencyCode } = useAuth();
  const [month, setMonth] = useState(toMonthString());
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ category: '', amount: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    categoryApi.list('EXPENSE').then(setExpenseCategories).catch(() => setExpenseCategories([]));
  }, []);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    budgetApi.list(month)
      .then((data) => { if (active) setBudgets(data); })
      .catch((err) => { if (active) setError(err.message || 'Failed to load budgets.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  useEffect(() => {
    load();
    const handleTxAdded = () => load();
    window.addEventListener('fintrack:transactionAdded', handleTxAdded);
    return () => window.removeEventListener('fintrack:transactionAdded', handleTxAdded);
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const found = validateBudget({ ...form, month });
    setFormErrors(found);
    setError('');
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await budgetApi.create({ category: form.category, month, amount: Number(form.amount) });
      setNotice('Budget created.');
      setForm({ category: '', amount: '' });
      load();
    } catch (err) {
      setError(err.message || 'Failed to create budget.');
    } finally {
      setSaving(false);
    }
  };

  const saveAmount = async (budget) => {
    const amount = Number(editing.amount);
    if (!(amount > 0)) {
      setError('Budget amount must be greater than zero.');
      return;
    }
    setBusy(true);
    try {
      await budgetApi.updateAmount(budget.id, amount);
      setEditing(null);
      setNotice('Budget updated.');
      load();
    } catch (err) {
      setError(err.message || 'Failed to update budget.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await budgetApi.remove(pendingDelete.id);
      setPendingDelete(null);
      setNotice('Budget deleted.');
      load();
    } catch (err) {
      setError(err.message || 'Failed to delete budget.');
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  // Budget summary metrics
  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.budgetAmount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining || 0), 0);
  const warningBudgets = budgets.filter((b) => {
    const pct = Number(b.percentUsed || 0);
    return pct >= 75 || b.status === 'WARNING' || b.status === 'EXCEEDED';
  });

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h3 page-title mb-1">Budgets</h1>
          <p className="text-secondary small mb-0">
            Monthly spending limits and tracking for <span className="fw-semibold text-dark">{month}</span>.
          </p>
        </div>
        <div style={{ minWidth: 200 }}>
          <MonthSelect id="budget-month" value={month} options={recentMonths(12)} onChange={setMonth} />
        </div>
      </div>

      <AlertMessage variant="success" onClose={() => setNotice('')}>{notice}</AlertMessage>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>

      {/* Smart Budget Alert Banner */}
      {!loading && warningBudgets.length > 0 && (
        <div className="mb-4">
          <div className="smart-alert-card danger shadow-xs">
            <IconAlertTriangle size={22} className="text-danger flex-shrink-0 mt-1" />
            <div className="flex-grow-1">
              <div className="fw-bold text-dark mb-1">Spending Alert for {month}</div>
              <div className="small text-secondary mb-2">
                The following categories are approaching or exceeding your monthly spending limits:
              </div>
              <div className="d-flex flex-wrap gap-2">
                {warningBudgets.map((b) => (
                  <span
                    key={b.id}
                    className={`badge-soft ${Number(b.percentUsed) >= 100 ? 'badge-expense' : 'badge-warning'}`}
                  >
                    {titleCase(b.category)}: {b.percentUsed}% ({formatCurrency(b.spent, currencyCode)} of {formatCurrency(b.budgetAmount, currencyCode)})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {!loading && budgets.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Total Monthly Budget</span>
              <div className="stat-value-modern text-dark">{formatCurrency(totalBudgeted, currencyCode)}</div>
              <div className="text-secondary small mt-1">{budgets.length} budgeted categories</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Total Spent</span>
              <div className="stat-value-modern text-expense">{formatCurrency(totalSpent, currencyCode)}</div>
              <div className="text-secondary small mt-1">
                {totalBudgeted > 0 ? `${Math.round((totalSpent / totalBudgeted) * 100)}% of total budget` : ''}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 h-100">
              <span className="stat-label-modern">Total Remaining</span>
              <div className={`stat-value-modern ${totalRemaining >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(totalRemaining, currencyCode)}
              </div>
              <div className="text-secondary small mt-1">
                {totalRemaining >= 0 ? 'Available balance' : 'Overall deficit'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Form Card */}
      <div className="card p-4 mb-4 shadow-xs">
        <h2 className="h6 fw-bold mb-3 text-dark">Add a budget for {month}</h2>
        <form onSubmit={handleCreate} noValidate className="row g-2 align-items-end">
          <div className="col-md-5">
            <label htmlFor="budget-category" className="form-label small mb-1">Expense category</label>
            <select
              id="budget-category"
              className={`form-select ${formErrors.category ? 'is-invalid' : ''}`}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {expenseCategories.map((c) => (
                <option key={c.name} value={c.name}>{c.label}</option>
              ))}
            </select>
            {formErrors.category && <div className="invalid-feedback d-block">{formErrors.category}</div>}
          </div>
          <div className="col-md-4">
            <label htmlFor="budget-amount" className="form-label small mb-1">Monthly limit ({currencyCode})</label>
            <input
              id="budget-amount"
              inputMode="decimal"
              placeholder="0.00"
              className={`form-control ${formErrors.amount ? 'is-invalid' : ''}`}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            {formErrors.amount && <div className="invalid-feedback d-block">{formErrors.amount}</div>}
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100" disabled={saving}>
              <IconPlus size={16} />
              {saving ? 'Saving...' : 'Add budget'}
            </button>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner label="Loading budgets..." />}

      {!loading && budgets.length === 0 && (
        <EmptyState
          icon={<IconBudgets size={32} />}
          title="No budgets for this month"
          message="Create a monthly limit for a category to track spending and stay on top of your financial health."
        />
      )}

      {!loading && budgets.length > 0 && (
        <div className="row g-3">
          {budgets.map((budget) => (
            <div className="col-md-6 col-xl-4" key={budget.id}>
              <BudgetProgress budget={budget} />
              <div className="d-flex gap-2 mt-2">
                {editing?.id === budget.id ? (
                  <div className="input-group input-group-sm mt-1">
                    <input
                      className="form-control"
                      aria-label="New budget amount"
                      value={editing.amount}
                      onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => saveAmount(budget)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="d-flex gap-2 w-100 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-1 px-2"
                      onClick={() => setEditing({ id: budget.id, amount: String(budget.budgetAmount) })}
                    >
                      <IconEdit size={14} /> Edit limit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-1 px-2"
                      onClick={() => setPendingDelete(budget)}
                    >
                      <IconTrash size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete budget?"
        message={pendingDelete
          ? `The ${titleCase(pendingDelete.category)} budget of ${formatCurrency(pendingDelete.budgetAmount, currencyCode)} for ${month} will be removed. Your transactions are not affected.`
          : ''}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={busy}
      />
    </div>
  );
}
