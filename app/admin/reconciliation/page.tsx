'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface ReconException {
  id: string;
  internalRef: string;
  provider: 'DriveWealth' | 'YellowCard' | 'Flutterwave' | 'NIBSS';
  providerRef: string;
  issue: string;
  internalStatus: string;
  providerStatus: string;
  amount: number;
  currency: string;
  stalledDuration: string;
  assignedOwner: string;
  internalTime: string;
  providerTime: string;
  rawPayloadSnippet: string;
}

const SAMPLE_EXCEPTIONS: ReconException[] = [
  {
    id: 'REC-EX-01',
    internalRef: 'TX-NGN-994102',
    provider: 'Flutterwave',
    providerRef: 'FLW-398102914',
    issue: 'Status Mismatch: Internal marked COMPLETED, Provider reports PENDING_SETTLEMENT',
    internalStatus: 'COMPLETED',
    providerStatus: 'PENDING_SETTLEMENT',
    amount: 1450000,
    currency: 'NGN',
    stalledDuration: '3h 12m',
    assignedOwner: 'Emeka Eze (Treasury)',
    internalTime: '2026-10-10 01:15 UTC',
    providerTime: '2026-10-10 01:17 UTC',
    rawPayloadSnippet: '{"status":"successful","charge_response_code":"00","app_fee":1450,"settlement_token":"ST-99120"}',
  },
  {
    id: 'REC-EX-02',
    internalRef: 'ORD-US-48190',
    provider: 'DriveWealth',
    providerRef: 'DW-ORD-881920',
    issue: 'Commission Delta: Expected commission $1.50, Broker charged $2.25',
    internalStatus: 'FILLED',
    providerStatus: 'EXECUTED',
    amount: 850.0,
    currency: 'USD',
    stalledDuration: '1h 05m',
    assignedOwner: 'Aliko Adeleke (Ops)',
    internalTime: '2026-10-10 02:00 UTC',
    providerTime: '2026-10-10 02:01 UTC',
    rawPayloadSnippet: '{"order_id":"DW-ORD-881920","side":"BUY","sec_fee":0.02,"taf_fee":0.03,"broker_commission":2.25}',
  },
  {
    id: 'REC-EX-03',
    internalRef: 'TX-CRYPTO-1029',
    provider: 'YellowCard',
    providerRef: 'YC-DEP-77192',
    issue: 'Unmatched Inbound Deposit: On-chain TX detected with missing user memo',
    internalStatus: 'UNLINKED',
    providerStatus: 'CONFIRMED',
    amount: 500.0,
    currency: 'USDT',
    stalledDuration: '14h 30m',
    assignedOwner: 'Fatima Kyari (Compliance)',
    internalTime: '2026-10-09 13:00 UTC',
    providerTime: '2026-10-09 13:04 UTC',
    rawPayloadSnippet: '{"txHash":"0x88fca91029...","confirmations":64,"memo":null,"destination_wallet":"0xPOOL-01"}',
  },
];

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [exceptions, setExceptions] = useState<ReconException[]>(SAMPLE_EXCEPTIONS);
  const [activeTab, setActiveTab] = useState<'exceptions' | 'records' | 'stalled'>('exceptions');
  const [selectedException, setSelectedException] = useState<ReconException | null>(null);

  // Realistic Action Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 're-query' | 'match' | 'refund' | 'write-off';
    item: ReconException | null;
  }>({ isOpen: false, type: 're-query', item: null });

  // Form states for actions
  const [bankSessionId, setBankSessionId] = useState('');
  const [refundReason, setRefundReason] = useState('Provider gateway permanent failure');
  const [writeOffReason, setWriteOffReason] = useState('DriveWealth fractional broker commission adjustment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAction = (item: ReconException, type: 're-query' | 'match' | 'refund' | 'write-off') => {
    setActionModal({ isOpen: true, type, item });
    setBankSessionId('');
  };

  const handleExecuteAction = () => {
    if (!actionModal.item) return;
    setIsSubmitting(true);
    const item = actionModal.item;

    setTimeout(() => {
      setIsSubmitting(false);
      setActionModal({ isOpen: false, type: 're-query', item: null });

      if (actionModal.type === 're-query') {
        toast('success', `Provider status re-queried: ${item.provider} confirms settlement. Exception cleared.`);
        setExceptions((prev) => prev.filter((e) => e.id !== item.id));
      } else if (actionModal.type === 'match') {
        toast('success', `Settlement reference ${bankSessionId || 'SESSION-99120'} matched. Ledger balanced.`);
        setExceptions((prev) => prev.filter((e) => e.id !== item.id));
      } else if (actionModal.type === 'refund') {
        toast('success', `Refund of ${fmtMoney(item.amount, item.currency)} credited to customer wallet.`);
        setExceptions((prev) => prev.filter((e) => e.id !== item.id));
      } else if (actionModal.type === 'write-off') {
        toast('success', `Micro-variance of ${fmtMoney(0.75, item.currency)} written off to GL Fee Variance.`);
        setExceptions((prev) => prev.filter((e) => e.id !== item.id));
      }
    }, 600);
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Reconciliation Desk</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => toast('info', 'Triggered automated reconcile batch.')}
          >
            <i className="ti ti-refresh" /> Run Batch Reconcile
          </button>
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Open Exceptions</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{exceptions.length}</span>
              <span className="fs-12 text-muted">mismatches</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Stalled</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">2</span>
              <span className="fs-12 text-muted">&gt; 60 mins</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Auto-Reconciled</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">99.9%</span>
              <span className="fs-12 text-muted">matched</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Pending Refunds</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">1</span>
              <span className="fs-12 text-muted">in review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'exceptions' ? 'active text-warning' : 'text-muted'}`}
                onClick={() => setActiveTab('exceptions')}
              >
                <i className="ti ti-alert-triangle me-1" /> Reconciliation Exceptions ({exceptions.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'records' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('records')}
              >
                <i className="ti ti-arrows-diff me-1" /> Side-by-Side Provider Records
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'stalled' ? 'active text-danger' : 'text-muted'}`}
                onClick={() => setActiveTab('stalled')}
              >
                <i className="ti ti-hourglass-empty me-1" /> Stalled Queue & Escalation
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'exceptions' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Exception ID</th>
                    <th>Internal Ref vs Provider Ref</th>
                    <th>Discrepancy Description</th>
                    <th>Status Divergence</th>
                    <th>Discrepancy Amount</th>
                    <th>Assigned Desk</th>
                    <th className="text-end">Operational Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((ex) => (
                    <tr key={ex.id}>
                      <td>
                        <span className="badge bg-danger-subtle text-danger font-monospace fs-11">{ex.id}</span>
                      </td>

                      <td>
                        <div>
                          <strong className="text-dark font-monospace">{ex.internalRef}</strong>
                          <div className="text-muted font-monospace fs-11">
                            <span className="badge bg-light text-dark border me-1">{ex.provider}</span>
                            {ex.providerRef}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="text-dark fw-medium" style={{ maxWidth: 300 }}>
                          {ex.issue}
                        </div>
                        <small className="text-danger font-monospace">Stalled for {ex.stalledDuration}</small>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 font-monospace fs-11">
                          <span className="badge bg-secondary">{ex.internalStatus}</span>
                          <i className="ti ti-arrow-right text-muted" />
                          <span className="badge bg-warning text-dark">{ex.providerStatus}</span>
                        </div>
                      </td>

                      <td className="fw-bold font-monospace">
                        {fmtMoney(ex.amount, ex.currency)}
                      </td>

                      <td>
                        <span className="text-muted fs-12">{ex.assignedOwner}</span>
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Re-query provider API"
                            onClick={() => handleOpenAction(ex, 're-query')}
                          >
                            <i className="ti ti-refresh me-1" /> Re-Query
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Match Bank Session ID"
                            onClick={() => handleOpenAction(ex, 'match')}
                          >
                            <i className="ti ti-link me-1" /> Match
                          </button>
                          {ex.issue.includes('Commission Delta') ? (
                            <button
                              type="button"
                              className="btn btn-outline-warning text-dark"
                              title="Write off micro-variance"
                              onClick={() => handleOpenAction(ex, 'write-off')}
                            >
                              <i className="ti ti-calculator me-1" /> Write-Off
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Refund to customer wallet"
                              onClick={() => handleOpenAction(ex, 'refund')}
                            >
                              <i className="ti ti-arrow-back-up me-1" /> Refund
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="View internal notes"
                            onClick={() => setNotesTarget({ id: ex.id, title: ex.internalRef })}
                          >
                            <i className="ti ti-notes" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exceptions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        <i className="ti ti-circle-check fs-24 text-success d-block mb-1" />
                        All provider transactions are reconciled with internal ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="row g-3">
              {exceptions.map((ex) => (
                <div key={ex.id} className="col-12">
                  <div className="card border rounded-3 p-3 bg-light-subtle">
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger-subtle text-danger font-monospace">{ex.id}</span>
                        <strong className="text-dark">{ex.internalRef}</strong>
                        <span className="text-muted">vs</span>
                        <span className="badge bg-light text-dark border">{ex.provider} ({ex.providerRef})</span>
                      </div>
                      <span className="fw-bold font-monospace text-dark">{fmtMoney(ex.amount, ex.currency)}</span>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="card p-3 border-0 bg-white shadow-sm h-100">
                          <h6 className="fw-bold fs-13 text-secondary mb-2">Internal Ledger State</h6>
                          <div className="d-flex justify-content-between fs-12 mb-1">
                            <span className="text-muted">Status:</span>
                            <span className="badge bg-secondary font-monospace">{ex.internalStatus}</span>
                          </div>
                          <div className="d-flex justify-content-between fs-12 mb-1">
                            <span className="text-muted">Timestamp:</span>
                            <span className="font-monospace text-dark">{ex.internalTime}</span>
                          </div>
                          <div className="d-flex justify-content-between fs-12">
                            <span className="text-muted">Ledger Amount:</span>
                            <span className="font-monospace fw-semibold text-dark">{fmtMoney(ex.amount, ex.currency)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card p-3 border-0 bg-white shadow-sm h-100">
                          <h6 className="fw-bold fs-13 text-secondary mb-2">Provider Gateway Response</h6>
                          <div className="d-flex justify-content-between fs-12 mb-1">
                            <span className="text-muted">Provider Status:</span>
                            <span className="badge bg-warning text-dark font-monospace">{ex.providerStatus}</span>
                          </div>
                          <div className="d-flex justify-content-between fs-12 mb-1">
                            <span className="text-muted">Timestamp:</span>
                            <span className="font-monospace text-dark">{ex.providerTime}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted fs-11 d-block mb-1">Raw Callback Payload:</span>
                            <pre className="bg-light p-2 rounded text-dark font-monospace fs-11 m-0 overflow-auto" style={{ maxHeight: 60 }}>
                              {ex.rawPayloadSnippet}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stalled' && (
            <div>
              <div className="alert alert-warning border-0 rounded-3 d-flex align-items-center gap-3 mb-3 p-3">
                <i className="ti ti-alert-triangle fs-24 text-warning" />
                <div className="fs-13">
                  <strong>SLA Escalation Threshold:</strong> Transactions stalled for more than 60 minutes are escalated to operations and treasury leads.
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Exception ID</th>
                      <th>Reference</th>
                      <th>Provider</th>
                      <th>Stalled Time</th>
                      <th>Amount</th>
                      <th>Escalation Owner</th>
                      <th className="text-end">Emergency Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions
                      .filter((e) => e.stalledDuration.includes('h'))
                      .map((ex) => (
                        <tr key={ex.id}>
                          <td><span className="badge bg-danger font-monospace">{ex.id}</span></td>
                          <td><strong className="font-monospace text-dark">{ex.internalRef}</strong></td>
                          <td><span className="badge bg-light text-dark border">{ex.provider}</span></td>
                          <td><span className="text-danger fw-bold font-monospace">{ex.stalledDuration}</span></td>
                          <td className="fw-bold font-monospace">{fmtMoney(ex.amount, ex.currency)}</td>
                          <td><span className="text-dark fs-12">{ex.assignedOwner}</span></td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleOpenAction(ex, 'refund')}
                            >
                              Emergency Refund
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Realistic Reconciliation Action Modal */}
      {actionModal.isOpen && actionModal.item && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setActionModal({ isOpen: false, type: 're-query', item: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {actionModal.type === 're-query' && 'Re-Query Gateway Endpoint'}
                  {actionModal.type === 'match' && 'Match Bank Session ID / Reference'}
                  {actionModal.type === 'refund' && 'Execute Customer Wallet Refund'}
                  {actionModal.type === 'write-off' && 'Book Micro-Variance GL Write-Off'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActionModal({ isOpen: false, type: 're-query', item: null })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted fs-12">Internal Ref:</span>
                    <strong className="ms-1 font-monospace text-dark">{actionModal.item.internalRef}</strong>
                  </div>
                  <span className="badge bg-secondary font-monospace">
                    {fmtMoney(actionModal.item.amount, actionModal.item.currency)}
                  </span>
                </div>

                {actionModal.type === 're-query' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Queries the live API of <strong className="text-dark">{actionModal.item.provider}</strong> for order/transaction status to reconcile with local database.
                    </p>
                    <div className="p-2 border rounded bg-white font-monospace fs-12 mb-3">
                      <div><strong>Provider Ref:</strong> {actionModal.item.providerRef}</div>
                      <div><strong>Endpoint:</strong> GET /api/v1/settlements/{actionModal.item.providerRef}/status</div>
                    </div>
                  </div>
                )}

                {actionModal.type === 'match' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Manually bind this transaction to a verified bank settlement session from NIBSS or clearing bank statement.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Bank Session ID / NIBSS RRN</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. 9990142610100912"
                        value={bankSessionId}
                        onChange={(e) => setBankSessionId(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {actionModal.type === 'refund' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Credit the customer wallet with <strong className="text-dark">{fmtMoney(actionModal.item.amount, actionModal.item.currency)}</strong> due to provider delivery failure.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Refund Audit Reason</label>
                      <select
                        className="form-select form-select-sm"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      >
                        <option value="Provider gateway permanent failure">Provider gateway permanent failure</option>
                        <option value="Beneficiary bank account inactive / invalid">Beneficiary bank account inactive</option>
                        <option value="Interbank clearing network timeout (NIP)">Interbank network timeout (NIP)</option>
                        <option value="Name mismatch between KYC and bank account">Name mismatch between KYC and account</option>
                      </select>
                    </div>
                  </div>
                )}

                {actionModal.type === 'write-off' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Record a micro-variance write-off to the operational fee expense ledger for delta between quoted fee and broker execution fee.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Variance Reason</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={writeOffReason}
                        onChange={(e) => setWriteOffReason(e.target.value)}
                      />
                    </div>
                    <div className="p-2 border rounded bg-white text-muted fs-12">
                      Posting: Debit Operational Fee Expense (+{fmtMoney(0.75, actionModal.item.currency)}), Credit Broker Clearing Account.
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setActionModal({ isOpen: false, type: 're-query', item: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary"
                  onClick={handleExecuteAction}
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
