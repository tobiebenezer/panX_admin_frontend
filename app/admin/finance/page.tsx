'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtNum } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface BankAccountBalance {
  id: string;
  institution: string;
  accountNumber: string;
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  balance: number;
  type: 'SEGREGATED_CUSTOMER_FLOAT' | 'OPERATIONAL_CAPITAL' | 'PREFUNDED_PROVIDER_BUFFER';
  runwayDays?: number;
}

const SAMPLE_TREASURY_ACCOUNTS: BankAccountBalance[] = [
  { id: 'ACC-01', institution: 'Access Bank Plc (Segregated Trust)', accountNumber: '0192847192', currency: 'NGN', balance: 4210500000, type: 'SEGREGATED_CUSTOMER_FLOAT' },
  { id: 'ACC-02', institution: 'First City Monument Bank (Operational)', accountNumber: '1109283741', currency: 'NGN', balance: 840000000, type: 'OPERATIONAL_CAPITAL' },
  { id: 'ACC-03', institution: 'Anchor Banking / JP Morgan (USD Client Float)', accountNumber: '882019482', currency: 'USD', balance: 5410200, type: 'SEGREGATED_CUSTOMER_FLOAT' },
  { id: 'ACC-04', institution: 'Flutterwave Prefund Float (NIP Outbound)', accountNumber: 'FLW-FLOAT-NGN', currency: 'NGN', balance: 840000000, type: 'PREFUNDED_PROVIDER_BUFFER', runwayDays: 6.8 },
  { id: 'ACC-05', institution: 'DriveWealth LLC (Omnibus US Brokerage Clearing)', accountNumber: 'DW-CLEARING-USD', currency: 'USD', balance: 1820400, type: 'PREFUNDED_PROVIDER_BUFFER', runwayDays: 14.1 },
  { id: 'ACC-06', institution: 'YellowCard Crypto Reserves (USDT Liquidity)', accountNumber: 'YC-TREASURY-01', currency: 'USD', balance: 1240000, type: 'PREFUNDED_PROVIDER_BUFFER', runwayDays: 22.0 },
];

export default function FinanceTreasuryPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccountBalance[]>(SAMPLE_TREASURY_ACCOUNTS);
  const [activeTab, setActiveTab] = useState<'balances' | 'sweeps' | 'close_checklist'>('balances');

  // Operational Action Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'topup' | 'sweep' | 'gl_adjust';
    account: BankAccountBalance | null;
  }>({ isOpen: false, type: 'topup', account: null });

  // Form states
  const [topupAmount, setTopupAmount] = useState('50000000');
  const [sourceAccount, setSourceAccount] = useState('First City Monument Bank (Operational)');
  const [sweepDestination, setSweepDestination] = useState('Access Bank Plc (Segregated Trust)');
  const [glReason, setGlReason] = useState('Reconciliation of micro-interest accrual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month-end close checklist states
  const [checklist, setChecklist] = useState([
    { id: 'chk-1', label: '1. Reconcile all bank statement balances against internal GL ledgers', done: true, by: 'Emeka Eze' },
    { id: 'chk-2', label: '2. Sweep accumulated corridor FX spread revenue to primary revenue account', done: true, by: 'Emeka Eze' },
    { id: 'chk-3', label: '3. Reconcile broker omnibus stock holdings against DTC depository statements', done: true, by: 'Aliko Adeleke' },
    { id: 'chk-4', label: '4. Book overnight treasury float interest and accrue partner commissions', done: false, by: 'Pending' },
    { id: 'chk-5', label: '5. Lock and cryptographically archive month-end general ledger pack', done: false, by: 'Pending' },
  ]);

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAction = (acc: BankAccountBalance, type: 'topup' | 'sweep' | 'gl_adjust') => {
    setActionModal({ isOpen: true, type, account: acc });
    if (acc.currency === 'USD') {
      setTopupAmount('250000');
    } else {
      setTopupAmount('50000000');
    }
  };

  const handleExecuteModalAction = () => {
    if (!actionModal.account) return;
    setIsSubmitting(true);
    const acc = actionModal.account;

    setTimeout(() => {
      setIsSubmitting(false);
      setActionModal({ isOpen: false, type: 'topup', account: null });

      if (actionModal.type === 'topup') {
        const added = parseFloat(topupAmount) || 0;
        setAccounts((prev) =>
          prev.map((a) => (a.id === acc.id ? { ...a, balance: a.balance + added, runwayDays: (a.runwayDays || 0) + 7 } : a))
        );
        toast('success', `Wire top-up order created: ${fmtMoney(added, acc.currency)} dispatched to ${acc.institution}.`);
      } else if (actionModal.type === 'sweep') {
        toast('success', `Inter-account sweep executed to ${sweepDestination}.`);
      } else if (actionModal.type === 'gl_adjust') {
        toast('success', `GL adjustment posted for ${acc.institution}. Journal balanced.`);
      }
    }, 600);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done, by: !c.done ? 'Aliko Adeleke' : 'Pending' } : c))
    );
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Treasury & Finance</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/pricing" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-arrows-exchange" /> Corridors & Rates
          </Link>
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Segregated Float (Owed)</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">₦4.21B</span>
              <span className="fs-12 text-muted">/ $5.41M</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Working Capital</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">₦840M</span>
              <span className="fs-12 text-muted">liquid</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Buffer Runway Alert</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-danger">6.8 days</span>
              <span className="fs-12 text-muted">Flutterwave</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Month-End Close</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{checklist.filter((c) => c.done).length} / {checklist.length}</span>
              <span className="fs-12 text-muted">signed off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'balances' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('balances')}
              >
                <i className="ti ti-building-bank me-1" /> Treasury Accounts & Liquidity ({accounts.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'close_checklist' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('close_checklist')}
              >
                <i className="ti ti-list-check me-1" /> Month-End Close Checklist
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'balances' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Banking Institution & Account</th>
                    <th>Classification</th>
                    <th>Currency</th>
                    <th>Live Balance</th>
                    <th>Liquidity Runway</th>
                    <th className="text-end">Treasury Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td>
                        <div className="fw-bold text-dark">{acc.institution}</div>
                        <small className="text-muted font-monospace">{acc.accountNumber}</small>
                      </td>

                      <td>
                        <span
                          className={`badge fs-11 ${
                            acc.type === 'SEGREGATED_CUSTOMER_FLOAT'
                              ? 'bg-info-subtle text-info'
                              : acc.type === 'PREFUNDED_PROVIDER_BUFFER'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-success-subtle text-success'
                          }`}
                        >
                          {acc.type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border font-monospace">{acc.currency}</span>
                      </td>

                      <td className="fw-bold font-monospace">
                        {fmtMoney(acc.balance, acc.currency)}
                      </td>

                      <td>
                        {acc.runwayDays != null ? (
                          <span
                            className={`badge font-monospace fs-11 ${
                              acc.runwayDays < 7 ? 'bg-danger text-white' : 'bg-success-subtle text-success'
                            }`}
                          >
                            {acc.runwayDays} Days Runway
                          </span>
                        ) : (
                          <span className="text-muted fs-11">N/A (Holding Float)</span>
                        )}
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {acc.type === 'PREFUNDED_PROVIDER_BUFFER' ? (
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              title="Initiate wire top-up order"
                              onClick={() => handleOpenAction(acc, 'topup')}
                            >
                              <i className="ti ti-plus me-1" /> Top-Up Wire
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Sweep excess liquidity"
                              onClick={() => handleOpenAction(acc, 'sweep')}
                            >
                              <i className="ti ti-arrows-right me-1" /> Sweep
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Post GL balancing adjustment"
                            onClick={() => handleOpenAction(acc, 'gl_adjust')}
                          >
                            <i className="ti ti-adjustments" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Notes"
                            onClick={() => setNotesTarget({ id: acc.id, title: acc.institution })}
                          >
                            <i className="ti ti-notes" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'close_checklist' && (
            <div className="d-flex flex-column gap-3">
              <div className="alert alert-secondary py-2 px-3 fs-13 mb-2 rounded border-0 bg-light">
                <strong>Month-End Institutional Runbook:</strong> Complete reconciliations and sweeps before monthly financial reports are sealed.
              </div>

              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-3 border d-flex align-items-center justify-content-between ${
                    item.done ? 'bg-light' : 'bg-white'
                  }`}
                >
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="checkbox"
                      className="form-check-input fs-16 m-0 cursor-pointer"
                      checked={item.done}
                      onChange={() => toggleChecklistItem(item.id)}
                    />
                    <div>
                      <span className={`fs-14 fw-medium ${item.done ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                        {item.label}
                      </span>
                      <div className="fs-12 text-muted">Signed off by: {item.by}</div>
                    </div>
                  </div>

                  <span className={`badge ${item.done ? 'bg-success' : 'bg-secondary'}`}>
                    {item.done ? 'COMPLETED' : 'INCOMPLETE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operational Finance Action Modal */}
      {actionModal.isOpen && actionModal.account && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setActionModal({ isOpen: false, type: 'topup', account: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {actionModal.type === 'topup' && 'Initiate Provider Buffer Top-Up'}
                  {actionModal.type === 'sweep' && 'Execute Liquidity Sweep'}
                  {actionModal.type === 'gl_adjust' && 'Post GL Balancing Adjustment'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActionModal({ isOpen: false, type: 'topup', account: null })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-dark">{actionModal.account.institution}</strong>
                    <div className="text-muted font-monospace fs-11">{actionModal.account.accountNumber}</div>
                  </div>
                  <span className="badge bg-secondary font-monospace">
                    {fmtMoney(actionModal.account.balance, actionModal.account.currency)}
                  </span>
                </div>

                {actionModal.type === 'topup' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Dispatch an interbank wire to replenish this gateway buffer and extend operational runway.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Funding Source Account</label>
                      <select
                        className="form-select form-select-sm"
                        value={sourceAccount}
                        onChange={(e) => setSourceAccount(e.target.value)}
                      >
                        <option value="First City Monument Bank (Operational)">First City Monument Bank (Operational NGN)</option>
                        <option value="Anchor Banking / JP Morgan (USD Client Float)">Anchor Banking / JP Morgan (USD)</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Top-Up Amount ({actionModal.account.currency})</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {actionModal.type === 'sweep' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Sweep accrued exchange margins or rebalance customer settlement balances into target vault.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Target Destination Account</label>
                      <select
                        className="form-select form-select-sm"
                        value={sweepDestination}
                        onChange={(e) => setSweepDestination(e.target.value)}
                      >
                        <option value="Access Bank Plc (Segregated Trust)">Access Bank Plc (Segregated Trust)</option>
                        <option value="First City Monument Bank (Operational)">First City Monument Bank (Operational)</option>
                      </select>
                    </div>
                  </div>
                )}

                {actionModal.type === 'gl_adjust' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Record a documented balancing adjustment between physical bank statement and sub-ledger.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Adjustment Rationale</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={glReason}
                        onChange={(e) => setGlReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setActionModal({ isOpen: false, type: 'topup', account: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary"
                  onClick={handleExecuteModalAction}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes Drawer */}
      {notesTarget && (
        <InternalNotesDrawer
          isOpen={true}
          recordId={notesTarget.id}
          recordTitle={notesTarget.title}
          onClose={() => setNotesTarget(null)}
        />
      )}
    </div>
  );
}
