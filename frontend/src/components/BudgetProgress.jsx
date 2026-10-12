import { useAuth } from '../contexts/AuthContext';
import { budgetStatusText, budgetStatusVariant, formatCurrency, titleCase } from '../utils/format';

export default function BudgetProgress({ budget }) {
  const { currencyCode } = useAuth();
  const percent = Math.min(Number(budget.percentUsed), 100);
  const variant = budgetStatusVariant(budget.status, budget.percentUsed);
  const remaining = Number(budget.remaining);
  return (
    <div className="card p-3 h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong className="text-dark">{titleCase(budget.category)}</strong>
        <span className={`badge text-bg-${variant}`}>{budgetStatusText(budget.status, budget.percentUsed)}</span>
      </div>
      <div className="progress progress-thin mb-2" role="progressbar" aria-label={`${titleCase(budget.category)} budget usage`}
           aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-bar bg-${variant}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="small text-secondary">
        Spent {formatCurrency(budget.spent, currencyCode)} of {formatCurrency(budget.budgetAmount, currencyCode)} ·{' '}
        {remaining >= 0 ? `${formatCurrency(remaining, currencyCode)} left` : `${formatCurrency(Math.abs(remaining), currencyCode)} over`}
      </div>
    </div>
  );
}
