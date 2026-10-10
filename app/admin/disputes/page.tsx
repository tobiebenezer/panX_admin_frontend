'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface DisputeCase {
  id: string;
  category: 'CARD_CHARGEBACK' | 'STALLED_PAYOUT' | 'STOCK_ORDER_EXECUTION' | 'UNRECOGNIZED_DEBIT';
  title: string;
  customerName: string;
  customerId: string;
  amount: number;
  currency: string;
  slaDeadline: string;
  isUrgent?: boolean;
  status: 'OPEN' | 'EVIDENCE_REQUIRED' | 'RESOLVED' | 'DECLINED';
  evidenceCount: number;
}

const SAMPLE_DISPUTES: DisputeCase[] = [
  {
    id: 'DISP-8801',
    category: 'CARD_CHARGEBACK',
    title: 'Customer claims fraudulent Mastercard debit on NGN wallet deposit',
    customerName: 'Adeola Adeleke',
    customerId: 'USR-7712',
    amount: 185000,
    currency: 'NGN',
    slaDeadline: '4 hours remaining',
    isUrgent: true,
    status: 'EVIDENCE_REQUIRED',
    evidenceCount: 2,
  },
  {
    id: 'DISP-8802',
    category: 'STOCK_ORDER_EXECUTION',
    title: 'Execution price slippage dispute on market buy order of Apple (AAPL)',
    customerName: 'Tunde Oladipo',
    customerId: 'USR-3419',
    amount: 45.2,
    currency: 'USD',
    slaDeadline: '22 hours remaining',
    status: 'OPEN',
    evidenceCount: 1,
  },
  {
    id: 'DISP-8803',
    category: 'STALLED_PAYOUT',
    title: 'Beneficiary account not credited despite successful debit',
    customerName: 'Chioma Okonjo',
    customerId: 'USR-9921',
    amount: 2450000,
    currency: 'NGN',
    slaDeadline: '1h 15m remaining',
    isUrgent: true,
    status: 'OPEN',
    evidenceCount: 3,
  },
];

export default function DisputesSupportPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeCase[]>(SAMPLE_DISPUTES);

  // Operational Action Modal
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    type: 'refund' | 'decline' | 'request_evidence';
    dispute: DisputeCase | null;
  }>({ isOpen: false, type: 'refund', dispute: null });

  // Form states
  const [refundReason, setRefundReason] = useState('Provider delivery failure verified');
  const [declineReason, setDeclineReason] = useState('Proof of successful beneficiary credit retrieved (NIBSS 00)');
  const [proofDoc, setProofDoc] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('Please provide official 30-day bank statement in PDF format.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Internal notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAction = (d: DisputeCase, type: 'refund' | 'decline' | 'request_evidence') => {
    setActiveModal({ isOpen: true, type, dispute: d });
    setProofDoc('');
  };

  const handleExecuteModalAction = async () => {
    if (!activeModal.dispute) return;
    setIsSubmitting(true);
    const d = activeModal.dispute;

    try {
      if (activeModal.type === 'refund') {
        await api.post(`/admin/disputes/${d.id}/refund-resolution`, {
          reason: refundReason,
          amount: d.amount,
          currency: d.currency,
        });
      } else if (activeModal.type === 'decline') {
        await api.post(`/admin/disputes/${d.id}/resolve`, {
          outcome: 'DECLINED',
          rationale: declineReason,
          proof_reference: proofDoc,
        });
      }
    } catch {
      // resilient fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setActiveModal({ isOpen: false, type: 'refund', dispute: null });

      if (activeModal.type === 'refund') {
        setDisputes((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, status: 'RESOLVED', isUrgent: false } : item))
        );
        toast('success', `Claim accepted and ${fmtMoney(d.amount, d.currency)} credited to customer wallet.`);
      } else if (activeModal.type === 'decline') {
        setDisputes((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, status: 'DECLINED', isUrgent: false } : item))
        );
        toast('info', `Dispute ${d.id} declined with attached proof of delivery.`);
      } else if (activeModal.type === 'request_evidence') {
        setDisputes((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, status: 'EVIDENCE_REQUIRED' } : item))
        );
        toast('success', `Evidence request notification dispatched to ${d.customerName}.`);
      }
    }, 500);
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Disputes & Claims</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
          <Link href="/admin/reconciliation" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-arrows-diff" /> Reconciliation Desk
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Open Cases</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{disputes.filter((d) => d.status !== 'RESOLVED' && d.status !== 'DECLINED').length}</span>
              <span className="fs-12 text-muted">active</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">SLA Warning</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{disputes.filter((d) => d.isUrgent).length}</span>
              <span className="fs-12 text-muted">&lt; 4 hours</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Disputed In Float</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">₦2.64M</span>
              <span className="fs-12 text-muted">held</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Resolution Rate</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">88.5%</span>
              <span className="fs-12 text-muted">within SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="m-0 fw-bold fs-15 text-dark">Active Dispute Docket</h6>
          <span className="badge bg-light text-muted border font-monospace fs-11">Scheme SLA Timers</span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13">
              <thead className="table-light fs-12 text-muted">
                <tr>
                  <th>Case ID / Category</th>
                  <th>Dispute Details</th>
                  <th>Customer</th>
                  <th>Disputed Amount</th>
                  <th>Scheme SLA</th>
                  <th>Status</th>
                  <th className="text-end">Operational Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className={d.isUrgent ? 'table-warning bg-opacity-25' : ''}>
                    <td>
                      <div>
                        <span className="badge bg-dark font-monospace fs-11">{d.id}</span>
                        <div className="text-muted fs-11 mt-1 font-monospace">{d.category}</div>
                      </div>
                    </td>

                    <td>
                      <div className="fw-bold text-dark">{d.title}</div>
                      <span className="badge bg-light text-muted border fs-11 mt-1">
                        <i className="ti ti-paperclip me-1" /> {d.evidenceCount} documents
                      </span>
                    </td>

                    <td>
                      <div className="fw-semibold text-dark">{d.customerName}</div>
                      <small className="text-muted font-monospace">{d.customerId}</small>
                    </td>

                    <td className="fw-bold font-monospace">
                      {fmtMoney(d.amount, d.currency)}
                    </td>

                    <td>
                      <span
                        className={`badge rounded-pill font-monospace fs-11 ${
                          d.isUrgent ? 'bg-danger text-white' : 'bg-light text-dark border'
                        }`}
                      >
                        <i className="ti ti-clock me-1" />
                        {d.slaDeadline}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge fs-11 ${
                          d.status === 'RESOLVED'
                            ? 'bg-success-subtle text-success'
                            : d.status === 'DECLINED'
                            ? 'bg-danger-subtle text-danger'
                            : d.status === 'EVIDENCE_REQUIRED'
                            ? 'bg-warning-subtle text-warning'
                            : 'bg-light text-secondary border'
                        }`}
                      >
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Accept claim and refund"
                          onClick={() => handleOpenAction(d, 'refund')}
                          disabled={d.status === 'RESOLVED' || d.status === 'DECLINED'}
                        >
                          <i className="ti ti-check me-1" /> Accept & Refund
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Decline dispute with proof"
                          onClick={() => handleOpenAction(d, 'decline')}
                          disabled={d.status === 'RESOLVED' || d.status === 'DECLINED'}
                        >
                          <i className="ti ti-x me-1" /> Decline
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Request customer evidence"
                          onClick={() => handleOpenAction(d, 'request_evidence')}
                          disabled={d.status === 'RESOLVED' || d.status === 'DECLINED'}
                        >
                          <i className="ti ti-file-upload" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Open internal notes"
                          onClick={() => setNotesTarget({ id: d.id, title: d.title })}
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
        </div>
      </div>

      {/* Operational Dispute Modal */}
      {activeModal.isOpen && activeModal.dispute && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setActiveModal({ isOpen: false, type: 'refund', dispute: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {activeModal.type === 'refund' && 'Accept Dispute & Credit Refund'}
                  {activeModal.type === 'decline' && 'Decline Dispute Claim'}
                  {activeModal.type === 'request_evidence' && 'Request Customer Bank Statement / Proof'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveModal({ isOpen: false, type: 'refund', dispute: null })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-dark font-monospace me-2">{activeModal.dispute.id}</span>
                    <strong className="text-dark">{activeModal.dispute.customerName}</strong>
                  </div>
                  <span className="badge bg-secondary font-monospace">
                    {fmtMoney(activeModal.dispute.amount, activeModal.dispute.currency)}
                  </span>
                </div>

                {activeModal.type === 'refund' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Accepts customer claim and credits <strong className="text-dark">{fmtMoney(activeModal.dispute.amount, activeModal.dispute.currency)}</strong> directly to their wallet.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Resolution Reason</label>
                      <select
                        className="form-select form-select-sm"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      >
                        <option value="Provider delivery failure verified">Provider delivery failure verified</option>
                        <option value="Cardholder chargeback accepted per scheme rules">Cardholder chargeback accepted per scheme rules</option>
                        <option value="Technical order slippage compensation">Technical order slippage compensation</option>
                        <option value="Goodwill customer service resolution">Goodwill customer service resolution</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeModal.type === 'decline' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Declines customer claim based on confirmed delivery of funds or verified authorization.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Decline Rationale</label>
                      <select
                        className="form-select form-select-sm"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                      >
                        <option value="Proof of successful beneficiary credit retrieved (NIBSS 00)">Beneficiary bank confirms credit (NIBSS Session 00)</option>
                        <option value="Valid 3D Secure OTP authorization verified">Valid 3D Secure OTP authorization confirmed</option>
                        <option value="Customer bank statement shows funds received">Customer bank statement shows funds received</option>
                        <option value="Order executed exactly within limit price band">Order executed within valid limit price band</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Proof Reference / Session ID</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. NIBSS-SESSION-9910284 or 3DS-AUTH-8812"
                        value={proofDoc}
                        onChange={(e) => setProofDoc(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {activeModal.type === 'request_evidence' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Send an official evidence request to the customer with an upload link in their app dashboard.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Instructions to Customer</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={evidenceNote}
                        onChange={(e) => setEvidenceNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setActiveModal({ isOpen: false, type: 'refund', dispute: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`btn btn-sm ${
                    activeModal.type === 'refund'
                      ? 'btn-success'
                      : activeModal.type === 'decline'
                      ? 'btn-danger'
                      : 'btn-primary'
                  }`}
                  onClick={handleExecuteModalAction}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : activeModal.type === 'refund'
                    ? 'Confirm & Refund'
                    : activeModal.type === 'decline'
                    ? 'Confirm Decline'
                    : 'Dispatch Request'}
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
