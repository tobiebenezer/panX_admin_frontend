/* Shared formatters and status vocabulary (port of PAE helpers). */

export function fmtMoney(amount: unknown, currency = 'USD', opts?: Intl.NumberFormatOptions): string {
  let n = typeof amount === 'string' ? parseFloat(amount) : (amount as number);
  if (n === null || n === undefined || isNaN(n)) n = 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      ...opts,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function fmtNum(amount: unknown, decimals?: number): string {
  let n = typeof amount === 'string' ? parseFloat(amount) : (amount as number);
  if (isNaN(n)) n = 0;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals == null ? 8 : decimals }).format(n);
}

export function fmtDate(value: unknown, withTime = false): string {
  if (!value) return '—';
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return String(value);
  return (
    d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    (withTime ? ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '')
  );
}

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function statusTone(status: unknown): Tone {
  const s = String(status || '').toLowerCase();
  if (/^(completed|settled|paid|approved|verified|active|succeeded|published|closed|passed|healthy|resolved|credit)/.test(s)) return 'success';
  if (/^(pending|processing|awaiting|review|in_review|submitted|draft|half_open|degraded|assigned|investigating|open|staged|monitoring)/.test(s)) return 'warning';
  if (/^(failed|rejected|declined|expired|revoked|blocked|suspended|disabled|open_circuit|critical|breach|fraud|escalated|cancelled)/.test(s)) return 'danger';
  if (/^(refunded|reversed|rolled_back|stalled_awaiting_provider)/.test(s)) return 'info';
  return 'neutral';
}

export function statusLabel(status: unknown): string {
  return String(status || 'unknown').replace(/_/g, ' ');
}

export function initials(name: unknown): string {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0] || '')[0] || '?').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();
}

export function qs(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}
