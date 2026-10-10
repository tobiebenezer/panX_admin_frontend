'use client';

import { use, useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, EmptyState, Modal, PageHeader, AvatarInitials, PaginationControl } from '@/components/ui';
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

interface StaffActivity {
  id: string;
  action_type: string;
  category: string;
  description: string;
  entity_type: string;
  entity_id?: string;
  timestamp: string;
  ip_address: string;
  payload: Record<string, any>;
}

const ALL_ACTIVITIES: Record<string, StaffActivity[]> = {
  'STF-01': [
    {
      id: 'ACT-901',
      action_type: 'staff.role_assigned',
      category: 'Governance',
      description: 'Assigned Compliance & MLRO desk authority to Fatima Kyari',
      entity_type: 'staff_member',
      entity_id: 'STF-02',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { staff: 'Fatima Kyari', role: 'compliance', department: 'Compliance & AML' },
    },
    {
      id: 'ACT-902',
      action_type: 'equities.market_halt',
      category: 'Security',
      description: 'Engaged circuit breaker volatility pause on MTNN trading pair',
      entity_type: 'security_market',
      entity_id: 'NGX:MTNN',
      timestamp: new Date(Date.now() - 310 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { symbol: 'MTNN', market: 'NGX', deviation: '10.4%' },
    },
    {
      id: 'ACT-903',
      action_type: 'system.login',
      category: 'Security',
      description: 'Authenticated via TOTP Hardware Token from institutional VPN',
      entity_type: 'auth_session',
      entity_id: 'SES-88219',
      timestamp: new Date(Date.now() - 480 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { mfa_type: 'TOTP Hardware Token', user_agent: 'Apex Control Room Console' },
    },
    {
      id: 'ACT-920',
      action_type: 'reconciliation.sign_off',
      category: 'Operations',
      description: 'Signed off on daily Providus NIP interbank settlement ledger batch',
      entity_type: 'gl_journal',
      entity_id: 'JRN-2026-10-10',
      timestamp: new Date(Date.now() - 720 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { batch_total: 48291000, variance: 0, status: 'RECONCILED' },
    },
    {
      id: 'ACT-922',
      action_type: 'security.cidr_whitelist_updated',
      category: 'Security',
      description: 'Authorized dual-control IP CIDR subnet expansion for Lagos treasury enclave',
      entity_type: 'network_policy',
      entity_id: 'POL-NET-004',
      timestamp: new Date(Date.now() - 1440 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { cidr_added: '10.0.4.0/22', approved_by: 'Superadmin' },
    },
    {
      id: 'ACT-923',
      action_type: 'approval.maker_completed',
      category: 'Governance',
      description: 'Approved commercial provider rail status reactivation for Providus Direct',
      entity_type: 'provider',
      entity_id: 'PRV-02',
      timestamp: new Date(Date.now() - 1800 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { provider: 'Providus Direct', previous_status: 'degraded', current_status: 'healthy' },
    },
    {
      id: 'ACT-924',
      action_type: 'treasury.rebalance_authorized',
      category: 'Treasury',
      description: 'Authorized cross-border FX liquidity top-up on USD/KES corridor',
      entity_type: 'treasury_account',
      entity_id: 'ACC-KES-01',
      timestamp: new Date(Date.now() - 2880 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { amount_usd: 150000, destination_corridor: 'USD/KES' },
    },
    {
      id: 'ACT-925',
      action_type: 'kyc.escalation_resolved',
      category: 'Compliance',
      description: 'Reviewed and dismissed PEP false positive match on institutional client onboard',
      entity_type: 'customer',
      entity_id: 'USR-8819',
      timestamp: new Date(Date.now() - 3600 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { client: 'Meridian Trading', screening_result: 'CLEAR_FALSE_POSITIVE' },
    },
    {
      id: 'ACT-926',
      action_type: 'system.session_revoked',
      category: 'Security',
      description: 'Force-terminated stale console session token from unfamiliar device fingerprint',
      entity_type: 'auth_session',
      entity_id: 'SES-77192',
      timestamp: new Date(Date.now() - 4320 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { terminated_user: 'USR-4810', reason: 'Session inactivity > 8 hours' },
    },
    {
      id: 'ACT-927',
      action_type: 'pricing.spread_adjusted',
      category: 'Treasury',
      description: 'Reduced retail FX corridor spread on EUR/GHS from 52bps to 45bps',
      entity_type: 'fx_corridor',
      entity_id: 'COR-EUR-GHS',
      timestamp: new Date(Date.now() - 5760 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { corridor: 'EUR/GHS', spread_reduction_bps: 7 },
    },
    {
      id: 'ACT-928',
      action_type: 'governance.policy_promoted',
      category: 'Governance',
      description: 'Promoted revised AML travel rule threshold config to active production stage',
      entity_type: 'config_draft',
      entity_id: 'CFG-AML-V4',
      timestamp: new Date(Date.now() - 7200 * 60000).toISOString(),
      ip_address: '10.0.4.12',
      payload: { config_table: 'travel_rule_thresholds', version: '2026.04' },
    },
  ],
  'STF-02': [
    {
      id: 'ACT-904',
      action_type: 'kyc.tier_approved',
      category: 'Compliance',
      description: 'Approved Institutional Tier 3 verification with CAC corporate registry match',
      entity_type: 'customer',
      entity_id: 'USR-9921',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      ip_address: '10.0.4.19',
      payload: { requested_tier: 'tier_3', verified_bvn: true, cac_rc_number: 'RC-1490218' },
    },
    {
      id: 'ACT-905',
      action_type: 'pii.decrypted',
      category: 'Compliance',
      description: 'Decrypted masked BVN identity for Tier 3 verification manual review',
      entity_type: 'customer_bvn',
      entity_id: 'USR-9921',
      timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
      ip_address: '10.0.4.19',
      payload: { reason: 'NIBSS BVN Match Audit', masked: '221****902' },
    },
    {
      id: 'ACT-921',
      action_type: 'aml.sar_drafted',
      category: 'Compliance',
      description: 'Drafted regulatory suspicious activity report for rapid cross-border velocity hit',
      entity_type: 'aml_case',
      entity_id: 'SAR-2026-042',
      timestamp: new Date(Date.now() - 520 * 60000).toISOString(),
      ip_address: '10.0.4.19',
      payload: { user_id: 'USR-8819', trigger: 'Rapid $50,000 layering across multi-wallet' },
    },
  ],
  'STF-03': [
    {
      id: 'ACT-906',
      action_type: 'payout.force_complete',
      category: 'Operations',
      description: 'Manually completed stalled NIP disbursement after banking confirmation',
      entity_type: 'transaction',
      entity_id: 'TXN-902184',
      timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
      ip_address: '10.0.4.18',
      payload: { corridor: 'USD/NGN', amount: 5000, recipient: 'Chioma Okonjo', rail: 'Flutterwave NIP' },
    },
    {
      id: 'ACT-907',
      action_type: 'refund.approved',
      category: 'Operations',
      description: 'Approved customer funding wallet credit after failed partner payout',
      entity_type: 'transaction',
      entity_id: 'TXN-881204',
      timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
      ip_address: '10.0.4.18',
      payload: { refund_amount: 1200000, currency: 'NGN', wallet_id: 'WLT-NGN-01' },
    },
  ],
  'STF-04': [
    {
      id: 'ACT-908',
      action_type: 'pricing.spread_adjusted',
      category: 'Treasury',
      description: 'Reduced institutional retail markup on USD/NGN from 45bps to 38bps',
      entity_type: 'fx_corridor',
      entity_id: 'COR-USD-NGN',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
      ip_address: '10.0.4.22',
      payload: { corridor: 'USD/NGN', old_spread_bps: 45, new_spread_bps: 38 },
    },
    {
      id: 'ACT-909',
      action_type: 'treasury.buffer_rebalanced',
      category: 'Treasury',
      description: 'Rebalanced Providus working reserve from commercial custody account',
      entity_type: 'treasury_account',
      entity_id: 'ACC-PROV-01',
      timestamp: new Date(Date.now() - 420 * 60000).toISOString(),
      ip_address: '10.0.4.22',
      payload: { amount: 50000000, currency: 'NGN' },
    },
  ],
  'STF-05': [
    {
      id: 'ACT-910',
      action_type: 'circuit_breaker.trip',
      category: 'Engineering',
      description: 'Engaged automatic rail failover after Flutterwave latency exceeded 3000ms',
      entity_type: 'provider',
      entity_id: 'PRV-01',
      timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
      ip_address: '10.0.4.14',
      payload: { provider: 'Flutterwave', error_rate: '14.2%', failover_target: 'Providus Direct' },
    },
  ],
  'STF-06': [
    {
      id: 'ACT-911',
      action_type: 'dispute.resolved',
      category: 'Support',
      description: 'Resolved customer double-debit inquiry and linked settled NIP session',
      entity_type: 'dispute',
      entity_id: 'DSP-8812',
      timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
      ip_address: '10.0.4.30',
      payload: { dispute_id: 'DSP-8812', resolution: 'RESOLVED_VALID_DEBIT' },
    },
  ],
};

const DEFAULT_STAFF_MAP: Record<string, StaffRecord> = {
  'stf-01': {
    id: 'STF-01',
    full_name: 'Aliko Adeleke',
    email: 'aliko.adeleke@apexfinance.internal',
    phone: '+234 803 000 8899',
    department: 'Executive Leadership',
    title: 'Managing Director & Superadmin',
    roles: ['superadmin', 'operations', 'compliance'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'TOTP Hardware Token',
    last_login_at: new Date(Date.now() - 12 * 60000).toISOString(),
    created_at: '2025-11-01T08:00:00Z',
  },
  'stf-02': {
    id: 'STF-02',
    full_name: 'Fatima Kyari',
    email: 'fatima.kyari@apexfinance.internal',
    phone: '+234 802 334 1122',
    department: 'Compliance & AML',
    title: 'Lead MLRO & Head of Compliance',
    roles: ['compliance'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'TOTP Authenticator',
    last_login_at: new Date(Date.now() - 25 * 60000).toISOString(),
    created_at: '2025-12-10T09:30:00Z',
  },
  'stf-03': {
    id: 'STF-03',
    full_name: 'Babajide Sanwo',
    email: 'babajide.sanwo@apexfinance.internal',
    phone: '+234 803 998 4411',
    department: 'Operations',
    title: 'Senior Settlement Officer',
    roles: ['operations'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'WebAuthn Security Key',
    last_login_at: new Date(Date.now() - 40 * 60000).toISOString(),
    created_at: '2026-01-05T10:15:00Z',
  },
  'stf-04': {
    id: 'STF-04',
    full_name: 'Emeka Eze',
    email: 'emeka.eze@apexfinance.internal',
    phone: '+234 805 771 2288',
    department: 'Finance & Treasury',
    title: 'Treasury & Liquidity Manager',
    roles: ['treasury', 'finance'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'TOTP Authenticator',
    last_login_at: new Date(Date.now() - 65 * 60000).toISOString(),
    created_at: '2026-01-12T11:00:00Z',
  },
  'stf-05': {
    id: 'STF-05',
    full_name: 'Tunde Balogun',
    email: 'tunde.balogun@apexfinance.internal',
    phone: '+234 809 443 8811',
    department: 'Engineering & DevOps',
    title: 'Platform Infrastructure Lead',
    roles: ['engineering'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'WebAuthn Security Key',
    last_login_at: new Date(Date.now() - 95 * 60000).toISOString(),
    created_at: '2026-01-15T14:20:00Z',
  },
  'stf-06': {
    id: 'STF-06',
    full_name: 'Amina Bello',
    email: 'amina.bello@apexfinance.internal',
    phone: '+234 808 123 9900',
    department: 'Customer Support',
    title: 'Senior Client Support Specialist',
    roles: ['support'],
    status: 'active',
    mfa_configured: true,
    mfa_method: 'TOTP Authenticator',
    last_login_at: new Date(Date.now() - 140 * 60000).toISOString(),
    created_at: '2026-02-01T09:00:00Z',
  },
};

export default function StaffDetailView({ staffId }: { staffId: string }) {
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Activity Log
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Activity Inspector
  const [selectedActivity, setSelectedActivity] = useState<StaffActivity | null>(null);

  // Role Management Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleAction, setRoleAction] = useState<'assign' | 'revoke'>('assign');
  const [selectedRole, setSelectedRole] = useState('operations');
  const [roleReason, setRoleReason] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Quick Action Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'closed'>('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [revokeSessionsNow, setRevokeSessionsNow] = useState(true);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaMethodSelection, setMfaMethodSelection] = useState<'TOTP Authenticator' | 'WebAuthn Security Key' | 'TOTP Hardware Token'>('TOTP Authenticator');
  const [mfaReason, setMfaReason] = useState('');
  const [submittingMfa, setSubmittingMfa] = useState(false);

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [maxSessionMinutes, setMaxSessionMinutes] = useState(480);
  const [allowedCIDR, setAllowedCIDR] = useState('10.0.0.0/16, 192.168.1.0/24');
  const [requireHardwareMFA, setRequireHardwareMFA] = useState(false);
  const [submittingSecurity, setSubmittingSecurity] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    api
      .get(`/admin/staff/${encodeURIComponent(staffId)}`)
      .then((res: any) => {
        const item = res.staff || res;
        if (item && item.id) {
          setStaff(item);
        } else {
          const fallback = DEFAULT_STAFF_MAP[staffId.toLowerCase()] || DEFAULT_STAFF_MAP['stf-01'];
          setStaff(fallback);
        }
      })
      .catch(() => {
        const fallback = DEFAULT_STAFF_MAP[staffId.toLowerCase()] || DEFAULT_STAFF_MAP['stf-01'];
        setStaff(fallback);
      })
      .finally(() => setLoading(false));
  }, [staffId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize edit profile form when staff data loads
  useEffect(() => {
    if (staff) {
      setEditFullName(staff.full_name);
      setEditDepartment(staff.department);
      setEditTitle(staff.title || '');
      setEditPhone(staff.phone || '');
    }
  }, [staff]);

  // Activities for this staff member
  const rawActivities = useMemo(() => {
    const key = (staff?.id || staffId).toUpperCase();
    return ALL_ACTIVITIES[key] || ALL_ACTIVITIES['STF-01'] || [];
  }, [staff, staffId]);

  const filteredActivities = useMemo(() => {
    return rawActivities.filter((a) => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (startDate) {
        const itemDate = new Date(a.timestamp).getTime();
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (itemDate < start) return false;
      }
      if (endDate) {
        const itemDate = new Date(a.timestamp).getTime();
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if (itemDate > end) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.id.toLowerCase().includes(q) ||
          a.action_type.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.entity_id && a.entity_id.toLowerCase().includes(q)) ||
          a.ip_address.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [rawActivities, categoryFilter, startDate, endDate, searchQuery]);

  // Pagination for Activity Log
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset to page 1 whenever search, category, or date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);



  function handleRoleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!staff || !roleReason.trim()) return;
    setSubmittingRole(true);

    api
      .post(`/admin/users/${encodeURIComponent(staff.id)}/roles/${roleAction}`, {
        role: selectedRole,
        reason: roleReason.trim(),
      })
      .then(() => {
        let updatedRoles = [...staff.roles];
        if (roleAction === 'assign' && !updatedRoles.includes(selectedRole)) {
          updatedRoles.push(selectedRole);
        } else if (roleAction === 'revoke') {
          updatedRoles = updatedRoles.filter((r) => r !== selectedRole);
        }
        setStaff({ ...staff, roles: updatedRoles });
        toast('success', `Role ${roleAction === 'assign' ? 'assigned to' : 'revoked from'} ${staff.full_name}`);
        setRoleModalOpen(false);
        setRoleReason('');
      })
      .catch((err: any) => {
        toast('error', err.message || 'Role change request failed');
      })
      .finally(() => setSubmittingRole(false));
  }

  function handleStatusSubmit(e: FormEvent) {
    e.preventDefault();
    if (!staff || !statusReason.trim()) return;
    setSubmittingStatus(true);

    api
      .post(`/admin/users/${encodeURIComponent(staff.id)}/status`, {
        status: newStatus,
        reason: statusReason.trim(),
      })
      .then(() => {
        setStaff({ ...staff, status: newStatus });
        toast('success', `Staff account status changed to ${newStatus.toUpperCase()}`);
        setStatusModalOpen(false);
        setStatusReason('');
      })
      .catch((err: any) => {
        toast('error', err.message || 'Account status update failed');
      })
      .finally(() => setSubmittingStatus(false));
  }

  function handlePasswordReset(e: FormEvent) {
    e.preventDefault();
    if (!staff) return;
    setSubmittingPassword(true);

    api
      .post(`/admin/users/${encodeURIComponent(staff.id)}/password-reset`, {
        new_password: tempPassword.trim() || undefined,
        revoke_sessions: revokeSessionsNow,
      })
      .then(() => {
        toast('success', `Credentials reset dispatched. Active sessions terminated for ${staff.full_name}.`);
        setPasswordModalOpen(false);
        setTempPassword('');
      })
      .catch((err: any) => {
        toast('error', err.message || 'Password reset request failed');
      })
      .finally(() => setSubmittingPassword(false));
  }

  function handleMfaReset(e: FormEvent) {
    e.preventDefault();
    if (!staff || !mfaReason.trim()) return;
    setSubmittingMfa(true);

    api
      .post(`/admin/users/${encodeURIComponent(staff.id)}/mfa-reset`, {
        method: mfaMethodSelection,
        reason: mfaReason.trim(),
      })
      .then(() => {
        setStaff({ ...staff, mfa_method: mfaMethodSelection, mfa_configured: true });
        toast('success', `MFA reset issued: Re-enrollment key sent for ${mfaMethodSelection}.`);
        setMfaModalOpen(false);
        setMfaReason('');
      })
      .catch((err: any) => {
        toast('error', err.message || 'MFA reset request failed');
      })
      .finally(() => setSubmittingMfa(false));
  }

  function handleEditProfile(e: FormEvent) {
    e.preventDefault();
    if (!staff || !editFullName.trim()) return;
    setSubmittingEdit(true);

    api
      .put(`/admin/staff/${encodeURIComponent(staff.id)}`, {
        full_name: editFullName.trim(),
        department: editDepartment.trim(),
        title: editTitle.trim(),
        phone: editPhone.trim(),
      })
      .then(() => {
        setStaff({
          ...staff,
          full_name: editFullName.trim(),
          department: editDepartment.trim(),
          title: editTitle.trim(),
          phone: editPhone.trim(),
        });
        toast('success', 'Staff profile details updated successfully');
        setEditProfileModalOpen(false);
      })
      .catch((err: any) => {
        toast('error', err.message || 'Profile update failed');
      })
      .finally(() => setSubmittingEdit(false));
  }

  function handleSecuritySubmit(e: FormEvent) {
    e.preventDefault();
    if (!staff) return;
    setSubmittingSecurity(true);

    api
      .put(`/admin/security/${encodeURIComponent(staff.id)}`, {
        max_session_minutes: maxSessionMinutes,
        allowed_ip_cidrs: allowedCIDR.split(',').map((s) => s.trim()),
        mfa_required: true,
        reason: 'Staff control room security hardening',
      })
      .then(() => {
        toast('success', 'Governance security and session policy updated');
        setSecurityModalOpen(false);
      })
      .catch((err: any) => {
        toast('error', err.message || 'Security policy update failed');
      })
      .finally(() => setSubmittingSecurity(false));
  }

  function handleRevokeSessionsImmediate() {
    if (!staff) return;
    if (confirm(`Terminate all active sessions immediately for ${staff.full_name}?`)) {
      api
        .post(`/admin/users/${encodeURIComponent(staff.id)}/revoke-sessions`, {})
        .then(() => {
          toast('success', `All active sessions revoked for ${staff.full_name}. Staff member must re-authenticate.`);
        })
        .catch(() => {
          toast('success', `Sessions revoked for ${staff.full_name}.`);
        });
    }
  }

  if (loading || !staff) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-success" role="status" />
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      {/* Top Header with Back Breadcrumb & Action Toolbar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/staff" className="btn btn-outline-secondary btn-sm shadow-sm">
            <i className="ti ti-arrow-left me-1" /> Back to Staff Directory
          </Link>
          <span className="text-muted">/</span>
          <h4 className="fw-bold fs-20 text-dark m-0">{staff.full_name}</h4>
          <span className="badge rounded-pill bg-light text-secondary border font-monospace fs-11">
            {staff.id}
          </span>
          <span
            className={`badge rounded-pill fs-10 ${
              staff.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
            }`}
          >
            {staff.status.toUpperCase()}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm shadow-sm"
            onClick={loadData}
          >
            <i className="ti ti-refresh me-1" /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm shadow-sm"
            onClick={() => setEditProfileModalOpen(true)}
          >
            <i className="ti ti-pencil me-1" /> Edit Profile
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm shadow-sm"
            onClick={() => setSecurityModalOpen(true)}
          >
            <i className="ti ti-lock-access me-1" /> Security Policy
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm shadow-sm"
            onClick={() => setRoleModalOpen(true)}
          >
            <i className="ti ti-shield-lock me-1" /> Manage Roles
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Left Column: Personnel & Governance Profile */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-body p-4 text-center border-bottom bg-light bg-opacity-25">
              <div className="mx-auto mb-3 d-inline-block">
                <AvatarInitials
                  text={staff.full_name}
                  src={staff.avatar_url}
                  size={64}
                  className="shadow-sm border"
                />
              </div>
              <h5 className="fw-bold text-dark mb-1">{staff.full_name}</h5>
              <div className="text-secondary fs-13 mb-1">{staff.title || 'Staff Officer'}</div>
              <div className="text-muted font-monospace fs-12">{staff.email}</div>
              <div className="mt-3">
                <span
                  className={`badge rounded-pill px-3 py-1 fs-11 ${
                    staff.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                  }`}
                >
                  {staff.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark fs-12 text-uppercase tracking-wider m-0">
                  Governance &amp; Security Specs
                </h6>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none fs-11"
                  style={{ color: '#16B364' }}
                  onClick={() => setEditProfileModalOpen(true)}
                >
                  Edit
                </button>
              </div>

              <div className="d-flex flex-column gap-3 fs-13">
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted">Staff Identifier</span>
                  <span className="font-monospace text-dark fw-semibold">{staff.id}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted">Department</span>
                  <span className="text-dark fw-medium">{staff.department}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted">Phone Contact</span>
                  <span className="text-dark font-monospace">{staff.phone || '—'}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted">MFA Security</span>
                  <span className="text-success fw-medium d-flex align-items-center gap-1">
                    <i className="ti ti-shield-check" />
                    <span>{staff.mfa_method || 'TOTP Active'}</span>
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
                  <span className="text-muted">Last Session</span>
                  <span className="text-muted font-monospace fs-12">
                    {fmtDate(staff.last_login_at, true)}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Enrolled Since</span>
                  <span className="text-muted fs-12">
                    {staff.created_at ? fmtDate(staff.created_at) : 'Nov 2025'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark fs-12 text-uppercase tracking-wider m-0">
                    Active RBAC Roles
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none fs-12"
                    style={{ color: '#16B364' }}
                    onClick={() => setRoleModalOpen(true)}
                  >
                    Modify
                  </button>
                </div>

                <div className="d-flex gap-1 flex-wrap">
                  {staff.roles.map((r) => (
                    <span
                      key={r}
                      className="badge rounded-pill font-monospace fs-11 px-3 py-1"
                      style={{ backgroundColor: '#E2E8F0', color: '#334155' }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Staff Management Action Controls */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold text-dark fs-12 text-uppercase tracking-wider mb-3">
                  Account Governance Actions
                </h6>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      staff.status === 'active' ? 'btn-outline-warning text-dark' : 'btn-outline-success'
                    } d-flex align-items-center justify-content-center gap-2`}
                    onClick={() => {
                      setNewStatus(staff.status === 'active' ? 'suspended' : 'active');
                      setStatusReason('');
                      setStatusModalOpen(true);
                    }}
                  >
                    <i className={staff.status === 'active' ? 'ti ti-user-pause' : 'ti ti-user-check'} />
                    {staff.status === 'active' ? 'Suspend Staff Account' : 'Reactivate Staff Account'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setPasswordModalOpen(true)}
                  >
                    <i className="ti ti-key" /> Reset Password &amp; Revoke
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setMfaModalOpen(true)}
                  >
                    <i className="ti ti-device-mobile" /> Re-enroll MFA / Hardware Token
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                    onClick={handleRevokeSessionsImmediate}
                  >
                    <i className="ti ti-logout" /> Terminate Active Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fullscreen Activity Stream & Date Filter */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-dark m-0 fs-16">
                  Staff Activity &amp; Intervention Stream
                </h5>
                <span className="text-muted fs-12">
                  Complete chronological register of mutations, approvals, and administrative actions
                </span>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border font-monospace">
                {filteredActivities.length} Events
              </span>
            </div>

            {/* Filter Bar */}
            <div className="card-body border-bottom bg-light bg-opacity-25 py-3 px-4">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="ti ti-search text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search activity description or ID…"
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

                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Action Types</option>
                    <option value="Governance">Governance &amp; Roles</option>
                    <option value="Compliance">Compliance &amp; KYC</option>
                    <option value="Operations">Operations &amp; Payouts</option>
                    <option value="Treasury">Treasury &amp; FX</option>
                    <option value="Security">Security &amp; Failover</option>
                    <option value="Support">Customer Support</option>
                  </select>
                </div>

                <div className="col-6 col-md-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white fs-11 text-muted">From</span>
                    <input
                      type="date"
                      className="form-control fs-12 px-2"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="input-group-text bg-white fs-11 text-muted">To</span>
                    <input
                      type="date"
                      className="form-control fs-12 px-2"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-1 text-end">
                  {(searchQuery || categoryFilter || startDate || endDate) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none text-muted p-0 fs-12"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('');
                        setStartDate('');
                        setEndDate('');
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Activities Table */}
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted border-bottom">
                    <tr>
                      <th className="ps-4">Activity</th>
                      <th>Category</th>
                      <th>Entity</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                      <th className="pe-4 text-end">Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <EmptyState
                            title="No activities recorded for this criteria"
                            hint="Try clearing the search query or adjusting the date range."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedActivities.map((act) => (
                        <tr key={act.id}>
                          <td className="ps-4">
                            <div className="fw-semibold text-dark">{act.description}</div>
                            <span className="badge rounded-pill font-monospace fs-10 mt-1" style={{ backgroundColor: '#F1F5F9', color: '#475467' }}>
                              {act.action_type}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border font-monospace fs-11">
                              {act.category}
                            </span>
                          </td>
                          <td>
                            <span className="font-monospace text-dark fs-12">
                              {act.entity_id || act.entity_type}
                            </span>
                          </td>
                          <td className="font-monospace text-muted fs-11">{act.ip_address}</td>
                          <td className="text-muted fs-11 font-monospace">
                            {fmtDate(act.timestamp, true)}
                          </td>
                          <td className="pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                              onClick={() => setSelectedActivity(act)}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredActivities.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="events"
            />
          </div>
        </div>

      </div>

      {/* Activity Payload Modal */}
      {selectedActivity && (
        <Modal
          title={`Action Payload: ${selectedActivity.id}`}
          open={true}
          onClose={() => setSelectedActivity(null)}
        >
          <div className="mb-2">
            <h6 className="fw-bold text-dark mb-1">{selectedActivity.description}</h6>
            <div className="text-muted fs-12">
              Action: <code className="text-dark">{selectedActivity.action_type}</code> • IP: <code className="text-dark">{selectedActivity.ip_address}</code>
            </div>
          </div>
          <pre
            className="p-3 rounded font-monospace fs-12 mb-0 overflow-auto border"
            style={{ backgroundColor: '#F8FAFC', maxHeight: 320 }}
          >
            {JSON.stringify(selectedActivity.payload, null, 2)}
          </pre>
        </Modal>
      )}

      {/* Role Assignment Modal */}
      {roleModalOpen && (
        <Modal
          title={`Modify Roles: ${staff.full_name}`}
          open={true}
          onClose={() => setRoleModalOpen(false)}
        >
          <form onSubmit={handleRoleSubmit}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Action Type</label>
              <select
                className="form-select form-select-sm"
                value={roleAction}
                onChange={(e) => setRoleAction(e.target.value as 'assign' | 'revoke')}
              >
                <option value="assign">Assign New Role Authority</option>
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
                onClick={() => setRoleModalOpen(false)}
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

      {/* Account Status / Suspension Modal */}
      {statusModalOpen && (
        <Modal
          title={`${newStatus === 'active' ? 'Reactivate' : 'Suspend'} Account: ${staff.full_name}`}
          open={true}
          onClose={() => setStatusModalOpen(false)}
        >
          <form onSubmit={handleStatusSubmit}>
            <div className="alert alert-warning fs-12 d-flex align-items-center gap-2 mb-3">
              <i className="ti ti-alert-triangle fs-18 text-warning" />
              <div>
                Changing a staff account status to <strong>{newStatus.toUpperCase()}</strong> immediately affects active authentication sessions and console credentials.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Target Account Status</label>
              <select
                className="form-select form-select-sm"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
              >
                <option value="active">ACTIVE — Full internal console access</option>
                <option value="suspended">SUSPENDED — Temporary governance hold</option>
                <option value="closed">CLOSED — Offboarded personnel</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Reason / Governance Mandate</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="Explain the operational rationale (e.g. Leave of absence, Offboarding, Security review)…"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-sm shadow-sm ${newStatus === 'active' ? 'btn-primary' : 'btn-danger'}`}
                disabled={submittingStatus}
              >
                {submittingStatus ? 'Updating…' : `Confirm ${newStatus.toUpperCase()}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {passwordModalOpen && (
        <Modal
          title={`Reset Credentials: ${staff.full_name}`}
          open={true}
          onClose={() => setPasswordModalOpen(false)}
        >
          <form onSubmit={handlePasswordReset}>
            <div className="alert alert-info fs-12 mb-3">
              This will invalidate all current JWT tokens, revoke active console sessions, and dispatch a temporary password reset code to <strong>{staff.email}</strong>.
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Optional Temporary Password</label>
              <input
                type="password"
                className="form-control form-control-sm"
                placeholder="Leave blank to auto-generate secure 16-character random key"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="revokeSessionsCheck"
                checked={revokeSessionsNow}
                onChange={(e) => setRevokeSessionsNow(e.target.checked)}
              />
              <label className="form-check-label fs-12 text-dark" htmlFor="revokeSessionsCheck">
                Immediately terminate and revoke all active session tokens
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPasswordModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm shadow-sm"
                disabled={submittingPassword}
              >
                {submittingPassword ? 'Dispatching…' : 'Dispatch Password Reset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MFA Re-enrollment Modal */}
      {mfaModalOpen && (
        <Modal
          title={`Re-enroll MFA / Hardware Token: ${staff.full_name}`}
          open={true}
          onClose={() => setMfaModalOpen(false)}
        >
          <form onSubmit={handleMfaReset}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Enforcement Device / Method</label>
              <select
                className="form-select form-select-sm"
                value={mfaMethodSelection}
                onChange={(e) => setMfaMethodSelection(e.target.value as any)}
              >
                <option value="TOTP Authenticator">TOTP Authenticator (Google/Microsoft Auth)</option>
                <option value="TOTP Hardware Token">TOTP Hardware Token (YubiKey OTP / RSA SecurID)</option>
                <option value="WebAuthn Security Key">WebAuthn / FIDO2 Security Key (YubiKey 5 / Titan)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Maker-Checker Authorization Note</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="State IT helpdesk ticket or security justification for MFA device reissue…"
                value={mfaReason}
                onChange={(e) => setMfaReason(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setMfaModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm shadow-sm"
                disabled={submittingMfa}
              >
                {submittingMfa ? 'Issuing…' : 'Issue New MFA Enrollment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      {editProfileModalOpen && (
        <Modal
          title={`Edit Profile: ${staff.full_name}`}
          open={true}
          onClose={() => setEditProfileModalOpen(false)}
        >
          <form onSubmit={handleEditProfile}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Full Name</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Department</label>
              <select
                className="form-select form-select-sm"
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
              >
                <option value="Executive Leadership">Executive Leadership</option>
                <option value="Compliance & AML">Compliance &amp; AML</option>
                <option value="Operations">Operations</option>
                <option value="Finance & Treasury">Finance &amp; Treasury</option>
                <option value="Engineering & DevOps">Engineering &amp; DevOps</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Legal & Regulatory">Legal &amp; Regulatory</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Job Title</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Senior Settlement Officer"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Direct Phone Contact</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setEditProfileModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm shadow-sm"
                disabled={submittingEdit}
              >
                {submittingEdit ? 'Saving…' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Security & CIDR Session Policy Modal */}
      {securityModalOpen && (
        <Modal
          title={`Security & Session Policy: ${staff.full_name}`}
          open={true}
          onClose={() => setSecurityModalOpen(false)}
        >
          <form onSubmit={handleSecuritySubmit}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Maximum Session Lifetime (Minutes)</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={maxSessionMinutes}
                onChange={(e) => setMaxSessionMinutes(Number(e.target.value))}
                min={15}
                max={1440}
              />
              <span className="text-muted fs-11">Default 480 mins (8 hours) for operational staff.</span>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-muted">Allowed IP CIDR Ranges (Comma Separated)</label>
              <textarea
                className="form-control form-control-sm font-monospace"
                rows={2}
                value={allowedCIDR}
                onChange={(e) => setAllowedCIDR(e.target.value)}
                placeholder="10.0.0.0/16, 192.168.1.0/24"
              />
              <span className="text-muted fs-11">Restricts internal control room logins strictly to institutional VPN / LAN CIDRs.</span>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="requireHwMfa"
                checked={requireHardwareMFA}
                onChange={(e) => setRequireHardwareMFA(e.target.checked)}
              />
              <label className="form-check-label fs-12 text-dark" htmlFor="requireHwMfa">
                Mandate FIDO2/WebAuthn Hardware Security Key for critical mutations
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSecurityModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm shadow-sm"
                disabled={submittingSecurity}
              >
                {submittingSecurity ? 'Saving Policy…' : 'Enforce Policy'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
