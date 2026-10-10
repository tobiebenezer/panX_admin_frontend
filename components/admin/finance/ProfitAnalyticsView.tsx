'use client';

import { Card } from '@/components/ui';
import { LineChart, BarChart, DoughnutChart, Sparkline } from '@/components/charts';

export function ProfitAnalyticsView() {
  const kpis = [
    { label: 'Net Spread Captured', value: '42.4 bps', sub: '$312,400 MTD', spark: [38, 40, 39, 41, 42, 44, 42.4] },
    { label: 'Fee Revenue (30d)', value: '$184,200', change: '+18.6%', spark: [140, 148, 155, 162, 170, 178, 184] },
    { label: 'Combined Net Margin', value: '68.2%', sub: 'Operating efficiency ratio', good: true },
    { label: 'Treasury Yield Float', value: '$46,800', change: '+5.4% pa', spark: [42, 43, 44, 45, 45.8, 46.2, 46.8] },
  ];

  const corridorProfitability = [
    { corridor: 'NGN → USD', gtv: '$5,400,000', marginBps: '48.2 bps', spreadRevenue: '$26,028', feeRevenue: '$16,200', netProfit: '$38,400', roi: '71.1%' },
    { corridor: 'USD → NGN', gtv: '$4,200,000', marginBps: '44.0 bps', spreadRevenue: '$18,480', feeRevenue: '$12,600', netProfit: '$28,100', roi: '66.9%' },
    { corridor: 'GHS → USD', gtv: '$2,100,000', marginBps: '52.5 bps', spreadRevenue: '$11,025', feeRevenue: '$6,300', netProfit: '$15,800', roi: '75.2%' },
    { corridor: 'KES → EUR', gtv: '$1,650,000', marginBps: '38.0 bps', spreadRevenue: '$6,270', feeRevenue: '$4,950', netProfit: '$9,800', roi: '59.4%' },
    { corridor: 'GBP → NGN', gtv: '$920,000', marginBps: '45.0 bps', spreadRevenue: '$4,140', feeRevenue: '$2,760', netProfit: '$6,200', roi: '67.4%' },
    { corridor: 'EUR → XOF', gtv: '$559,000', marginBps: '32.0 bps', spreadRevenue: '$1,788', feeRevenue: '$1,677', netProfit: '$2,900', roi: '51.8%' },
  ];

  const profitMonths = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const profitValues = [210, 235, 258, 275, 298, 312];

  const revenueLabels = ['FX Corridor Spreads', 'Brokerage Trading Fees', 'Treasury Overnight Float', 'Custody & Admin Fees'];
  const revenueValues = [58, 24, 11, 7];
  const revenueColors = ['#16B364', '#0BA5EC', '#F79009', '#667085'];

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

      {/* Revenue Trajectory & Revenue Mix */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Revenue Trajectory ($000s)</h6>
                <span className="text-muted fs-12">Historical FX spread capture vs transactional fee yield</span>
              </div>
              <span className="badge bg-success-subtle text-success px-2 py-1 fs-11">MTD Run Rate</span>
            </div>
            <div style={{ height: 260 }}>
              <LineChart labels={profitMonths} data={profitValues} label="FX Spread ($k)" color="#16B364" />
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-4">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Gross Revenue Contribution</h6>
              <span className="text-muted fs-12">Split across business verticals</span>
            </div>
            <div style={{ height: 210 }}>
              <DoughnutChart labels={revenueLabels} values={revenueValues} colors={revenueColors} />
            </div>
            <div className="d-flex justify-content-around mt-3 pt-2 border-top fs-11 text-muted">
              <span>FX Spreads: 58%</span>
              <span>Brokerage: 24%</span>
              <span>Float: 11%</span>
              <span>Custody: 7%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Corridor Profitability Matrix */}
      <Card className="p-3 shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">Corridor Unit Economics & Profitability Matrix</h6>
            <span className="text-muted fs-12">Basis point spread capture, fee margins, and net operational profit by pair</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead>
              <tr className="text-muted text-uppercase fs-11 border-bottom">
                <th>Corridor</th>
                <th>Monthly GTV</th>
                <th>Spread Capture</th>
                <th>Spread Rev</th>
                <th>Fee Rev</th>
                <th>Net Platform Profit</th>
                <th>Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {corridorProfitability.map((row) => (
                <tr key={row.corridor}>
                  <td className="fw-semibold text-dark">{row.corridor}</td>
                  <td className="font-monospace fw-semibold">{row.gtv}</td>
                  <td className="font-monospace text-primary fw-semibold">{row.marginBps}</td>
                  <td className="font-monospace">{row.spreadRevenue}</td>
                  <td className="font-monospace">{row.feeRevenue}</td>
                  <td className="font-monospace text-success fw-bold">{row.netProfit}</td>
                  <td>
                    <span className="badge bg-success-subtle text-success">{row.roi}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
