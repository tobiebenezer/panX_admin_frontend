'use client';

import { Card } from '@/components/ui';
import { LineChart, BarChart, DoughnutChart, Sparkline } from '@/components/charts';

export function TransactionsAnalyticsView() {
  const kpis = [
    { label: 'GTV Velocity (24h)', value: '$1,482,900', change: '+14.2%', spark: [120, 135, 142, 160, 185, 210, 240, 260, 248] },
    { label: 'Settlement Latency', value: '1.8s', sub: 'p95: 4.2s (Realtime)', good: true },
    { label: 'Direct Success Rate', value: '98.84%', sub: '42 stalled of 3,640', good: true },
    { label: 'Average Ticket Size', value: '$407.39', change: '+3.1%', spark: [380, 395, 410, 405, 420, 415, 407] },
  ];

  const corridorLabels = ['NGN → USD', 'USD → NGN', 'GHS → USD', 'KES → EUR', 'GBP → NGN', 'EUR → XOF'];
  const corridorVolumes = [540000, 420000, 210000, 165000, 92000, 55900];

  const velocityHours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const velocityValues = [42000, 28000, 35000, 120000, 185000, 240000, 195000, 140000];

  const railsLabels = ['Instant NIP (NG)', 'SEPA Instant (EU)', 'FedNow / ACH (US)', 'GhIPSS (GH)', 'Pesalink (KE)'];
  const railsShares = [48, 22, 15, 9, 6];
  const railsColors = ['#16B364', '#0E9384', '#0BA5EC', '#F79009', '#667085'];

  const corridorLedger = [
    { corridor: 'NGN/USD', volume24h: '$540,000', count: 1420, successRate: '99.4%', avgLatency: '1.2s', status: 'Optimal' },
    { corridor: 'USD/NGN', volume24h: '$420,000', count: 980, successRate: '98.9%', avgLatency: '1.9s', status: 'Optimal' },
    { corridor: 'GHS/USD', volume24h: '$210,000', count: 480, successRate: '98.1%', avgLatency: '2.4s', status: 'Optimal' },
    { corridor: 'KES/EUR', volume24h: '$165,000', count: 390, successRate: '97.2%', avgLatency: '3.1s', status: 'Monitoring' },
    { corridor: 'GBP/NGN', volume24h: '$92,000', count: 240, successRate: '99.1%', avgLatency: '1.6s', status: 'Optimal' },
    { corridor: 'EUR/XOF', volume24h: '$55,900', count: 130, successRate: '96.8%', avgLatency: '4.5s', status: 'Elevated Latency' },
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

      {/* Main Charts */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Intraday GTV Velocity ($ / Hour)</h6>
                <span className="text-muted fs-12">Settled gross transaction volume cadence across all active settlement rails</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-11">
                Live Feed
              </span>
            </div>
            <div style={{ height: 260 }}>
              <LineChart labels={velocityHours} data={velocityValues} color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-4">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Payment Rail Share</h6>
              <span className="text-muted fs-12">Settlement volume split by underlying switch</span>
            </div>
            <div style={{ height: 210 }}>
              <DoughnutChart labels={railsLabels} values={railsShares} colors={railsColors} />
            </div>
            <div className="d-flex justify-content-around mt-3 pt-2 border-top fs-11 text-muted">
              <span>NIP: 48%</span>
              <span>SEPA: 22%</span>
              <span>FedNow: 15%</span>
              <span>GhIPSS: 9%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Corridor Breakdown & Corridor Health */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Corridor Volume Distribution (24h)</h6>
              <span className="text-muted fs-12">USD equivalent settled per active trading corridor</span>
            </div>
            <div style={{ height: 240 }}>
              <BarChart labels={corridorLabels} data={corridorVolumes} color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Corridor Operational Health</h6>
                <span className="text-muted fs-12">Real-time throughput, SLA latency and switch telemetry</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0 fs-12">
                <thead>
                  <tr className="text-muted text-uppercase fs-11 border-bottom">
                    <th>Corridor</th>
                    <th>24h Volume</th>
                    <th>Count</th>
                    <th>Success</th>
                    <th>Latency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {corridorLedger.map((row) => (
                    <tr key={row.corridor}>
                      <td className="fw-semibold text-dark">{row.corridor}</td>
                      <td className="font-monospace fw-semibold">{row.volume24h}</td>
                      <td className="font-monospace text-muted">{row.count}</td>
                      <td>
                        <span className="text-success fw-semibold">{row.successRate}</span>
                      </td>
                      <td className="font-monospace text-muted">{row.avgLatency}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.status === 'Optimal'
                              ? 'bg-success-subtle text-success'
                              : row.status === 'Monitoring'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-danger-subtle text-danger'
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
