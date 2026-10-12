import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi, savingsGoalApi } from '../api/services';
import BudgetProgress from '../components/BudgetProgress';
import { AlertMessage, EmptyState, LoadingSpinner, MonthSelect, StatCard } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, recentMonths, titleCase, toMonthString } from '../utils/format';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
  IconSavings,
  IconShield,
  IconPlus,
} from '../components/icons';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#eab308'];

export default function DashboardPage() {
  const { user, currencyCode } = useAuth();
  const [month, setMonth] = useState(toMonthString());
  const [data, setData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    dashboardApi.get(month)
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message || 'Cannot reach the server. Check that the backend is running and try again.'); })
      .finally(() => { if (active) setLoading(false); });

    // Load savings goals for overview if available
    if (savingsGoalApi?.list) {
      savingsGoalApi.list()
        .then((gList) => { if (active && Array.isArray(gList)) setGoals(gList); })
        .catch(() => {});
    }

    return () => { active = false; };
  }, [month]);

  useEffect(() => {
    load();
    const handleTxAdded = () => load();
    window.addEventListener('fintrack:transactionAdded', handleTxAdded);
    return () => window.removeEventListener('fintrack:transactionAdded', handleTxAdded);
  }, [load]);

  const isEmpty = data && Number(data.totalIncome) === 0 && Number(data.totalExpenses) === 0
    && data.recentTransactions.length === 0;

  const comparisonData = data ? [
    { name: 'Income', amount: Number(data.totalIncome) },
    { name: 'Expenses', amount: Number(data.totalExpenses) },
  ] : [];

  const pieData = data ? data.expenseByCategory.map((row) => ({
    name: titleCase(row.category),
    value: Number(row.amount),
  })) : [];

  // Identify categories with warnings or over budget
  const warningBudgets = data?.budgets?.filter((b) => {
    const pct = Number(b.percentUsed || 0);
    return pct >= 75 || b.status === 'WARNING' || b.status === 'EXCEEDED';
  }) || [];

  // Calculate total remaining budget across all budgets
  const totalRemainingBudget = data?.budgets?.reduce((sum, b) => sum + Math.max(0, Number(b.remaining || 0)), 0) || 0;

  return (
    <div>
      {/* Top Banner / Month Selector */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h3 page-title mb-1">
            {user?.name ? `Welcome back, ${user.name}` : 'Dashboard'}
          </h1>
          <p className="text-secondary small mb-0">
            Overview of your financial performance for <span className="fw-semibold text-dark">{month}</span>.
          </p>
        </div>
        <div style={{ minWidth: 200 }}>
          <MonthSelect id="dashboard-month" value={month} options={recentMonths(12)} onChange={setMonth} />
        </div>
      </div>

      {loading && <LoadingSpinner label="Loading dashboard..." />}

      {error && (
        <AlertMessage>
          {error}{' '}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={load}>Try again</button>
        </AlertMessage>
      )}

      {data && !loading && isEmpty && (
        <EmptyState
          title="No activity for this month yet"
          message="Add an income or expense to start seeing totals, charts, and budget progress."
          action={<Link to="/transactions" className="btn btn-primary">Add a transaction</Link>}
        />
      )}

      {data && !loading && !isEmpty && (
        <>
          {/* Smart Budget Warning Alert Banner */}
          {warningBudgets.length > 0 && (
            <div className="mb-4">
              <div className="smart-alert-card danger shadow-xs">
                <IconAlertTriangle size={22} className="text-danger flex-shrink-0 mt-1" />
                <div className="flex-grow-1">
                  <div className="fw-bold text-dark mb-1">Smart Budget Alert</div>
                  <div className="small text-secondary mb-2">
                    {warningBudgets.length} {warningBudgets.length === 1 ? 'category is' : 'categories are'} approaching or exceeding set spending limits for this month:
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {warningBudgets.map((b) => (
                      <span
                        key={b.id}
                        className={`badge-soft ${Number(b.percentUsed) >= 100 ? 'badge-expense' : 'badge-warning'}`}
                      >
                        {titleCase(b.category)}: {b.percentUsed}% ({formatCurrency(b.spent, currencyCode)} / {formatCurrency(b.budgetAmount, currencyCode)})
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/budgets" className="btn btn-sm btn-outline-secondary text-nowrap ms-2">
                  View Budgets
                </Link>
              </div>
            </div>
          )}

          {/* 4 Financial Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-3">
              <StatCard
                label="Income"
                value={formatCurrency(data.totalIncome, currencyCode)}
                tone="text-income"
                icon={<IconArrowUpRight size={22} />}
                subtitle="Earned this month"
              />
            </div>
            <div className="col-md-6 col-xl-3">
              <StatCard
                label="Expenses"
                value={formatCurrency(data.totalExpenses, currencyCode)}
                tone="text-expense"
                icon={<IconArrowDownRight size={22} />}
                subtitle="Spent this month"
              />
            </div>
            <div className="col-md-6 col-xl-3">
              <StatCard
                label="Net savings"
                value={formatCurrency(data.netSavings, currencyCode)}
                tone={Number(data.netSavings) >= 0 ? 'text-income' : 'text-expense'}
                icon={<IconShield size={22} />}
                subtitle={Number(data.netSavings) >= 0 ? 'Surplus retained' : 'Deficit spent'}
              />
            </div>
            <div className="col-md-6 col-xl-3">
              <StatCard
                label="Remaining Budget"
                value={formatCurrency(totalRemainingBudget, currencyCode)}
                tone="text-dark"
                icon={<IconAlertTriangle size={22} />}
                subtitle={`${data.budgets.length} budget limit${data.budgets.length === 1 ? '' : 's'}`}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-3 mb-4">
            {/* Income vs Expenses Bar Chart */}
            <div className="col-lg-6">
              <div className="card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h6 fw-bold mb-0">Income vs expenses</h2>
                  <span className="badge text-bg-light border text-secondary small">Comparison</span>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis tickFormatter={(v) => formatCurrency(v, currencyCode)} width={90} stroke="#94a3b8" />
                      <Tooltip formatter={(v) => formatCurrency(v, currencyCode)} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Expenses by Category Pie / Donut Chart */}
            <div className="col-lg-6">
              <div className="card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h6 fw-bold mb-0">Expenses by category</h2>
                  <span className="badge text-bg-light border text-secondary small">Breakdown</span>
                </div>
                {pieData.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-secondary">
                    <p className="small mb-0">No expenses recorded for this month.</p>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          label={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v, currencyCode)} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Savings Goals Overview Widget */}
          {goals.length > 0 && (
            <div className="card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <IconSavings size={20} className="text-primary" />
                  <h2 className="h6 fw-bold mb-0">Savings Goals Overview</h2>
                </div>
                <Link to="/savings-goals" className="btn btn-sm btn-outline-secondary">
                  Manage Goals ({goals.length})
                </Link>
              </div>
              <div className="row g-3">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(Number(g.percentSaved || 0), 100);
                  return (
                    <div className="col-md-4" key={g.id}>
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span className="text-dark text-truncate">{g.name}</span>
                          <span className="text-primary">{g.percentSaved}%</span>
                        </div>
                        <div className="progress progress-modern mb-2">
                          <div className={`progress-bar ${g.completed ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="d-flex justify-content-between small text-secondary" style={{ fontSize: '0.75rem' }}>
                          <span>{formatCurrency(g.currentAmount, currencyCode)}</span>
                          <span>of {formatCurrency(g.targetAmount, currencyCode)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lower Grid: Budgets & Recent Transactions */}
          <div className="row g-3">
            {/* Budget Utilization Section */}
            <div className="col-lg-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 fw-bold mb-0">Budget utilization</h2>
                <Link to="/budgets" className="small text-decoration-none">View all budgets</Link>
              </div>
              {data.budgets.length === 0 ? (
                <div className="card p-4 text-center">
                  <p className="text-secondary small mb-2">
                    No budgets configured for this month.
                  </p>
                  <div>
                    <Link to="/budgets" className="btn btn-sm btn-outline-primary">
                      <IconPlus size={14} /> Set a Budget
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {data.budgets.map((budget) => <BudgetProgress key={budget.id} budget={budget} />)}
                </div>
              )}
            </div>

            {/* Recent Transactions Section */}
            <div className="col-lg-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 fw-bold mb-0">Recent transactions</h2>
                <Link to="/transactions" className="small text-decoration-none">View all</Link>
              </div>
              <div className="card p-0 overflow-hidden shadow-xs">
                <ul className="list-group list-group-flush">
                  {data.recentTransactions.map((tx) => (
                    <li key={tx.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                      <div>
                        <div className="fw-semibold text-dark">{tx.title}</div>
                        <div className="small text-secondary">
                          <span className="badge text-bg-light border me-1">{titleCase(tx.category)}</span>
                          · {formatDate(tx.transactionDate)}
                        </div>
                      </div>
                      <span className={`fw-bold ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'INCOME' ? '+' : '−'}{formatCurrency(tx.amount, currencyCode)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
