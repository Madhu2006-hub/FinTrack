import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from './TransactionForm';

const categories = [
  { name: 'SALARY', type: 'INCOME', label: 'Salary' },
  { name: 'FOOD', type: 'EXPENSE', label: 'Food' },
  { name: 'BILLS', type: 'EXPENSE', label: 'Bills' },
];

describe('TransactionForm', () => {
  it('shows validation errors and does not submit an incomplete form', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Amount is required.')).toBeInTheDocument();
    expect(screen.getByText('Choose a category.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid expense with a numeric amount', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), '  Groceries ');
    await userEvent.type(screen.getByLabelText('Amount'), '42.75');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'FOOD');
    await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Groceries',
      amount: 42.75,
      type: 'EXPENSE',
      category: 'FOOD',
      description: null,
    });
  });

  it('only offers categories for the selected type and clears a mismatched choice', async () => {
    render(<TransactionForm categories={categories} onSubmit={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'BILLS');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'INCOME');

    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.queryByRole('option', { name: 'Bills' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
  });
});
