'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { AvatarInitials, Card, DataTable, ErrorState, Modal, PageHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Row = Record<string, any>;

const COUNTRIES = ['NG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'RW', 'CI', 'CM', 'SN', 'US'];
const CURRENCIES = ['NGN', 'KES', 'GHS', 'ZAR', 'TZS', 'UGX', 'RWF', 'XOF', 'XAF', 'USD'];
const CHANNELS: Array<[string, string]> = [
  ['bank_transfer', 'Bank transfer'],
  ['mobile_money', 'Mobile money'],
  ['wallet', 'Wallet credit'],
];

interface FormState {
  alias: string;
  destination_country: string;
  currency: string;
  channel: string;
  account_number: string;
  account_name: string;
}

const EMPTY_FORM: FormState = {
  alias: '',
  destination_country: 'NG',
  currency: 'NGN',
  channel: 'bank_transfer',
  account_number: '',
  account_name: '',
};

export default function BeneficiariesView() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/beneficiaries?limit=100');
      setRows(listOf<Row>(data, 'beneficiaries', 'items'));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(b: Row) {
    setEditingId(String(b.id));
    setForm({
      alias: b.alias ? String(b.alias) : '',
      destination_country: b.destination_country ? String(b.destination_country) : 'NG',
      currency: b.currency ? String(b.currency) : 'NGN',
      channel: b.channel ? String(b.channel) : 'bank_transfer',
      account_number: '',
      account_name: '',
    });
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      alias: form.alias.trim(),
      destination_country: form.destination_country,
      currency: form.currency,
      channel: form.channel,
      account_number: form.account_number.trim(),
      account_name: form.account_name.trim() || null,
    };
    try {
      if (editingId) {
        await api.patch(`/beneficiaries/${encodeURIComponent(editingId)}`, body);
        toast.toast('success', 'Beneficiary updated');
      } else {
        await api.post('/beneficiaries', body);
        toast.toast('success', 'Beneficiary saved');
      }
      setFormOpen(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.toast('error', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this beneficiary?')) return;
    try {
      await api.del(`/beneficiaries/${encodeURIComponent(id)}`);
      load();
    } catch (err: any) {
      toast.toast('error', err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        breadcrumb="Beneficiaries"
        actions={
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={openAdd}>
            <i className="ti ti-user-plus fs-16" /> Add beneficiary
          </button>
        }
      />

      <Card
        title="Saved Recipients"
        className="shadow-sm border-0"
      >
        {error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            columns={['Recipient', 'Destination', 'Channel', 'Account', 'Actions']}
            rows={rows}
            emptyIcon="ti-users"
            emptyTitle="No beneficiaries yet"
            emptyHint="Add a saved payout destination to withdraw and exchange faster."
            render={(b) => [
              <span className="d-flex align-items-center gap-2" key="r">
                <AvatarInitials text={String(b.alias || '')} />
                <strong>{String(b.alias || b.name || '')}</strong>
              </span>,
              <span key="d">
                {String(b.destination_country || '')} · {String(b.currency || '')}
              </span>,
              <span className="text-capitalize" key="c">{String(b.channel || '').replace(/_/g, ' ')}</span>,
              <span className="font-monospace fs-12 text-muted" key="a">{String(b.masked_account || b.masked_destination || '••••')}</span>,
              <div className="d-flex gap-1" key="act">
                <Link
                  href={`/exchange?beneficiary=${b.id}`}
                  className="btn btn-light btn-sm d-inline-flex align-items-center justify-content-center"
                  title="Send"
                  style={{ width: 32, height: 32 }}
                >
                  <i className="ti ti-send text-primary fs-14" />
                </Link>
                <button
                  className="btn btn-light btn-sm d-inline-flex align-items-center justify-content-center"
                  title="Edit"
                  style={{ width: 32, height: 32 }}
                  onClick={() => openEdit(b)}
                >
                  <i className="ti ti-pencil text-secondary fs-14" />
                </button>
                <button
                  className="btn btn-light btn-sm d-inline-flex align-items-center justify-content-center"
                  title="Delete"
                  style={{ width: 32, height: 32 }}
                  onClick={() => remove(String(b.id))}
                >
                  <i className="ti ti-trash text-danger fs-14" />
                </button>
              </div>,
            ]}
          />
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => !busy && setFormOpen(false)}
        title={editingId ? 'Edit Beneficiary' : 'Add Beneficiary'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3"
              disabled={busy}
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="benForm"
              className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1"
              disabled={busy}
            >
              <i className="ti ti-check" /> Save beneficiary
            </button>
          </>
        }
      >
        <form id="benForm" onSubmit={submit}>
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="benAlias" className="form-label">
                Alias / nickname <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="benAlias"
                className="form-control"
                placeholder="Mama Ada"
                required
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="benCountry" className="form-label">Destination country</label>
              <select
                id="benCountry"
                className="form-select"
                value={form.destination_country}
                onChange={(e) => setForm({ ...form, destination_country: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="benCurrency" className="form-label">Currency</label>
              <select
                id="benCurrency"
                className="form-select"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="benChannel" className="form-label">Channel</label>
              <select
                id="benChannel"
                className="form-select"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {CHANNELS.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="benAccount" className="form-label">
                Account / MSISDN (encrypted){' '}
                {!editingId ? (
                  <span className="text-danger">*</span>
                ) : (
                  <small className="text-muted">(leave blank to keep)</small>
                )}
              </label>
              <input
                type="text"
                id="benAccount"
                className="form-control font-monospace"
                placeholder="0123456789 or +254…"
                required={!editingId}
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label htmlFor="benAccName" className="form-label">Account name at bank</label>
              <input
                type="text"
                id="benAccName"
                className="form-control"
                placeholder="Legal name on the account"
                value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
