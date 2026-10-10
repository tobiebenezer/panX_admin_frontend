'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, ErrorState, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function StalledTransactionsPage() {
  const { toast } = useToast();
  const [stalled, setStalled] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Intervention Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [action, setAction] = useState<'force_complete' | 'retry' | 'reverse'>('retry');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStalled = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/transactions/stalled')
      .then((res: any) => {
        setStalled(listOf(res, 'transactions', 'items'));
        setError(null);
      })
      .catch((err) => {
        setStalled([]);
        setError(err);
        toast('error', err.message || 'Could not load stalled queue');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadStalled();
  }, [loadStalled]);

  function submitIntervention(e: FormEvent) {
    e.preventDefault();
    if (!selectedTx || !reason.trim()) return;
    setSubmitting(true);
    api
      .post(`/admin/transactions/${encodeURIComponent(selectedTx.id)}/resolve`, {
        action,
        reason: reason.trim(),
      })
      .then((res: any) => {
        toast('success', `Intervention completed: ${res.current_state}`);
        setSelectedTx(null);
        setReason('');
        loadStalled();
      })
      .catch((err: any) => {
        toast('error', err.message || 'Intervention failed');
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div>
      <PageHeader
        title="Stalled Transactions"
        actions={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadStalled}>
              <i className="ti ti-refresh me-1" /> Refresh
            </button>
            <Link href="/admin/transactions" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-receipt-2 me-1" /> Ledger
            </Link>
          </div>
        }
      />

      <Card className="shadow-sm border-0">
        {error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            columns={['Transaction ID', 'Corridor', 'Input Amount', 'Output Amount', 'Failure Reason', 'Stalled Since', 'Resolution Actions']}
            rows={stalled}
            render={(st) => [
              <span key="id" className="font-monospace fs-12 text-primary fw-semibold">
                {st.id}
              </span>,
              <span key="c" className="badge bg-light text-dark border">
                {st.input_asset_or_currency} → {st.output_currency}
              </span>,
              <span key="in" className="fw-semibold">
                {st.input_amount} {st.input_asset_or_currency}
              </span>,
              <span key="out" className="text-success fw-semibold">
                {st.output_amount} {st.output_currency}
              </span>,
              <span key="r" className="text-danger fs-12">
                {st.failure_reason || st.failure_code || 'Provider timeout (awaiting callback)'}
              </span>,
              <span key="d" className="text-muted fs-12">
                {fmtDate(st.updated_at || st.created_at)}
              </span>,
              <div key="act" className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-ghost-success btn-icon btn-sm"
                  onClick={() => {
                    setSelectedTx(st);
                    setAction('force_complete');
                  }}
                  title="Force Complete (Mark Paid)"
                >
                  <i className="ti ti-check fs-lg" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-warning btn-icon btn-sm"
                  onClick={() => {
                    setSelectedTx(st);
                    setAction('retry');
                  }}
                  title="Retry Provider Payout"
                >
                  <i className="ti ti-refresh fs-lg" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost-danger btn-icon btn-sm"
                  onClick={() => {
                    setSelectedTx(st);
                    setAction('reverse');
                  }}
                  title="Reverse & Refund"
                >
                  <i className="ti ti-arrow-back-up fs-lg" />
                </button>
              </div>,
            ]}
          />
        )}
      </Card>

      {/* Intervention Modal */}
      {selectedTx && (
        <Modal
          title={`Intervene: Transaction ${selectedTx.id}`}
          open={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
        >
          <form onSubmit={submitIntervention}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Intervention Action</label>
              <select
                className="form-select"
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
              >
                <option value="retry">Retry Provider (Attempts payout through alternate route)</option>
                <option value="force_complete">Force Complete (Customer received funds outside automated pipeline)</option>
                <option value="reverse">Reverse & Refund (Return funds to sender wallet/bank)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Administrative Audit Justification</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Reason for this exception resolution (e.g. verified on bank portal, partner confirmed failure)…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
                className={`btn btn-sm ${action === 'reverse' ? 'btn-danger' : 'btn-primary'}`}
                disabled={submitting}
              >
                {submitting ? 'Executing…' : 'Confirm Intervention'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
