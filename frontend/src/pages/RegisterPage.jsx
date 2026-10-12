import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertMessage } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { validateRegister } from '../utils/validation';
import COUNTRIES, { CURRENCIES, defaultCurrencyForCountry } from '../utils/countries';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    countryCode: '', currencyCode: 'USD',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'countryCode' && value) {
        next.currencyCode = defaultCurrencyForCountry(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateRegister(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password,
        form.countryCode || null, form.currencyCode || 'USD');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const fieldMessages = Object.values(err.fieldErrors || {});
      setServerError(fieldMessages.length ? fieldMessages.join(' ') : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (id, label, type = 'text', autoComplete = 'off', placeholder = '') => (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        name={id.replace('register-', '')}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`form-control ${errors[id.replace('register-', '')] ? 'is-invalid' : ''}`}
        value={form[id.replace('register-', '')]}
        onChange={handleChange}
      />
      {errors[id.replace('register-', '')] && (
        <div className="invalid-feedback d-block">{errors[id.replace('register-', '')]}</div>
      )}
    </div>
  );

  return (
    <div className="auth-wrapper bg-light py-5">
      <div className="card p-4 p-sm-5 w-100 shadow-sm border my-auto" style={{ maxWidth: 480 }}>
        <div className="text-center mb-4">
          <div className="sidebar-logo-icon mx-auto mb-2" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
            FT
          </div>
          <h1 className="h4 fw-bold mb-1 text-dark">Create your account</h1>
          <p className="text-secondary small mb-0">Start tracking income, expenses, budgets, and savings goals.</p>
        </div>

        <AlertMessage>{serverError}</AlertMessage>

        <form onSubmit={handleSubmit} noValidate>
          {field('register-name', 'Full name', 'text', 'name', 'e.g. Alex Morgan')}
          {field('register-email', 'Email', 'email', 'email', 'you@example.com')}
          {field('register-password', 'Password (8–72 characters)', 'password', 'new-password', '••••••••')}
          {field('register-confirmPassword', 'Confirm password', 'password', 'new-password', '••••••••')}

          {/* Country selector */}
          <div className="mb-3">
            <label htmlFor="register-countryCode" className="form-label">
              Country <span className="text-secondary fw-normal small">(optional)</span>
            </label>
            <select
              id="register-countryCode"
              name="countryCode"
              className="form-select"
              value={form.countryCode}
              onChange={handleChange}
            >
              <option value="">— Select your country —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Currency selector */}
          <div className="mb-4">
            <label htmlFor="register-currencyCode" className="form-label">Preferred currency</label>
            <select
              id="register-currencyCode"
              name="currencyCode"
              className="form-select"
              value={form.currencyCode}
              onChange={handleChange}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="text-center small mt-4 pt-3 border-top text-secondary">
          Already registered? <Link to="/login" className="fw-semibold text-primary text-decoration-none">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
