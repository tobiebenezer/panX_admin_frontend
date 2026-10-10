'use client';

import React from 'react';
import { fmtMoney, fmtNum } from '@/lib/format';
import { DoughnutChart, BarChart } from '@/components/charts';

export interface TopUserHolding {
  symbol: string;
  name: string;
  market: 'NGX' | 'US' | 'BONDS';
  totalShares: number;
  totalValueUSD: number;
  totalHolders: number;
  avgCostBasisUSD: number;
  unrealizedPnLPercent: number;
  allocationPercent: number;
}

const SAMPLE_TOP_HOLDINGS: TopUserHolding[] = [
  { symbol: 'MTNN', name: 'MTN Nigeria Communications', market: 'NGX', totalShares: 1420000, totalValueUSD: 2319333, totalHolders: 3410, avgCostBasisUSD: 1.42, unrealizedPnLPercent: 15.2, allocationPercent: 28.5 },
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'US', totalShares: 4500, totalValueUSD: 1046025, totalHolders: 2890, avgCostBasisUSD: 198.5, unrealizedPnLPercent: 17.1, allocationPercent: 21.0 },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding Co.', market: 'NGX', totalShares: 2500000, totalValueUSD: 808333, totalHolders: 4120, avgCostBasisUSD: 0.026, unrealizedPnLPercent: 24.3, allocationPercent: 16.2 },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', totalShares: 2100, totalValueUSD: 479010, totalHolders: 1940, avgCostBasisUSD: 242.0, unrealizedPnLPercent: -5.7, allocationPercent: 9.6 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'US', totalShares: 3800, totalValueUSD: 512240, totalHolders: 2150, avgCostBasisUSD: 88.0, unrealizedPnLPercent: 53.1, allocationPercent: 10.3 },
  { symbol: 'FGN-2029', name: 'FGN 14.55% Apr 2029 Sovereign Bond', market: 'BONDS', totalShares: 1250000, totalValueUSD: 720000, totalHolders: 860, avgCostBasisUSD: 0.58, unrealizedPnLPercent: 8.4, allocationPercent: 14.4 },
];

export function UserPortfoliosAnalytics() {
  const totalAUM = 14820400;
  const retailAUM = 6120000;
  const institutionalAUM = 8700400;
  const activeInvestors = 12480;
  const aggregateUnrealizedPnL = 2140800;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Level Metric Scorecard */}
      <div className="row g-3">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">TOTAL CLIENT ASSETS (AUM)</span>
            <h3 className="fw-bold fs-22 text-dark m-0 mt-1 font-monospace">$14,820,400</h3>
            <div className="mt-2 fs-11 text-success d-flex align-items-center gap-1 fw-semibold">
              <i className="ti ti-arrow-up-right" /> +16.9% YTD Growth
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">RETAIL VS INSTITUTIONAL BOOK</span>
            <div className="d-flex align-items-baseline gap-2 mt-1 font-monospace">
              <span className="fw-bold fs-16 text-dark">$6.12M Retail</span>
              <span className="text-muted fs-12">• $8.70M Corp</span>
            </div>
            <div className="mt-2 fs-11 text-muted">
              <span>{fmtNum(activeInvestors)} Active client accounts</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">UNREALIZED CLIENT P&amp;L</span>
            <h3 className="fw-bold fs-22 text-success m-0 mt-1 font-monospace">+$2,140,800</h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Weighted portfolio gain across accounts</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">30D DIVIDENDS ACCRUED</span>
            <h3 className="fw-bold fs-22 text-dark m-0 mt-1 font-monospace">$124,500</h3>
            <div className="mt-2 fs-11 text-secondary">
              <span>94.2% automatically credited to cash wallets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation & Risk Matrix Breakdown */}
      <div className="row g-3">
        {/* Asset Class Distribution */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark m-0 fs-13 text-uppercase">
                <i className="ti ti-pie-chart text-success me-1" /> Client Asset Class Allocation
              </h6>
              <span className="text-muted fs-11 font-monospace">Weighted across all portfolios</span>
            </div>

            <div className="row align-items-center">
              <div className="col-5" style={{ height: 160 }}>
                <DoughnutChart
                  labels={['Equities', 'Treasury Bills', 'Commercial Paper', 'Commodities Pools']}
                  values={[58, 22, 12, 8]}
                  colors={['#16B364', '#0EA5E9', '#F59E0B', '#8B5CF6']}
                />
              </div>
              <div className="col-7">
                <div className="d-flex flex-column gap-2 fs-12">
                  <div className="d-flex justify-content-between align-items-center pb-1 border-bottom">
                    <span className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1" style={{ backgroundColor: '#16B364' }}> </span>
                      <span>Equities (NGX &amp; US)</span>
                    </span>
                    <span className="font-monospace fw-bold text-dark">58.0% ($8.6M)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pb-1 border-bottom">
                    <span className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1" style={{ backgroundColor: '#0EA5E9' }}> </span>
                      <span>Sovereign Treasury Bills</span>
                    </span>
                    <span className="font-monospace fw-bold text-dark">22.0% ($3.26M)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pb-1 border-bottom">
                    <span className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1" style={{ backgroundColor: '#F59E0B' }}> </span>
                      <span>Commercial Paper</span>
                    </span>
                    <span className="font-monospace fw-bold text-dark">12.0% ($1.77M)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1" style={{ backgroundColor: '#8B5CF6' }}> </span>
                      <span>Agri &amp; Export Pools</span>
                    </span>
                    <span className="font-monospace fw-bold text-dark">8.0% ($1.18M)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Risk Profiles & Tier Gates */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark m-0 fs-13 text-uppercase">
                <i className="ti ti-shield-check text-success me-1" /> Suitability &amp; Risk Profiles
              </h6>
              <span className="badge bg-light text-secondary border font-monospace fs-11">SEC Mandate</span>
            </div>

            <div className="d-flex flex-column gap-3 fs-12">
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Balanced / Moderate Growth (Equities + Fixed Income)</span>
                  <span className="font-monospace fw-semibold text-dark">5,510 Users (44%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-success" style={{ width: '44%' }} />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Conservative / Capital Preservation (100% T-Bills)</span>
                  <span className="font-monospace fw-semibold text-dark">3,490 Users (28%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-info" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Aggressive Growth (US Tech &amp; African Blue Chips)</span>
                  <span className="font-monospace fw-semibold text-dark">2,745 Users (22%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-warning" style={{ width: '22%' }} />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Institutional Discretionary Mandate Accounts</span>
                  <span className="font-monospace fw-semibold text-dark">735 Users (6%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-purple" style={{ width: '6%', backgroundColor: '#8B5CF6' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Held Assets Across All User Portfolios */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-14">
              <i className="ti ti-trophy text-warning me-1" /> Top Instruments Held Across User Portfolios
            </h6>
            <span className="text-muted fs-12">Consolidated client equity exposure ranked by aggregate market value</span>
          </div>
          <span className="badge rounded-pill bg-light text-secondary border font-monospace">
            6 Core Assets = 90% AUM
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Instrument</th>
                  <th>Market Venue</th>
                  <th>Total User Shares</th>
                  <th>Aggregate Value</th>
                  <th>Client Holders</th>
                  <th>Avg Cost Basis</th>
                  <th>Unrealized P&amp;L</th>
                  <th className="pe-4 text-end">AUM Share</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_TOP_HOLDINGS.map((h) => {
                  const isPositive = h.unrealizedPnLPercent >= 0;
                  return (
                    <tr key={h.symbol}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{h.symbol}</div>
                        <span className="text-muted fs-11 font-sans text-truncate d-block" style={{ maxWidth: 180 }}>
                          {h.name}
                        </span>
                      </td>
                      <td>
                        <span className="badge rounded-pill bg-light text-secondary border fs-10">
                          {h.market}
                        </span>
                      </td>
                      <td className="text-dark fw-semibold">{fmtNum(h.totalShares)}</td>
                      <td className="fw-bold text-dark">${fmtNum(h.totalValueUSD)}</td>
                      <td>
                        <span className="badge bg-light text-secondary border fs-11 font-sans">
                          <i className="ti ti-users me-1" /> {fmtNum(h.totalHolders)}
                        </span>
                      </td>
                      <td className="text-muted">${h.avgCostBasisUSD}</td>
                      <td className={isPositive ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        {isPositive ? '+' : ''}{h.unrealizedPnLPercent}%
                      </td>
                      <td className="pe-4 text-end">
                        <span className="fw-bold text-dark">{h.allocationPercent}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
