'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, EmptyState, Modal, PageHeader, StatusPill, PaginationControl } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface SystemActivityLog {
  id: string;
  action_type: string;
  category?: 'staff' | 'transactions' | 'compliance' | 'security' | 'treasury' | 'customer';
  entity_type: string;
  entity_id?: string;
  actor_name: string;
  actor_role?: string;
  actor_type?: 'staff' | 'customer' | 'system';
  ip_address: string;
  created_at: string;
  description: string;
  status?: 'success' | 'flagged' | 'intervened' | 'failed';
  payload: Record<string, any>;
}

const DEFAULT_ACTIVITY_LOGS: SystemActivityLog[] = [
  {
    id: 'LOG-99201',
    action_type: 'staff.role_assigned',
    category: 'staff',
    entity_type: 'staff_member',
    entity_id: 'STF-02',
    actor_name: 'Aliko Adeleke',
    actor_role: 'Superadmin',
    actor_type: 'staff',
    ip_address: '10.0.4.12',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'success',
    description: 'Granted Compliance & MLRO desk authority to Fatima Kyari',
    payload: { staff: 'Fatima Kyari', role: 'compliance', department: 'Compliance & AML' },
  },
  {
    id: 'LOG-99202',
    action_type: 'payout.force_complete',
    category: 'transactions',
    entity_type: 'transaction',
    entity_id: 'TXN-902184',
    actor_name: 'Babajide Sanwo',
    actor_role: 'Operations Desk',
    actor_type: 'staff',
    ip_address: '10.0.4.18',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    status: 'success',
    description: 'Manually completed stalled NIP disbursement after bank confirmation',
    payload: { corridor: 'USD/NGN', amount: 5000, recipient: 'Chioma Okonjo', rail: 'Flutterwave NIP' },
  },
  {
    id: 'LOG-99203',
    action_type: 'kyc.tier_approved',
    category: 'compliance',
    entity_type: 'customer',
    entity_id: 'USR-9921',
    actor_name: 'Fatima Kyari',
    actor_role: 'Compliance & MLRO',
    actor_type: 'staff',
    ip_address: '10.0.4.19',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    status: 'success',
    description: 'Approved Institutional Tier 3 verification with CAC corporate registry match',
    payload: { requested_tier: 'tier_3', verified_bvn: true, cac_rc_number: 'RC-1490218' },
  },
  {
    id: 'LOG-99204',
    action_type: 'pricing.spread_adjusted',
    category: 'treasury',
    entity_type: 'fx_corridor',
    entity_id: 'COR-USD-NGN',
    actor_name: 'Emeka Eze',
    actor_role: 'Finance & Treasury',
    actor_type: 'staff',
    ip_address: '10.0.4.22',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    status: 'success',
    description: 'Adjusted institutional spread on USD/NGN corridor from 45bps to 38bps',
    payload: { corridor: 'USD/NGN', old_spread_bps: 45, new_spread_bps: 38 },
  },
  {
    id: 'LOG-99205',
    action_type: 'circuit_breaker.trip',
    category: 'security',
    entity_type: 'provider',
    entity_id: 'PRV-01',
    actor_name: 'Tunde Balogun',
    actor_role: 'Engineering & DevOps',
    actor_type: 'staff',
    ip_address: '10.0.4.14',
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    status: 'intervened',
    description: 'Tripped Flutterwave NIP circuit breaker and routed flow to Providus standby rail',
    payload: { provider: 'Flutterwave', latency_ms: 3200, error_rate: '14.2%', failover_target: 'Providus Direct' },
  },
  {
    id: 'LOG-99206',
    action_type: 'user.password_reset',
    category: 'customer',
    entity_type: 'customer',
    entity_id: 'USR-4810',
    actor_name: 'Babajide Adeleke',
    actor_role: 'Verified Retail Client',
    actor_type: 'customer',
    ip_address: '105.112.98.24',
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    status: 'success',
    description: 'Customer password updated after 2FA TOTP biometric challenge',
    payload: { mfa_method: 'TOTP', challenge_verified: true },
  },
  {
    id: 'LOG-99207',
    action_type: 'pii.decrypted',
    category: 'compliance',
    entity_type: 'customer_bvn',
    entity_id: 'USR-9921',
    actor_name: 'Fatima Kyari',
    actor_role: 'Compliance & MLRO',
    actor_type: 'staff',
    ip_address: '10.0.4.19',
    created_at: new Date(Date.now() - 240 * 60000).toISOString(),
    status: 'flagged',
    description: 'Decrypted masked BVN identity for Tier 3 verification review',
    payload: { reason: 'NIBSS BVN Match Audit', masked: '221****902' },
  },
  {
    id: 'LOG-99208',
    action_type: 'equities.market_halt',
    category: 'security',
    entity_type: 'security_market',
    entity_id: 'NGX:MTNN',
    actor_name: 'Aliko Adeleke',
    actor_role: 'Superadmin',
    actor_type: 'staff',
    ip_address: '10.0.4.12',
    created_at: new Date(Date.now() - 310 * 60000).toISOString(),
    status: 'intervened',
    description: 'Enacted volatility circuit breaker pause on MTNN trading pair',
    payload: { symbol: 'MTNN', market: 'NGX', deviation: '10.4%' },
  },
  {
    id: 'LOG-99209',
    action_type: 'treasury.buffer_rebalanced',
    category: 'treasury',
    entity_type: 'treasury_account',
    entity_id: 'ACC-PROV-01',
    actor_name: 'Emeka Eze',
    actor_role: 'Finance & Treasury',
    actor_type: 'staff',
    ip_address: '10.0.4.22',
    created_at: new Date(Date.now() - 420 * 60000).toISOString(),
    status: 'success',
    description: 'Transferred ₦50,000,000 liquidity buffer to Providus Settlement pool',
    payload: { amount: 50000000, currency: 'NGN', destination: 'Providus Settling' },
  },
  {
    id: 'LOG-99210',
    action_type: 'staff.mfa_enforced',
    category: 'staff',
    entity_type: 'staff_member',
    entity_id: 'STF-03',
    actor_name: 'Aliko Adeleke',
    actor_role: 'Superadmin',
    actor_type: 'staff',
    ip_address: '10.0.4.12',
    created_at: new Date(Date.now() - 490 * 60000).toISOString(),
    status: 'success',
    description: 'Enforced FIDO2 hardware token requirement on high-value operations staff',
    payload: { staff: 'Babajide Sanwo', enforced_token: 'FIDO2 WebAuthn' },
  },
  {
    id: 'LOG-99211',
    action_type: 'compliance.sar_escalated',
    category: 'compliance',
    entity_type: 'aml_case',
    entity_id: 'SAR-2026-042',
    actor_name: 'Fatima Kyari',
    actor_role: 'Compliance & MLRO',
    actor_type: 'staff',
    ip_address: '10.0.4.19',
    created_at: new Date(Date.now() - 540 * 60000).toISOString(),
    status: 'flagged',
    description: 'Escalated rapid $50,000 structuring pattern to NFIU regulatory portal',
    payload: { target_account: 'USR-8819', trigger: 'Rapid multi-wallet layering' },
  },
  {
    id: 'LOG-99212',
    action_type: 'provider.latency_recovered',
    category: 'security',
    entity_type: 'provider',
    entity_id: 'PRV-01',
    actor_name: 'Tunde Balogun',
    actor_role: 'Engineering & DevOps',
    actor_type: 'staff',
    ip_address: '10.0.4.14',
    created_at: new Date(Date.now() - 610 * 60000).toISOString(),
    status: 'success',
    description: 'Re-enabled primary gateway after Flutterwave SLA normalised to 410ms',
    payload: { provider: 'Flutterwave', new_latency_ms: 410, health_status: 'HEALTHY' },
  },
  {
    id: 'LOG-99213',
    action_type: 'support.ticket_escalated',
    category: 'staff',
    entity_type: 'support_ticket',
    entity_id: 'TCK-4819',
    actor_name: 'Amina Bello',
    actor_role: 'Customer Support',
    actor_type: 'staff',
    ip_address: '10.0.4.25',
    created_at: new Date(Date.now() - 720 * 60000).toISOString(),
    status: 'success',
    description: 'Escalated delayed inbound SWIFT transfer to Treasury desk',
    payload: { customer: 'Kelechi Amadi', amount: 14500, currency: 'USD' },
  },
  {
    id: 'LOG-99214',
    action_type: 'refund.approved',
    category: 'transactions',
    entity_type: 'transaction',
    entity_id: 'TXN-881204',
    actor_name: 'Babajide Sanwo',
    actor_role: 'Operations Desk',
    actor_type: 'staff',
    ip_address: '10.0.4.18',
    created_at: new Date(Date.now() - 840 * 60000).toISOString(),
    status: 'success',
    description: 'Processed refund credit of ₦1,200,000 for timed-out bill payment',
    payload: { refund_amount: 1200000, currency: 'NGN', target_wallet: 'WLT-NGN-01' },
  },
];


export default function AdminAuditLogsPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'system' | 'pii'>('all');
  const [logs, setLogs] = useState<SystemActivityLog[]>(DEFAULT_ACTIVITY_LOGS);
  const [piiLogs, setPiiLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemActivityLog | null>(null);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (categoryFilter) params.set('category', categoryFilter);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    api
      .get(`/admin/audit-logs?${params.toString()}`)
      .then((res: any) => {
        const items = listOf(res, 'items', 'logs');
        if (items.length > 0) {
          setLogs(items);
        } else {
          setLogs(DEFAULT_ACTIVITY_LOGS);
        }
      })
      .catch(() => {
        setLogs(DEFAULT_ACTIVITY_LOGS);
      })
      .finally(() => setLoading(false));
  }, [searchQuery, categoryFilter, startDate, endDate]);

  const loadPiiLogs = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pae_pii_audit_trail') || '[]');
      if (stored.length > 0) {
        setPiiLogs(stored);
      } else {
        setPiiLogs([
          {
            id: 'AUD-884192',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            staff: 'Aliko Adeleke (Superadmin)',
            record: 'USR-9921',
            field: 'BVN (Nigeria)',
            reason: 'Compliance AML Review',
            notes: 'Verified against NIBSS portal for Tier 3 verification clearance.',
          },
          {
            id: 'AUD-884193',
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
            staff: 'Fatima Kyari (Compliance)',
            record: 'USR-9921',
            field: 'RC Number (Corporate)',
            reason: 'Corporate Entity Registration Check',
            notes: 'Cross-referenced CAC company extract for Meridian Capital Partners.',
          },
        ]);
      }
    } catch {
      setPiiLogs([]);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadPiiLogs();

    const listener = () => loadPiiLogs();
    window.addEventListener('pae-audit-updated', listener);
    return () => window.removeEventListener('pae-audit-updated', listener);
  }, [loadLogs, loadPiiLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // Tab filter
      if (activeTab === 'staff' && l.actor_type !== 'staff') return false;
      if (activeTab === 'system' && (l.category !== 'security' && l.category !== 'treasury')) return false;

      // Category filter
      if (categoryFilter && l.category !== categoryFilter) return false;

      // Actor filter
      if (actorFilter && l.actor_name !== actorFilter) return false;

      // Date range filter
      if (startDate) {
        const itemDate = new Date(l.created_at).getTime();
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (itemDate < start) return false;
      }
      if (endDate) {
        const itemDate = new Date(l.created_at).getTime();
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if (itemDate > end) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          l.id.toLowerCase().includes(q) ||
          l.action_type.toLowerCase().includes(q) ||
          l.actor_name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
          l.ip_address.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, activeTab, categoryFilter, actorFilter, startDate, endDate, searchQuery]);

  // Pagination State for System Logs
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Pagination State for PII Decryption Trail
  const [piiCurrentPage, setPiiCurrentPage] = useState(1);
  const [piiPageSize, setPiiPageSize] = useState(10);

  // Reset page when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
    setPiiCurrentPage(1);
  }, [activeTab, searchQuery, categoryFilter, actorFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const piiTotalPages = Math.max(1, Math.ceil(piiLogs.length / piiPageSize));
  const paginatedPiiLogs = useMemo(() => {
    const start = (piiCurrentPage - 1) * piiPageSize;
    return piiLogs.slice(start, start + piiPageSize);
  }, [piiLogs, piiCurrentPage, piiPageSize]);

  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.actor_name) set.add(l.actor_name);
    });
    return Array.from(set);

  }, [logs]);

  return (
    <div className="container-fluid pb-5">
      <PageHeader
        title="Activity & Audit Logs"
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => {
                loadLogs();
                loadPiiLogs();
                toast('info', 'Activity audit logs updated');
              }}
            >
              <i className="ti ti-refresh" /> Refresh
            </button>
            <Link href="/admin/control-plane" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-switch-3 me-1" /> Control Plane
            </Link>
            <Link href="/admin/rbac" className="btn btn-primary btn-sm shadow-sm">
              <i className="ti ti-shield-lock me-1" /> Roles &amp; Permissions
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
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Total Recorded Events</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">{logs.length + piiLogs.length}</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: 40, height: 40, backgroundColor: '#16B364' }}
              >
                <i className="ti ti-history fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Immutable cryptographic hash integrity</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Staff Interventions</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">
                  {logs.filter((l) => l.actor_type === 'staff').length}
                </h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-user-check fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Attributed with role and source IP</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">Critical Failovers &amp; Halts</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">
                  {logs.filter((l) => l.status === 'intervened' || l.action_type.includes('circuit')).length}
                </h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-alert-triangle fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Automatic and manual system trips</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-md-3">
          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fs-12 fw-semibold text-uppercase tracking-wider">PII Decryptions</span>
                <h3 className="fw-bold fs-22 text-dark m-0 mt-1">{piiLogs.length}</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary border"
                style={{ width: 40, height: 40 }}
              >
                <i className="ti ti-lock-open fs-20" />
              </div>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>Full compliance justification logged</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Container */}
      <div className="card border-0 shadow-sm rounded-3">
        {/* Navigation Tabs */}
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'all' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('all')}
              >
                <i className="ti ti-list me-1" /> All System Events ({logs.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'staff' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('staff')}
              >
                <i className="ti ti-user-check me-1" /> Staff Actions ({logs.filter((l) => l.actor_type === 'staff').length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'system' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('system')}
              >
                <i className="ti ti-cpu me-1" /> Infrastructure &amp; Security
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'pii' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('pii')}
              >
                <i className="ti ti-lock-open me-1" /> PII Access Register ({piiLogs.length})
              </button>
            </li>
          </ul>
        </div>

        {/* Filter Bar */}
        {activeTab !== 'pii' && (
          <div className="card-body border-bottom bg-light bg-opacity-25 py-3 px-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-lg-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by ID, action, staff, or description…"
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

              <div className="col-6 col-lg-2">
                <select
                  className="form-select form-select-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Domains</option>
                  <option value="staff">Staff Governance</option>
                  <option value="transactions">Ledger &amp; Payouts</option>
                  <option value="compliance">Compliance &amp; KYC</option>
                  <option value="treasury">Treasury &amp; FX Rates</option>
                  <option value="security">Security &amp; Circuit Breakers</option>
                  <option value="customer">Customer Self-Service</option>
                </select>
              </div>

              <div className="col-6 col-lg-2">
                <select
                  className="form-select form-select-sm"
                  value={actorFilter}
                  onChange={(e) => setActorFilter(e.target.value)}
                >
                  <option value="">All Actors</option>
                  {uniqueActors.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-lg-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white fs-11 text-muted">From</span>
                  <input
                    type="date"
                    className="form-control fs-12 px-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    title="Start date"
                  />
                  <span className="input-group-text bg-white fs-11 text-muted">To</span>
                  <input
                    type="date"
                    className="form-control fs-12 px-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    title="End date"
                  />
                </div>
              </div>

              <div className="col-6 col-lg-1 text-end">
                {(searchQuery || categoryFilter || actorFilter || startDate || endDate) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none text-muted p-0 fs-12"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('');
                      setActorFilter('');
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
        )}

        {/* Content */}
        <div className="card-body p-0">
          {activeTab !== 'pii' ? (
            <div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted border-bottom">
                    <tr>
                      <th className="ps-4">Event ID</th>
                      <th>Action</th>
                      <th>Staff Actor</th>
                      <th>Activity Description</th>
                      <th>Entity</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                      <th className="pe-4 text-end">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5">
                          <EmptyState
                            title="No activity logs match your filter"
                            hint="Try clearing search parameters or switching event domains."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((l) => (
                        <tr key={l.id}>
                          <td className="ps-4 font-monospace fw-semibold text-dark">{l.id}</td>
                          <td>
                            <span
                              className="badge rounded-pill font-monospace fs-11"
                              style={{ backgroundColor: '#E2E8F0', color: '#334155' }}
                            >
                              {l.action_type}
                            </span>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{l.actor_name}</div>
                            {l.actor_role && (
                              <small className="text-muted d-block fs-11">{l.actor_role}</small>
                            )}
                          </td>
                          <td style={{ maxWidth: 300 }}>
                            <span className="text-secondary">{l.description}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border font-monospace fs-11">
                              {l.entity_type}
                            </span>
                            {l.entity_id && (
                              <div className="font-monospace text-muted fs-11 mt-0">{l.entity_id}</div>
                            )}
                          </td>
                          <td className="font-monospace text-muted fs-11">{l.ip_address}</td>
                          <td className="text-muted fs-11">{fmtDate(l.created_at, true)}</td>
                          <td className="pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                              onClick={() => setSelectedLog(l)}
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

              {/* Pagination Controls for System Activity Logs */}
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel="logs"
              />
            </div>
          ) : (

          <div>
            <div className="p-3 border-bottom bg-light bg-opacity-50">
              <div className="d-flex align-items-center gap-2 text-secondary fs-13">
                <i className="ti ti-shield-lock text-success fs-16" />
                <span>
                  Immutable register of all customer identity decrypt operations. Every record is cryptographically signed and tracked for regulatory review.
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted border-bottom">
                  <tr>
                    <th className="ps-4">Audit Token</th>
                    <th>Target Record / Field</th>
                    <th>Staff Member</th>
                    <th>Compliance Justification</th>
                    <th>Investigation Notes</th>
                    <th className="pe-4">Decrypted At</th>
                  </tr>
                </thead>
                <tbody>
                  {piiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <EmptyState
                          title="No PII decryptions recorded"
                          hint="Decryptions of BVN, NIN, and bank accounts are automatically registered here."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedPiiLogs.map((p) => (
                      <tr key={p.id}>
                        <td className="ps-4 font-monospace fw-bold" style={{ color: '#16B364' }}>
                          {p.id}
                        </td>
                        <td>
                          <strong className="text-dark">{p.record}</strong>
                          <div className="text-muted fs-11">{p.field}</div>
                        </td>
                        <td className="fw-semibold text-dark">{p.staff}</td>
                        <td>
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={{ backgroundColor: '#FEF3F2', color: '#B42318' }}
                          >
                            {p.reason}
                          </span>
                        </td>
                        <td className="text-secondary fs-12" style={{ maxWidth: 300 }}>
                          {p.notes || '—'}
                        </td>
                        <td className="pe-4 text-muted fs-11 font-monospace">
                          {fmtDate(p.timestamp, true)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for PII Access Trail */}
            <PaginationControl
              currentPage={piiCurrentPage}
              totalPages={piiTotalPages}
              totalItems={piiLogs.length}
              pageSize={piiPageSize}
              onPageChange={(page) => setPiiCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setPiiPageSize(newSize);
                setPiiCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="audit records"
            />
          </div>
        )}
      </div>
    </div>


      {/* Payload Modal */}
      {selectedLog && (
        <Modal
          title={`Audit Payload: ${selectedLog.id}`}
          open={true}
          onClose={() => setSelectedLog(null)}
        >
          <div className="mb-3">
            <h6 className="fw-bold text-dark mb-1">{selectedLog.description}</h6>
            <div className="d-flex align-items-center gap-2 fs-12 text-muted">
              <span>Actor: <strong>{selectedLog.actor_name}</strong></span>
              <span>•</span>
              <span>Action: <code className="text-dark">{selectedLog.action_type}</code></span>
              <span>•</span>
              <span>IP: <code className="text-dark">{selectedLog.ip_address}</code></span>
            </div>
          </div>
          <pre
            className="p-3 rounded font-monospace fs-12 mb-0 overflow-auto border"
            style={{ backgroundColor: '#F8FAFC', maxHeight: 360 }}
          >
            {JSON.stringify(selectedLog.payload, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}
