import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertMessage } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { validateLogin } from '../utils/validation';

export default function LoginPage() {
  const { login, isAuthenticated, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper bg-light">
      <div className="card p-4 p-sm-5 w-100 shadow-sm border" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div className="sidebar-logo-icon mx-auto mb-2" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
            FT
          </div>
          <h1 className="h4 fw-bold mb-1 text-dark">Welcome back</h1>
          <p className="text-secondary small mb-0">Sign in to your FinTrack personal finance account.</p>
        </div>

        {sessionMessage && <AlertMessage variant="warning">{sessionMessage}</AlertMessage>}
        <AlertMessage>{serverError}</AlertMessage>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center small mt-4 pt-3 border-top text-secondary">
          New to FinTrack? <Link to="/register" className="fw-semibold text-primary text-decoration-none">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
