import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { authApi } from '../api/services';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

vi.mock('../api/services', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('validates fields before calling the API', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows the backend message for invalid credentials', async () => {
    authApi.login.mockRejectedValue({ status: 401, message: 'Invalid email or password.', fieldErrors: {} });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(localStorage.getItem('fintrack.token')).toBeNull();
  });

  it('stores the token after a successful sign-in', async () => {
    authApi.login.mockResolvedValue({
      token: 'jwt-token', tokenType: 'Bearer', expiresInSeconds: 3600,
      user: { id: 1, name: 'Ana', email: 'ana@example.com' },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(localStorage.getItem('fintrack.token')).toBe('jwt-token'));
  });
});
