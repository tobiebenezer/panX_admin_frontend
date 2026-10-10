'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  roles: string[];
  isOnCall: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'STF-01', name: 'Aliko Adeleke', email: 'aliko.adeleke@apexfinance.internal', department: 'Executive & Superadmin', roles: ['superadmin', 'operations', 'compliance'], isOnCall: false, status: 'ACTIVE' },
  { id: 'STF-02', name: 'Fatima Kyari', email: 'fatima.kyari@apexfinance.internal', department: 'Compliance & Risk', roles: ['compliance', 'mlro'], isOnCall: true, status: 'ACTIVE' },
  { id: 'STF-03', name: 'Emeka Eze', email: 'emeka.eze@apexfinance.internal', department: 'Finance & Treasury', roles: ['finance', 'treasury'], isOnCall: false, status: 'ACTIVE' },
  { id: 'STF-04', name: 'Tunde Balogun', email: 'tunde.balogun@apexfinance.internal', department: 'Engineering & Ops', roles: ['engineering', 'devops'], isOnCall: true, status: 'ACTIVE' },
];

export default function PeopleOnCallPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [activeTab, setActiveTab] = useState<'directory' | 'on_call'>('directory');

  // Role Edit Modal
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [roleToToggle, setRoleToToggle] = useState('operations');
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('add');
  const [roleReason, setRoleReason] = useState('');

  // On-Call Handover Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [newOnCallId, setNewOnCallId] = useState('STF-04');
  const [handoverNote, setHandoverNote] = useState('');

  // Suspend Staff Modal
  const [suspendTarget, setSuspendTarget] = useState<StaffMember | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !roleReason.trim()) return;

    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === selectedStaff.id) {
          const currentRoles = new Set(s.roles);
          if (roleAction === 'add') {
            currentRoles.add(roleToToggle);
          } else {
            currentRoles.delete(roleToToggle);
          }
          return { ...s, roles: Array.from(currentRoles) };
        }
        return s;
      })
    );

    toast('success', `Role ${roleToToggle} ${roleAction === 'add' ? 'assigned to' : 'revoked from'} ${selectedStaff.name}`);
    setSelectedStaff(null);
    setRoleReason('');
  };

  const handleOnCallHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setStaff((prev) =>
      prev.map((s) => ({
        ...s,
        isOnCall: s.id === newOnCallId,
      }))
    );

    const lead = staff.find((s) => s.id === newOnCallId);
    toast('success', `24/7 on-call duty handed over to ${lead?.name || 'new responder'}`);
    setHandoverModalOpen(false);
    setHandoverNote('');
  };

  const handleToggleSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendTarget) return;

    const nextStatus = suspendTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStaff((prev) =>
      prev.map((s) => (s.id === suspendTarget.id ? { ...s, status: nextStatus } : s))
    );

    toast(
      nextStatus === 'SUSPENDED' ? 'warning' : 'success',
      `Account ${suspendTarget.name} ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reactivated'}`
    );
    setSuspendTarget(null);
    setSuspendReason('');
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">People & Access</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeTab === 'on_call' && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => setHandoverModalOpen(true)}
            >
              <i className="ti ti-arrows-transfer-up" /> Handover On-Call
            </button>
          )}
          <Link href="/admin/staff" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-users" /> Staff List
          </Link>
          <Link href="/admin/rbac" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-lock-access" /> RBAC Matrix
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'directory' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('directory')}
              >
                <i className="ti ti-users me-1" /> Staff Directory ({staff.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'on_call' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('on_call')}
              >
                <i className="ti ti-phone-call me-1" /> On-Call Duty ({staff.filter((s) => s.isOnCall).length} Active)
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'directory' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Staff Name & Email</th>
                    <th>Department</th>
                    <th>Assigned Roles</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-bold text-dark">{s.name}</div>
                        <small className="text-muted font-monospace">{s.email}</small>
                      </td>
                      <td>{s.department}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {s.roles.map((r) => (
                            <span key={r} className="badge bg-light text-dark border font-monospace fs-10">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => {
                              setSelectedStaff(s);
                              setRoleAction('add');
                              setRoleReason('');
                            }}
                          >
                            Edit Roles
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm py-1 px-2 fs-12 ${
                              s.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'
                            }`}
                            onClick={() => {
                              setSuspendTarget(s);
                              setSuspendReason('');
                            }}
                          >
                            {s.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => setNotesTarget({ id: s.id, title: s.name })}
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

          {activeTab === 'on_call' && (
            <div className="d-flex flex-column gap-3">
              <div className="row g-3">
                {staff
                  .filter((s) => s.isOnCall)
                  .map((lead) => (
                    <div className="col-md-6" key={lead.id}>
                      <div className="card border-success border-2 p-3 rounded-3 bg-white shadow-sm">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-success text-white font-monospace fs-11">PRIMARY RESPONDER</span>
                          <span className="badge bg-success-subtle text-success fs-11">Active Routing</span>
                        </div>
                        <h5 className="fw-bold text-dark mb-1">{lead.name}</h5>
                        <div className="text-muted fs-12 font-monospace mb-2">{lead.email}</div>
                        <div className="fs-12 text-muted">
                          Department: <strong className="text-dark">{lead.department}</strong>
                        </div>
                        <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                          <small className="text-muted">Pager SLA: 5-minute ack</small>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setHandoverModalOpen(true);
                              setNewOnCallId(lead.id === 'STF-02' ? 'STF-04' : 'STF-02');
                            }}
                          >
                            Transfer Duty
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Mutation Modal */}
      {selectedStaff && (
        <Modal
          title={`Manage Roles — ${selectedStaff.name}`}
          open={Boolean(selectedStaff)}
          onClose={() => setSelectedStaff(null)}
        >
          <form onSubmit={handleRoleSubmit}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Action</label>
              <select
                className="form-select"
                value={roleAction}
                onChange={(e) => setRoleAction(e.target.value as any)}
              >
                <option value="add">Grant New Role</option>
                <option value="remove">Revoke Existing Role</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Role</label>
              <select
                className="form-select"
                value={roleToToggle}
                onChange={(e) => setRoleToToggle(e.target.value)}
              >
                <option value="operations">Operations (Order & Payout interventions)</option>
                <option value="compliance">Compliance (AML screening & SAR filing)</option>
                <option value="treasury">Treasury (Liquidity rebalancing & Buffer wires)</option>
                <option value="engineering">Engineering (Circuit breaker & DLQ retry)</option>
                <option value="superadmin">Superadmin (Global administrative permissions)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Operational Rationale</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Specify reason for privilege adjustment…"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedStaff(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Role Change
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* On-Call Handover Modal */}
      {handoverModalOpen && (
        <Modal title="Handover 24/7 Incident Duty" open={handoverModalOpen} onClose={() => setHandoverModalOpen(false)}>
          <form onSubmit={handleOnCallHandover}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Incoming On-Call Lead</label>
              <select
                className="form-select"
                value={newOnCallId}
                onChange={(e) => setNewOnCallId(e.target.value)}
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Handover Briefing Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ongoing watchlist items, active rail monitoring notes, or scheduled maintenance…"
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setHandoverModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Handover
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Suspend Account Modal */}
      {suspendTarget && (
        <Modal
          title={`${suspendTarget.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} Access — ${suspendTarget.name}`}
          open={Boolean(suspendTarget)}
          onClose={() => setSuspendTarget(null)}
        >
          <form onSubmit={handleToggleSuspend}>
            <p className="fs-13 text-dark">
              Are you sure you want to {suspendTarget.status === 'ACTIVE' ? 'suspend' : 'reactivate'} administrative access for{' '}
              <strong>{suspendTarget.name}</strong> ({suspendTarget.email})?
            </p>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Audit Rationale</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Reason for account status change…"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSuspendTarget(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-sm ${suspendTarget.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
              >
                Confirm {suspendTarget.status === 'ACTIVE' ? 'Suspension' : 'Reactivation'}
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
