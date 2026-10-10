'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { fmtMoney, fmtDate } from '@/lib/format';
import { Card, DataTable, EmptyState, ErrorState, Modal, OtpInput, PageHeader, Skeleton, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Row = Record<string, any>;

interface WithdrawState {
  walletId: string;
  amount: string;
  beneficiaryId: string;
  busy: boolean;
  beneficiaries: Row[];
}

export default function WalletsView() {
  const toast = useToast();
  const [wallets, setWallets] = useState<Row[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [billItems, setBillItems] = useState<Row[] | null>(null);
  const [statement, setStatement] = useState<{ currency: unknown; rows: Row[] } | null>(null);
  const [withdraw, setWithdraw] = useState<WithdrawState | null>(null);
  const [optInOpen, setOptInOpen] = useState(false);
  const [optInStep, setOptInStep] = useState<1 | 2>(1);
  const [ticket, setTicket] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [otp, setOtp] = useState('');
  const [optInError, setOptInError] = useState('');
  const [optInBusy, setOptInBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/wallets');
      const list = listOf<Row>(data, 'wallets', 'items');
      setWallets(list);
      setError(null);
      if (!list.length) {
        setBillItems([]);
        return;
      }
      const results = await Promise.all(
        list.map((w) =>
          api
            .get(`/wallets/${encodeURIComponent(String(w.id))}/bill-payments?limit=10`)
            .catch(() => ({}) as Row)
        )
      );
      const items = results.flatMap((r) => listOf<Row>(r, 'bill_payments', 'items', 'payments'));
      setBillItems(items.slice(0, 15));
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openStatement(w: Row) {
    try {
      const data = await api.get(`/wallets/${encodeURIComponent(String(w.id))}/transactions?limit=25`);
      setStatement({ currency: w.currency, rows: listOf<Row>(data, 'transactions', 'entries', 'items') });
    } catch (err: any) {
      toast.toast('error', err.message);
    }
  }

  function openWithdraw(w: Row) {
    setWithdraw({ walletId: String(w.id), amount: '', beneficiaryId: '', busy: false, beneficiaries: [] });
    api
      .get('/beneficiaries?limit=50')
      .then((data) =>
        setWithdraw((prev) => (prev ? { ...prev, beneficiaries: listOf<Row>(data, 'beneficiaries', 'items') } : prev))
      )
      .catch(() => {});
    document.getElementById('withdrawSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function submitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!withdraw) return;
    setWithdraw({ ...withdraw, busy: true });
    try {
      await api.post(`/wallets/${encodeURIComponent(withdraw.walletId)}/withdrawals`, {
        amount: String(withdraw.amount),
        beneficiary_id: withdraw.beneficiaryId,
      });
      toast.toast('success', 'Withdrawal submitted');
      setWithdraw(null);
      load();
    } catch (err: any) {
      toast.toast('error', err.message);
      setWithdraw((prev) => (prev ? { ...prev, busy: false } : prev));
    }
  }

  async function startOptIn() {
    setOptInBusy(true);
    setOptInError('');
    try {
      const data = await api.post('/wallets/opt-in', {});
      const v = data.challenge || data.verification || data;
      setTicket(v.ticket || '');
      setDebugCode(v.debug_code ? String(v.debug_code) : '');
      setOptInStep(2);
    } catch (err: any) {
      setOptInError(err.message);
    } finally {
      setOptInBusy(false);
    }
  }

  async function verifyOptIn() {
    setOptInBusy(true);
    try {
      await api.post('/wallets/opt-in/verify', { ticket, code: otp });
      setOptInOpen(false);
      toast.toast('success', 'Wallet opened');
      setOptInStep(1);
      setTicket('');
      setOtp('');
      setDebugCode('');
      load();
    } catch (err: any) {
      toast.toast('error', err.message);
    } finally {
      setOptInBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Wallets & Accounts"
        breadcrumb="Wallets"
        actions={
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              setOptInError('');
              setOptInStep(1);
              setOptInOpen(true);
            }}
          >
            <i className="ti ti-plus fs-16" /> Open Wallet (SMS)
          </button>
        }
      />

      {/* Wallets Grid Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold fs-13 text-muted text-uppercase mb-0">
            Active Currency Accounts
          </h5>
          <span className="text-muted fs-12">
            {wallets ? `${wallets.length} account${wallets.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="row g-3">
          {error ? (
            <div className="col-12">
              <ErrorState error={error} />
            </div>
          ) : wallets === null ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm p-4">
                <Skeleton width="60%" />
                <Skeleton width="40%" />
                <Skeleton width="80%" />
              </div>
            </div>
          ) : !wallets.length ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <EmptyState
                  icon="wallet"
                  title="No wallets yet"
                  hint="Activate your first fiat wallet with verified phone credentials."
                />
              </div>
            </div>
          ) : (
            wallets.map((w) => {
              const bal = w.available_balance != null ? w.available_balance : w.balance;
              const cur = String(w.currency || 'USD');
              return (
                <div className="col-md-6 col-xxl-4" key={String(w.id)}>
                  <div className="card border-0 shadow-sm h-100 position-relative">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar-sm rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center fs-13 font-monospace"
                            style={{ width: 42, height: 42 }}
                          >
                            {cur.slice(0, 3)}
                          </div>
                          <div>
                            <h5 className="fs-15 fw-semibold mb-0 text-dark">
                              {String(w.label || `${cur} Ledger`)}
                            </h5>
                            <small className="text-muted fs-11 font-monospace">
                              ACCT •••• {String(w.id || '0000').slice(-4)}
                            </small>
                          </div>
                        </div>
                        <StatusPill status={w.status} />
                      </div>

                      <div className="my-3 py-1">
                        <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">
                          Available Balance
                        </span>
                        <div className="fs-24 fw-bold font-monospace text-dark">
                          {fmtMoney(bal, w.currency)}
                        </div>
                      </div>

                      <div className="d-flex gap-2 pt-3 border-top mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => openStatement(w)}
                        >
                          <i className="ti ti-file-text fs-14" /> Statement
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary bg-gradient flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => openWithdraw(w)}
                        >
                          <i className="ti ti-send fs-14" /> Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Statement Modal / Section */}
      {statement ? (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header border-0 justify-content-between d-flex align-items-center pb-2">
            <div>
              <h4 className="card-title fs-15 fw-semibold mb-0">
                Statement · {String(statement.currency || '')} Wallet
              </h4>
              <p className="text-muted fs-12 mb-0">Audited transaction ledger records and settlements</p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => setStatement(null)}
            >
              <i className="ti ti-x fs-14" /> Close
            </button>
          </div>
          <div className="card-body p-0">
            <DataTable
              columns={['Direction', 'Description', 'Amount', 'Date']}
              rows={statement.rows}
              emptyIcon="receipt-2"
              emptyTitle="No transactions in this period"
              render={(t) => {
                const credit = /^(credit|deposit|inflow)/i.test(String(t.direction || t.type || ''));
                return [
                  <span
                    key="dir"
                    className={`badge ${credit ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                  >
                    {credit ? 'Credit' : 'Debit'}
                  </span>,
                  <span key="desc" className="fs-13">{String(t.description || t.reference || '—')}</span>,
                  <strong key="amt" className={`font-monospace fs-13 ${credit ? 'text-success' : 'text-dark'}`}>
                    {credit ? '+' : '−'}
                    {fmtMoney(t.amount, t.currency)}
                  </strong>,
                  <span key="date" className="text-muted fs-12">{fmtDate(t.created_at || t.effective_at, true)}</span>,
                ];
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Instant Withdraw Drawer/Card */}
      {withdraw ? (
        <div id="withdrawSection" className="card shadow-sm border-0 mb-4">
          <div className="card-header border-0 pb-2">
            <h4 className="card-title fs-15 fw-semibold mb-0">Withdraw from Wallet</h4>
            <p className="text-muted fs-12 mb-0">Transfer funds to a verified local beneficiary or bank node</p>
          </div>
          <div className="card-body">
            <form onSubmit={submitWithdraw}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="withdrawBeneficiary" className="form-label fs-12 fw-semibold text-muted text-uppercase">
                    Recipient / Beneficiary
                  </label>
                  <select
                    id="withdrawBeneficiary"
                    className="form-select"
                    required
                    value={withdraw.beneficiaryId}
                    onChange={(e) => setWithdraw({ ...withdraw, beneficiaryId: e.target.value })}
                  >
                    <option value="">Choose beneficiary…</option>
                    {withdraw.beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.alias || b.name} ({b.destination_country || b.currency || 'Bank'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="withdrawAmount" className="form-label fs-12 fw-semibold text-muted text-uppercase">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="withdrawAmount"
                    step="any"
                    min={0}
                    className="form-control"
                    placeholder="0.00"
                    required
                    value={withdraw.amount}
                    onChange={(e) => setWithdraw({ ...withdraw, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" disabled={withdraw.busy} className="btn btn-primary bg-gradient px-4">
                  {withdraw.busy ? 'Submitting…' : 'Confirm Withdrawal'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  onClick={() => setWithdraw(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Bill Payments Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-0 justify-content-between d-flex align-items-center pb-2">
          <div>
            <h4 className="card-title fs-15 fw-semibold mb-0">Bill Payments</h4>
            <p className="text-muted fs-12 mb-0">Utility and service bill settlements from wallet ledger</p>
          </div>
          <Link href="/bills" className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0">
            Pay a bill <i className="ti ti-arrow-right ms-1" />
          </Link>
        </div>
        <div className="card-body p-0">
          {wallets !== null && !wallets.length ? (
            <EmptyState icon="device-mobile" title="No wallets active" hint="Open a wallet to start paying utilities." />
          ) : (
            <DataTable
              columns={['Biller', 'Customer Ref', 'Amount', 'Status', 'Date']}
              rows={billItems}
              emptyIcon="device-mobile"
              emptyTitle="No bill payments yet"
              emptyHint="Utilities, airtime, and electricity bills will show here."
              render={(b) => [
                <span key="biller" className="fw-semibold fs-13 text-dark">{String(b.biller_name || b.biller || b.category || '—')}</span>,
                <span key="ref" className="font-monospace fs-12 text-muted">{String(b.customer_reference || b.account_number || '—')}</span>,
                <strong key="amt" className="font-monospace fs-13">{fmtMoney(b.amount, b.currency)}</strong>,
                <StatusPill key="status" status={b.status} />,
                <span key="date" className="text-muted fs-12">{fmtDate(b.created_at, true)}</span>,
              ]}
            />
          )}
        </div>
      </div>

      {/* Opt-In SMS Verification Modal */}
      <Modal
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        title="Open a Fiat Wallet"
        width="460px"
      >
        <p className="text-muted fs-13 mb-3">
          We&apos;ll send a one-time code to your verified phone number to activate wallet access (including USSD).
        </p>
        {optInError ? (
          <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
            <div className="fs-13">{optInError}</div>
          </div>
        ) : null}
        {optInStep === 1 ? (
          <div className="d-grid">
            <button
              className="btn btn-primary bg-gradient fw-semibold py-2"
              disabled={optInBusy}
              onClick={startOptIn}
            >
              <i className="ti ti-message-dots me-1" /> Send Activation Code
            </button>
          </div>
        ) : (
          <div>
            <OtpInput length={6} value={otp} onChange={setOtp} />
            <div className="d-grid mt-3">
              <button
                className="btn btn-primary bg-gradient fw-semibold py-2"
                disabled={optInBusy || otp.length < 6}
                onClick={verifyOptIn}
              >
                <i className="ti ti-shield-check me-1" /> Verify &amp; Open Wallet
              </button>
            </div>
          </div>
        )}
        {debugCode ? (
          <p className="text-warning text-center fs-12 mt-3 mb-0">Development mode code: <strong>{debugCode}</strong></p>
        ) : null}
      </Modal>
    </div>
  );
}
