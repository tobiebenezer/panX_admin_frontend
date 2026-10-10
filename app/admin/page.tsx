'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useUser, displayName } from '@/lib/auth';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { StatusPill } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { useToast } from '@/components/Toast';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface WorkItem {
  id: string;
  type: 'APPROVAL' | 'DISPUTE' | 'COMPLIANCE' | 'RECON' | 'TASK';
  title: string;
  entityId: string;
  assignedBy: string;
  slaTimeRemaining: string;
  isUrgent?: boolean;
  actionHref: string;
  actionLabel: string;
}

const MY_WORK_ITEMS: WorkItem[] = [
  {
    id: 'wrk-101',
    type: 'APPROVAL',
    title: 'Dual-Approval Needed: Payout Refund of ₦2,450,000 to Chioma Okonjo',
    entityId: 'APPR-8901',
    assignedBy: 'Emeka Eze (Treasury)',
    slaTimeRemaining: '38 mins remaining',
    isUrgent: true,
    actionHref: '/admin/approvals?id=APPR-8901',
    actionLabel: 'Review & Authorize',
  },
  {
    id: 'wrk-102',
    type: 'DISPUTE',
    title: 'Customer Claim: Delayed USD Stock Settlement (DriveWealth Order #DW-4890)',
    entityId: 'DISP-4402',
    assignedBy: 'Support Escalation',
    slaTimeRemaining: '1h 45m remaining',
    actionHref: '/admin/disputes?id=DISP-4402',
    actionLabel: 'Resolve Dispute',
  },
  {
    id: 'wrk-103',
    type: 'COMPLIANCE',
    title: 'High-Velocity Screening Hit: PEP False-Positive Clearing for USR-9921',
    entityId: 'AML-3021',
    assignedBy: 'Automated AML Rule Engine',
    slaTimeRemaining: '3h 10m remaining',
    actionHref: '/admin/compliance?case=AML-3021',
    actionLabel: 'Examine Case',
  },
  {
    id: 'wrk-104',
    type: 'RECON',
    title: 'Ledger Discrepancy: YellowCard USDT Wallet Delta (+120.50 USDT unallocated)',
    entityId: 'REC-EX-77',
    assignedBy: 'Nightly Recon Engine',
    slaTimeRemaining: 'Due Today 18:00 UTC',
    actionHref: '/admin/reconciliation?item=REC-EX-77',
    actionLabel: 'Investigate Delta',
  },
];

const PROVIDER_STATUSES = [
  { name: 'DriveWealth LLC', service: 'US Equities & Brokerage', status: 'OPERATIONAL', breaker: 'CLOSED', latency: '142ms', success: '99.9%' },
  { name: 'YellowCard', service: 'USDT / USDC Custody & FX', status: 'OPERATIONAL', breaker: 'CLOSED', latency: '210ms', success: '99.7%' },
  { name: 'Flutterwave', service: 'NIP Bank Clearing (NGN)', status: 'LOW_RESERVE', breaker: 'CLOSED', latency: '480ms', success: '98.8%', alert: 'Runway: 6.8 days remaining' },
  { name: 'Smile Identity', service: 'BVN / NIN Biometric KYB', status: 'OPERATIONAL', breaker: 'CLOSED', latency: '195ms', success: '99.5%' },
  { name: 'Anchor Banking', service: 'USD Dedicated Accounts', status: 'OPERATIONAL', breaker: 'CLOSED', latency: '310ms', success: '99.4%' },
  { name: 'CSCS Nigeria', service: 'NGX Domestic Custody', status: 'MARKET_CLOSED', breaker: 'CLOSED', latency: '180ms', success: '100.0%' },
];

export default function AdminOpsDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTx, setActiveTx] = useState<any | null>(null);
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  // Live state
  const [liveHourlyTx, setLiveHourlyTx] = useState(148);
  const [liveSuccessRate, setLiveSuccessRate] = useState('99.6%');
  const [liveQueueDepth, setLiveQueueDepth] = useState(14);
  const [stalledTxsCount, setStalledTxsCount] = useState(2);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        api.get('/admin/dashboard').catch(() => null),
        api.get('/admin/transactions?limit=5').catch(() => null),
      ]);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userName = displayName(user);

  return (
    <div className="container-fluid pb-5">
      {/* Telemetry Cards - Clean Minimalist Style */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Hourly Volume</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{liveHourlyTx}</span>
              <span className="fs-12 text-muted">txns</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Success Rate</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">{liveSuccessRate}</span>
              <span className="fs-12 text-muted">settled</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Avg Delivery Time</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">3.4</span>
              <span className="fs-12 text-muted">minutes</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Queue Depth</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{liveQueueDepth}</span>
              <span className="fs-12 text-muted">in flight</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Bar - Clean & Minimalist */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h4 className="fs-20 fw-bold text-dark m-0">Command Centre</h4>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <i className={`ti ti-refresh ${loading ? 'ti-spin' : ''}`} /> Refresh
          </button>
          <Link href="/admin/executive" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-chart-pie-2" /> Executive Scorecard
          </Link>
          <Link href="/admin/control-plane" className="btn btn-danger btn-sm d-flex align-items-center gap-1 fw-medium">
            <i className="ti ti-alert-octagon" /> Emergency Controls
          </Link>
        </div>
      </div>

      {/* My Work Queue */}
      <div className="card border shadow-none rounded-3 mb-4" id="my-work">
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <h6 className="m-0 fw-bold fs-15 text-dark">
              My Work ({MY_WORK_ITEMS.length})
            </h6>
          </div>
          <span className="badge bg-light text-secondary border font-monospace">
            1 Needs Approval
          </span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0 fs-13">
            <thead className="table-light fs-12 text-muted">
              <tr>
                <th style={{ width: '110px' }}>Type</th>
                <th>Item</th>
                <th>Origin</th>
                <th>Due</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {MY_WORK_ITEMS.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="badge bg-light text-secondary border font-monospace fs-11">
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div className="fw-semibold text-dark">{item.title}</div>
                    <span className="text-muted font-monospace fs-11">{item.entityId}</span>
                  </td>
                  <td>
                    <span className="text-muted fs-12">{item.assignedBy}</span>
                  </td>
                  <td>
                    <span
                      className={`badge rounded-pill font-monospace fs-11 ${
                        item.isUrgent ? 'bg-danger-subtle text-danger' : 'bg-light text-secondary border'
                      }`}
                    >
                      <i className="ti ti-clock me-1" />
                      {item.slaTimeRemaining}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border py-1 px-2 fs-12 text-secondary"
                        title="View notes"
                        onClick={() => setNotesTarget({ id: item.entityId, title: item.title })}
                      >
                        <i className="ti ti-notes" /> Notes
                      </button>
                      <Link href={item.actionHref} className="btn btn-sm btn-primary py-1 px-3 fw-medium fs-12">
                        {item.actionLabel}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Health */}
      <div className="card border shadow-none rounded-3 mb-4 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h6 className="fw-bold fs-15 text-dark m-0">Provider Health</h6>
          <Link href="/admin/providers" className="btn btn-sm btn-outline-secondary py-0 px-2 fs-12">
            Configure Breakers
          </Link>
        </div>

        <div className="row g-3">
          {PROVIDER_STATUSES.map((p) => (
            <div key={p.name} className="col-lg-4 col-md-6">
              <div className="p-3 border rounded-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-semibold text-dark fs-14">{p.name}</span>
                    <span
                      className={`badge fs-11 ${
                        p.status === 'OPERATIONAL'
                          ? 'bg-success-subtle text-success'
                          : p.status === 'LOW_RESERVE'
                          ? 'bg-warning-subtle text-warning'
                          : 'bg-light text-muted border'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <span className="text-muted fs-12 d-block mb-2">{p.service}</span>

                  {p.alert && (
                    <div className="alert alert-warning py-1 px-2 fs-11 mb-2 rounded border-0">
                      <i className="ti ti-alert-triangle me-1" />
                      {p.alert}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-top d-flex align-items-center justify-content-between fs-11 font-monospace text-muted">
                  <span>Breaker: <strong className="text-dark">{p.breaker}</strong></span>
                  <span>Latency: <strong className="text-dark">{p.latency}</strong></span>
                  <span>Success: <strong className="text-success">{p.success}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Workspaces */}
      <div className="card border shadow-none rounded-3 p-4 mb-4">
        <h6 className="fw-bold fs-15 text-dark mb-3">Workspaces</h6>

        <div className="row g-3 fs-13">
          <div className="col-md-3 col-sm-6">
            <Link href="/admin/users" className="card p-3 border rounded-3 bg-white text-decoration-none hover-shadow">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-users fs-18 text-secondary" />
                <span className="fw-semibold text-dark">Customer 360</span>
              </div>
              <span className="text-muted fs-12">Users, accounts & eligibility</span>
            </Link>
          </div>
          <div className="col-md-3 col-sm-6">
            <Link href="/admin/reconciliation" className="card p-3 border rounded-3 bg-white text-decoration-none hover-shadow">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-arrows-diff fs-18 text-secondary" />
                <span className="fw-semibold text-dark">Reconciliation</span>
              </div>
              <span className="text-muted fs-12">Exceptions & provider matching</span>
            </Link>
          </div>
          <div className="col-md-3 col-sm-6">
            <Link href="/admin/investments" className="card p-3 border rounded-3 bg-white text-decoration-none hover-shadow">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-chart-candle fs-18 text-secondary" />
                <span className="fw-semibold text-dark">Investments</span>
              </div>
              <span className="text-muted fs-12">NGX, US equities & securities</span>
            </Link>
          </div>
          <div className="col-md-3 col-sm-6">
            <Link href="/admin/finance" className="card p-3 border rounded-3 bg-white text-decoration-none hover-shadow">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-wallet fs-18 text-secondary" />
                <span className="fw-semibold text-dark">Treasury</span>
              </div>
              <span className="text-muted fs-12">Balances, cash buffers & runway</span>
            </Link>
          </div>
        </div>
      </div>

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
