'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtNum } from '@/lib/format';

interface DefinitionModalState {
  title: string;
  definition: string;
  source: string;
  lastUpdated: string;
}

export default function ExecutiveStakeholderPage() {
  const [dateRange, setDateRange] = useState('30D');
  const [definition, setDefinition] = useState<DefinitionModalState | null>(null);
  const [boardCommentary, setBoardCommentary] = useState(
    'Strong month-on-month growth across NGN ➔ USD and NGN ➔ GBP corridors (+24.2%). Nigerian cross-border retail volume remains resilient. US Stock brokerage integration with DriveWealth reached $1.8M in aggregate retail custody holdings. Prefunding buffer at Flutterwave maintained above 14 days runway.'
  );
  const [savedCommentaryToast, setSavedCommentaryToast] = useState(false);

  const openDefinition = (title: string, definition: string, source: string) => {
    setDefinition({
      title,
      definition,
      source,
      lastUpdated: 'Today at 00:00 UTC (Daily Live Rollup)',
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title & Date Range Controls */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Executive & Board</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Period Selector */}
          <div className="btn-group btn-group-sm bg-white shadow-sm rounded-pill p-1 border">
            {['7D', '30D', 'Q3 2026', 'YTD'].map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 ${dateRange === p ? 'btn-primary' : 'btn-light'}`}
                onClick={() => setDateRange(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportPDF}
          >
            <i className="ti ti-download" /> Export Board Pack (PDF)
          </button>
        </div>
      </div>

      {/* Top Scorecard Tiles with "Definition on Tap" */}
      <div className="row g-3 mb-4">
        {/* Gross Cleared Volume */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fs-12 fw-semibold text-uppercase">Total Settled Volume</span>
              <button
                type="button"
                className="btn btn-link p-0 text-muted"
                title="Tap for plain language definition"
                onClick={() =>
                  openDefinition(
                    'Total Settled Volume',
                    'The cumulative face value of all fiat and crypto transfers, stock orders, and bill payments successfully executed through the exchange core within the selected timeframe. Excludes canceled, reversed, or refunded legs.',
                    'Core Ledger Settlement Engine'
                  )
                }
              >
                <i className="ti ti-help-circle fs-16 text-primary" />
              </button>
            </div>
            <h3 className="fw-bold fs-24 text-dark mb-1">$14,820,400</h3>
            <div className="d-flex align-items-center gap-2 fs-12">
              <span className="text-success fw-semibold">
                <i className="ti ti-arrow-up-right" /> +18.4%
              </span>
              <span className="text-muted">vs previous period</span>
            </div>
          </div>
        </div>

        {/* Realised Revenue */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fs-12 fw-semibold text-uppercase">Realised Net Revenue</span>
              <button
                type="button"
                className="btn btn-link p-0 text-muted"
                onClick={() =>
                  openDefinition(
                    'Realised Net Revenue',
                    'Actual cash revenue captured from FX spreads, retail brokerage trading commissions, fiat withdrawal fees, and dividend processing fees, net of provider interchange expenses.',
                    'Treasury General Ledger (Booked vs Realised)'
                  )
                }
              >
                <i className="ti ti-help-circle fs-16 text-primary" />
              </button>
            </div>
            <h3 className="fw-bold fs-24 text-dark mb-1">$342,850</h3>
            <div className="d-flex align-items-center gap-2 fs-12">
              <span className="text-success fw-semibold">
                <i className="ti ti-arrow-up-right" /> +22.1%
              </span>
              <span className="badge bg-success-subtle text-success py-0 px-2">2.31% Net Take Rate</span>
            </div>
          </div>
        </div>

        {/* Active Transacting Customers */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fs-12 fw-semibold text-uppercase">Active Customers</span>
              <button
                type="button"
                className="btn btn-link p-0 text-muted"
                onClick={() =>
                  openDefinition(
                    'Active Customers',
                    'Distinct retail and institutional accounts that completed at least one funded transaction (wallet deposit, exchange swap, stock buy/sell, or bill payment) in the rolling window.',
                    'Customer Identity & Ledger Metrics'
                  )
                }
              >
                <i className="ti ti-help-circle fs-16 text-primary" />
              </button>
            </div>
            <h3 className="fw-bold fs-24 text-dark mb-1">18,490</h3>
            <div className="d-flex align-items-center gap-2 fs-12">
              <span className="text-success fw-semibold">
                <i className="ti ti-arrow-up-right" /> +1,410 new
              </span>
              <span className="text-muted">74.2% Verification Conversion</span>
            </div>
          </div>
        </div>

        {/* Operational SLA & Success Rate */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fs-12 fw-semibold text-uppercase">Payment Success Rate</span>
              <button
                type="button"
                className="btn btn-link p-0 text-muted"
                onClick={() =>
                  openDefinition(
                    'Payment Success Rate & Mean Time to Deliver',
                    'The proportion of initiating user payouts and settlements that reach terminal COMPLETED status without human intervention or failure. Average delivery time measures timestamp delta from user quote acceptance to destination provider confirmation.',
                    'Platform Observability Engine'
                  )
                }
              >
                <i className="ti ti-help-circle fs-16 text-primary" />
              </button>
            </div>
            <h3 className="fw-bold fs-24 text-dark mb-1">99.42%</h3>
            <div className="d-flex align-items-center gap-2 fs-12">
              <span className="badge bg-primary-subtle text-primary py-0 px-2">Avg 4.8m Delivery</span>
              <span className="text-muted">0 Open P1 Incidents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress Bar Tracker */}
      <div className="card border-0 shadow-sm rounded-3 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold fs-15 text-dark m-0">Quarterly Strategic Targets (Q3 2026)</h6>
            <small className="text-muted fs-12">Tracking institutional KPIs approved by the Board of Directors</small>
          </div>
          <span className="badge bg-primary-subtle text-primary px-3 py-1 fs-12 fw-bold">78% Target Attainment</span>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="d-flex justify-content-between fs-13 mb-1">
              <span className="text-muted">Quarterly Volume Target ($20M)</span>
              <span className="fw-bold text-dark">$14.82M (74%)</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar bg-primary" role="progressbar" style={{ width: '74%' }} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex justify-content-between fs-13 mb-1">
              <span className="text-muted">Active Customer Target (20,000)</span>
              <span className="fw-bold text-dark">18,490 (92%)</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar bg-success" role="progressbar" style={{ width: '92%' }} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex justify-content-between fs-13 mb-1">
              <span className="text-muted">Investment Custody AUM ($2.5M)</span>
              <span className="fw-bold text-dark">$1.82M (73%)</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar bg-info" role="progressbar" style={{ width: '73%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 6.2 Deep Dive Grids */}
      <div className="row g-4 mb-4">
        {/* Revenue Streams & Unit Economics */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold fs-15 text-dark m-0">Revenue by Stream & Unit Economics</h6>
                <small className="text-muted fs-12">Net margin captured per product channel</small>
              </div>
              <span className="badge bg-light text-muted border">Live Stream Breakdown</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Revenue Stream</th>
                    <th>Booked Gross</th>
                    <th>Provider Cost</th>
                    <th className="text-end">Net Margin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Corridor FX Conversion Spread</div>
                      <small className="text-muted">NGN ➔ USD, NGN ➔ GBP, KES ➔ NGN</small>
                    </td>
                    <td>$218,400</td>
                    <td className="text-muted">$34,100</td>
                    <td className="text-end fw-bold text-success">$184,300 (84.4%)</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Investments Trading Commissions</div>
                      <small className="text-muted">US Equities (DriveWealth) & NGX Shares</small>
                    </td>
                    <td>$74,200</td>
                    <td className="text-muted">$16,500</td>
                    <td className="text-end fw-bold text-success">$57,700 (77.8%)</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Treasury Cash Interest</div>
                      <small className="text-muted">Overnight Yield on Settlement Float</small>
                    </td>
                    <td>$32,150</td>
                    <td className="text-muted">$0</td>
                    <td className="text-end fw-bold text-success">$32,150 (100%)</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Dividend FX Processing</div>
                      <small className="text-muted">Corporate Action distribution withholding</small>
                    </td>
                    <td>$11,800</td>
                    <td className="text-muted">$2,100</td>
                    <td className="text-end fw-bold text-success">$9,700 (82.2%)</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Fiat Payout & Withdrawal Fees</div>
                      <small className="text-muted">Bank NIP rails & Mobile Money</small>
                    </td>
                    <td>$18,400</td>
                    <td className="text-muted">$9,200</td>
                    <td className="text-end fw-bold text-success">$9,200 (50.0%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cash & Treasury Liquidity Buffer */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold fs-15 text-dark m-0">Treasury & Segregated Customer Float</h6>
                <small className="text-muted fs-12">Regulatory reserve segregation & provider runways</small>
              </div>
              <span className="badge bg-success-subtle text-success fs-11">100% Backed Reserves</span>
            </div>

            <div className="alert alert-light border py-2 px-3 fs-12 mb-3 rounded d-flex align-items-center justify-content-between">
              <span className="text-muted">Customer Funds Held in Segregated Trust:</span>
              <span className="fw-bold text-dark font-monospace">$8,450,120 (100% Owed to Customers)</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Custodian / Account</th>
                    <th>Currency</th>
                    <th>Balance</th>
                    <th className="text-end">Prefunding Runway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Access Bank Plc (Settlement Trust)</div>
                      <small className="text-muted">Segregated NGN Float</small>
                    </td>
                    <td><span className="badge bg-light text-dark border">NGN</span></td>
                    <td className="font-monospace">₦4,210,500,000</td>
                    <td className="text-end text-success fw-bold">18.4 Days</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">DriveWealth LLC (Omnibus Cash)</div>
                      <small className="text-muted">US Brokerage Clearing</small>
                    </td>
                    <td><span className="badge bg-light text-dark border">USD</span></td>
                    <td className="font-monospace">$1,820,400</td>
                    <td className="text-end text-success fw-bold">14.1 Days</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">Flutterwave Prefund Float</div>
                      <small className="text-muted">NIP Outbound Payout Rail</small>
                    </td>
                    <td><span className="badge bg-light text-dark border">NGN</span></td>
                    <td className="font-monospace">₦840,000,000</td>
                    <td className="text-end text-warning fw-bold">6.8 Days</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold text-dark">YellowCard Crypto Custody</div>
                      <small className="text-muted">USDT / USDC Settlement</small>
                    </td>
                    <td><span className="badge bg-light text-dark border">USDT</span></td>
                    <td className="font-monospace">1,240,000 USDT</td>
                    <td className="text-end text-success fw-bold">22.0 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cohorts & Risk Snapshot */}
      <div className="row g-4 mb-4">
        {/* Growth & Cohorts */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold fs-15 text-dark m-0">Customer Corridor Adoption & Retention Funnel</h6>
                <small className="text-muted fs-12">From onboarding sign-up to multi-product investing</small>
              </div>
              <span className="badge bg-light text-muted border">Funnel Velocity</span>
            </div>

            <div className="d-flex flex-column gap-3 mb-2">
              <div>
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">1. Account Registered (Completed Onboarding)</span>
                  <span className="fw-semibold text-dark">24,910 (100%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-secondary" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">2. Tier 2 / BVN Verified (Identity Pass)</span>
                  <span className="fw-semibold text-dark">18,490 (74.2%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-info" style={{ width: '74.2%' }} />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">3. First Wallet Funded (Initial Cash Deposit)</span>
                  <span className="fw-semibold text-dark">15,120 (60.7%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-primary" style={{ width: '60.7%' }} />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">4. Multi-Product Adoption (Stock Trade Executed)</span>
                  <span className="fw-semibold text-dark">6,840 (27.5%)</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar bg-success" style={{ width: '27.5%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Compliance Snapshot (Counts only, zero PII) */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold fs-15 text-dark m-0">Risk & Compliance Snapshot</h6>
                <small className="text-muted fs-12">Counts only · No customer personal data</small>
              </div>
              <Link href="/admin/compliance" className="btn btn-sm btn-outline-primary py-0 px-2 fs-12">
                Open AML Desk
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-flag-3 text-warning fs-18" />
                  <span className="fs-13 text-dark">Open AML Automated Alerts</span>
                </div>
                <span className="badge bg-warning text-dark fs-12 fw-bold">4 Pending Review</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-calendar-due text-info fs-18" />
                  <span className="fs-13 text-dark">Upcoming Regulatory Filings</span>
                </div>
                <span className="badge bg-info-subtle text-info fs-12 fw-bold">2 Due (CBN & SEC)</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-activity-heartbeat text-success fs-18" />
                  <span className="fs-13 text-dark">Connected Provider Health</span>
                </div>
                <span className="badge bg-success-subtle text-success fs-12 fw-bold">6 / 6 Operational</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-shield-alert text-danger fs-18" />
                  <span className="fs-13 text-dark">Platform Limit Exceptions</span>
                </div>
                <span className="badge bg-secondary-subtle text-dark fs-12 fw-bold">0 Active Overrides</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board & Investor Pack Monthly Commentary */}
      <div className="card border-0 shadow-sm rounded-3 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold fs-15 text-dark m-0">Board & Investor Monthly Pack Commentary</h6>
            <small className="text-muted fs-12">
              Staff commentary embedded directly into the generated investor report PDF
            </small>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary fw-semibold px-3"
            onClick={() => {
              setSavedCommentaryToast(true);
              setTimeout(() => setSavedCommentaryToast(false), 2500);
            }}
          >
            <i className="ti ti-device-floppy me-1" /> Save Commentary Version
          </button>
        </div>

        {savedCommentaryToast && (
          <div className="alert alert-success py-2 px-3 fs-12 mb-3 border-0 bg-success-subtle text-success rounded">
            Board report commentary version v2026.09-final saved successfully.
          </div>
        )}

        <textarea
          className="form-control fs-13 mb-3"
          rows={3}
          value={boardCommentary}
          onChange={(e) => setBoardCommentary(e.target.value)}
        />

        <div className="d-flex align-items-center justify-content-between fs-12 text-muted pt-2 border-top">
          <span>Author: <strong>Aliko Adeleke (Superadmin & Ops)</strong> · Version: <strong>2026.09 (Live)</strong></span>
          <span>Next scheduled automatic distribution: <strong>1st of next month, 08:00 UTC</strong></span>
        </div>
      </div>

      {/* Definition on Tap Modal */}
      {definition && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', zIndex: 1080 }}
          onClick={() => setDefinition(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-light py-2 px-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti ti-info-circle text-primary fs-18" />
                  <h6 className="modal-title fs-14 fw-bold text-dark m-0">
                    Definition on Tap: {definition.title}
                  </h6>
                </div>
                <button type="button" className="btn-close" onClick={() => setDefinition(null)} />
              </div>
              <div className="modal-body p-4 fs-13">
                <p className="text-dark mb-3 leading-relaxed">{definition.definition}</p>
                <div className="p-2 bg-light rounded text-muted fs-12">
                  <div><strong>Data Source:</strong> {definition.source}</div>
                  <div className="mt-1"><strong>Recalculation Cadence:</strong> {definition.lastUpdated}</div>
                </div>
              </div>
              <div className="modal-footer bg-light py-2 px-3 border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setDefinition(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
