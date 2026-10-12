import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { dashboardApi } from '../api/services';
import DashboardPage from './DashboardPage';

vi.mock('../api/services', () => ({
  dashboardApi: { get: vi.fn() },
  savingsGoalApi: { list: vi.fn().mockResolvedValue([]) },
}));

const emptySummary = {
  month: '2026-10', totalIncome: 0, totalExpenses: 0, netSavings: 0,
  expenseByCategory: [], recentTransactions: [], budgets: [],
};

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading indicator while the request is in flight', () => {
    dashboardApi.get.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard...');
  });

  it('shows the API error with a retry action', async () => {
    dashboardApi.get.mockRejectedValue({ message: 'Cannot reach the server. Check that the backend is running and try again.' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(dashboardApi.get).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state with a call to action when the month has no activity', async () => {
    dashboardApi.get.mockResolvedValue(emptySummary);
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(await screen.findByText('No activity for this month yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add a transaction' })).toHaveAttribute('href', '/transactions');
  });

  it('requests the selected month from the backend', async () => {
    dashboardApi.get.mockResolvedValue(emptySummary);
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => expect(dashboardApi.get).toHaveBeenCalledTimes(1));
    expect(dashboardApi.get.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}$/);
  });
});
