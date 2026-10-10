'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface RegDeadline {
  id: string;
  regulator: string;
  filingTitle: string;
  dueDate: string;
  status: 'PENDING' | 'PREPARED' | 'SUBMITTED';
  responsibleLead: string;
  submissionRef?: string;
}

interface AuditorGrant {
  id: string;
  firm: string;
  leadAuditor: string;
  scope: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

const INITIAL_DEADLINES: RegDeadline[] = [
  { id: 'REG-01', regulator: 'Central Bank of Nigeria (CBN)', filingTitle: 'Semi-Annual Cross-Border Remittance & Settlement Audit', dueDate: 'October 31, 2026', status: 'PREPARED', responsibleLead: 'Barr. Folake Adeleke (General Counsel)' },
  { id: 'REG-02', regulator: 'Securities and Exchange Commission (SEC)', filingTitle: 'Quarterly Digital Assets Custody & Brokerage Capital Adequacy', dueDate: 'November 15, 2026', status: 'PENDING', responsibleLead: 'Fatima Kyari (MLRO)' },
  { id: 'REG-03', regulator: 'Nigerian Financial Intelligence Unit (NFIU)', filingTitle: 'Monthly PEP & High-Value Transaction Register Return', dueDate: 'End of Current Month', status: 'PENDING', responsibleLead: 'Fatima Kyari (MLRO)' },
];

const INITIAL_AUDITOR_GRANTS: AuditorGrant[] = [
  {
    id: 'AUD-TKN-910',
    firm: 'PricewaterhouseCoopers (PwC Engagement)',
    leadAuditor: 'Ngozi Okoli, FCA',
    scope: 'General Ledger, Treasury & Trade Settlements',
    expiresAt: 'In 12 days',
    status: 'ACTIVE',
  },
];

export default function LegalGovernancePage() {
  const { toast } = useToast();
  const [deadlines, setDeadlines] = useState<RegDeadline[]>(INITIAL_DEADLINES);
  const [grants, setGrants] = useState<AuditorGrant[]>(INITIAL_AUDITOR_GRANTS);
  const [activeTab, setActiveTab] = useState<'calendar' | 'policies' | 'auditor_access'>('calendar');

  // Submit Filing Modal
  const [recordFiling, setRecordFiling] = useState<RegDeadline | null>(null);
  const [submissionRef, setSubmissionRef] = useState('');
  const [submissionOfficer, setSubmissionOfficer] = useState('');

  // Add Deadline Modal
  const [newDeadlineOpen, setNewDeadlineOpen] = useState(false);
  const [newRegulator, setNewRegulator] = useState('Central Bank of Nigeria (CBN)');
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newLead, setNewLead] = useState('Fatima Kyari (MLRO)');

  // Grant Auditor Token Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [auditorFirm, setAuditorFirm] = useState('KPMG Audit Advisory');
  const [auditorLead, setAuditorLead] = useState('');
  const [grantDurationDays, setGrantDurationDays] = useState('14');
  const [auditorScope, setAuditorScope] = useState('General Ledger & Settlement Ledgers');

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleRecordSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordFiling || !submissionRef.trim()) return;

    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === recordFiling.id
          ? { ...d, status: 'SUBMITTED', submissionRef: submissionRef.trim() }
          : d
      )
    );

    toast('success', `Filing ${recordFiling.id} marked as submitted (Ref: ${submissionRef.trim()})`);
    setRecordFiling(null);
    setSubmissionRef('');
  };

  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate.trim()) return;

    const item: RegDeadline = {
      id: `REG-0${deadlines.length + 1}`,
      regulator: newRegulator.trim(),
      filingTitle: newTitle.trim(),
      dueDate: newDueDate.trim(),
      status: 'PENDING',
      responsibleLead: newLead.trim(),
    };

    setDeadlines([...deadlines, item]);
    setNewDeadlineOpen(false);
    setNewTitle('');
    setNewDueDate('');
    toast('success', 'Statutory deadline added to regulatory calendar');
  };

  const handleIssueAuditorToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorLead.trim()) return;

    const newGrant: AuditorGrant = {
      id: `AUD-TKN-${Math.floor(100 + Math.random() * 900)}`,
      firm: auditorFirm.trim(),
      leadAuditor: auditorLead.trim(),
      scope: auditorScope,
      expiresAt: `In ${grantDurationDays} days`,
      status: 'ACTIVE',
    };

    setGrants([newGrant, ...grants]);
    setGrantModalOpen(false);
    setAuditorLead('');
    toast('success', `Inspection credential generated for ${newGrant.firm}`);
  };

  const handleRevokeToken = (id: string) => {
    setGrants((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: 'REVOKED' } : g))
    );
    toast('success', 'Auditor inspection credential revoked immediately');
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Legal & Governance</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeTab === 'calendar' && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => setNewDeadlineOpen(true)}
            >
              <i className="ti ti-plus" /> Add Regulatory Obligation
            </button>
          )}
          {activeTab === 'auditor_access' && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => setGrantModalOpen(true)}
            >
              <i className="ti ti-plus" /> Issue Auditor Access
            </button>
          )}
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'calendar' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('calendar')}
              >
                <i className="ti ti-calendar-event me-1" /> Regulatory Obligations & Deadlines ({deadlines.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'policies' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('policies')}
              >
                <i className="ti ti-file-text me-1" /> Policies & Terms
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'auditor_access' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('auditor_access')}
              >
                <i className="ti ti-user-check me-1" /> Auditor Inspection Access ({grants.filter((g) => g.status === 'ACTIVE').length})
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'calendar' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Regulator</th>
                    <th>Filing Requirement</th>
                    <th>Statutory Due Date</th>
                    <th>Responsible Officer</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deadlines.map((d) => (
                    <tr key={d.id}>
                      <td className="fw-bold text-dark">{d.regulator}</td>
                      <td>
                        <div className="fw-semibold text-dark">{d.filingTitle}</div>
                        {d.submissionRef && (
                          <span className="text-muted fs-11 font-monospace">Ref: {d.submissionRef}</span>
                        )}
                      </td>
                      <td className="font-monospace text-primary fw-semibold">{d.dueDate}</td>
                      <td className="text-muted">{d.responsibleLead}</td>
                      <td>
                        <span
                          className={`badge ${
                            d.status === 'SUBMITTED'
                              ? 'bg-success-subtle text-success'
                              : d.status === 'PREPARED'
                              ? 'bg-info-subtle text-info'
                              : 'bg-warning-subtle text-warning-emphasis'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          {d.status !== 'SUBMITTED' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-1 px-2 fs-12"
                              onClick={() => {
                                setRecordFiling(d);
                                setSubmissionRef('');
                                setSubmissionOfficer(d.responsibleLead);
                              }}
                            >
                              Record Submission
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => setNotesTarget({ id: d.id, title: d.filingTitle })}
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

          {activeTab === 'policies' && (
            <div className="d-flex flex-column gap-3">
              {[
                { title: 'Customer Terms of Service', version: 'v2026.3', updated: 'October 1, 2026', scope: 'All Retail & Institutional Users' },
                { title: 'AML / Counter-Terrorist Financing Policy', version: 'v2026.2', updated: 'September 15, 2026', scope: 'Transaction Monitoring & Sanctions' },
                { title: 'Securities Custody & Omnibus Disclosures', version: 'v2026.1', updated: 'August 20, 2026', scope: 'DriveWealth & CSCS Brokerage' },
              ].map((p, i) => (
                <div key={i} className="card border p-3 rounded-3 bg-white">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold fs-14 text-dark">{p.title}</span>
                        <span className="badge bg-light text-dark font-monospace fs-11">{p.version}</span>
                      </div>
                      <div className="text-muted fs-12 mt-1">Scope: {p.scope} • Effective: {p.updated}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => toast('info', `${p.title} version history retrieved`)}
                    >
                      View Version
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'auditor_access' && (
            <div className="d-flex flex-column gap-3">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Token ID</th>
                      <th>Audit Engagement Firm</th>
                      <th>Lead Examiner</th>
                      <th>Restricted Scope</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grants.map((g) => (
                      <tr key={g.id}>
                        <td className="font-monospace fw-semibold text-primary">{g.id}</td>
                        <td className="fw-semibold text-dark">{g.firm}</td>
                        <td>{g.leadAuditor}</td>
                        <td className="text-muted fs-12">{g.scope}</td>
                        <td className="font-monospace text-muted fs-12">{g.expiresAt}</td>
                        <td>
                          <span
                            className={`badge ${
                              g.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                        <td className="text-end">
                          {g.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-1 px-2 fs-12"
                              onClick={() => handleRevokeToken(g.id)}
                            >
                              Revoke Access
                            </button>
                          )}
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

      {/* Record Statutory Submission Modal */}
      {recordFiling && (
        <Modal
          title={`Record Regulatory Submission — ${recordFiling.id}`}
          open={Boolean(recordFiling)}
          onClose={() => setRecordFiling(null)}
        >
          <form onSubmit={handleRecordSubmission}>
            <div className="p-3 bg-light rounded-3 mb-3">
              <div className="fs-12 text-muted">Filing Title</div>
              <div className="fw-bold text-dark">{recordFiling.filingTitle}</div>
              <div className="fs-12 text-primary mt-1">Recipient: {recordFiling.regulator}</div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Regulator Receipt / Acknowledgment Code</label>
              <input
                type="text"
                className="form-control font-monospace"
                placeholder="e.g. CBN/BOP/2026/092-ACK"
                value={submissionRef}
                onChange={(e) => setSubmissionRef(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Attesting Officer</label>
              <input
                type="text"
                className="form-control"
                value={submissionOfficer}
                onChange={(e) => setSubmissionOfficer(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setRecordFiling(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm">
                Mark Submitted & Log Evidence
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Statutory Obligation Modal */}
      {newDeadlineOpen && (
        <Modal title="Schedule Regulatory Obligation" open={newDeadlineOpen} onClose={() => setNewDeadlineOpen(false)}>
          <form onSubmit={handleCreateDeadline}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Supervisory Authority</label>
              <select
                className="form-select"
                value={newRegulator}
                onChange={(e) => setNewRegulator(e.target.value)}
              >
                <option value="Central Bank of Nigeria (CBN)">Central Bank of Nigeria (CBN)</option>
                <option value="Securities and Exchange Commission (SEC)">Securities and Exchange Commission (SEC)</option>
                <option value="Nigerian Financial Intelligence Unit (NFIU)">Nigerian Financial Intelligence Unit (NFIU)</option>
                <option value="Federal Inland Revenue Service (FIRS)">Federal Inland Revenue Service (FIRS)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Filing Obligation Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Quarterly Capital Adequacy & Liquid Buffer Return"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Statutory Due Date</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. November 30, 2026"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Responsible Lead</label>
                <input
                  type="text"
                  className="form-control"
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setNewDeadlineOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Add to Calendar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Grant Auditor Access Modal */}
      {grantModalOpen && (
        <Modal title="Issue Auditor Inspection Credential" open={grantModalOpen} onClose={() => setGrantModalOpen(false)}>
          <form onSubmit={handleIssueAuditorToken}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">External Audit Firm</label>
              <input
                type="text"
                className="form-control"
                value={auditorFirm}
                onChange={(e) => setAuditorFirm(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Lead Examiner Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Babatunde Jinadu, FCA"
                value={auditorLead}
                onChange={(e) => setAuditorLead(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Validity Period</label>
                <select
                  className="form-select"
                  value={grantDurationDays}
                  onChange={(e) => setGrantDurationDays(e.target.value)}
                >
                  <option value="7">7 Days (Single Audit Sprint)</option>
                  <option value="14">14 Days (Standard Fieldwork)</option>
                  <option value="30">30 Days (Annual Statutory Audit)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Data Scope Restriction</label>
                <input
                  type="text"
                  className="form-control"
                  value={auditorScope}
                  onChange={(e) => setAuditorScope(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setGrantModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Generate Token
              </button>
            </div>
          </form>
        </Modal>
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
