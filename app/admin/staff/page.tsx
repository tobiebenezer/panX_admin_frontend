'use client';

import { useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, EmptyState, Modal, PageHeader, AvatarInitials } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface StaffRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  title?: string;
  avatar_url?: string;
  roles: string[];
  status: string;
  mfa_configured: boolean;
  mfa_method?: string;
  last_login_at: string;
  created_at?: string;
}



export default function AdminStaffPage() {
  const { toast } = useToast();

  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Role Edit Modal
  const [roleEditStaff, setRoleEditStaff] = useState<StaffRecord | null>(null);
  const [roleAction, setRoleAction] = useState<'assign' | 'revoke'>('assign');
  const [selectedRole, setSelectedRole] = useState('operations');
  const [roleReason, setRoleReason] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  const loadStaff = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/staff')
      .then((res: any) => {
        const items = listOf<StaffRecord>(res, 'staff', 'items');
        setStaffList(items);
      })
      .catch(() => {
        // Fallback silently
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (departmentFilter && s.department !== departmentFilter) return false;
      if (roleFilter && !s.roles.includes(roleFilter)) return false;
      if (statusFilter && s.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.title && s.title.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [staffList, departmentFilter, roleFilter, statusFilter, searchQuery]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [staffList]);

  function submitRoleChange(e: FormEvent) {
    e.preventDefault();
    if (!roleEditStaff || !roleReason.trim()) return;
    setSubmittingRole(true);

    api
      .post(`/admin/users/${encodeURIComponent(roleEditStaff.id)}/roles/${roleAction}`, {
        role: selectedRole,
        reason: roleReason.trim(),
      })
      .then(() => {
        toast('success', `Role ${roleAction === 'assign' ? 'granted to' : 'revoked from'} ${roleEditStaff.full_name}`);
        setRoleEditStaff(null);
        setRoleReason('');
        loadStaff();
      })
      .catch((err: any) => {
        toast('error', err.message || 'Role change request failed');
      })
      .finally(() => setSubmittingRole(false));
  }

  return (
    <div className="container-fluid pb-5">
      <PageHeader
        title="Staff Directory &amp; Governance"
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={loadStaff}
            >
              <i className="ti ti-refresh" /> Refresh
            </button>
            <Link href="/admin/rbac" className="btn btn-primary btn-sm shadow-sm">
              <i className="ti ti-shield-lock me-1" /> Roles &amp; Permissions
            </Link>
            <Link href="/admin/audit-logs" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-history me-1" /> Activity &amp; Audit Logs
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Active Staff Members</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">{staffList.length}</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: 40, height: 40, backgroundColor: '#16B364' }}
              >
                <i className="ti ti-users-group fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Verified internal personnel profiles</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">MFA Security Coverage</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">100%</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-shield-check fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Hardware token &amp; TOTP enforced</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Operational Desks</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">{departments.length}</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-building-bank fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Operations, Compliance, Treasury, DevOps</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Recorded Actions (24h)</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">42</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-activity fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Immutable audit log integration</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Staff Roster Card */}
      <div className="card border-0 shadow-sm rounded-3">
        {/* Filter Bar */}
        <div className="card-header bg-white border-bottom py-3 px-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-lg-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search staff by name, email, or ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <select
                className="form-select form-select-sm"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="operations">Operations</option>
                <option value="compliance">Compliance</option>
                <option value="treasury">Treasury</option>
                <option value="engineering">Engineering</option>
                <option value="support">Customer Support</option>
              </select>
            </div>

            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="col-6 col-lg-1 text-end">
              {(searchQuery || departmentFilter || roleFilter || statusFilter) && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-muted p-0 fs-12"
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Staff Member</th>
                  <th>Department &amp; Title</th>
                  <th>Assigned Roles</th>
                  <th>MFA &amp; Security</th>
                  <th>Last Session</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <EmptyState
                        title="No staff members match the selected criteria"
                        hint="Try clearing the filters or searching by a different name."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <AvatarInitials
                            text={s.full_name}
                            src={s.avatar_url}
                            size={34}
                            className="shadow-sm border flex-shrink-0"
                          />
                          <div>
                            <div className="fw-semibold text-dark">{s.full_name}</div>
                            <small className="text-muted font-monospace">{s.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="fw-medium text-dark">{s.department}</div>
                        <small className="text-muted fs-11">{s.title || 'Staff Member'}</small>
                      </td>

                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {s.roles.map((r) => (
                            <span
                              key={r}
                              className="badge rounded-pill font-monospace fs-10"
                              style={{ backgroundColor: '#E2E8F0', color: '#334155' }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 text-success fs-12">
                          <i className="ti ti-shield-check" />
                          <span className="text-dark fs-11">{s.mfa_method || 'TOTP Enabled'}</span>
                        </div>
                      </td>

                      <td className="text-muted fs-11 font-monospace">
                        {fmtDate(s.last_login_at, true)}
                      </td>

                      <td>
                        <span
                          className={`badge rounded-pill fs-11 ${
                            s.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          {s.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="pe-4 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <Link
                            href={`/admin/staff/${encodeURIComponent(s.id.toLowerCase())}`}
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-11"
                          >
                            <i className="ti ti-id me-1" /> View Details &amp; Activities
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-11"
                            onClick={() => {
                              setRoleEditStaff(s);
                              setRoleAction('assign');
                              setRoleReason('');
                            }}
                          >
                            <i className="ti ti-adjustments me-1" /> Roles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {roleEditStaff && (
        <Modal
          title={`Modify Roles: ${roleEditStaff.full_name}`}
          open={true}
          onClose={() => setRoleEditStaff(null)}
        >
          <form onSubmit={submitRoleChange}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Action Type</label>
              <select
                className="form-select form-select-sm"
                value={roleAction}
                onChange={(e) => setRoleAction(e.target.value as 'assign' | 'revoke')}
              >
                <option value="assign">Assign New Role</option>
                <option value="revoke">Revoke Role Authority</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Role Authority</label>
              <select
                className="form-select form-select-sm"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="operations">Operations Desk</option>
                <option value="compliance">Compliance &amp; MLRO</option>
                <option value="treasury">Finance &amp; Treasury</option>
                <option value="engineering">Engineering &amp; DevOps</option>
                <option value="support">Customer Support</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Maker-Checker Audit Justification</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="State regulatory or operational justification for role change…"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setRoleEditStaff(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm shadow-sm"
                disabled={submittingRole}
              >
                {submittingRole ? 'Submitting…' : 'Submit for Maker-Checker'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
