'use client';

/* Shared Paces-styled building blocks used across all pages. */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { statusTone, statusLabel, Tone } from '@/lib/format';

export function StatusPill({ status }: { status: unknown }) {
  const tone: Tone = statusTone(status);
  const bgClass =
    tone === 'success'
      ? 'bg-success-subtle text-success'
      : tone === 'warning'
      ? 'bg-warning-subtle text-warning'
      : tone === 'danger'
      ? 'bg-danger-subtle text-danger'
      : tone === 'info'
      ? 'bg-info-subtle text-info'
      : 'bg-secondary-subtle text-secondary';

  return (
    <span className={`badge ${bgClass} px-2 py-1 fs-12 fw-medium rounded-pill status-pill status-${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

export function EmptyState({
  icon = 'ti-inbox',
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  const iconClass = icon.startsWith('ti-')
    ? `ti ${icon}`
    : icon.startsWith('ti ')
    ? icon
    : `ti ti-${icon}`;

  return (
    <div className="text-center py-5">
      <div
        className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted mx-auto mb-3"
        style={{ width: 56, height: 56, fontSize: 24 }}
      >
        <i className={iconClass} />
      </div>
      <h5 className="fs-16 fw-semibold mb-1">{title}</h5>
      {hint ? <p className="text-muted fs-13 mb-0">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error && (error as Error).message ? (error as Error).message : 'Something went wrong';
  return (
    <div className="text-center py-5">
      <div
        className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center mx-auto mb-3"
        style={{ width: 56, height: 56, fontSize: 24 }}
      >
        <i className="ti ti-alert-triangle" />
      </div>
      <h5 className="fs-16 fw-semibold text-danger mb-1">Could not load data</h5>
      <p className="text-muted fs-13 mb-0">{msg}</p>
    </div>
  );
}

export function Skeleton({ width }: { width?: string | number }) {
  return <div className="skeleton-line" style={width ? { width } : undefined} />;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-title-head d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <div className="flex-grow-1">
        <div className="d-flex align-items-center gap-2">
          <h4 className="page-main-title m-0 fs-20 fw-bold text-dark">{title}</h4>
          {badge}
        </div>
        {subtitle && <p className="text-muted fs-12 mb-0 mt-1">{subtitle}</p>}
      </div>
      {actions ? <div className="text-end d-flex align-items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  bodyClassName,
  className,
  headerClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <div className={`card${className ? ' ' + className : ''}`}>
      {title || actions ? (
        <div className={`card-header d-flex justify-content-between align-items-center border-0 py-3 ${headerClassName || ''}`}>
          <div>
            {title ? <h4 className="card-title mb-0 fs-15 fw-semibold">{title}</h4> : null}
            {subtitle ? <p className="text-muted fs-12 mb-0 mt-1">{subtitle}</p> : null}
          </div>
          {actions ? <div className="card-action">{actions}</div> : null}
        </div>
      ) : null}
      <div className={`card-body${bodyClassName ? ' ' + bodyClassName : ''}`}>{children}</div>
    </div>
  );
}

export interface Column<T> {
  label: string;
}

export function DataTable<T>({
  columns,
  rows,
  render,
  emptyIcon,
  emptyTitle,
  emptyHint,
}: {
  columns: string[];
  rows: T[] | null;
  render: (row: T) => ReactNode[];
  emptyIcon?: string;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  if (!rows) return <Skeleton width="90%" />;
  if (!rows.length)
    return (
      <EmptyState
        icon={emptyIcon || 'ti-inbox'}
        title={emptyTitle || 'Nothing here yet'}
        hint={emptyHint || 'New activity will appear automatically.'}
      />
    );
  return (
    <div className="table-responsive">
      <table className="table table-hover table-centered mb-0 align-middle">
        <thead className="table-light">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-uppercase fs-12 fw-semibold text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {render(row).map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Bootstrap-styled modal rendered with React state (no bootstrap JS). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1050 }} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered" style={width ? { maxWidth: width } : undefined}>
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header border-bottom py-3 px-4">
              <h5 className="modal-title fs-16 fw-semibold">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body p-4">{children}</div>
            {footer ? <div className="modal-footer border-top py-3 px-4">{footer}</div> : null}
          </div>
        </div>
      </div>
    </>
  );
}

/* One-time-code input group (MFA / verification codes). */
export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] || '');

  function setChar(i: number, ch: string) {
    const next = chars.slice();
    next[i] = ch;
    onChange(next.join('').slice(0, length));
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  }

  return (
    <div className="otp-group mb-3 d-flex gap-2 justify-content-center">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="form-control text-center fs-18 fw-bold"
          style={{ width: 46, height: 48 }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={c}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => setChar(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (text) {
              e.preventDefault();
              onChange(text);
              refs.current[Math.min(text.length, length - 1)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

/* Animated number counter. */
export function CountUp({
  value,
  duration = 900,
  format,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(initial + (value - initial) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}

export function AvatarInitials({
  text,
  src,
  className,
  size = 34,
}: {
  text: string;
  src?: string;
  className?: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const parts = String(text || '?').trim().split(/\s+/);
  const ini = ((parts[0] || '')[0] || '?').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={text}
        className={`rounded-circle object-fit-cover border ${className || 'avatar-sm'}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className={`rounded-circle bg-primary-subtle text-primary fw-bold d-inline-flex align-items-center justify-content-center ${
        className || 'avatar-sm'
      }`}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) }}
    >
      {ini}
    </span>
  );
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = 'items',
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis if needed
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3 border-top bg-light bg-opacity-25 fs-12">
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted">
          Showing <span className="fw-semibold text-dark">{startItem}</span> to{' '}
          <span className="fw-semibold text-dark">{endItem}</span> of{' '}
          <span className="fw-semibold text-dark">{totalItems}</span> {itemLabel}
        </span>
        {onPageSizeChange && (
          <div className="d-inline-flex align-items-center gap-1 text-muted">
            <span>Per page:</span>
            <select
              className="form-select form-select-sm py-0 ps-2 pe-4 fs-11"
              style={{ width: 'auto', minWidth: 62 }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm m-0 gap-1 align-items-center">
          <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link border rounded-2 px-2 py-1 d-flex align-items-center gap-1"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{ color: currentPage <= 1 ? '#94A3B8' : '#16B364' }}
            >
              <i className="ti ti-chevron-left" />
              <span className="d-none d-sm-inline">Prev</span>
            </button>
          </li>

          {getPageNumbers().map((p, idx) => (
            <li key={idx} className={`page-item ${p === currentPage ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}>
              {p === '...' ? (
                <span className="page-link border-0 text-muted px-2 py-1">…</span>
              ) : (
                <button
                  type="button"
                  className={`page-link border rounded-2 px-2 py-1 ${
                    p === currentPage ? 'text-white fw-semibold' : 'text-dark'
                  }`}
                  style={
                    p === currentPage
                      ? { backgroundColor: '#16B364', borderColor: '#16B364' }
                      : undefined
                  }
                  onClick={() => onPageChange(Number(p))}
                >
                  {p}
                </button>
              )}
            </li>
          ))}

          <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link border rounded-2 px-2 py-1 d-flex align-items-center gap-1"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{ color: currentPage >= totalPages ? '#94A3B8' : '#16B364' }}
            >
              <span className="d-none d-sm-inline">Next</span>
              <i className="ti ti-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

