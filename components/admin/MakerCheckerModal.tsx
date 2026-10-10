'use client';

import React, { useState } from 'react';

export interface MakerCheckerAction {
  id?: string;
  actionType:
    | 'KILL_SWITCH'
    | 'PROVIDER_CIRCUIT_BREAKER'
    | 'ACCOUNT_SUSPENSION'
    | 'REFUND_PAYOUT'
    | 'MANUAL_COMPLETION'
    | 'SECURITY_DELIST'
    | 'TREASURY_DIFFERENCE'
    | 'CONFIG_CHANGE'
    | 'TERMS_UPDATE'
    | 'ROLE_ASSIGNMENT';
  title: string;
  targetEntity: string;
  description: string;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  makerName?: string;
  makerRole?: string;
  canRollback?: boolean;
}

export function MakerCheckerModal({
  isOpen,
  action,
  onClose,
  onSubmitForApproval,
}: {
  isOpen: boolean;
  action: MakerCheckerAction | null;
  onClose: () => void;
  onSubmitForApproval: (details: { reason: string; urgency: string }) => void;
}) {
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState('NORMAL');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !action) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmitForApproval({ reason: justification, urgency });
      setSubmitted(false);
      onClose();
    }, 600);
  };

  const getImpactBadge = () => {
    switch (action.impactLevel) {
      case 'CRITICAL':
        return <span className="badge bg-danger-subtle text-danger px-2 py-1 fs-12 fw-bold">Critical · Checker Review Required</span>;
      case 'HIGH':
        return <span className="badge bg-warning-subtle text-warning px-2 py-1 fs-12 fw-bold">High Impact · Checker Review Required</span>;
      default:
        return <span className="badge bg-primary-subtle text-primary px-2 py-1 fs-12 fw-bold">Dual Control Required</span>;
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1070 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-3">
          {/* Header */}
          <div className="modal-header bg-light py-3 px-4 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-shield-check fs-22 text-primary" />
              <div>
                <h6 className="modal-title fs-15 fw-bold text-dark m-0">Dual-Control Approval</h6>
                <small className="text-muted fs-12">Requires review and sign-off by an independent checker</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 fs-13">
              <div className="mb-3 d-flex justify-content-between align-items-center">
                {getImpactBadge()}
                <span className="text-muted fs-12 font-monospace">Code: {action.actionType}</span>
              </div>

              {/* Action summary card */}
              <div className="card bg-light border p-3 mb-3 rounded-3">
                <h6 className="fw-bold fs-14 text-dark mb-1">{action.title}</h6>
                <div className="text-muted fs-13 mb-2">{action.description}</div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top fs-12">
                  <span className="text-muted">Target Entity:</span>
                  <span className="font-monospace fw-semibold text-dark">{action.targetEntity}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-1 fs-12">
                  <span className="text-muted">Initiating Maker:</span>
                  <span className="text-dark fw-medium">{action.makerName || 'Operations Officer'}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-1 fs-12">
                  <span className="text-muted">Rollback Feasibility:</span>
                  <span className={action.canRollback === false ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                    {action.canRollback === false ? 'Irreversible once approved' : 'Reversible within runbook guidelines'}
                  </span>
                </div>
              </div>

              {/* Rule Note */}
              <div className="alert alert-info py-2 px-3 fs-12 mb-3 border-0 bg-info-subtle text-info-emphasis rounded">
                <i className="ti ti-info-circle me-1" />
                <strong>Separation of Duties:</strong> You cannot approve your own submission.
                Upon submission, this request enters the <strong>Pending Approvals Desk</strong> for an independent checker from your department.
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-12 mb-1">
                  Business Justification & Context <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="Provide precise rationale, runbook link, or customer ticket ref #..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold fs-12 mb-1">Urgency Level</label>
                <div className="d-flex gap-3">
                  <div className="form-check fs-12">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="urgencyOpt"
                      id="urgencyNorm"
                      checked={urgency === 'NORMAL'}
                      onChange={() => setUrgency('NORMAL')}
                    />
                    <label className="form-check-label" htmlFor="urgencyNorm">
                      Standard SLA (4 Hours)
                    </label>
                  </div>
                  <div className="form-check fs-12">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="urgencyOpt"
                      id="urgencyP1"
                      checked={urgency === 'P1'}
                      onChange={() => setUrgency('P1')}
                    />
                    <label className="form-check-label text-danger fw-semibold" htmlFor="urgencyP1">
                      P1 Emergency (Escalate via PagerDuty)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted fs-11">
                Audit logged with ISO 27001 Maker-Checker compliance
              </span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary fw-semibold px-3"
                  disabled={submitted}
                >
                  {submitted ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" /> Routing…
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-1" /> Submit for 2nd Approval
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
