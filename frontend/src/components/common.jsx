import { IconAlertTriangle } from './icons';

export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary" role="status">
      <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }} aria-hidden="true" />
      <span className="small fw-semibold">{label}</span>
    </div>
  );
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="card p-4 h-100" style={{ minHeight: height }}>
      <div className="placeholder-glow">
        <span className="placeholder col-6 mb-2" />
        <span className="placeholder col-8 placeholder-lg mb-3" />
        <span className="placeholder col-4" />
      </div>
    </div>
  );
}

export function AlertMessage({ variant = 'danger', children, onClose }) {
  if (!children) return null;
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  return (
    <div
      className={`alert alert-${variant} d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-xs border`}
      role="alert"
    >
      <div className="d-flex align-items-center gap-2">
        {(isDanger || isWarning) && <IconAlertTriangle size={20} className="flex-shrink-0" />}
        <div className="small fw-medium">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close ms-3"
          aria-label="Dismiss alert"
          onClick={onClose}
        />
      )}
    </div>
  );
}

export function EmptyState({ title, message, action, icon }) {
  return (
    <div className="empty-state-card card p-5 text-center my-3">
      <div className="empty-state-icon mx-auto">
        {icon || <IconAlertTriangle size={28} />}
      </div>
      <h2 className="h5 text-dark fw-bold mb-1">{title}</h2>
      <p className="text-secondary small mb-3 mx-auto" style={{ maxWidth: '420px' }}>{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone = '', icon, subtitle }) {
  let iconBg = 'var(--ft-surface-muted)';
  let iconColor = 'var(--ft-text-secondary)';

  if (tone.includes('income')) {
    iconBg = 'var(--ft-income-bg)';
    iconColor = 'var(--ft-income)';
  } else if (tone.includes('expense')) {
    iconBg = 'var(--ft-expense-bg)';
    iconColor = 'var(--ft-expense)';
  } else if (tone.includes('warning')) {
    iconBg = 'var(--ft-warning-bg)';
    iconColor = 'var(--ft-warning)';
  } else if (tone.includes('brand') || tone.includes('primary')) {
    iconBg = 'var(--ft-brand-accent-subtle)';
    iconColor = 'var(--ft-brand-accent)';
  }

  return (
    <div className="stat-card-modern">
      <div className="stat-card-top">
        <span className="stat-label-modern">{label}</span>
        {icon && (
          <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className={`stat-value-modern ${tone}`}>{value}</div>
        {subtitle && <div className="text-secondary small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop-custom" role="presentation">
      <div className="modal-panel-modern" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className="h5 fw-bold mb-2 text-dark">{title}</h2>
        <p className="text-secondary small mb-4">{message}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MonthSelect({ id = 'month', value, options, onChange, label = 'Month' }) {
  return (
    <div>
      {label && <label htmlFor={id} className="form-label small mb-1">{label}</label>}
      <select id={id} className="form-select form-select-sm fw-medium shadow-xs" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
