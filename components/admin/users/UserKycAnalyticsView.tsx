'use client';

import { Card } from '@/components/ui';
import { LineChart, BarChart, DoughnutChart, Sparkline } from '@/components/charts';

export function UserKycAnalyticsView() {
  const kpis = [
    { label: 'Active Retail & KYB', value: '18,420', change: '+12.4% MoM', spark: [14200, 15100, 15900, 16800, 17500, 18420] },
    { label: 'KYC Tier 3 Verified', value: '4,890', sub: '26.5% of total base', good: true },
    { label: 'High Risk / PEP Monitored', value: '142', sub: '0.77% flagged for enhanced DD', good: false },
    { label: 'Avg AUM Per Active User', value: '$803.40', change: '+6.8%', spark: [680, 710, 730, 755, 780, 803.4] },
  ];

  const cohortMonths = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const cohortRegistrations = [1200, 1450, 1680, 1920, 2150, 2480];

  const tierLabels = ['Tier 1 (Phone/Email)', 'Tier 2 (BVN/NIN Confirmed)', 'Tier 3 (Address & KYB Legal)'];
  const tierShares = [38, 35, 27];
  const tierColors = ['#667085', '#0BA5EC', '#16B364'];

  const wealthBrackets = ['<$1k (Micro)', '$1k-$10k (Mass)', '$10k-$50k (Affluent)', '$50k-$250k (HNW)', '>$250k (Ultra HNW)'];
  const wealthCounts = [11200, 4800, 1650, 620, 150];

  const riskMatrix = [
    { bracket: 'Low Risk (Automated Clearance)', count: '16,210', pct: '88.0%', autoRule: 'Standard velocity limits ($10k/day)', action: 'Clear' },
    { bracket: 'Medium Risk (Elevated Velocity)', count: '1,840', pct: '10.0%', autoRule: 'Secondary 2FA & selfie liveness check', action: 'Monitored' },
    { bracket: 'High Risk (AML Sanction / PEP match)', count: '228', pct: '1.2%', autoRule: 'Manual 4-eyes compliance signoff required', action: 'Enhanced DD' },
    { bracket: 'Frozen / Blocklist Interdictions', count: '142', pct: '0.8%', autoRule: 'Immediate asset freeze & STR report filed', action: 'Restricted' },
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

      {/* Cohort Growth & KYC Tier Split */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Customer Acquisition Velocity</h6>
                <span className="text-muted fs-12">New retail versus corporate accounts activated monthly</span>
              </div>
              <span className="badge bg-success-subtle text-success px-2 py-1 fs-11">Healthy Organic Flow</span>
            </div>
            <div style={{ height: 260 }}>
              <LineChart labels={cohortMonths} data={cohortRegistrations} label="Registrations" color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-4">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Identity & KYC Tier Split</h6>
              <span className="text-muted fs-12">Compliance verification status of user base</span>
            </div>
            <div style={{ height: 210 }}>
              <DoughnutChart labels={tierLabels} values={tierShares} colors={tierColors} />
            </div>
            <div className="d-flex justify-content-around mt-3 pt-2 border-top fs-11 text-muted">
              <span>Tier 1: 38%</span>
              <span>Tier 2: 35%</span>
              <span>Tier 3: 27%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Wealth Distribution & AML Risk Matrix */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Client Wealth Concentration</h6>
              <span className="text-muted fs-12">Account count segmented by aggregate fiat & equities AUM balance</span>
            </div>
            <div style={{ height: 240 }}>
              <BarChart labels={wealthBrackets} data={wealthCounts} color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">AML & PEP Risk Segmentation Matrix</h6>
              <span className="text-muted fs-12">Automated screening classifications and policy enforcement</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-12">
                <thead>
                  <tr className="text-muted text-uppercase fs-11 border-bottom">
                    <th>Risk Bracket</th>
                    <th>Count</th>
                    <th>Share</th>
                    <th>Automated Rule</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {riskMatrix.map((row) => (
                    <tr key={row.bracket}>
                      <td className="fw-semibold text-dark">{row.bracket}</td>
                      <td className="font-monospace fw-semibold">{row.count}</td>
                      <td className="font-monospace text-muted">{row.pct}</td>
                      <td className="text-muted fs-11">{row.autoRule}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.action === 'Clear'
                              ? 'bg-success-subtle text-success'
                              : row.action === 'Monitored'
                              ? 'bg-info-subtle text-info'
                              : row.action === 'Enhanced DD'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          {row.action}
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
