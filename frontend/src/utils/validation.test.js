import { validateBudget, validateLogin, validateRegister, validateTransaction } from './validation';

const categories = [
  { name: 'SALARY', type: 'INCOME', label: 'Salary' },
  { name: 'FOOD', type: 'EXPENSE', label: 'Food' },
];

describe('validateTransaction', () => {
  const valid = { title: 'Lunch', amount: '12.50', type: 'EXPENSE', category: 'FOOD', transactionDate: '2026-10-01' };

  it('accepts a complete valid transaction', () => {
    expect(validateTransaction(valid, categories.filter((c) => c.type === 'EXPENSE'))).toEqual({});
  });

  it('rejects zero, negative, and over-precise amounts', () => {
    expect(validateTransaction({ ...valid, amount: '0' }, categories).amount).toMatch(/greater than zero/);
    expect(validateTransaction({ ...valid, amount: '-5' }, categories).amount).toBeDefined();
    expect(validateTransaction({ ...valid, amount: '1.999' }, categories).amount).toMatch(/2 decimal/);
  });

  it('rejects a category that does not match the type', () => {
    const errors = validateTransaction({ ...valid, category: 'SALARY' }, categories.filter((c) => c.type === 'EXPENSE'));
    expect(errors.category).toMatch(/matches the transaction type/);
  });

  it('requires a title and a date', () => {
    const errors = validateTransaction({ ...valid, title: '  ', transactionDate: '' }, categories);
    expect(errors.title).toBeDefined();
    expect(errors.transactionDate).toBeDefined();
  });
});

describe('auth validation', () => {
  it('validates login fields', () => {
    expect(validateLogin({ email: 'bad', password: '' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password is required.',
    });
  });

  it('checks password length and confirmation on register', () => {
    const errors = validateRegister({ name: 'Ana', email: 'ana@example.com', password: 'short', confirmPassword: 'other' });
    expect(errors.password).toMatch(/8 and 72/);
    expect(errors.confirmPassword).toMatch(/do not match/);
  });
});

describe('validateBudget', () => {
  it('requires an expense category and a positive amount', () => {
    const errors = validateBudget({ category: '', month: '2026-10', amount: '0' });
    expect(errors.category).toBeDefined();
    expect(errors.amount).toBeDefined();
  });
});
