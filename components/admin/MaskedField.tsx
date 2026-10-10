'use client';

import React, { useState } from 'react';

export interface MaskedFieldProps {
  label?: string;
  rawValue: string;
  maskedValue?: string;
  fieldType?: 'email' | 'phone' | 'bvn' | 'nin' | 'bank_account' | 'address' | 'text';
  recordId?: string;
}

export function defaultMask(value: string, type: MaskedFieldProps['fieldType'] = 'text'): string {
  if (!value) return '—';
  if (type === 'email') {
    const parts = value.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name.slice(0, 2)}***${name.slice(-1)}` : `${name}***`;
      return `${maskedName}@${domain}`;
    }
  }
  if (type === 'phone') {
    if (value.length > 7) {
      return `${value.slice(0, 4)} ••• •• ${value.slice(-3)}`;
    }
    return '••••••••';
  }
  if (type === 'bvn' || type === 'nin') {
    return `•••• •••• ${value.slice(-4)}`;
  }
  if (type === 'bank_account') {
    return `••••••${value.slice(-4)}`;
  }
  // Generic
  if (value.length > 6) {
    return `${value.slice(0, 3)}••••••${value.slice(-2)}`;
  }
  return '••••••••';
}

export function MaskedField({
  label,
  rawValue,
  maskedValue,
  fieldType = 'text',
  recordId = 'REC-CURRENT',
}: MaskedFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('Compliance AML Review');
  const [notes, setNotes] = useState('');
  const [auditId, setAuditId] = useState<string | null>(null);

  const displayMask = maskedValue || defaultMask(rawValue, fieldType);

  const handleConfirmReveal = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `AUD-${Math.floor(100000 + Math.random() * 900000)}`;
    setAuditId(id);
    setIsRevealed(true);
    setModalOpen(false);

    // Save to local storage for immutable audit log feed demo
    try {
      const existing = JSON.parse(localStorage.getItem('pae_pii_audit_trail') || '[]');
      existing.unshift({
        id,
        timestamp: new Date().toISOString(),
        staff: 'Aliko Adeleke (Superadmin)',
        record: recordId,
        field: label || fieldType,
        reason,
        notes,
      });
      localStorage.setItem('pae_pii_audit_trail', JSON.stringify(existing.slice(0, 50)));
      window.dispatchEvent(new Event('pae-audit-updated'));
    } catch {}
  };

  return (
    <div className="d-inline-flex align-items-center gap-2 flex-wrap">
      {label && <span className="text-muted fs-13">{label}:</span>}
      <span className="font-monospace fs-13 fw-semibold">
        {isRevealed ? rawValue : displayMask}
      </span>

      {!isRevealed ? (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11 rounded-pill d-inline-flex align-items-center gap-1 shadow-none"
          title="Personal data is protected under least-privilege policy. Click to unlock with reason."
          onClick={() => setModalOpen(true)}
        >
          <i className="ti ti-eye fs-12 text-primary" />
          <span>Reveal (PII Guard)</span>
        </button>
      ) : (
        <span
          className="badge bg-success-subtle text-success fs-10 py-1 px-2 rounded-pill font-monospace"
          title="Staff reveal logged in compliance register"
        >
          <i className="ti ti-lock-open me-1" />
          Logged #{auditId}
        </span>
      )}

      {/* Justification Modal */}
      {modalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', zIndex: 1070 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header bg-light py-2 px-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-shield-lock text-warning fs-18" />
                  <h6 className="modal-title fs-14 fw-semibold text-dark m-0">
                    Justify PII Data Decryption
                  </h6>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                />
              </div>

              <form onSubmit={handleConfirmReveal}>
                <div className="modal-body p-3 fs-13">
                  <div className="alert alert-warning py-2 px-3 fs-12 mb-3 border-0 bg-warning-subtle text-warning-emphasis rounded">
                    <strong>NDPR & GDPR Compliance Rule:</strong> Personal data is masked by default.
                    Unmasking this attribute will be recorded in the tamper-evident regulatory audit trail.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold fs-12 mb-1">
                      Target Entity / Field
                    </label>
                    <div className="p-2 bg-light rounded text-muted font-monospace fs-12">
                      Record: <strong>{recordId}</strong> · Field: <strong>{label || fieldType}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold fs-12 mb-1">
                      Regulatory Reason <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    >
                      <option value="Compliance AML Review">Compliance & AML Review / SAR Inquiry</option>
                      <option value="Fraud & Chargeback Investigation">Fraud & Chargeback Investigation</option>
                      <option value="Customer Support Escalation">Customer Support Explicit Escalation</option>
                      <option value="Manual Payout Settlement">Manual Payout Settlement & Bank Verification</option>
                      <option value="Sanctions False Positive Check">Sanctions Screening False-Positive Check</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold fs-12 mb-1">
                      Case / Ticket Note <span className="text-muted">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="e.g., Cross-checking with NIBSS verification portal for Tier 3 verification..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-3 border-top d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary fw-semibold px-3">
                    <i className="ti ti-check me-1" /> Confirm & Unmask
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
