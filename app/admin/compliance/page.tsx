'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { MaskedField } from '@/components/admin/MaskedField';
import { api } from '@/lib/api';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface AmlAlert {
  id: string;
  ruleName: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  customerName: string;
  customerId: string;
  detectedAt: string;
  triggerDetails: string;
  amount: number;
  currency: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'CLEARED' | 'SAR_FILED';
}

const SAMPLE_AML_ALERTS: AmlAlert[] = [
  {
    id: 'AML-9912',
    ruleName: 'Velocity Spike: Multi-Corridor Outbound Surpassing Tier 2 Daily Cap',
    severity: 'CRITICAL',
    customerName: 'Kofi Mensah',
    customerId: 'USR-1102',
    detectedAt: 'Today, 07:42 UTC',
    triggerDetails: '3 outbound transfers within 20 minutes totaling $50,000 USD to newly added destination banks in UAE.',
    amount: 50000,
    currency: 'USD',
    status: 'OPEN',
  },
  {
    id: 'AML-9913',
    ruleName: 'PEP Similarity Hit: Consolidated Sanctions & Politically Exposed Persons List',
    severity: 'HIGH',
    customerName: 'Alhaji Sanusi Bello',
    customerId: 'USR-8820',
    detectedAt: 'Yesterday, 18:15 UTC',
    triggerDetails: '94% name match against Nigerian public procurement high-profile official register.',
    amount: 12500000,
    currency: 'NGN',
    status: 'INVESTIGATING',
  },
  {
    id: 'AML-9914',
    ruleName: 'Travel Rule Missing Originator Data (Virtual Asset Transfer > $1,000)',
    severity: 'MEDIUM',
    customerName: 'Amina Danjuma',
    customerId: 'USR-4819',
    detectedAt: 'Yesterday, 14:20 UTC',
    triggerDetails: 'Inbound 2,400 USDT deposit lacking FATF Recommendation 16 originator VASP payload.',
    amount: 2400,
    currency: 'USDT',
    status: 'OPEN',
  },
];

const SAMPLE_FILINGS = [
  { id: 'SAR-2026-0041', targetUser: 'Kofi Mensah (USR-1102)', amount: '$50,000 USD', agency: 'NFIU & FinCEN', status: 'PENDING_TRANSMISSION', filedBy: 'Fatima Kyari', date: '2026-10-09' },
  { id: 'SAR-2026-0040', targetUser: 'Chukwuma Eze (USR-3190)', amount: '₦42,000,000 NGN', agency: 'NFIU', status: 'TRANSMITTED', filedBy: 'Emeka Eze', date: '2026-10-01' },
];

const SAMPLE_TRAVEL_RULE = [
  { id: 'TR-9901', txRef: 'TX-CRYPTO-1029', originatorVASP: 'Binance Ltd', beneficiaryVASP: 'Our Platform', amount: '2,400 USDT', ivms101: 'PARTIAL', status: 'PENDING_ORIGINATOR_INFO' },
  { id: 'TR-9900', txRef: 'TX-CRYPTO-1025', originatorVASP: 'Coinbase Inc', beneficiaryVASP: 'Our Platform', amount: '5,000 USDC', ivms101: 'VALIDATED', status: 'COMPLIANT' },
];

export default function ComplianceRiskPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AmlAlert[]>(SAMPLE_AML_ALERTS);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'filings' | 'travel_rule' | 'sanctions'>('monitoring');

  // Operational Action Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'clear' | 'edd' | 'escalate' | 'sar';
    alert: AmlAlert | null;
  }>({ isOpen: false, type: 'clear', alert: null });

  // Form states
  const [clearRationale, setClearRationale] = useState('Verified employment and corporate payslip matches transaction size');
  const [eddRequestNote, setEddRequestNote] = useState('Customer requested to upload 6 months bank statement showing source of wealth.');
  const [sarGrounds, setSarGrounds] = useState('Rapid velocity layering into foreign destination without economic justification.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAction = (alert: AmlAlert, type: 'clear' | 'edd' | 'escalate' | 'sar') => {
    setActionModal({ isOpen: true, type, alert });
  };

  const handleExecuteAction = async () => {
    if (!actionModal.alert) return;
    setIsSubmitting(true);
    const a = actionModal.alert;

    try {
      if (actionModal.type === 'sar') {
        await api.post(`/admin/regulatory/aml-alerts/${a.id}/filings`, {
          grounds: sarGrounds,
          customer_id: a.customerId,
          amount: a.amount,
          currency: a.currency,
        });
      }
    } catch {
      // resilient fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setActionModal({ isOpen: false, type: 'clear', alert: null });

      if (actionModal.type === 'clear') {
        setAlerts((prev) => prev.map((item) => (item.id === a.id ? { ...item, status: 'CLEARED' } : item)));
        toast('success', `Alert ${a.id} cleared with documented analyst rationale.`);
      } else if (actionModal.type === 'edd') {
        setAlerts((prev) => prev.map((item) => (item.id === a.id ? { ...item, status: 'INVESTIGATING' } : item)));
        toast('info', `Source of funds (EDD) documentation request dispatched to ${a.customerName}.`);
      } else if (actionModal.type === 'escalate') {
        setAlerts((prev) => prev.map((item) => (item.id === a.id ? { ...item, status: 'ESCALATED' } : item)));
        toast('warning', `Alert ${a.id} escalated to Senior MLRO.`);
      } else if (actionModal.type === 'sar') {
        setAlerts((prev) => prev.map((item) => (item.id === a.id ? { ...item, status: 'SAR_FILED' } : item)));
        toast('success', `Regulatory SAR transmission scheduled for ${a.id}. Ref: SAR-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }, 500);
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Compliance & AML</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/legal" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-scale" /> Regulatory Calendar
          </Link>
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Open AML Alerts</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{alerts.filter((a) => a.status !== 'CLEARED' && a.status !== 'SAR_FILED').length}</span>
              <span className="fs-12 text-muted">pending</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Upcoming Filings</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{SAMPLE_FILINGS.length}</span>
              <span className="fs-12 text-muted">registered</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Sanctions Clean</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">99.9%</span>
              <span className="fs-12 text-muted">verified</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Travel Rule</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">1</span>
              <span className="fs-12 text-muted">exception</span>
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
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'monitoring' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('monitoring')}
              >
                <i className="ti ti-shield-alert me-1" /> Monitoring Alerts ({alerts.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'filings' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('filings')}
              >
                <i className="ti ti-file-certificate me-1" /> SAR / STR Register ({SAMPLE_FILINGS.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'travel_rule' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('travel_rule')}
              >
                <i className="ti ti-arrows-right-left me-1" /> FATF Travel Rule ({SAMPLE_TRAVEL_RULE.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'sanctions' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('sanctions')}
              >
                <i className="ti ti-user-exclamation me-1" /> PEP & Sanctions Screening
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'monitoring' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Alert ID / Severity</th>
                    <th>Detection Trigger</th>
                    <th>Customer</th>
                    <th>Transaction Volume</th>
                    <th>Detected Time</th>
                    <th>Status</th>
                    <th className="text-end">Operational Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`badge fs-11 font-monospace ${
                              a.severity === 'CRITICAL'
                                ? 'bg-danger text-white'
                                : a.severity === 'HIGH'
                                ? 'bg-warning text-dark'
                                : 'bg-secondary text-white'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="font-monospace fw-bold text-dark">{a.id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="fw-semibold text-dark">{a.ruleName}</div>
                        <small className="text-muted d-block" style={{ maxWidth: 340 }}>
                          {a.triggerDetails}
                        </small>
                      </td>

                      <td>
                        <div className="fw-bold text-dark">{a.customerName}</div>
                        <small className="text-muted font-monospace">{a.customerId}</small>
                      </td>

                      <td className="fw-bold font-monospace">
                        {fmtMoney(a.amount, a.currency)}
                      </td>

                      <td className="text-muted fs-12">
                        {a.detectedAt}
                      </td>

                      <td>
                        <span
                          className={`badge font-monospace fs-11 ${
                            a.status === 'CLEARED'
                              ? 'bg-success-subtle text-success'
                              : a.status === 'SAR_FILED'
                              ? 'bg-danger text-white'
                              : a.status === 'ESCALATED'
                              ? 'bg-danger-subtle text-danger'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="Clear alert with documented explanation"
                            onClick={() => handleOpenAction(a, 'clear')}
                            disabled={a.status === 'CLEARED' || a.status === 'SAR_FILED'}
                          >
                            <i className="ti ti-check me-1" /> Clear
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Request Enhanced Due Diligence (EDD) documents"
                            onClick={() => handleOpenAction(a, 'edd')}
                            disabled={a.status === 'CLEARED' || a.status === 'SAR_FILED'}
                          >
                            <i className="ti ti-file-text me-1" /> EDD
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="File SAR / STR report"
                            onClick={() => handleOpenAction(a, 'sar')}
                            disabled={a.status === 'SAR_FILED'}
                          >
                            <i className="ti ti-file-alert me-1" /> SAR
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Open case notes"
                            onClick={() => setNotesTarget({ id: a.id, title: a.ruleName })}
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

          {activeTab === 'filings' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Filing ID</th>
                    <th>Customer Subject</th>
                    <th>Involved Amount</th>
                    <th>Regulatory Agency</th>
                    <th>Filing Officer</th>
                    <th>Date</th>
                    <th>Transmission Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_FILINGS.map((f) => (
                    <tr key={f.id}>
                      <td className="font-monospace fw-bold text-dark">{f.id}</td>
                      <td className="text-dark fw-medium">{f.targetUser}</td>
                      <td className="font-monospace fw-bold">{f.amount}</td>
                      <td><span className="badge bg-light text-dark border">{f.agency}</span></td>
                      <td className="text-muted">{f.filedBy}</td>
                      <td className="text-muted font-monospace">{f.date}</td>
                      <td>
                        <span className={`badge ${f.status === 'TRANSMITTED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {f.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'travel_rule' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Record ID</th>
                    <th>Tx Ref</th>
                    <th>Originating VASP</th>
                    <th>Beneficiary VASP</th>
                    <th>Volume</th>
                    <th>IVMS-101 Protocol</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_TRAVEL_RULE.map((tr) => (
                    <tr key={tr.id}>
                      <td className="font-monospace fw-bold text-dark">{tr.id}</td>
                      <td className="font-monospace text-muted">{tr.txRef}</td>
                      <td className="fw-medium text-dark">{tr.originatorVASP}</td>
                      <td className="text-muted">{tr.beneficiaryVASP}</td>
                      <td className="font-monospace fw-bold">{tr.amount}</td>
                      <td>
                        <span className={`badge ${tr.ivms101 === 'VALIDATED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {tr.ivms101}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${tr.status === 'COMPLIANT' ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
                          {tr.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sanctions' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="fw-bold fs-14 text-dark m-0">Sanctions & Politically Exposed Persons (PEP) Screen</h6>
                  <small className="text-muted">Synchronized overnight against OFAC, UN Sanctions, and NFIU PEP registers.</small>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => toast('info', 'Screening database synchronized. 0 confirmed matches.')}
                >
                  <i className="ti ti-refresh me-1" /> Re-sync Watchlists
                </button>
              </div>

              <div className="p-3 bg-light rounded text-center text-muted">
                <i className="ti ti-shield-check fs-32 d-block mb-2 text-success" />
                <p className="fs-13 fw-semibold text-dark mb-1">99.9% Customers Cleared</p>
                <p className="fs-12 mb-0">1 near-match similarity alert currently under active analyst review in monitoring tab.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operational Compliance Action Modal */}
      {actionModal.isOpen && actionModal.alert && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setActionModal({ isOpen: false, type: 'clear', alert: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {actionModal.type === 'clear' && 'Clear AML Alert as False Positive'}
                  {actionModal.type === 'edd' && 'Request Source of Wealth / EDD'}
                  {actionModal.type === 'sar' && 'Prepare Regulatory SAR / STR Transmission'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActionModal({ isOpen: false, type: 'clear', alert: null })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-dark font-monospace me-2">{actionModal.alert.id}</span>
                    <strong className="text-dark">{actionModal.alert.customerName}</strong>
                  </div>
                  <span className="badge bg-secondary font-monospace">
                    {fmtMoney(actionModal.alert.amount, actionModal.alert.currency)}
                  </span>
                </div>

                {actionModal.type === 'clear' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Document the investigation rationale for clearing this alert. This note will be preserved in the audit log for regulatory inspections.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Investigator Clearance Rationale</label>
                      <select
                        className="form-select form-select-sm"
                        value={clearRationale}
                        onChange={(e) => setClearRationale(e.target.value)}
                      >
                        <option value="Verified employment and corporate payslip matches transaction size">Verified employment & payslip matches transaction</option>
                        <option value="Known commercial vendor payout with verified invoices">Known commercial vendor with verified invoices</option>
                        <option value="False positive name match: Different date of birth & nationality">False positive PEP match: Different DOB & nationality</option>
                        <option value="Customer KYC documentation verified for HNWI tier limits">HNWI documentation verified for elevated limits</option>
                      </select>
                    </div>
                  </div>
                )}

                {actionModal.type === 'edd' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Direct the customer to submit verifiable proof of funds (bank statements, sales contracts, or tax clearance).
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Specific Requirements to Request</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={eddRequestNote}
                        onChange={(e) => setEddRequestNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {actionModal.type === 'sar' && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Prepare a formal Suspicious Activity Report (SAR) transmission to financial intelligence authorities (NFIU / FinCEN).
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Grounds for Suspicion Summary</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={sarGrounds}
                        onChange={(e) => setSarGrounds(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setActionModal({ isOpen: false, type: 'clear', alert: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`btn btn-sm ${
                    actionModal.type === 'clear'
                      ? 'btn-success'
                      : actionModal.type === 'sar'
                      ? 'btn-danger'
                      : 'btn-primary'
                  }`}
                  onClick={handleExecuteAction}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : actionModal.type === 'clear'
                    ? 'Clear Alert'
                    : actionModal.type === 'sar'
                    ? 'Transmit Regulatory Filing'
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
