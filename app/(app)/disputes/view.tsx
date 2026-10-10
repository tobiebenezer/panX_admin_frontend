'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, ErrorState, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Row = Record<string, any>;

const REASONS: Array<[string, string]> = [
  ['missing_funds', 'Missing funds'],
  ['delayed_payout', 'Delayed payout'],
  ['wrong_amount', 'Wrong amount'],
  ['unauthorized', 'Unauthorized transaction'],
  ['other', 'Other'],
];

const EMPTY_FORM = { transaction_id: '', reason: 'missing_funds', description: '' };

export default function DisputesView() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/disputes');
      setRows(listOf<Row>(data, 'disputes', 'items'));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/disputes', {
        transaction_id: form.transaction_id.trim(),
        reason: form.reason,
        description: form.description,
      });
      toast('success', 'Dispute filed');
      setFormOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Disputes"
        actions={
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={() => setFormOpen(true)}>
            <i className="ti ti-scale fs-16" /> File dispute
          </button>
        }
      />

      <Card title="Dispute History" className="shadow-sm border-0" bodyClassName="p-0">
        {error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            columns={['Reference', 'Transaction', 'Reason', 'Status', 'Opened']}
            rows={rows}
            emptyIcon="ti-scale"
            emptyTitle="No disputes yet"
            emptyHint="File a dispute if something looks wrong with a transaction."
            render={(d) => [
              <span key="ref" className="text-monospace fs-12">{String(d.id || '').slice(0, 13)}…</span>,
              <span key="tx" className="text-monospace fs-12">{String(d.transaction_id || '').slice(0, 13)}…</span>,
              <span key="reason" className="text-capitalize">{String(d.reason || '').replace(/_/g, ' ')}</span>,
              <StatusPill key="st" status={d.status} />,
              <span key="date" className="fs-12 text-muted">{fmtDate(d.created_at, true)}</span>,
            ]}
          />
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => !busy && setFormOpen(false)}
        title="File a dispute"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="disputeForm" className="btn btn-primary btn-sm" disabled={busy}>
              <i className="ti ti-send me-1" /> Submit dispute
            </button>
          </>
        }
      >
        <form id="disputeForm" onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">
              Transaction ID <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control font-monospace"
              placeholder="UUID of the transaction"
              required
              value={form.transaction_id}
              onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Reason</label>
            <select
              className="form-select w-100"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            >
              {REASONS.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">
              What happened? <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              minLength={20}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
