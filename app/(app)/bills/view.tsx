'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, listOf } from '@/lib/api';
import { fmtMoney, fmtDate } from '@/lib/format';
import { Card, DataTable, EmptyState, ErrorState, Modal, PageHeader, Skeleton, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Row = Record<string, any>;

const CAT_ICONS: Record<string, string> = {
  airtime: 'device-mobile',
  data: 'wifi',
  electricity: 'bolt',
  cable: 'device-tv',
  water: 'droplet',
  education: 'school',
  betting: 'dice',
};

interface Validation {
  ok: boolean;
  text: string;
}

export default function BillsView() {
  const toast = useToast();
  const [billers, setBillers] = useState<Row[] | null>(null);
  const [wallets, setWallets] = useState<Row[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [billerId, setBillerId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [amount, setAmount] = useState('');
  const [validation, setValidation] = useState<Validation | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [recent, setRecent] = useState<Row[] | null>(null);

  useEffect(() => {
    Promise.all([api.get('/billers'), api.get('/wallets')])
      .then(([b, w]) => {
        const bl = listOf<Row>(b, 'billers', 'items');
        const wl = listOf<Row>(w, 'wallets', 'items');
        setBillers(bl);
        setWallets(wl);
        if (wl.length) setWalletId(String(wl[0].id));
      })
      .catch((err) => setError(err));
  }, []);

  const selected = useMemo(() => billers?.find((b) => String(b.id) === billerId) || {}, [billers, billerId]);

  const categories = useMemo(() => {
    const cats: Record<string, number> = {};
    (billers || []).forEach((b) => {
      if (b.category) cats[b.category] = (cats[b.category] || 0) + 1;
    });
    return Object.keys(cats).map((c) => ({ name: c, count: cats[c] }));
  }, [billers]);

  const walletCurrency = useMemo(() => {
    if ((selected as Row).currency) return String((selected as Row).currency);
    const w = wallets.find((x) => String(x.id) === walletId);
    return w ? String(w.currency || '') : '';
  }, [selected, wallets, walletId]);

  const loadRecent = useCallback(async () => {
    if (!walletId) return;
    try {
      const data = await api.get(`/wallets/${encodeURIComponent(walletId)}/bill-payments?limit=10`);
      setRecent(listOf<Row>(data, 'bill_payments', 'items', 'payments').slice(0, 10));
    } catch {
      setRecent([]);
    }
  }, [walletId]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  async function validateCustomer() {
    if (!customerReference.trim()) {
      toast.toast('error', 'Enter the customer reference first');
      return;
    }
    setValidating(true);
    try {
      const data = await api.post('/billers/validate', {
        biller_id: billerId,
        customer_reference: customerReference.trim(),
      });
      const v = data.validation || data;
      const ok = String(v.valid).toLowerCase() !== 'false' && !v.error;
      setValidation({ ok, text: String(v.customer_name || v.message || v.error || 'Check the reference') });
    } catch (err: any) {
      setValidation({ ok: false, text: err.message });
    } finally {
      setValidating(false);
    }
  }

  async function confirmPay() {
    if (!walletId) return;
    setPaying(true);
    try {
      await api.post(`/wallets/${encodeURIComponent(walletId)}/bill-payments`, {
        biller_id: billerId,
        biller_name: (selected as Row).name || (selected as Row).biller_name || '',
        category: (selected as Row).category || '',
        country: (selected as Row).country || '',
        customer_reference: customerReference.trim(),
        amount: String(amount),
        currency: walletCurrency,
      });
      toast.toast('success', 'Bill payment submitted');
      setConfirming(false);
      setAmount('');
      setCustomerReference('');
      setValidation(null);
      loadRecent();
    } catch (err: any) {
      toast.toast('error', err.message);
      setConfirming(false);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bills &amp; Utilities"
        breadcrumb="Bills &amp; Utilities"
      />

      <div className="row g-3">
        <div className="col-lg-7">
          <Card
            title="New Payment"
            className="shadow-sm border-0 h-100"
          >
            {error ? (
              <ErrorState error={error} />
            ) : billers === null ? (
              <div className="py-3">
                <Skeleton width="70%" />
                <Skeleton width="55%" />
                <Skeleton width="62%" />
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirming(true);
                }}
                className="row g-3"
              >
                <div className="col-md-6">
                  <label htmlFor="billerSelect" className="form-label">
                    Biller <span className="text-danger">*</span>
                  </label>
                  <select
                    id="billerSelect"
                    className="form-select"
                    value={billerId}
                    onChange={(e) => setBillerId(e.target.value)}
                    required
                  >
                    <option value="">Choose a biller…</option>
                    {billers.map((b) => (
                      <option value={String(b.id)} key={String(b.id)}>
                        {String(b.name || b.biller_name)}
                        {b.category ? ` · ${String(b.category)}` : ''}
                        {b.country ? ` (${String(b.country)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="billWalletSelect" className="form-label">
                    Wallet to Debit
                  </label>
                  <select
                    id="billWalletSelect"
                    className="form-select"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    {!wallets.length ? <option value="">No wallets — open one first</option> : null}
                    {wallets.map((w) => (
                      <option value={String(w.id)} key={String(w.id)}>
                        {String(w.currency || '')} wallet ·{' '}
                        {fmtMoney(w.available_balance != null ? w.available_balance : w.balance, w.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="customerRef" className="form-label">
                    Customer / Meter Reference <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerRef"
                    className="form-control font-monospace"
                    placeholder="e.g. 4109876543"
                    required
                    value={customerReference}
                    onChange={(e) => setCustomerReference(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="billAmount" className="form-label">
                    Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    id="billAmount"
                    step="any"
                    min="0"
                    className="form-control"
                    placeholder="1000.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mb-2 d-inline-flex align-items-center gap-1"
                    disabled={validating}
                    onClick={validateCustomer}
                  >
                    {validating ? (
                      <span className="spinner-border spinner-border-sm me-1" />
                    ) : (
                      <i className="ti ti-circle-check fs-15" />
                    )}
                    Validate customer account
                  </button>
                  {validation ? (
                    <div
                      className={`alert ${validation.ok ? 'alert-success' : 'alert-warning'} d-flex align-items-center mb-2 py-2 fs-13`}
                    >
                      <i className={`ti ${validation.ok ? 'ti-user-check' : 'ti-alert-triangle'} me-2 fs-16`} />
                      {validation.text}
                    </div>
                  ) : null}
                </div>

                <div className="col-12 mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold py-2 w-100 d-flex align-items-center justify-content-center gap-1"
                    disabled={!wallets.length || paying}
                  >
                    <i className="ti ti-receipt fs-18" /> Pay Bill
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="col-lg-5">
          <Card title="Categories" subtitle="Supported biller utility categories" className="shadow-sm border-0 h-100">
            {categories.length ? (
              <div className="d-flex flex-column gap-2">
                {categories.map((c) => (
                  <div key={c.name} className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36 }}
                      >
                        <i className={`ti ti-${CAT_ICONS[c.name] || 'receipt'} fs-18`} />
                      </div>
                      <strong className="fs-13 text-capitalize text-dark">{c.name}</strong>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary fs-12">
                      {c.count} {c.count === 1 ? 'biller' : 'billers'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="ti-category" title="No categories" />
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card
          title="Recent Bill Payments"
          subtitle="Audit log of completed utility debits and reference confirmations"
          className="shadow-sm border-0"
        >
          <DataTable
            columns={['Biller', 'Customer Ref', 'Amount', 'Status', 'Date']}
            rows={recent}
            emptyIcon="ti-device-mobile"
            emptyTitle="No bill payments yet"
            emptyHint="Make your first bill payment using the form above."
            render={(b) => [
              String(b.biller_name || b.biller || b.category || '—'),
              <span className="font-monospace fs-12 text-muted" key="r">{String(b.customer_reference || b.account_number || '')}</span>,
              <strong className="font-monospace fs-13" key="a">{fmtMoney(b.amount, b.currency)}</strong>,
              <StatusPill status={b.status} key="s" />,
              <span className="text-muted fs-12" key="d">{fmtDate(b.created_at, true)}</span>,
            ]}
          />
        </Card>
      </div>

      <Modal
        open={confirming}
        onClose={() => !paying && setConfirming(false)}
        title="Confirm Bill Payment"
        width="500px"
        footer={
          <>
            <button
              className="btn btn-outline-secondary btn-sm px-3"
              disabled={paying}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1"
              disabled={paying}
              onClick={confirmPay}
            >
              {paying ? (
                <>
                  <span className="spinner-border spinner-border-sm" /> Paying…
                </>
              ) : (
                <>
                  <i className="ti ti-check" /> Confirm &amp; Pay
                </>
              )}
            </button>
          </>
        }
      >
        <p className="text-muted fs-13 mb-3">
          Please review the bill details before authorizing. Funds will be immediately debited from your wallet.
        </p>
        <div className="bg-light rounded p-3 border">
          <div className="d-flex justify-content-between py-2 border-bottom fs-13">
            <span className="text-muted">Biller</span>
            <strong className="text-dark">{String((selected as Row).name || (selected as Row).biller_name || '—')}</strong>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom fs-13">
            <span className="text-muted">Customer Reference</span>
            <span className="font-monospace fw-semibold">{customerReference}</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom fs-13">
            <span className="text-muted">Wallet Debited</span>
            <span>{String(wallets.find((w) => String(w.id) === walletId)?.currency || '')} Wallet</span>
          </div>
          <div className="d-flex justify-content-between pt-2 align-items-center">
            <span className="fw-bold text-dark fs-14">Total Amount</span>
            <span className="fw-bold text-success fs-16 font-monospace">
              {fmtMoney(amount, walletCurrency)}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
