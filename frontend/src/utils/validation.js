const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = { ...validateLogin({ email, password }) };
  if (!name?.trim()) errors.name = 'Name is required.';
  else if (name.trim().length > 100) errors.name = 'Name must be at most 100 characters.';
  if (password && (password.length < 8 || password.length > 72)) {
    errors.password = 'Password must be between 8 and 72 characters.';
  }
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/** Client-side checks mirror the backend rules. The backend remains the source of truth. */
export function validateTransaction(values, categories) {
  const errors = {};
  if (!values.title?.trim()) errors.title = 'Title is required.';
  else if (values.title.trim().length > 120) errors.title = 'Title must be at most 120 characters.';
  if (!values.amount) errors.amount = 'Amount is required.';
  else if (!AMOUNT_PATTERN.test(String(values.amount))) errors.amount = 'Enter a number with up to 2 decimal places.';
  else if (Number(values.amount) <= 0) errors.amount = 'Amount must be greater than zero.';
  if (!values.type) errors.type = 'Choose income or expense.';
  if (!values.category) errors.category = 'Choose a category.';
  else if (categories && !categories.some((c) => c.name === values.category)) {
    errors.category = 'Choose a category that matches the transaction type.';
  }
  if (!values.transactionDate) errors.transactionDate = 'Date is required.';
  if (values.description && values.description.length > 500) {
    errors.description = 'Description must be at most 500 characters.';
  }
  return errors;
}

export function validateBudget({ category, month, amount }) {
  const errors = {};
  if (!category) errors.category = 'Choose an expense category.';
  if (!month) errors.month = 'Choose a month.';
  if (!amount) errors.amount = 'Budget amount is required.';
  else if (!AMOUNT_PATTERN.test(String(amount)) || Number(amount) <= 0) {
    errors.amount = 'Enter a positive amount with up to 2 decimal places.';
  }
  return errors;
}
