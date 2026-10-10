'use client';

import React from 'react';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';

export interface OrderItem {
  id: string;
  ticker: string;
  customer: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  venue: string;
  status: 'FILLED' | 'PENDING' | 'REJECTED';
  timestamp: string;
}

export interface CustodyItem {
  ticker: string;
  broker: string;
  omnibusBalance: number;
  clientSubledger: number;
  variance: number;
  status: 'MATCHED' | 'DISCREPANCY';
}

export interface DividendItem {
  id: string;
  ticker: string;
  type: string;
  amountPerShare: number;
  currency: 'NGN' | 'USD';
  exDate: string;
  status: string;
  eligibleShares: number;
}

export const SAMPLE_ORDERS: OrderItem[] = [
  { id: 'ORD-DW-1092', ticker: 'AAPL', customer: 'Chioma Okonjo', side: 'BUY', qty: 15, price: 232.45, venue: 'DriveWealth LLC / DTC', status: 'FILLED', timestamp: '10:14:02' },
  { id: 'ORD-NGX-8812', ticker: 'MTNN', customer: 'Babajide Adeleke', side: 'BUY', qty: 2500, price: 245.0, venue: 'NGX CSCS Central', status: 'FILLED', timestamp: '10:08:44' },
  { id: 'ORD-DW-1091', ticker: 'TSLA', customer: 'Emeka Eze', side: 'SELL', qty: 4, price: 228.1, venue: 'DriveWealth LLC / DTC', status: 'PENDING', timestamp: '09:59:12' },
  { id: 'ORD-NGX-8811', ticker: 'GTCO', customer: 'Kofi Mensah', side: 'BUY', qty: 10000, price: 48.5, venue: 'NGX CSCS Central', status: 'FILLED', timestamp: '09:45:00' },
  { id: 'ORD-FMDQ-402', ticker: 'FGN-2029', customer: 'Meridian Capital Partners', side: 'BUY', qty: 50000, price: 98.4, venue: 'FMDQ Securities Exchange', status: 'FILLED', timestamp: '09:30:15' },
];

export const SAMPLE_DIVIDENDS: DividendItem[] = [
  { id: 'CA-DIV-01', ticker: 'MTNN', type: 'CASH_DIVIDEND', amountPerShare: 5.60, currency: 'NGN', exDate: '2026-10-15', status: 'SCHEDULED', eligibleShares: 1420000 },
  { id: 'CA-DIV-02', ticker: 'AAPL', type: 'CASH_DIVIDEND', amountPerShare: 0.25, currency: 'USD', exDate: '2026-10-20', status: 'READY_TO_DISTRIBUTE', eligibleShares: 4500 },
];

export const SAMPLE_CUSTODY: CustodyItem[] = [
  { ticker: 'MTNN', broker: 'CardinalStone / CSCS Depository', omnibusBalance: 1420000, clientSubledger: 1420000, variance: 0, status: 'MATCHED' },
  { ticker: 'AAPL', broker: 'DriveWealth DTC Omnibus', omnibusBalance: 4500, clientSubledger: 4500, variance: 0, status: 'MATCHED' },
  { ticker: 'TSLA', broker: 'DriveWealth DTC Omnibus', omnibusBalance: 2100, clientSubledger: 2100, variance: 0, status: 'MATCHED' },
  { ticker: 'GTCO', broker: 'Chapel Hill Denham Omnibus', omnibusBalance: 2500000, clientSubledger: 2500000, variance: 0, status: 'MATCHED' },
  { ticker: 'NVDA', broker: 'DriveWealth DTC Omnibus', omnibusBalance: 3800, clientSubledger: 3800, variance: 0, status: 'MATCHED' },
];

export function OrdersAndCustody({
  orders = SAMPLE_ORDERS,
  custody = SAMPLE_CUSTODY,
  dividends = SAMPLE_DIVIDENDS,
  onOpenDividendModal,
}: {
  orders?: OrderItem[];
  custody?: CustodyItem[];
  dividends?: DividendItem[];
  onOpenDividendModal?: (div: DividendItem) => void;
}) {
  return (
    <div className="d-flex flex-column gap-3 font-sans">
      {/* Live Broker Order Stream */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-14">
              <i className="ti ti-receipt text-success me-1" /> Live Execution Venue Order Stream
            </h6>
            <span className="text-muted fs-12">Straight-through processing routed to CSCS, DriveWealth, and Chapel Hill Denham</span>
          </div>
          <span className="badge rounded-pill bg-light text-secondary border font-monospace">
            {orders.length} Recent Fills
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Order ID</th>
                  <th>Instrument</th>
                  <th>Client</th>
                  <th>Side</th>
                  <th>Quantity</th>
                  <th>Fill Price</th>
                  <th>Execution Venue</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="ps-4 fw-bold text-dark">{o.id}</td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark border fs-11">
                        {o.ticker}
                      </span>
                    </td>
                    <td className="font-sans text-secondary">{o.customer}</td>
                    <td>
                      <span className={`badge ${o.side === 'BUY' ? 'bg-success text-white' : 'bg-danger text-white'} fs-10`}>
                        {o.side}
                      </span>
                    </td>
                    <td>{fmtNum(o.qty)}</td>
                    <td className="fw-semibold text-dark">${o.price}</td>
                    <td className="text-muted font-sans fs-11">{o.venue}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success fs-10 font-sans">
                        {o.status}
                      </span>
                    </td>
                    <td className="pe-4 text-end text-muted fs-11">{o.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custody Reconciliation & Corporate Action Dividends Grid */}
      <div className="row g-3">
        {/* Omnibus Custody Reconciliations */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold text-dark m-0 fs-13 text-uppercase">
                  <i className="ti ti-building-bank text-primary me-1" /> Omnibus Depository Reconciliation
                </h6>
                <span className="text-muted fs-11">DTC &amp; CSCS custodian holdings vs platform subledger</span>
              </div>
              <span className="badge rounded-pill bg-success-subtle text-success fs-11">
                Zero Variance
              </span>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-12 font-monospace">
                  <thead className="table-light fs-11 text-muted border-bottom">
                    <tr>
                      <th className="ps-3">Security</th>
                      <th>Depository Broker</th>
                      <th>Omnibus Balance</th>
                      <th>Client Subledger</th>
                      <th className="pe-3 text-end">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custody.map((c) => (
                      <tr key={c.ticker}>
                        <td className="ps-3 fw-bold text-dark">{c.ticker}</td>
                        <td className="font-sans text-muted">{c.broker}</td>
                        <td>{fmtNum(c.omnibusBalance)}</td>
                        <td>{fmtNum(c.clientSubledger)}</td>
                        <td className="pe-3 text-end">
                          <span className="badge bg-success-subtle text-success fs-10 font-sans">
                            {c.variance === 0 ? 'MATCHED (0.0)' : `${c.variance} VAR`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Actions & Dividends */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold text-dark m-0 fs-13 text-uppercase">
                  <i className="ti ti-coin text-warning me-1" /> Dividend Schedules
                </h6>
                <span className="text-muted fs-11">WHT withholding &amp; automated wallet payouts</span>
              </div>
            </div>

            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {dividends.map((d) => (
                  <div key={d.id} className="p-2 rounded border bg-light bg-opacity-25 fs-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark font-monospace">{d.ticker}</span>
                      <span className="badge bg-light text-dark border fs-10">{d.status}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted fs-11 mb-2">
                      <span>Rate: {fmtMoney(d.amountPerShare, d.currency)}/sh</span>
                      <span>Ex-Date: {fmtDate(d.exDate)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-secondary fs-11">
                        Gross: {fmtMoney(d.amountPerShare * d.eligibleShares, d.currency)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0 px-2 fs-11"
                        style={{ borderColor: '#16B364', color: '#16B364' }}
                        onClick={() => onOpenDividendModal?.(d)}
                      >
                        Distribute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
