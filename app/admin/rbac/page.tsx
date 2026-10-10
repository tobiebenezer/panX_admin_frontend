'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { Card, DataTable, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface RoleDefinition {
  code: string;
  name: string;
  department: string;
  description: string;
  isSystem: boolean;
  staffCount: number;
}

interface PermissionItem {
  code: string;
  name: string;
  category: string;
  description: string;
}

interface StaffAssignment {
  id: string;
  name: string;
  email: string;
  department: string;
  assignedAt: string;
  mfaVerified: boolean;
}

const DEFAULT_ROLES: RoleDefinition[] = [
  { code: 'superadmin', name: 'Superadmin', department: 'Executive', description: 'Full unconstrained platform control and break-glass capabilities', isSystem: true, staffCount: 1 },
  { code: 'operations', name: 'Operations Desk', department: 'Operations', description: 'Day-to-day transaction processing, payouts, and customer support interventions', isSystem: true, staffCount: 4 },
  { code: 'compliance', name: 'Compliance & MLRO', department: 'Compliance', description: 'AML transaction monitoring, KYC Tier approvals, and regulatory filing', isSystem: true, staffCount: 2 },
  { code: 'treasury', name: 'Finance & Treasury', department: 'Finance', description: 'Liquidity buffer management, corridor pricing, and fee schedule governance', isSystem: true, staffCount: 3 },
  { code: 'engineering', name: 'Engineering & DevOps', department: 'Engineering', description: 'Circuit breakers, provider failovers, dead-letter retries, and API observability', isSystem: true, staffCount: 2 },
  { code: 'support', name: 'Customer Support', department: 'Operations', description: 'Dispute investigations, beneficiary verifications, and customer communication', isSystem: true, staffCount: 5 },
];

const PERMISSION_CATALOG: PermissionItem[] = [
  // 1. Core Ledger & Payouts
  { code: 'transactions:read', name: 'View Global Ledger', category: 'Core Ledger & Payouts', description: 'Inspect real-time transaction states and ledger journals' },
  { code: 'transactions:intervene', name: 'Intervene & Force Complete', category: 'Core Ledger & Payouts', description: 'Execute administrative state transitions on stalled transfers' },
  { code: 'transactions:refund', name: 'Execute User Refunds', category: 'Core Ledger & Payouts', description: 'Cancel payouts and credit original customer funding wallets' },
  { code: 'reconciliation:write_off', name: 'Authorize GL Write-Offs', category: 'Core Ledger & Payouts', description: 'Approve micro-variance reconciliation deltas against banking rails' },

  // 2. Treasury & Markets
  { code: 'treasury:view_reserves', name: 'Inspect Liquidity Buffers', category: 'Treasury & Markets', description: 'View real-time banking balances and provider runway estimates' },
  { code: 'treasury:wire_transfer', name: 'Initiate Buffer Top-Up Wires', category: 'Treasury & Markets', description: 'Disburse wire transfers to replenish low-runway payout providers' },
  { code: 'pricing:adjust_spreads', name: 'Adjust Volatility Bounds', category: 'Treasury & Markets', description: 'Modify corridor price sanity deviation thresholds' },
  { code: 'fees:create_schedule', name: 'Manage Fee Schedules', category: 'Treasury & Markets', description: 'Create and pause fee tiers and custom account concessions' },

  // 3. Compliance & AML
  { code: 'kyc:approve_tier', name: 'Approve KYC Verification Tiers', category: 'Compliance & AML', description: 'Override customer identity tiers with NIBSS / CAC audit justification' },
  { code: 'compliance:aml_triage', name: 'Clear AML Screening Hits', category: 'Compliance & AML', description: 'Resolve PEP and high-velocity alerts as false positives' },
  { code: 'compliance:file_sar', name: 'Transmit Regulatory SARs', category: 'Compliance & AML', description: 'Submit suspicious transaction reports to regulatory registries' },
  { code: 'audit:decrypt_pii', name: 'Decrypt Masked Customer PII', category: 'Compliance & AML', description: 'Access unmasked BVN, NIN, and bank account numbers for fraud review' },

  // 4. Securities & Custody
  { code: 'equities:halt_market', name: 'Halt Equity Trading', category: 'Securities & Custody', description: 'Trigger trading freezes on domestic (NGX) or US stock tickers' },
  { code: 'equities:distribute_dividends', name: 'Disburse Dividend Batches', category: 'Securities & Custody', description: 'Execute omnibus cash dividend credits with 10% statutory WHT' },
  { code: 'custody:reconcile_broker', name: 'CSCS & DTC Reconciliation', category: 'Securities & Custody', description: 'Verify custodial omnibus holding statements against clearing records' },

  // 5. Engineering & Infrastructure
  { code: 'providers:failover_route', name: 'Switch Failover Routes', category: 'Engineering & Infrastructure', description: 'Reroute active outbound payout rails to secondary bank providers' },
  { code: 'breakers:trip_reset', name: 'Trip / Reset Circuit Breakers', category: 'Engineering & Infrastructure', description: 'Manually halt or resume degraded third-party provider integrations' },
  { code: 'dlq:retry_jobs', name: 'Retry Poison Queue Jobs', category: 'Engineering & Infrastructure', description: 'Redeliver failed webhook messages and broker order dispatchers' },
  { code: 'killswitch:activate', name: 'Activate Emergency Kill Switch', category: 'Engineering & Infrastructure', description: 'Halt global trading corridors in disaster-recovery scenarios' },

  // 6. System Administration
  { code: 'staff:assign_roles', name: 'Mutate Staff Roles', category: 'System Administration', description: 'Assign or revoke administrative role memberships' },
  { code: 'rbac:manage_matrix', name: 'Configure RBAC Matrix', category: 'System Administration', description: 'Grant or revoke capability permissions assigned to roles' },
  { code: 'config:promote_version', name: 'Promote Staged Config', category: 'System Administration', description: 'Promote staged pricing or fee drafts to production engine' },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  superadmin: PERMISSION_CATALOG.map((p) => p.code),
  operations: [
    'transactions:read', 'transactions:intervene', 'transactions:refund', 'reconciliation:write_off',
    'treasury:view_reserves', 'kyc:approve_tier', 'providers:failover_route',
  ],
  compliance: [
    'transactions:read', 'kyc:approve_tier', 'compliance:aml_triage', 'compliance:file_sar',
    'audit:decrypt_pii', 'custody:reconcile_broker',
  ],
  treasury: [
    'transactions:read', 'reconciliation:write_off', 'treasury:view_reserves',
    'treasury:wire_transfer', 'pricing:adjust_spreads', 'fees:create_schedule', 'equities:distribute_dividends',
  ],
  engineering: [
    'transactions:read', 'providers:failover_route', 'breakers:trip_reset',
    'dlq:retry_jobs', 'killswitch:activate', 'config:promote_version',
  ],
  support: [
    'transactions:read', 'transactions:intervene',
  ],
};

const DEFAULT_STAFF: Record<string, StaffAssignment[]> = {
  superadmin: [
    { id: 'STF-01', name: 'Aliko Adeleke', email: 'aliko.adeleke@apexfinance.internal', department: 'Executive & Superadmin', assignedAt: 'Jan 15, 2026', mfaVerified: true },
  ],
  operations: [
    { id: 'STF-01', name: 'Aliko Adeleke', email: 'aliko.adeleke@apexfinance.internal', department: 'Executive & Superadmin', assignedAt: 'Jan 15, 2026', mfaVerified: true },
    { id: 'STF-04', name: 'Tunde Balogun', email: 'tunde.balogun@apexfinance.internal', department: 'Engineering & Ops', assignedAt: 'Feb 02, 2026', mfaVerified: true },
    { id: 'STF-05', name: 'Zainab Ahmed', email: 'zainab.ahmed@apexfinance.internal', department: 'Operations Desk', assignedAt: 'Mar 10, 2026', mfaVerified: true },
    { id: 'STF-06', name: 'Kolawole Davies', email: 'kolawole.davies@apexfinance.internal', department: 'Operations Desk', assignedAt: 'Mar 12, 2026', mfaVerified: true },
  ],
  compliance: [
    { id: 'STF-02', name: 'Fatima Kyari', email: 'fatima.kyari@apexfinance.internal', department: 'Compliance & Risk', assignedAt: 'Jan 20, 2026', mfaVerified: true },
    { id: 'STF-07', name: 'Barr. Folake Adeleke', email: 'folake.adeleke@apexfinance.internal', department: 'Legal & Governance', assignedAt: 'Feb 15, 2026', mfaVerified: true },
  ],
  treasury: [
    { id: 'STF-03', name: 'Emeka Eze', email: 'emeka.eze@apexfinance.internal', department: 'Finance & Treasury', assignedAt: 'Jan 18, 2026', mfaVerified: true },
    { id: 'STF-08', name: 'Ibrahim Danjuma', email: 'ibrahim.danjuma@apexfinance.internal', department: 'Treasury Markets', assignedAt: 'Feb 28, 2026', mfaVerified: true },
    { id: 'STF-09', name: 'Ngozi Okoli', email: 'ngozi.okoli@apexfinance.internal', department: 'Financial Controller', assignedAt: 'Mar 01, 2026', mfaVerified: true },
  ],
  engineering: [
    { id: 'STF-04', name: 'Tunde Balogun', email: 'tunde.balogun@apexfinance.internal', department: 'Engineering & Ops', assignedAt: 'Jan 10, 2026', mfaVerified: true },
    { id: 'STF-10', name: 'Chinedu Okafor', email: 'chinedu.okafor@apexfinance.internal', department: 'Platform Engineering', assignedAt: 'Feb 11, 2026', mfaVerified: true },
  ],
  support: [
    { id: 'STF-11', name: 'Amina Bello', email: 'amina.bello@apexfinance.internal', department: 'Customer Support', assignedAt: 'Jan 25, 2026', mfaVerified: true },
    { id: 'STF-12', name: 'David Mensah', email: 'david.mensah@apexfinance.internal', department: 'Customer Support', assignedAt: 'Feb 05, 2026', mfaVerified: true },
  ],
};

export default function AdminRBACPage() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('operations');
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [staffMap, setStaffMap] = useState<Record<string, StaffAssignment[]>>(DEFAULT_STAFF);
  const [activeTab, setActiveTab] = useState<'matrix' | 'staff'>('matrix');

  // Create Role Modal
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('Operations');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [cloneFromRole, setCloneFromRole] = useState('operations');

  // Clone Role Modal
  const [cloneRoleTarget, setCloneRoleTarget] = useState<RoleDefinition | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneCode, setCloneCode] = useState('');

  // Assign Staff Modal
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [assignStaffName, setAssignStaffName] = useState('Zainab Ahmed');
  const [assignStaffEmail, setAssignStaffEmail] = useState('zainab.ahmed@apexfinance.internal');

  // Initialize permission map
  const initPermissions = useCallback(() => {
    const initialMap: Record<string, Record<string, boolean>> = {};
    DEFAULT_ROLES.forEach((r) => {
      initialMap[r.code] = {};
      const grantedList = DEFAULT_ROLE_PERMS[r.code] || [];
      PERMISSION_CATALOG.forEach((p) => {
        initialMap[r.code][p.code] = r.code === 'superadmin' || grantedList.includes(p.code);
      });
    });
    setRolePermissions(initialMap);
  }, []);

  useEffect(() => {
    initPermissions();

    // Check backend, but gracefully fall back without showing 404
    api
      .get('/admin/rbac/roles')
      .then((res: any) => {
        const remoteRoles = listOf(res, 'roles', 'items');
        if (remoteRoles.length > 0) {
          setRoles(remoteRoles);
        }
      })
      .catch(() => {
        // Fallback silently without throwing 404
      });
  }, [initPermissions]);

  const selectedRole = roles.find((r) => r.code === selectedRoleCode) || roles[0];
  const currentPerms = rolePermissions[selectedRoleCode] || {};

  const handleTogglePermission = (permCode: string) => {
    if (selectedRoleCode === 'superadmin') {
      toast('info', 'Superadmin role permissions are permanently active');
      return;
    }

    const nextVal = !currentPerms[permCode];
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRoleCode]: {
        ...(prev[selectedRoleCode] || {}),
        [permCode]: nextVal,
      },
    }));

    toast('success', `Permission ${permCode} ${nextVal ? 'granted to' : 'revoked from'} ${selectedRole.name}`);
  };

  const handleBulkCategoryToggle = (category: string, grant: boolean) => {
    if (selectedRoleCode === 'superadmin') {
      toast('info', 'Superadmin role permissions are permanently active');
      return;
    }

    const catPerms = PERMISSION_CATALOG.filter((p) => p.category === category);
    setRolePermissions((prev) => {
      const updated = { ...(prev[selectedRoleCode] || {}) };
      catPerms.forEach((p) => {
        updated[p.code] = grant;
      });
      return {
        ...prev,
        [selectedRoleCode]: updated,
      };
    });

    toast('success', `${grant ? 'Granted' : 'Revoked'} all ${category} permissions for ${selectedRole.name}`);
  };

  const handleCreateRole = (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = newRoleCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanCode || !newRoleName.trim()) return;

    const newRole: RoleDefinition = {
      code: cleanCode,
      name: newRoleName.trim(),
      department: newRoleDept,
      description: newRoleDesc.trim() || `${newRoleName.trim()} role`,
      isSystem: false,
      staffCount: 0,
    };

    setRoles([...roles, newRole]);
    setRolePermissions((prev) => ({
      ...prev,
      [cleanCode]: { ...(prev[cloneFromRole] || {}) },
    }));
    setStaffMap((prev) => ({
      ...prev,
      [cleanCode]: [],
    }));

    setSelectedRoleCode(cleanCode);
    setCreateRoleOpen(false);
    setNewRoleCode('');
    setNewRoleName('');
    setNewRoleDesc('');
    toast('success', `Custom role "${newRole.name}" created and configured`);
  };

  const handleCloneRole = (e: FormEvent) => {
    e.preventDefault();
    if (!cloneRoleTarget || !cloneCode.trim() || !cloneName.trim()) return;

    const cleanCode = cloneCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const clonedRole: RoleDefinition = {
      code: cleanCode,
      name: cloneName.trim(),
      department: cloneRoleTarget.department,
      description: `Cloned from ${cloneRoleTarget.name}`,
      isSystem: false,
      staffCount: 0,
    };

    setRoles([...roles, clonedRole]);
    setRolePermissions((prev) => ({
      ...prev,
      [cleanCode]: { ...(prev[cloneRoleTarget.code] || {}) },
    }));
    setStaffMap((prev) => ({
      ...prev,
      [cleanCode]: [],
    }));

    setSelectedRoleCode(cleanCode);
    setCloneRoleTarget(null);
    setCloneCode('');
    setCloneName('');
    toast('success', `Role "${clonedRole.name}" cloned from ${cloneRoleTarget.name}`);
  };

  const handleDeleteRole = (roleCode: string) => {
    const target = roles.find((r) => r.code === roleCode);
    if (!target || target.isSystem) {
      toast('error', 'System roles cannot be deleted');
      return;
    }

    setRoles(roles.filter((r) => r.code !== roleCode));
    setSelectedRoleCode('operations');
    toast('success', `Custom role ${target.name} removed`);
  };

  const handleAssignStaff = (e: FormEvent) => {
    e.preventDefault();
    if (!assignStaffName.trim() || !assignStaffEmail.trim()) return;

    const newStaff: StaffAssignment = {
      id: `STF-${Math.floor(10 + Math.random() * 90)}`,
      name: assignStaffName.trim(),
      email: assignStaffEmail.trim(),
      department: selectedRole.department,
      assignedAt: 'Just now',
      mfaVerified: true,
    };

    setStaffMap((prev) => ({
      ...prev,
      [selectedRoleCode]: [newStaff, ...(prev[selectedRoleCode] || [])],
    }));

    setRoles((prev) =>
      prev.map((r) => (r.code === selectedRoleCode ? { ...r, staffCount: r.staffCount + 1 } : r))
    );

    setAssignStaffOpen(false);
    toast('success', `${newStaff.name} assigned to ${selectedRole.name}`);
  };

  const handleRemoveStaff = (staffId: string) => {
    setStaffMap((prev) => ({
      ...prev,
      [selectedRoleCode]: (prev[selectedRoleCode] || []).filter((s) => s.id !== staffId),
    }));

    setRoles((prev) =>
      prev.map((r) => (r.code === selectedRoleCode ? { ...r, staffCount: Math.max(0, r.staffCount - 1) } : r))
    );

    toast('success', 'Staff member unassigned from role');
  };

  // Group permissions by category
  const categories = Array.from(new Set(PERMISSION_CATALOG.map((p) => p.category)));
  const currentStaffList = staffMap[selectedRoleCode] || [];

  return (
    <div>
      <PageHeader
        title="Role & Permission Manager"
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setCreateRoleOpen(true)}
            >
              <i className="ti ti-plus" /> New Custom Role
            </button>
            <Link href="/admin/people" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-users me-1" /> People &amp; On-Call
            </Link>
          </div>
        }
      />

      <div className="row g-3">
        {/* Left Column: Roles Registry */}
        <div className="col-xl-4 col-md-5">
          <Card title="Roles Registry" className="shadow-sm border-0 h-100">
            <div className="d-flex flex-column gap-2">
              {roles.map((r) => {
                const isSelected = selectedRoleCode === r.code;
                return (
                  <div
                    key={r.code}
                    className={`card border p-3 rounded-3 cursor-pointer transition-all ${
                      isSelected ? 'border-success bg-success-subtle bg-opacity-10 shadow-sm' : 'bg-white hover-bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedRoleCode(r.code)}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className={`fw-bold fs-14 ${isSelected ? 'text-success' : 'text-dark'}`}>{r.name}</span>
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-light text-dark border fs-10">{r.department}</span>
                        {r.isSystem && <span className="badge bg-secondary-subtle text-secondary fs-10">System</span>}
                      </div>
                    </div>

                    <p className="fs-12 text-muted mb-2 text-truncate-2" style={{ lineHeight: 1.4 }}>
                      {r.description}
                    </p>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light">
                      <span className="fs-11 text-muted">
                        <i className="ti ti-user me-1" />
                        <strong>{(staffMap[r.code] || []).length}</strong> staff assigned
                      </span>

                      <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-link text-secondary p-0 fs-12 text-decoration-none"
                          title="Clone role"
                          onClick={() => {
                            setCloneRoleTarget(r);
                            setCloneName(`${r.name} (Copy)`);
                            setCloneCode(`${r.code}_copy`);
                          }}
                        >
                          <i className="ti ti-copy" />
                        </button>
                        {!r.isSystem && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 fs-12 text-decoration-none ms-1"
                            title="Delete custom role"
                            onClick={() => handleDeleteRole(r.code)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Permission Matrix & Staff Inspector */}
        <div className="col-xl-8 col-md-7">
          <Card className="shadow-sm border-0">
            {/* Header info */}
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom flex-wrap gap-2 mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold fs-18 text-dark m-0">{selectedRole.name}</h5>
                  <span className="font-monospace fs-11 badge bg-light text-secondary border">code: {selectedRole.code}</span>
                  {selectedRole.isSystem && <span className="badge bg-success-subtle text-success fs-10">Protected Role</span>}
                </div>
                <div className="text-muted fs-12 mt-1">{selectedRole.description}</div>
              </div>

              {/* View Switcher */}
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${activeTab === 'matrix' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('matrix')}
                >
                  <i className="ti ti-lock-access me-1" /> Permissions
                </button>
                <button
                  type="button"
                  className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('staff')}
                >
                  <i className="ti ti-users me-1" /> Assigned Staff ({currentStaffList.length})
                </button>
              </div>
            </div>

            {/* Matrix View */}
            {activeTab === 'matrix' && (
              <div>
                {selectedRoleCode === 'superadmin' && (
                  <div className="alert alert-light border py-2 px-3 fs-12 mb-3 text-secondary rounded">
                    <i className="ti ti-shield-check text-success me-1" />
                    <strong>Superadmin Override:</strong> All institutional permissions are automatically granted and permanently locked.
                  </div>
                )}

                <div className="d-flex flex-column gap-4">
                  {categories.map((cat) => {
                    const catPerms = PERMISSION_CATALOG.filter((p) => p.category === cat);
                    const grantedCount = catPerms.filter((p) => selectedRoleCode === 'superadmin' || currentPerms[p.code]).length;

                    return (
                      <div key={cat} className="border rounded-3 p-3 bg-white">
                        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold fs-14 text-dark">{cat}</span>
                            <span className="badge bg-light text-secondary fs-11">
                              {grantedCount} of {catPerms.length} active
                            </span>
                          </div>

                          {selectedRoleCode !== 'superadmin' && (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                                onClick={() => handleBulkCategoryToggle(cat, true)}
                              >
                                Grant All
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                                onClick={() => handleBulkCategoryToggle(cat, false)}
                              >
                                Revoke All
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0 fs-13">
                            <thead className="table-light fs-11 text-muted">
                              <tr>
                                <th>Capability Code</th>
                                <th>Scope Description</th>
                                <th className="text-center" style={{ width: 90 }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catPerms.map((p) => {
                                const isGranted = selectedRoleCode === 'superadmin' || Boolean(currentPerms[p.code]);
                                return (
                                  <tr key={p.code}>
                                    <td>
                                      <div className="fw-semibold text-dark">{p.name}</div>
                                      <span className="font-monospace text-muted fs-11">{p.code}</span>
                                    </td>
                                    <td className="text-muted fs-12">{p.description}</td>
                                    <td className="text-center">
                                      <div className="form-check form-switch d-inline-block">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          checked={isGranted}
                                          disabled={selectedRoleCode === 'superadmin'}
                                          onChange={() => handleTogglePermission(p.code)}
                                          style={{ cursor: selectedRoleCode === 'superadmin' ? 'default' : 'pointer' }}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assigned Staff View */}
            {activeTab === 'staff' && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="text-muted fs-13">
                    Staff members currently equipped with <strong>{selectedRole.name}</strong> permissions
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => setAssignStaffOpen(true)}
                  >
                    <i className="ti ti-user-plus" /> Assign Staff Member
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 fs-13">
                    <thead className="table-light fs-12 text-muted">
                      <tr>
                        <th>Staff Member</th>
                        <th>Department</th>
                        <th>MFA Security</th>
                        <th>Assigned Date</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStaffList.length > 0 ? (
                        currentStaffList.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <div className="fw-bold text-dark">{s.name}</div>
                              <span className="font-monospace text-muted fs-11">{s.email}</span>
                            </td>
                            <td>{s.department}</td>
                            <td>
                              <span className={`badge ${s.mfaVerified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                {s.mfaVerified ? 'Verified MFA' : 'MFA Pending'}
                              </span>
                            </td>
                            <td className="text-muted fs-12">{s.assignedAt}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-2 fs-11"
                                onClick={() => handleRemoveStaff(s.id)}
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4 fs-13">
                            No staff members currently assigned to this role.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      {createRoleOpen && (
        <Modal title="Create Custom Role" open={createRoleOpen} onClose={() => setCreateRoleOpen(false)}>
          <form onSubmit={handleCreateRole}>
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Role Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Risk Analyst"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (!newRoleCode) setNewRoleCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  }}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Role Code Identifier</label>
                <input
                  type="text"
                  className="form-control font-monospace"
                  placeholder="e.g. risk_analyst"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Department</label>
                <select
                  className="form-select"
                  value={newRoleDept}
                  onChange={(e) => setNewRoleDept(e.target.value)}
                >
                  <option value="Operations">Operations</option>
                  <option value="Compliance">Compliance &amp; Risk</option>
                  <option value="Finance">Finance &amp; Treasury</option>
                  <option value="Engineering">Engineering &amp; DevOps</option>
                  <option value="Legal">Legal &amp; Regulatory</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Clone Permissions From</label>
                <select
                  className="form-select"
                  value={cloneFromRole}
                  onChange={(e) => setCloneFromRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Role Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Responsibilities and intended access scope of this role…"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCreateRoleOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Create Role
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clone Role Modal */}
      {cloneRoleTarget && (
        <Modal
          title={`Clone Role — ${cloneRoleTarget.name}`}
          open={Boolean(cloneRoleTarget)}
          onClose={() => setCloneRoleTarget(null)}
        >
          <form onSubmit={handleCloneRole}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">New Role Display Name</label>
              <input
                type="text"
                className="form-control"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">New Role Code</label>
              <input
                type="text"
                className="form-control font-monospace"
                value={cloneCode}
                onChange={(e) => setCloneCode(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCloneRoleTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Clone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Staff Member Modal */}
      {assignStaffOpen && (
        <Modal title={`Assign Staff to ${selectedRole.name}`} open={assignStaffOpen} onClose={() => setAssignStaffOpen(false)}>
          <form onSubmit={handleAssignStaff}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Staff Member Name</label>
              <input
                type="text"
                className="form-control"
                value={assignStaffName}
                onChange={(e) => setAssignStaffName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Internal Email Address</label>
              <input
                type="email"
                className="form-control font-monospace"
                value={assignStaffEmail}
                onChange={(e) => setAssignStaffEmail(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAssignStaffOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm">
                Grant Membership
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
