'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface SecurityItem {
  ticker: string;
  name: string;
  market: 'NGX' | 'US';
  currency: 'NGN' | 'USD';
  lastPrice: number;
  tradingStatus: 'ACTIVE' | 'HALTED' | 'RESTRICTED';
  totalSharesHeld: number;
  custodianAUM: number;
  haltReason?: string;
}

const SAMPLE_SECURITIES: SecurityItem[] = [
  { ticker: 'MTNN', name: 'MTN Nigeria Communications Plc', market: 'NGX', currency: 'NGN', lastPrice: 245.0, tradingStatus: 'ACTIVE', totalSharesHeld: 1420000, custodianAUM: 347900000 },
  { ticker: 'AIRTELAFRI', name: 'Airtel Africa Plc', market: 'NGX', currency: 'NGN', lastPrice: 1950.0, tradingStatus: 'ACTIVE', totalSharesHeld: 48000, custodianAUM: 93600000 },
  { ticker: 'GTCO', name: 'Guaranty Trust Holding Co.', market: 'NGX', currency: 'NGN', lastPrice: 48.5, tradingStatus: 'ACTIVE', totalSharesHeld: 2500000, custodianAUM: 121250000 },
  { ticker: 'AAPL', name: 'Apple Inc.', market: 'US', currency: 'USD', lastPrice: 230.15, tradingStatus: 'ACTIVE', totalSharesHeld: 4500, custodianAUM: 1035675 },
  { ticker: 'TSLA', name: 'Tesla Inc.', market: 'US', currency: 'USD', lastPrice: 225.0, tradingStatus: 'ACTIVE', totalSharesHeld: 2100, custodianAUM: 472500 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', market: 'US', currency: 'USD', lastPrice: 128.4, tradingStatus: 'ACTIVE', totalSharesHeld: 3800, custodianAUM: 487920 },
];

const SAMPLE_ORDERS = [
  { id: 'ORD-DW-1092', ticker: 'AAPL', customer: 'Chioma Okonjo', side: 'BUY', qty: 15, price: 230.15, venue: 'DriveWealth LLC', status: 'FILLED', timestamp: '10:14:02' },
  { id: 'ORD-NGX-8812', ticker: 'MTNN', customer: 'Babajide Adeleke', side: 'BUY', qty: 2500, price: 245.0, venue: 'NGX CSCS', status: 'FILLED', timestamp: '10:08:44' },
  { id: 'ORD-DW-1091', ticker: 'TSLA', customer: 'Emeka Eze', side: 'SELL', qty: 4, price: 225.0, venue: 'DriveWealth LLC', status: 'PENDING', timestamp: '09:59:12' },
  { id: 'ORD-NGX-8811', ticker: 'GTCO', customer: 'Kofi Mensah', side: 'BUY', qty: 10000, price: 48.5, venue: 'NGX CSCS', status: 'FILLED', timestamp: '09:45:00' },
];

const SAMPLE_DIVIDENDS = [
  { id: 'CA-DIV-01', ticker: 'MTNN', type: 'CASH_DIVIDEND', amountPerShare: 5.60, currency: 'NGN', exDate: '2026-10-15', status: 'SCHEDULED', eligibleShares: 1420000 },
  { id: 'CA-DIV-02', ticker: 'AAPL', type: 'CASH_DIVIDEND', amountPerShare: 0.25, currency: 'USD', exDate: '2026-10-20', status: 'READY_TO_DISTRIBUTE', eligibleShares: 4500 },
];

const SAMPLE_CUSTODY = [
  { ticker: 'MTNN', broker: 'CardinalStone / CSCS', omnibusBalance: 1420000, clientSubledger: 1420000, variance: 0, status: 'MATCHED' },
  { ticker: 'AAPL', broker: 'DriveWealth DTC', omnibusBalance: 4500, clientSubledger: 4500, variance: 0, status: 'MATCHED' },
  { ticker: 'TSLA', broker: 'DriveWealth DTC', omnibusBalance: 2100, clientSubledger: 2100, variance: 0, status: 'MATCHED' },
  { ticker: 'GTCO', broker: 'Chapel Hill Denham', omnibusBalance: 2500000, clientSubledger: 2500000, variance: 0, status: 'MATCHED' },
];

export default function InvestmentsBackOfficePage() {
  const { toast } = useToast();
  const [securities, setSecurities] = useState<SecurityItem[]>(SAMPLE_SECURITIES);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'dividends' | 'custody'>('catalog');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'NGX' | 'US'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Market status switches
  const [ngxOpen, setNgxOpen] = useState(false);
  const [usOpen, setUsOpen] = useState(true);

  // Trading Halt Operational Modal
  const [haltModal, setHaltModal] = useState<{
    isOpen: boolean;
    security: SecurityItem | null;
    isHalting: boolean;
    reason: string;
  }>({
    isOpen: false,
    security: null,
    isHalting: true,
    reason: 'Corporate Action Pending (Earnings Announcement)',
  });

  // Dividend Distribution Modal
  const [dividendModal, setDividendModal] = useState<{
    isOpen: boolean;
    item: (typeof SAMPLE_DIVIDENDS)[0] | null;
    isExecuting: boolean;
  }>({
    isOpen: false,
    item: null,
    isExecuting: false,
  });

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenHalt = (sec: SecurityItem) => {
    const isHalting = sec.tradingStatus === 'ACTIVE';
    setHaltModal({
      isOpen: true,
      security: sec,
      isHalting,
      reason: isHalting
        ? 'Corporate Action Pending (Earnings Announcement)'
        : 'Trading resumed following market open confirmation',
    });
  };

  const handleExecuteHalt = () => {
    if (!haltModal.security) return;
    const updatedStatus = haltModal.isHalting ? 'HALTED' : 'ACTIVE';
    setSecurities((prev) =>
      prev.map((s) =>
        s.ticker === haltModal.security?.ticker
          ? { ...s, tradingStatus: updatedStatus, haltReason: haltModal.isHalting ? haltModal.reason : undefined }
          : s
      )
    );
    toast(
      haltModal.isHalting ? 'warning' : 'success',
      `Trading ${haltModal.isHalting ? 'halted' : 'resumed'} for ${haltModal.security.ticker}. Reason: ${haltModal.reason}`
    );
    setHaltModal({ isOpen: false, security: null, isHalting: true, reason: '' });
  };

  const handleExecuteDividend = () => {
    if (!dividendModal.item) return;
    setDividendModal((prev) => ({ ...prev, isExecuting: true }));
    const item = dividendModal.item;

    setTimeout(() => {
      setDividendModal({ isOpen: false, item: null, isExecuting: false });
      const gross = item.eligibleShares * item.amountPerShare;
      toast(
        'success',
        `Cash dividend of ${fmtMoney(gross, item.currency)} distributed across eligible holders (10% WHT withheld).`
      );
    }, 700);
  };

  const filteredSecurities = securities.filter((s) => {
    if (marketFilter !== 'ALL' && s.market !== marketFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Investments Desk</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Market Status Overrides */}
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border fs-12 text-secondary">
            <span>NGX:</span>
            <span
              className={`badge cursor-pointer ${ngxOpen ? 'bg-success-subtle text-success' : 'bg-light text-muted border'}`}
              onClick={() => {
                setNgxOpen(!ngxOpen);
                toast('info', `NGX market session switched to ${!ngxOpen ? 'OPEN' : 'CLOSED'}`);
              }}
            >
              {ngxOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <span className="ms-2">US:</span>
            <span
              className={`badge cursor-pointer ${usOpen ? 'bg-success-subtle text-success' : 'bg-light text-muted border'}`}
              onClick={() => {
                setUsOpen(!usOpen);
                toast('info', `US market session switched to ${!usOpen ? 'OPEN' : 'CLOSED'}`);
              }}
            >
              {usOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'catalog' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('catalog')}
              >
                <i className="ti ti-list-details me-1" /> Securities Master Catalog ({securities.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'orders' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="ti ti-receipt me-1" /> Live Broker Order Stream ({SAMPLE_ORDERS.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'dividends' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('dividends')}
              >
                <i className="ti ti-coin me-1" /> Corporate Actions & Dividends
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'custody' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('custody')}
              >
                <i className="ti ti-building-bank me-1" /> Custody Holdings Reconciliation
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <>
              {/* Filter Row */}
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-0">
                      <i className="ti ti-search text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      placeholder="Search securities by symbol or name (e.g. MTNN, AAPL, Tesla)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="btn-group btn-group-sm w-100">
                    {['ALL', 'NGX', 'US'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`btn ${marketFilter === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setMarketFilter(m as any)}
                      >
                        {m} Markets
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-3 text-end">
                  <span className="badge bg-light text-muted border p-2 fs-12">
                    Omnibus Custody: <strong>$1.98M USD / ₦562M NGN</strong>
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Ticker & Name</th>
                      <th>Market / Currency</th>
                      <th>Current Price</th>
                      <th>Retail Shares in Custody</th>
                      <th>Custodian Value (AUM)</th>
                      <th>Trading Status</th>
                      <th className="text-end">Operational Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSecurities.map((s) => (
                      <tr key={s.ticker}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-dark font-monospace fs-12">{s.ticker}</span>
                            <div>
                              <div className="fw-bold text-dark">{s.name}</div>
                              {s.haltReason && (
                                <small className="text-danger d-block">{s.haltReason}</small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${s.market === 'NGX' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} font-monospace`}>
                            {s.market} ({s.currency})
                          </span>
                        </td>

                        <td className="fw-bold font-monospace">
                          {fmtMoney(s.lastPrice, s.currency)}
                        </td>

                        <td className="font-monospace">
                          {fmtNum(s.totalSharesHeld, 0)} units
                        </td>

                        <td className="fw-semibold text-success font-monospace">
                          {fmtMoney(s.custodianAUM, s.currency)}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              s.tradingStatus === 'ACTIVE'
                                ? 'bg-success-subtle text-success'
                                : 'bg-danger-subtle text-danger'
                            }`}
                          >
                            {s.tradingStatus}
                          </span>
                        </td>

                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Internal notes"
                              onClick={() => setNotesTarget({ id: s.ticker, title: s.name })}
                            >
                              <i className="ti ti-notes" />
                            </button>
                            <button
                              type="button"
                              className={`btn ${s.tradingStatus === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleOpenHalt(s)}
                            >
                              {s.tradingStatus === 'ACTIVE' ? 'Halt Trading' : 'Resume'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Order Reference</th>
                    <th>Security</th>
                    <th>Customer</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th>Limit / Exec Price</th>
                    <th>Execution Broker</th>
                    <th>Status</th>
                    <th>Time (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ORDERS.map((ord) => (
                    <tr key={ord.id}>
                      <td className="font-monospace fw-semibold text-dark">{ord.id}</td>
                      <td>
                        <span className="badge bg-dark font-monospace">{ord.ticker}</span>
                      </td>
                      <td className="text-dark">{ord.customer}</td>
                      <td>
                        <span className={`badge ${ord.side === 'BUY' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="font-monospace">{fmtNum(ord.qty, 0)}</td>
                      <td className="font-monospace fw-bold">${ord.price.toFixed(2)}</td>
                      <td className="text-muted">{ord.venue}</td>
                      <td>
                        <span className={`badge ${ord.status === 'FILLED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="font-monospace text-muted fs-11">{ord.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Corporate Actions Tab */}
          {activeTab === 'dividends' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="fw-bold fs-14 text-dark m-0">Corporate Actions & Cash Dividends</h6>
                  <small className="text-muted">Distribute cash dividends to eligible shareholders with 10% statutory WHT withholding.</small>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Action Ref</th>
                      <th>Security</th>
                      <th>Type</th>
                      <th>Dividend / Share</th>
                      <th>Ex-Dividend Date</th>
                      <th>Eligible Holdings</th>
                      <th>Total Distribution</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_DIVIDENDS.map((div) => {
                      const gross = div.eligibleShares * div.amountPerShare;
                      return (
                        <tr key={div.id}>
                          <td className="font-monospace fw-semibold text-dark">{div.id}</td>
                          <td><span className="badge bg-dark font-monospace">{div.ticker}</span></td>
                          <td><span className="badge bg-light text-dark border">Cash Dividend</span></td>
                          <td className="font-monospace fw-bold">{fmtMoney(div.amountPerShare, div.currency)}</td>
                          <td className="font-monospace text-muted">{div.exDate}</td>
                          <td className="font-monospace">{fmtNum(div.eligibleShares, 0)} shares</td>
                          <td className="font-monospace fw-bold text-success">{fmtMoney(gross, div.currency)}</td>
                          <td>
                            <span className={`badge ${div.status === 'READY_TO_DISTRIBUTE' ? 'bg-success-subtle text-success' : 'bg-light text-muted border'}`}>
                              {div.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => setDividendModal({ isOpen: true, item: div, isExecuting: false })}
                            >
                              Distribute Payout
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Custody Reconciliation Tab */}
          {activeTab === 'custody' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="fw-bold fs-14 text-dark m-0">Broker Omnibus vs Customer Sub-Ledger</h6>
                  <small className="text-muted">Verified daily against DriveWealth DTC depository and CSCS clearinghouse records.</small>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => toast('info', 'Re-queried broker custody depository endpoints. All holdings verified.')}
                >
                  <i className="ti ti-refresh me-1" /> Re-verify Custody
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Ticker</th>
                      <th>Custody Depository</th>
                      <th>Broker Omnibus Shares</th>
                      <th>Client Sub-Ledger Total</th>
                      <th>Variance Delta</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_CUSTODY.map((c) => (
                      <tr key={c.ticker}>
                        <td><span className="badge bg-dark font-monospace">{c.ticker}</span></td>
                        <td className="text-dark fw-medium">{c.broker}</td>
                        <td className="font-monospace fw-bold">{fmtNum(c.omnibusBalance, 0)}</td>
                        <td className="font-monospace fw-bold">{fmtNum(c.clientSubledger, 0)}</td>
                        <td className="font-monospace text-success fw-bold">{c.variance === 0 ? '0.00 (Balanced)' : fmtNum(c.variance, 0)}</td>
                        <td>
                          <span className="badge bg-success-subtle text-success">
                            <i className="ti ti-check me-1" /> {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trading Halt Modal */}
      {haltModal.isOpen && haltModal.security && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setHaltModal({ isOpen: false, security: null, isHalting: true, reason: '' })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {haltModal.isHalting ? 'Halt Instrument Trading' : 'Resume Instrument Trading'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setHaltModal({ isOpen: false, security: null, isHalting: true, reason: '' })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-dark font-monospace me-2">{haltModal.security.ticker}</span>
                    <strong className="text-dark">{haltModal.security.name}</strong>
                  </div>
                  <span className="badge bg-secondary">{haltModal.security.market}</span>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-12 fw-medium text-dark">
                    {haltModal.isHalting ? 'Market Reason for Trading Halt' : 'Resumption Rationale'}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={haltModal.reason}
                    onChange={(e) => setHaltModal({ ...haltModal, reason: e.target.value })}
                  >
                    {haltModal.isHalting ? (
                      <>
                        <option value="Corporate Action Pending (Earnings Announcement)">Corporate Action Pending (Earnings Announcement)</option>
                        <option value="Volatility Circuit Breaker (Price Band Triggered)">Volatility Circuit Breaker (Price Band Triggered)</option>
                        <option value="SEC / Exchange Regulatory Inquiry Directive">SEC / Exchange Regulatory Inquiry Directive</option>
                        <option value="Broker Clearing Depository Maintenance">Broker Clearing Depository Maintenance</option>
                      </>
                    ) : (
                      <>
                        <option value="Corporate Action Complete / Disclosures Published">Corporate Action Complete / Disclosures Published</option>
                        <option value="Exchange Circuit Breaker Cool-Down Elapsed">Exchange Circuit Breaker Cool-Down Elapsed</option>
                        <option value="Regulatory Clearance Received">Regulatory Clearance Received</option>
                        <option value="Market Open Session Resumed">Market Open Session Resumed</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setHaltModal({ isOpen: false, security: null, isHalting: true, reason: '' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${haltModal.isHalting ? 'btn-danger' : 'btn-success'}`}
                  onClick={handleExecuteHalt}
                >
                  {haltModal.isHalting ? 'Confirm Halt' : 'Resume Trading'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dividend Distribution Modal */}
      {dividendModal.isOpen && dividendModal.item && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  Execute Dividend Distribution
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                <div className="p-3 bg-light rounded mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Security:</span>
                    <strong className="text-dark font-monospace">{dividendModal.item.ticker}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Dividend Rate:</span>
                    <span className="fw-semibold">{fmtMoney(dividendModal.item.amountPerShare, dividendModal.item.currency)} / share</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Eligible Retail Shares:</span>
                    <span className="font-monospace">{fmtNum(dividendModal.item.eligibleShares, 0)} units</span>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2">
                    <span className="text-muted">Gross Payout:</span>
                    <span className="fw-bold text-dark font-monospace">
                      {fmtMoney(dividendModal.item.eligibleShares * dividendModal.item.amountPerShare, dividendModal.item.currency)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-12 mt-1">
                    <span>Statutory 10% WHT:</span>
                    <span className="font-monospace">
                      -{fmtMoney(dividendModal.item.eligibleShares * dividendModal.item.amountPerShare * 0.1, dividendModal.item.currency)}
                    </span>
                  </div>
                </div>

                <div className="p-2 border rounded bg-white text-muted fs-12">
                  <i className="ti ti-info-circle me-1 text-primary" />
                  Each shareholder will receive net cash credited directly to their {dividendModal.item.currency} cash wallet.
                </div>
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={dividendModal.isExecuting}
                  className="btn btn-sm btn-success"
                  onClick={handleExecuteDividend}
                >
                  {dividendModal.isExecuting ? 'Processing...' : 'Execute Distribution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
