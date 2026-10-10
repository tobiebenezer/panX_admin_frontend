'use client';

import { Card } from '@/components/ui';
import { LineChart, BarChart, DoughnutChart, Sparkline } from '@/components/charts';

export function StaffOperationsAnalyticsView() {
  const kpis = [
    { label: 'Maker-Checker SLA Avg', value: '4.8 min', sub: 'p95: 14.2 min (Target <30m)', good: true },
    { label: 'Total Dual Signoffs (30d)', value: '1,280', change: '+8.4%', spark: [1050, 1120, 1180, 1210, 1250, 1280] },
    { label: 'On-Call Incident MTTR', value: '18.5 min', sub: 'Target <30 min across desks', good: true },
    { label: 'Audit Log Integrity', value: '100.0%', sub: 'Zero signature validation drift', good: true },
  ];

  const approvalHours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const approvalCounts = [12, 45, 68, 85, 72, 38, 14];

  const deskLabels = ['Treasury Operations', 'Compliance & AML', 'Equities Custody', 'Customer Onboarding', 'Infra DevOps'];
  const deskVolumes = [420, 380, 240, 150, 90];

  const shiftLabels = ['West Africa (Lagos Desk)', 'East Africa (Nairobi Desk)', 'UK / Europe (London Desk)', 'Automated Night Daemon'];
  const shiftShares = [48, 22, 20, 10];
  const shiftColors = ['#16B364', '#0BA5EC', '#F79009', '#667085'];

  const slaLeaderboard = [
    { desk: 'Treasury & FX Sweeps', p50: '3.2 min', p95: '8.4 min', breaches: 0, complianceRate: '100%', status: 'Nominal' },
    { desk: 'Equities Block Trading', p50: '4.1 min', p95: '11.0 min', breaches: 0, complianceRate: '100%', status: 'Nominal' },
    { desk: 'AML Tier 3 Verification', p50: '7.8 min', p95: '22.5 min', breaches: 2, complianceRate: '98.4%', status: 'Watch' },
    { desk: 'High-Value Wallet Overrides', p50: '5.0 min', p95: '14.1 min', breaches: 0, complianceRate: '100%', status: 'Nominal' },
    { desk: 'Custody Omnibus Reconciliation', p50: '12.0 min', p95: '28.0 min', breaches: 1, complianceRate: '99.2%', status: 'Nominal' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* KPI Cards */}
      <div className="row g-3">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <Card className="h-100 p-3 shadow-sm border-0">
              <span className="text-muted fs-12 fw-medium text-uppercase">{kpi.label}</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <span className="fs-22 fw-bold text-dark font-monospace">{kpi.value}</span>
                {kpi.change && (
                  <span className="badge bg-success-subtle text-success fs-11 fw-semibold">
                    <i className="ti ti-trending-up me-1" />
                    {kpi.change}
                  </span>
                )}
                {kpi.sub && (
                  <span className="text-muted fs-11 font-monospace">{kpi.sub}</span>
                )}
              </div>
              {kpi.spark && (
                <div className="mt-2" style={{ height: 26 }}>
                  <Sparkline data={kpi.spark} color="#16B364" height={26} />
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* Approvals Volume & Regional Desk Split */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Intraday Dual-Control Clearance Velocity</h6>
                <span className="text-muted fs-12">4-eyes maker-checker signoffs cleared per hour across all operations desks</span>
              </div>
              <span className="badge bg-success-subtle text-success px-2 py-1 fs-11">Active Shift</span>
            </div>
            <div style={{ height: 260 }}>
              <LineChart labels={approvalHours} data={approvalCounts} label="Approvals / Hr" color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-4">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Shift & Regional Desk Share</h6>
              <span className="text-muted fs-12">Personnel volume distribution by trading hub</span>
            </div>
            <div style={{ height: 210 }}>
              <DoughnutChart labels={shiftLabels} values={shiftShares} colors={shiftColors} />
            </div>
            <div className="d-flex justify-content-around mt-3 pt-2 border-top fs-11 text-muted">
              <span>Lagos: 48%</span>
              <span>Nairobi: 22%</span>
              <span>London: 20%</span>
              <span>Daemons: 10%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Desk Workload & SLA Leaderboard */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Desk Dual-Control Volume (30d)</h6>
              <span className="text-muted fs-12">Total maker-checker approvals processed by operational division</span>
            </div>
            <div style={{ height: 240 }}>
              <BarChart labels={deskLabels} data={deskVolumes} color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Operational SLA & Response Performance</h6>
              <span className="text-muted fs-12">Turnaround latency and dual-control signoff adherence</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-12">
                <thead>
                  <tr className="text-muted text-uppercase fs-11 border-bottom">
                    <th>Desk</th>
                    <th>Median SLA</th>
                    <th>p95 SLA</th>
                    <th>Breaches</th>
                    <th>Adherence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slaLeaderboard.map((row) => (
                    <tr key={row.desk}>
                      <td className="fw-semibold text-dark">{row.desk}</td>
                      <td className="font-monospace fw-semibold">{row.p50}</td>
                      <td className="font-monospace text-muted">{row.p95}</td>
                      <td className="font-monospace">{row.breaches}</td>
                      <td className="font-monospace text-success fw-bold">{row.complianceRate}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.status === 'Nominal' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
