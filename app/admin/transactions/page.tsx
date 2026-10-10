'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import { Card, DataTable, ErrorState, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

import { TransactionsAnalyticsView } from '@/components/admin/transactions/TransactionsAnalyticsView';

type ResolutionAction = 'force_complete' | 'retry' | 'reverse';

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ledger' | 'analytics'>('ledger');

  const [transactions, setTransactions] = useState<any[] | null>(null);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Resolution Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [resolutionAction, setResolutionAction] = useState<ResolutionAction>('force_complete');
  const [resolutionReason, setResolutionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [detailTx, setDetailTx] = useState<any | null>(null);

  const loadTransactions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (stateFilter) params.set('state', stateFilter);
    params.set('limit', '50');

    api
      .get(`/admin/transactions?${params.toString()}`)
      .then((res: any) => {
        setTransactions(res.items || []);
        setTotal(res.total || 0);
        setError(null);
      })
      .catch((err) => {
        setTransactions([]);
        setError(err);
        toast('error', err.message || 'Could not load transactions ledger');
      })
      .finally(() => setLoading(false));
  }, [searchQuery, stateFilter, toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function openResolution(tx: any, action: ResolutionAction) {
    setSelectedTx(tx);
    setResolutionAction(action);
    setResolutionReason('');
  }

  function submitResolution(e: FormEvent) {
    e.preventDefault();
    if (!selectedTx || !resolutionReason.trim()) {
      toast('error', 'Please provide a valid administrative reason');
      return;
    }
    setSubmitting(true);
    api
      .post(`/admin/transactions/${encodeURIComponent(selectedTx.id)}/resolve`, {
        action: resolutionAction,
        reason: resolutionReason.trim(),
      })
      .then((res: any) => {
        toast('success', `Transaction successfully updated to ${res.current_state}`);
        setSelectedTx(null);
        setResolutionReason('');
        loadTransactions();
      })
      .catch((err: any) => {
        toast('error', err.message || 'Resolution failed');
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadTransactions}>
              <i className="ti ti-refresh me-1" /> Refresh
            </button>
            <Link href="/admin/transactions/stalled" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-alert-triangle me-1" /> Stalled Queue
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-bottom">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold px-3 py-2 border-0 border-bottom border-2 ${
              activeTab === 'ledger' ? 'border-primary text-primary' : 'text-muted border-transparent'
            }`}
            onClick={() => setActiveTab('ledger')}
          >
            <i className="ti ti-list me-2" /> Global Ledger
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold px-3 py-2 border-0 border-bottom border-2 ${
              activeTab === 'analytics' ? 'border-primary text-primary' : 'text-muted border-transparent'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="ti ti-chart-dots me-2" /> Volume & Velocity Analytics
          </button>
        </li>
      </ul>

      {activeTab === 'analytics' ? (
        <TransactionsAnalyticsView />
      ) : (
        <Card className="shadow-sm border-0 mb-4">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <div className="d-flex flex-wrap gap-2 flex-grow-1" style={{ maxWidth: 640 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="search"
                className="form-control bg-light border-0"
                placeholder="Search by Transaction ID, Quote ID, Sender Email, or Recipient Name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={loadTransactions}>
                Search
              </button>
            </div>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              <option value="completed">Completed</option>
              <option value="payout_pending">Payout Pending</option>
              <option value="stalled_awaiting_provider">Stalled (Awaiting Provider)</option>
              <option value="deposit_detected">Deposit Detected</option>
              <option value="awaiting_deposit">Awaiting Deposit</option>
              <option value="refund_pending">Refund Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
              <option value="manual_review">Manual Review</option>
            </select>
          </div>
        </div>

        {error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            columns={['Transaction', 'Corridor & Asset', 'Input Amount', 'Output Amount', 'Customer', 'Status', 'Date', 'Interventions']}
            rows={transactions}
            render={(tx) => [
              <div key="t" className="d-flex flex-column">
                <button
                  type="button"
                  className="btn btn-link p-0 text-start font-monospace fs-12 fw-semibold text-primary text-decoration-none"
                  onClick={() => setDetailTx(tx)}
                >
                  {tx.id ? tx.id.slice(0, 13) + '…' : '—'}
                </button>
                <span className="text-muted fs-11">{tx.payout_mode || 'standard'}</span>
              </div>,
              <div key="c" className="d-flex flex-column">
                <span className="badge bg-light text-dark border">{tx.corridor_code || 'FX Corridor'}</span>
                <span className="text-muted fs-11">{tx.destination_type || 'bank_transfer'}</span>
              </div>,
              <span key="in" className="fw-semibold">
                {tx.input_amount} {tx.input_asset}
              </span>,
              <span key="out" className="text-success fw-semibold">
                {tx.output_amount} {tx.output_currency}
              </span>,
              <div key="u" className="d-flex flex-column">
                <span className="fs-12">{tx.user_email || 'Customer'}</span>
                <span className="text-muted fs-11 font-monospace">{tx.user_id ? tx.user_id.slice(0, 8) + '…' : '—'}</span>
              </div>,
              <div key="s" className="d-flex flex-column gap-1">
                <StatusPill status={tx.current_state} />
                {tx.failure_code && <small className="text-danger fs-10">{tx.failure_code}</small>}
              </div>,
              <span key="d" className="text-muted fs-12">
                {fmtDate(tx.created_at)}
              </span>,
              <div key="act" className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-default btn-icon btn-sm"
                  onClick={() => setDetailTx(tx)}
                  title="Inspect Transaction Details"
                >
                  <i className="ti ti-eye fs-lg" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-success btn-icon btn-sm"
                  onClick={() => openResolution(tx, 'force_complete')}
                  title="Force Complete (Mark Paid)"
                >
                  <i className="ti ti-check fs-lg" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-primary btn-icon btn-sm"
                  onClick={() => openResolution(tx, 'retry')}
                  title="Manual Retry Payout"
                >
                  <i className="ti ti-refresh fs-lg" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-danger btn-icon btn-sm"
                  onClick={() => openResolution(tx, 'reverse')}
                  title="Reverse Transaction & Refund"
                >
                  <i className="ti ti-arrow-back-up fs-lg" />
                </button>
              </div>,
            ]}
          />
        )}
      </Card>
      )}

      {/* Transaction Details Inspector Modal */}
      {detailTx && (
        <Modal title={`Transaction Inspector — ${detailTx.id}`} open={Boolean(detailTx)} onClose={() => setDetailTx(null)}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">State & Status</small>
                <StatusPill status={detailTx.current_state} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Corridor Code</small>
                <span className="fw-semibold">{detailTx.corridor_code}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Input Amount</small>
                <span className="fw-bold fs-15 text-dark">{detailTx.input_amount} {detailTx.input_asset}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Output Amount</small>
                <span className="fw-bold fs-15 text-success">{detailTx.output_amount} {detailTx.output_currency}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Sender Email</small>
                <span>{detailTx.user_email || '—'}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Recipient Info</small>
                <span>{detailTx.recipient_name || detailTx.destination_masked || '—'}</span>
              </div>
            </div>
            {detailTx.failure_reason && (
              <div className="col-12">
                <div className="p-3 bg-danger-subtle text-danger rounded-3">
                  <small className="d-block fw-bold mb-1">Failure / Hold Reason</small>
                  <span>{detailTx.failure_reason}</span>
                </div>
              </div>
            )}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => {
                const t = detailTx;
                setDetailTx(null);
                openResolution(t, 'force_complete');
              }}
            >
              Force Complete
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                const t = detailTx;
                setDetailTx(null);
                openResolution(t, 'reverse');
              }}
            >
              Trigger Reversal
            </button>
          </div>
        </Modal>
      )}

      {/* Manual Intervention & Resolution Modal */}
      {selectedTx && (
        <Modal
          title={`Intervention — ${resolutionAction.toUpperCase().replace('_', ' ')}`}
          open={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
        >
          <form onSubmit={submitResolution}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Action to Execute</label>
              <select
                className="form-select"
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value as ResolutionAction)}
              >
                <option value="force_complete">Force Complete (Mark Paid off-chain)</option>
                <option value="retry">Retry Dispatch (Re-submit to provider rail)</option>
                <option value="reverse">Reverse & Refund (Cancel and refund sender)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Verification Reason & Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Specify provider ticket ID, banking reference, or rationale for this intervention…"
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSelectedTx(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-sm ${resolutionAction === 'reverse' ? 'btn-danger' : 'btn-primary'}`}
                disabled={submitting}
              >
                {submitting ? 'Executing…' : 'Confirm & Execute Intervention'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
