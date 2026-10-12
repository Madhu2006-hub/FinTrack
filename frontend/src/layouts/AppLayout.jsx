import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuickAddModal from '../components/QuickAddModal';
import {
  IconDashboard,
  IconTransactions,
  IconBudgets,
  IconSavings,
  IconReports,
  IconProfile,
  IconPlus,
  IconLogOut,
  IconMenu,
  IconX,
} from '../components/icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/transactions', label: 'Transactions', icon: IconTransactions },
  { to: '/budgets', label: 'Budgets', icon: IconBudgets },
  { to: '/savings-goals', label: 'Savings Goals', icon: IconSavings },
  { to: '/reports', label: 'Reports', icon: IconReports },
  { to: '/profile', label: 'Profile', icon: IconProfile },
];

export default function AppLayout() {
  const { user, currencyCode, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentItem = navItems.find((item) => item.to === location.pathname);
  const pageTitle = currentItem ? currentItem.label : 'FinTrack';

  const handleQuickAddSuccess = () => {
    // Dispatch custom event so pages (Dashboard, Transactions, Budgets) can refresh if needed
    window.dispatchEvent(new CustomEvent('fintrack:transactionAdded'));
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <NavLink to="/dashboard" className="sidebar-brand">
          <div className="sidebar-logo-icon">FT</div>
          <div>
            <div className="sidebar-brand-name">FinTrack</div>
            <div className="text-muted" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Personal Finance</div>
          </div>
        </NavLink>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center justify-content-between">
            <div className="text-truncate me-2">
              <div className="fw-semibold text-white small text-truncate">{user?.name || 'My Account'}</div>
              <div className="small text-muted" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                {user?.email}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary p-1 border-0 text-white-50"
              onClick={handleLogout}
              title="Log out"
            >
              <IconLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Drawer Backdrop */}
      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} role="presentation" />
      )}

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <aside className="mobile-nav-drawer">
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <div className="sidebar-logo-icon" style={{ width: 30, height: 30, fontSize: '0.9rem' }}>FT</div>
              <span className="sidebar-brand-name text-white">FinTrack</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-white p-1"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <IconX size={20} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="d-flex align-items-center justify-content-between">
              <div className="text-truncate me-2">
                <div className="fw-semibold text-white small">{user?.name}</div>
                <div className="small text-muted" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{user?.email}</div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 border-0 text-white-50"
                onClick={handleLogout}
                title="Log out"
              >
                <IconLogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Header */}
        <header className="app-topbar">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-lg-none p-1 px-2"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu size={20} />
            </button>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>

          <div className="topbar-actions">
            {/* Active Currency Badge */}
            <span className="badge text-bg-light border text-secondary px-2 py-1 small fw-semibold" title="Selected Currency">
              {currencyCode || 'USD'}
            </span>

            {/* Quick Add Transaction Button */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setQuickAddOpen(true)}
            >
              <IconPlus size={16} />
              <span className="d-none d-sm-inline">Quick Add</span>
            </button>

            {/* Logout button on desktop */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-none d-md-inline-flex"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}
