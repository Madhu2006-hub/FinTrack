import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertMessage } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import COUNTRIES, { CURRENCIES, defaultCurrencyForCountry } from '../utils/countries';
import { IconProfile, IconShield, IconLogOut } from '../components/icons';

export default function ProfilePage() {
  const { user, logout, updatePreferences, currencyCode } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    countryCode: user?.countryCode || '',
    currencyCode: user?.currencyCode || 'USD',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updatePreferences(form.countryCode || null, form.currencyCode || 'USD');
      setSuccess('Preferences updated successfully. Currency formatting will update across the app.');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const countryName = COUNTRIES.find((c) => c.code === user?.countryCode)?.name;
  const currencyEntry = CURRENCIES.find((c) => c.code === currencyCode);
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'FT';

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="mb-4">
        <h1 className="h3 page-title mb-1">Account & Preferences</h1>
        <p className="text-secondary small mb-0">Manage your profile information and localized currency preferences.</p>
      </div>

      {/* User Header Profile Card */}
      <div className="card p-4 mb-4 shadow-xs">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs"
            style={{ width: 56, height: 56, backgroundColor: '#1e3a8a', fontSize: '1.25rem' }}
          >
            {initials}
          </div>
          <div>
            <h2 className="h5 fw-bold mb-0 text-dark">{user?.name || 'User Account'}</h2>
            <div className="small text-secondary">{user?.email}</div>
          </div>
        </div>
      </div>

      <AlertMessage variant="success" onClose={() => setSuccess('')}>{success}</AlertMessage>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>

      {/* Preferences Card */}
      <div className="card p-4 mb-4 shadow-xs">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <IconProfile size={18} className="text-primary" />
            <h2 className="h6 fw-bold mb-0 text-dark">Currency & Regional Preferences</h2>
          </div>
          {!editing && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => { setEditing(true); setSuccess(''); }}
            >
              Change currency preferences
            </button>
          )}
        </div>

        {!editing ? (
          <dl className="row mb-0">
            <dt className="col-sm-4 text-secondary small">Country</dt>
            <dd className="col-sm-8 fw-semibold text-dark">{countryName || user?.countryCode || 'Not specified'}</dd>

            <dt className="col-sm-4 text-secondary small">Active Currency</dt>
            <dd className="col-sm-8 fw-semibold text-dark">
              {currencyEntry ? `${currencyEntry.code} — ${currencyEntry.name} (${currencyEntry.symbol})` : currencyCode || 'USD'}
            </dd>

            <dt className="col-sm-4 text-secondary small">Currency Behavior</dt>
            <dd className="col-sm-8 text-secondary small">
              All financial figures, transactions, budgets, and goals display in this currency.
            </dd>
          </dl>
        ) : (
          <form onSubmit={handleSave} className="p-3 bg-light rounded-3 border">
            <div className="mb-3">
              <label htmlFor="pref-countryCode" className="form-label">Country</label>
              <select
                id="pref-countryCode"
                name="countryCode"
                className="form-select"
                value={form.countryCode}
                onChange={handleChange}
              >
                <option value="">— None —</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <div className="form-text small">Selecting a country automatically recommends its primary currency.</div>
            </div>

            <div className="mb-3">
              <label htmlFor="pref-currencyCode" className="form-label">Preferred currency</label>
              <select
                id="pref-currencyCode"
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

            <div className="d-flex gap-2 pt-2 border-top">
              <button type="submit" className="btn btn-primary btn-sm px-3" disabled={saving}>
                {saving ? 'Saving...' : 'Save preferences'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => { setEditing(false); setError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security & Session Card */}
      <div className="card p-4 shadow-xs">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <IconShield size={18} className="text-secondary" />
          <h2 className="h6 fw-bold mb-0 text-dark">Security & Session</h2>
        </div>
        <p className="small text-secondary mb-3">
          Your session token is encrypted and stored locally. Logging out revokes access on this browser.
        </p>
        <div>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            <IconLogOut size={16} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
