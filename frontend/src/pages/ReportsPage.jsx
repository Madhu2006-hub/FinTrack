import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportApi } from '../api/services';
import { AlertMessage, EmptyState, LoadingSpinner, StatCard } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, monthLabel, recentMonths, titleCase } from '../utils/format';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconShield,
  IconCalendar,
} from '../components/icons';

export default function ReportsPage() {
  const { currencyCode } = useAuth();
  const options = recentMonths(24);
  const [to, setTo] = useState(options[0]);
  const [from, setFrom] = useState(options[5]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rangeInvalid = from > to;

  useEffect(() => {
    if (rangeInvalid) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    reportApi.summary(from, to)
      .then((data) => { if (active) setReport(data); })
      .catch((err) => { if (active) setError(err.message || 'Failed to generate report.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [from, to, rangeInvalid]);

  const hasData = report && report.months.some((m) => Number(m.income) > 0 || Number(m.expenses) > 0);
  const chartData = report ? [...report.months].reverse().map((m) => ({
    name: monthLabel(m.month),
    Income: Number(m.income),
    Expenses: Number(m.expenses),
  })) : [];

  const categoryMax = report && report.expenseByCategory.length
    ? Math.max(...report.expenseByCategory.map((c) => Number(c.amount)))
    : 0;

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 page-title mb-1">Reports & Analytics</h1>
        <p className="text-secondary small mb-0">Detailed financial analysis and multi-month trends.</p>
      </div>

      {/* Date Range Selector Card */}
      <div className="card p-3 mb-4 shadow-xs">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-sm-auto d-flex align-items-center gap-2 text-secondary small fw-semibold">
            <IconCalendar size={18} />
            <span>Select Range:</span>
          </div>
          <div className="col-6 col-sm-3 col-md-2">
            <label htmlFor="report-from" className="form-label small mb-1">From Month</label>
            <select
              id="report-from"
              className="form-select form-select-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {options.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-sm-3 col-md-2">
            <label htmlFor="report-to" className="form-label small mb-1">To Month</label>
            <select
              id="report-to"
              className="form-select form-select-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {options.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm text-sm-end text-secondary small">
            Analyzing {report?.months?.length || 0} consecutive months
          </div>
        </div>
      </div>

      {rangeInvalid && <AlertMessage>The "From" month must be on or before the "To" month.</AlertMessage>}
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>
      {loading && <LoadingSpinner label="Building financial analytics..." />}

      {!loading && report && !hasData && (
        <EmptyState
          title="No data in this range"
          message="Add transactions for these months, or select a different date range above."
        />
      )}

      {!loading && report && hasData && (
        <>
          {/* Summary Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <StatCard
                label="Total income"
                value={formatCurrency(report.totalIncome, currencyCode)}
                tone="text-income"
                icon={<IconArrowUpRight size={22} />}
                subtitle="Aggregated period earnings"
              />
            </div>
            <div className="col-md-4">
              <StatCard
                label="Total expenses"
                value={formatCurrency(report.totalExpenses, currencyCode)}
                tone="text-expense"
                icon={<IconArrowDownRight size={22} />}
                subtitle="Aggregated period spending"
              />
            </div>
            <div className="col-md-4">
              <StatCard
                label="Net savings"
                value={formatCurrency(report.netSavings, currencyCode)}
                tone={Number(report.netSavings) >= 0 ? 'text-income' : 'text-expense'}
                icon={<IconShield size={22} />}
                subtitle={Number(report.netSavings) >= 0 ? 'Net period surplus' : 'Net period deficit'}
              />
            </div>
          </div>

          {/* Income & Expenses by Month Bar Chart */}
          <div className="card p-4 mb-4 shadow-xs">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 fw-bold mb-0">Income and expenses by month</h2>
              <span className="badge text-bg-light border text-secondary small">Period Trend</span>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => formatCurrency(v, currencyCode)} width={90} stroke="#94a3b8" />
                  <Tooltip formatter={(v) => formatCurrency(v, currencyCode)} />
                  <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '10px' }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month Comparison & Category Breakdown Grid */}
          <div className="row g-3">
            {/* Monthly Table */}
            <div className="col-lg-7">
              <div className="card p-0 shadow-xs h-100 overflow-hidden">
                <div className="p-3 border-bottom bg-light">
                  <h2 className="h6 fw-bold mb-0 text-dark">Month-to-month comparison</h2>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle table-modern">
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col" className="text-end">Income</th>
                        <th scope="col" className="text-end">Expenses</th>
                        <th scope="col" className="text-end">Net</th>
                        <th scope="col" className="text-end">Expense Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.months.map((m) => {
                        const change = m.expenseChangePercent;
                        const isIncrease = change !== null && Number(change) > 0;
                        const isDecrease = change !== null && Number(change) < 0;

                        return (
                          <tr key={m.month}>
                            <td className="fw-semibold text-dark">{monthLabel(m.month)}</td>
                            <td className="text-end text-income small">{formatCurrency(m.income, currencyCode)}</td>
                            <td className="text-end text-expense small">{formatCurrency(m.expenses, currencyCode)}</td>
                            <td className={`text-end fw-bold ${Number(m.net) >= 0 ? 'text-income' : 'text-expense'}`}>
                              {formatCurrency(m.net, currencyCode)}
                            </td>
                            <td className="text-end">
                              {change === null ? (
                                <span className="text-secondary small">—</span>
                              ) : isIncrease ? (
                                <span className="badge-soft badge-expense">+{change}%</span>
                              ) : isDecrease ? (
                                <span className="badge-soft badge-income">{change}%</span>
                              ) : (
                                <span className="badge-soft text-secondary">0%</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Expenses by Category Breakdown */}
            <div className="col-lg-5">
              <div className="card p-4 shadow-xs h-100">
                <h2 className="h6 fw-bold mb-3 text-dark">Expenses by category</h2>
                {report.expenseByCategory.length === 0 ? (
                  <p className="text-secondary small mb-0">No expenses in this range.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {report.expenseByCategory.map((c) => {
                      const sharePct = categoryMax ? Math.round((Number(c.amount) / categoryMax) * 100) : 0;
                      return (
                        <div key={c.category}>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="fw-semibold text-dark">{titleCase(c.category)}</span>
                            <span className="fw-bold">{formatCurrency(c.amount, currencyCode)}</span>
                          </div>
                          <div
                            className="progress progress-modern"
                            role="progressbar"
                            aria-label={`${titleCase(c.category)} share`}
                            aria-valuenow={sharePct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div className="progress-bar bg-danger" style={{ width: `${sharePct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
