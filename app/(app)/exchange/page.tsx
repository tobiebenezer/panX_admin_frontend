'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, listOf, getAccessToken } from '@/lib/api';
import { fmtMoney, fmtDate, qs } from '@/lib/format';
import { Card, Modal, StatusPill, PageHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface Asset { asset?: string; code?: string; symbol?: string; display_name?: string }
interface Corridor {
  destination_currency?: string; quote_currency?: string; currency?: string; code?: string; name?: string;
}
interface Beneficiary {
  id?: string; alias?: string; name?: string; destination_country?: string; currency?: string;
}
interface Quote {
  id?: string;
  destination_amount?: unknown; target_amount?: unknown; receive_amount?: unknown;
  destination_currency?: string; target_currency?: string;
  fee_amount?: unknown; total_fee?: unknown;
  rate?: unknown; effective_rate?: unknown; exchange_rate?: unknown;
  expires_at?: string; locked_until?: string;
}
interface TxEvent {
  label?: string; event_type?: string; to_status?: string; status?: string;
  tone?: string; created_at?: string; at?: string;
}
interface Tx {
  id?: string; reference?: string; status?: string; created_at?: string;
  events?: TxEvent[];
  deposit_address?: string; deposit_asset?: string; deposit_network?: string; memo?: string;
}

function field<T>(obj: Record<string, any>, names: string[]): T | null {
  for (const n of names) {
    if (obj[n] != null) return obj[n] as T;
  }
  return null;
}

function toneOf(status: unknown): string {
  const map: Record<string, string> = { success: 'tone-success', failed: 'tone-danger', rejected: 'tone-danger' };
  return map[String(status).toLowerCase()] || '';
}

export default function ExchangePage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currencies, setCurrencies] = useState<Corridor[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [countdown, setCountdown] = useState('—');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tx, setTx] = useState<Tx | null>(null);
  const [events, setEvents] = useState<TxEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/assets'), api.get('/corridors'), api.get('/beneficiaries?limit=50')])
      .then(([a, c, b]) => {
        if (!alive) return;
        const assetList = listOf<Asset>(a, 'assets');
        const seenAsset: Record<string, boolean> = {};
        setAssets(
          assetList.filter((x) => {
            const code = x.asset || x.code || x.symbol || '';
            if (!code || seenAsset[code]) return false;
            seenAsset[code] = true;
            return true;
          })
        );
        const corridors = listOf<Corridor>(c, 'corridors', 'currencies');
        const seenCur: Record<string, boolean> = {};
        setCurrencies([
          { destination_currency: 'USD', name: 'US Dollar' },
          ...corridors.filter((x) => {
            const code = x.destination_currency || x.quote_currency || x.currency || x.code || '';
            if (!code || seenCur[code]) return false;
            seenCur[code] = true;
            return true;
          }),
        ]);
        setBeneficiaries(listOf<Beneficiary>(b, 'beneficiaries', 'items'));
        const pre = qs('beneficiary');
        if (pre) setBeneficiaryId(pre);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (esRef.current) esRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const startCountdown = useCallback((expiresAt?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!expiresAt) {
      setCountdown('—');
      return;
    }
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setCountdown('expired');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const s = Math.floor(ms / 1000);
      setCountdown(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    timerRef.current = setInterval(tick, 500);
  }, []);

  const refreshTx = useCallback(async (txID: string) => {
    const fresh = await api.get(`/transactions/${encodeURIComponent(txID)}`);
    const t: Tx = fresh.transaction || fresh;
    setTx(t);
    setEvents(t.events || []);
    if (/^(completed|settled|failed|rejected|refunded)/.test(String(t.status))) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    }
  }, []);

  const listen = useCallback(
    (txID: string) => {
      if (esRef.current) esRef.current.close();
      try {
        const es = new EventSource(
          `/v1/transactions/${encodeURIComponent(txID)}/events?access_token=${encodeURIComponent(getAccessToken() || '')}`
        );
        esRef.current = es;
        es.onmessage = () => {
          refreshTx(txID).catch(() => {});
        };
        es.onerror = () => {
          es.close();
          if (esRef.current === es) esRef.current = null;
        };
      } catch {}
    },
    [refreshTx]
  );

  async function submitQuote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuoteError(null);
    setQuoting(true);
    try {
      const body: Record<string, unknown> = {
        source_asset: asset,
        source_amount: String(amount),
        target_currency: targetCurrency,
      };
      if (beneficiaryId) body.beneficiary_id = beneficiaryId;
      const data = await api.post('/quotes', body);
      const q: Quote = data.quote || data;
      setQuote(q);
      startCountdown(q.expires_at || q.locked_until);
      document.getElementById('confirmSection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err: any) {
      setQuoteError(err.message || 'Could not get a quote');
    } finally {
      setQuoting(false);
    }
  }

  function showTracking(t: Tx) {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuote(null);
    setConfirmOpen(false);
    setTx(t);
    setEvents(t.events || [{ status: t.status, created_at: t.created_at }]);
    if (t.id) listen(t.id);
    setTimeout(() => {
      document.getElementById('trackingSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  async function execute() {
    if (!quote?.id) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = { quote_id: quote.id };
      if (beneficiaryId) body.beneficiary_id = beneficiaryId;
      const data = await api.post('/transactions', body);
      showTracking(data.transaction || data);
    } catch (err: any) {
      toast('error', err.message || 'Could not create transaction');
      setCreating(false);
      setConfirmOpen(false);
    }
  }

  const q = quote;
  const destAmt = q ? field<unknown>(q as any, ['destination_amount', 'target_amount', 'receive_amount']) : null;
  const destCur = q ? String(field<unknown>(q as any, ['destination_currency', 'target_currency']) ?? '') : '';
  const feeAmt = q ? field<unknown>(q as any, ['fee_amount', 'total_fee']) : null;
  const rateVal = q ? field<unknown>(q as any, ['rate', 'effective_rate', 'exchange_rate']) : null;

  return (
    <div>
      <PageHeader
        title="Instant Exchange"
        subtitle="Lock an institutional-grade rate, deposit crypto, and settle in local African fiat currency"
        breadcrumb="Exchange"
      />

      <div className="row g-3">
        <div className="col-lg-7">
          <Card
            title="Get a locked quote"
            subtitle="Rates lock for a short window with live settlement tracking"
            className="shadow-sm border-0 h-100"
          >
            {quoteError ? (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
                <div className="fs-13">{quoteError}</div>
              </div>
            ) : null}

            <form onSubmit={submitQuote}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="sendAmount" className="form-label">
                    You send (asset amount) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    id="sendAmount"
                    step="any"
                    min={0}
                    className="form-control"
                    placeholder="100.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="assetSelect" className="form-label">
                    Asset
                  </label>
                  <select
                    id="assetSelect"
                    className="form-select"
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                  >
                    {assets.length ? (
                      assets.map((a) => {
                        const code = a.asset || a.code || a.symbol || '';
                        return (
                          <option key={code} value={code}>
                            {code}
                            {a.display_name ? ` · ${a.display_name}` : ''}
                          </option>
                        );
                      })
                    ) : (
                      <option value="">Loading…</option>
                    )}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="currencySelect" className="form-label">
                    Destination currency
                  </label>
                  <select
                    id="currencySelect"
                    className="form-select"
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                  >
                    {currencies.length ? (
                      currencies.map((c) => {
                        const code = c.destination_currency || c.quote_currency || c.currency || c.code || '';
                        return (
                          <option key={code} value={code}>
                            {code}
                            {c.name ? ` · ${c.name}` : ''}
                          </option>
                        );
                      })
                    ) : (
                      <option value="USD">Loading…</option>
                    )}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="beneficiarySelect" className="form-label">
                    Recipient
                  </label>
                  <select
                    id="beneficiarySelect"
                    className="form-select"
                    value={beneficiaryId}
                    onChange={(e) => setBeneficiaryId(e.target.value)}
                  >
                    <option value="">Enter manually after quote…</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.alias || b.name || 'Beneficiary'} ({b.destination_country || b.currency || ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={quoting}
                  className="btn btn-primary fw-semibold py-2 w-100 d-flex align-items-center justify-content-center"
                >
                  {quoting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" /> Locking rate…
                    </>
                  ) : (
                    <>
                      <i className="ti ti-calculator me-1 fs-18" /> Get locked rate
                    </>
                  )}
                </button>
              </div>
            </form>

            {q ? (
              <div id="confirmSection" className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fs-13 fw-semibold text-uppercase text-muted">Quote Locked</span>
                  <span className="badge bg-warning-subtle text-warning fs-12 px-2 py-1 d-inline-flex align-items-center gap-1">
                    <i className="ti ti-clock" /> Expires in {countdown}
                  </span>
                </div>

                <div className="bg-light rounded p-3 mb-3 border">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted fs-13">Quote Reference</span>
                    <span className="font-monospace fw-semibold fs-13">{(q.id || '').slice(0, 18)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted fs-13">Exchange Fee</span>
                    <span className="fw-semibold fs-13">{feeAmt != null ? fmtMoney(feeAmt, destCur || 'USD') : 'Included'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted fs-13">Effective Rate</span>
                    <span className="fw-semibold fs-13 font-monospace">{rateVal != null ? String(rateVal) : '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 align-items-center">
                    <span className="fw-bold text-dark fs-14">You Receive</span>
                    <span className="fw-bold text-success fs-18 font-monospace">
                      {destAmt != null ? fmtMoney(destAmt, destCur || 'USD') : '—'}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-success bg-gradient fw-semibold py-2 w-100 d-flex align-items-center justify-content-center shadow-sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!q.id}
                >
                  <i className="ti ti-check me-1 fs-18" /> Accept &amp; Create Transaction
                </button>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="col-lg-5">
          <Card title="Corridor Rates" className="shadow-sm border-0 h-100">
            <div className="d-flex flex-column gap-2 py-2 fs-13">
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                <div>
                  <span className="fw-semibold text-dark">USDT / NGN</span>
                  <small className="text-muted d-block fs-11">Nigeria Rail</small>
                </div>
                <span className="font-monospace fw-bold text-success">₦1,640.50</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                <div>
                  <span className="fw-semibold text-dark">USDT / GHS</span>
                  <small className="text-muted d-block fs-11">Ghana Mobile Money</small>
                </div>
                <span className="font-monospace fw-bold text-success">GH₵ 15.80</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                <div>
                  <span className="fw-semibold text-dark">USDT / KES</span>
                  <small className="text-muted d-block fs-11">Kenya M-Pesa</small>
                </div>
                <span className="font-monospace fw-bold text-success">KSh 132.20</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                <div>
                  <span className="fw-semibold text-dark">USD / NGN</span>
                  <small className="text-muted d-block fs-11">Interbank Reference</small>
                </div>
                <span className="font-monospace fw-bold text-dark">₦1,610.00</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Transfer"
        width="520px"
        footer={
          <>
            <button
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={() => setConfirmOpen(false)}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm px-3"
              onClick={execute}
              disabled={creating || !quote?.id}
            >
              {creating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" /> Creating…
                </>
              ) : (
                <>
                  <i className="ti ti-lock me-1" /> Confirm &amp; Pay
                </>
              )}
            </button>
          </>
        }
      >
        {q ? (
          <div className="bg-light rounded p-3 border">
            <div className="d-flex justify-content-between py-2 border-bottom fs-13">
              <span className="text-muted">Quote Reference</span>
              <span className="font-monospace fw-semibold">{(q.id || '').slice(0, 18)}</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom fs-13">
              <span className="text-muted">Exchange Fee</span>
              <span className="fw-semibold">{feeAmt != null ? fmtMoney(feeAmt, destCur || 'USD') : 'Included'}</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom fs-13">
              <span className="text-muted">Rate</span>
              <span className="fw-semibold font-monospace">{rateVal != null ? String(rateVal) : '—'}</span>
            </div>
            {beneficiaryId ? (
              <div className="d-flex justify-content-between py-2 border-bottom fs-13">
                <span className="text-muted">Recipient</span>
                <span className="fw-semibold">
                  {beneficiaries.find((b) => b.id === beneficiaryId)?.alias || 'Saved beneficiary'}
                </span>
              </div>
            ) : null}
            <div className="d-flex justify-content-between py-2 border-bottom fs-13">
              <span className="text-muted">Expires In</span>
              <span className="badge bg-warning-subtle text-warning">{countdown}</span>
            </div>
            <div className="d-flex justify-content-between pt-2 align-items-center">
              <span className="fw-bold text-dark fs-14">You Receive</span>
              <span className="fw-bold text-success fs-18 font-monospace">
                {destAmt != null ? fmtMoney(destAmt, destCur || 'USD') : '—'}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>

      {tx ? (
        <div id="trackingSection" className="mt-4">
          <Card
            title="Transaction Tracking"
            subtitle={`Reference: ${tx.id || tx.reference || '—'}`}
            actions={
              <div className="d-flex gap-2 align-items-center">
                <StatusPill status={tx.status} />
                {tx.id ? (
                  <Link href={`/transactions?tx=${encodeURIComponent(tx.id)}`} className="btn btn-outline-primary btn-sm">
                    <i className="ti ti-receipt me-1" /> Receipt
                  </Link>
                ) : null}
              </div>
            }
          >
            {tx.deposit_address ? (
              <div className="alert alert-info border-info-subtle mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-info-circle fs-20 text-info" />
                    <strong className="fs-14">Deposit Instructions</strong>
                  </div>
                  <span className="badge bg-info text-white fs-12">
                    {tx.deposit_network || 'Network'}
                  </span>
                </div>
                <p className="text-muted fs-13 mb-2">
                  Send <strong>{tx.deposit_asset || ''}</strong> to this unique deposit address:
                </p>
                <div
                  className="bg-white p-2 rounded border d-flex align-items-center justify-content-between font-monospace fs-13 text-break cursor-pointer"
                  style={{ cursor: 'pointer' }}
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(tx.deposit_address || '');
                    toast('success', 'Deposit address copied');
                  }}
                >
                  <span className="text-dark">{tx.deposit_address}</span>
                  <button type="button" className="btn btn-sm btn-light text-primary flex-shrink-0 ms-2">
                    <i className="ti ti-copy me-1" /> Copy
                  </button>
                </div>
                {tx.memo ? (
                  <div className="mt-2 fs-13 text-muted">
                    Memo / Tag: <span className="font-monospace fw-bold text-dark">{tx.memo}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="position-relative ps-4 border-start ms-2">
              {events.length ? (
                events.map((e, i) => {
                  const label = e.label || e.event_type || e.status || 'update';
                  return (
                    <div key={i} className="mb-3 position-relative">
                      <div
                        className="position-absolute rounded-circle bg-primary"
                        style={{
                          width: 10,
                          height: 10,
                          left: -22,
                          top: 5,
                        }}
                      />
                      <h6 className="fw-semibold mb-0 fs-14 text-capitalize">
                        {String(label).replace(/_/g, ' ')}
                      </h6>
                      <small className="text-muted fs-12">
                        {fmtDate(e.created_at || e.at, true)}
                      </small>
                    </div>
                  );
                })
              ) : (
                <div className="mb-3 position-relative">
                  <div
                    className="position-absolute rounded-circle bg-secondary"
                    style={{ width: 10, height: 10, left: -22, top: 5 }}
                  />
                  <h6 className="fw-semibold mb-0 fs-14">Waiting for updates…</h6>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
