'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  BrokerPartnerId,
  BROKER_HEALTH,
  INITIAL_PORTFOLIOS,
  CustomerPortfolio,
  CustomerHolding,
  ConsoleOrder,
  ConsoleDividendAction,
} from '@/lib/investmentConsoleData';

export function PortfolioConsole() {
  const { toast } = useToast();
  const { activeRole } = useAuth();

  // Active Selected Broker
  const [activeBrokerId, setActiveBrokerId] = useState<BrokerPartnerId>('DRIVEWEALTH_US');
  const activeBroker = BROKER_HEALTH[activeBrokerId];

  // Portfolios dataset
  const [portfolios, setPortfolios] = useState<CustomerPortfolio[]>(INITIAL_PORTFOLIOS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESTRICTED' | 'NEEDS_ATTENTION'>('ALL');

  // Selected portfolio for drawer / modal
  const [selectedPortfolio, setSelectedPortfolio] = useState<CustomerPortfolio | null>(null);

  // Filtered portfolios
  const filteredPortfolios = useMemo(() => {
    return portfolios.filter((p) => {
      const matchBroker = p.brokerPartner === activeBrokerId;
      const matchSearch =
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        p.customerId.toLowerCase().includes(search.toLowerCase()) ||
        p.brokerAccountRef.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'NEEDS_ATTENTION'
          ? p.needsAttention
          : p.status === statusFilter;
      return matchBroker && matchSearch && matchStatus;
    });
  }, [portfolios, activeBrokerId, search, statusFilter]);

  // Handle PII Reveal / Mask
  const handleToggleReveal = (id: string) => {
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.revealed;
          toast('info', nextState ? `Customer PII unmasked for ${p.id}. Access logged.` : `Customer PII masked for ${p.id}.`);
          return { ...p, revealed: nextState };
        }
        return p;
      })
    );
    if (selectedPortfolio && selectedPortfolio.id === id) {
      setSelectedPortfolio((prev) => (prev ? { ...prev, revealed: !prev.revealed } : null));
    }
  };

  // Sync Broker action
  const handleSyncBroker = () => {
    toast('info', `Sync request dispatched to ${activeBroker.name}. Fetching live custodial positions.`);
    setPortfolios((prev) =>
      prev.map((p) => (p.brokerPartner === activeBrokerId ? { ...p, lastSynced: 'Just now' } : p))
    );
  };

  return (
    <div>
      {/* ------------------------------------------------------------- */}
      {/* TOP COMMAND STRIP: BROKER SWITCHER & HEALTH                   */}
      {/* ------------------------------------------------------------- */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            {/* Broker partner switcher */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted fs-12 text-uppercase fw-semibold">Broker Partner:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${activeBrokerId === 'NGX_CHAPEL_HILL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveBrokerId('NGX_CHAPEL_HILL')}
                >
                  <i className="ti ti-building-bank me-1" />
                  Chapel Hill Denham (NGX / NGN)
                </button>
                <button
                  type="button"
                  className={`btn ${activeBrokerId === 'DRIVEWEALTH_US' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveBrokerId('DRIVEWEALTH_US')}
                >
                  <i className="ti ti-world me-1" />
                  DriveWealth LLC (US / USD)
                </button>
              </div>
            </div>

            {/* Health & Sync */}
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2 fs-12">
                <span className="text-muted">API Connection:</span>
                <span className={`badge ${activeBroker.status === 'ONLINE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                  ● {activeBroker.status} ({activeBroker.latencyMs}ms)
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 fs-12 text-muted">
                <span>Last Sync: <strong>{activeBroker.lastSyncTime}</strong></span>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleSyncBroker}
              >
                <i className="ti ti-refresh me-1" />
                Sync Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SINGLE RESPONSIBILITY DESK DIRECTORY NAVIGATION CARDS          */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fs-12 text-muted text-uppercase fw-bold">
            <i className="ti ti-layout-grid me-1 text-primary" />
            Dedicated Investment Sub-Desks (Single Responsibility Architecture)
          </div>
          <span className="badge bg-light text-muted border fs-11">Individual Dedicated Pages</span>
        </div>
        <div className="row g-2">
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/securities" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-list-check text-primary fs-18" />
                <span className="fw-bold text-dark fs-12">Securities Master</span>
              </div>
              <div className="text-muted fs-11">Stocks &amp; ETFs catalogue, halt controls</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/broker-accounts" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-user-shield text-info fs-18" />
                <span className="fw-bold text-dark fs-12">Broker Accounts</span>
              </div>
              <div className="text-muted fs-11">Custodial accounts, KYC, retry onboarding</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/orders" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-arrows-transfer-up text-warning fs-18" />
                <span className="fw-bold text-dark fs-12">Orders Monitor</span>
              </div>
              <div className="text-muted fs-11">STP orders, retry/cancel, staff orders</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/reconciliation" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-scale text-success fs-18" />
                <span className="fw-bold text-dark fs-12">Reconciliation</span>
              </div>
              <div className="text-muted fs-11">Platform vs broker, dual approver</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/dividends" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-cash text-danger fs-18" />
                <span className="fw-bold text-dark fs-12">Dividends Desk</span>
              </div>
              <div className="text-muted fs-11">Expected yields, wallet credits, splits</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <Link href="/admin/investments/disputes" className="card border-0 shadow-sm text-decoration-none h-100 hover-card p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-headset text-secondary fs-18" />
                <span className="fw-bold text-dark fs-12">Disputes Desk</span>
              </div>
              <div className="text-muted fs-11">Investment claims, refunds &amp; exceptions</div>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOMER PORTFOLIOS ROSTER (SINGLE RESPONSIBILITY TABLE)       */}
      {/* ------------------------------------------------------------- */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h6 className="card-title mb-0 fw-bold">Customer Portfolios Roster: {activeBroker.name}</h6>
              <span className="text-muted fs-12">
                Market: {activeBroker.market} · Base Currency: {activeBroker.currency}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: 260 }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search customer, ID, account..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select form-select-sm"
                style={{ width: 180 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Portfolios</option>
                <option value="ACTIVE">Active Only</option>
                <option value="RESTRICTED">Restricted Only</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Customer Name &amp; ID</th>
                <th>Broker Account Reference</th>
                <th>Portfolio Value</th>
                <th>Cash at Broker</th>
                <th>Buying Power</th>
                <th>Change Today</th>
                <th>Status</th>
                <th>Last Synced</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.map((p) => {
                const currency = p.currency;
                return (
                  <tr
                    key={p.id}
                    className={p.needsAttention ? 'table-warning-subtle' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPortfolio(p)}
                  >
                    <td className="ps-4" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark">
                          {p.revealed ? p.customerName : p.maskedName}
                        </span>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary py-0 px-1 border-0"
                          onClick={() => handleToggleReveal(p.id)}
                          title={p.revealed ? 'Mask Customer PII' : 'Reveal Customer Name'}
                        >
                          <i className={`ti ${p.revealed ? 'ti-eye-off' : 'ti-eye'} fs-12`} />
                        </button>
                      </div>
                      <div className="text-muted font-sans fs-11">{p.customerId} · {p.id}</div>
                      {p.needsAttention && (
                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle fs-10 mt-1">
                          <i className="ti ti-alert-triangle me-1" /> Attention
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="font-sans fw-bold text-dark">{p.brokerAccountRef}</span>
                      <div className="text-muted fs-11">{p.market} Market</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{fmtMoney(p.portfolioValue, currency)}</div>
                      <div className="text-muted fs-11">{p.holdings.length} securities</div>
                    </td>
                    <td className="fw-semibold text-secondary font-sans">{fmtMoney(p.cashAtBroker, currency)}</td>
                    <td className="fw-semibold text-primary font-sans">{fmtMoney(p.buyingPower, currency)}</td>
                    <td>
                      <span className={`fw-bold ${p.changeTodayPct >= 0 ? 'text-success' : 'text-danger'}`}>
                        {p.changeTodayPct >= 0 ? `+${p.changeTodayPct}%` : `${p.changeTodayPct}%`}
                      </span>
                    </td>
                    <td>
                      {p.status === 'ACTIVE' && <span className="badge bg-success text-white">ACTIVE</span>}
                      {p.status === 'RESTRICTED' && <span className="badge bg-danger text-white">RESTRICTED</span>}
                      {p.status === 'CLOSED' && <span className="badge bg-secondary text-white">CLOSED</span>}
                    </td>
                    <td className="text-muted font-sans fs-11">{p.lastSynced}</td>
                    <td className="pe-4 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                        onClick={() => setSelectedPortfolio(p)}
                      >
                        Inspect Drawer
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPortfolios.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    No customer portfolios found for {activeBroker.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PORTFOLIO DETAIL MODAL / DRAWER                               */}
      {/* ------------------------------------------------------------- */}
      {selectedPortfolio && (
        <Modal
          title={`Portfolio Console: ${selectedPortfolio.revealed ? selectedPortfolio.customerName : selectedPortfolio.maskedName} (${selectedPortfolio.id})`}
          open={true}
          width="840px"
          onClose={() => setSelectedPortfolio(null)}
          footer={
            <div className="d-flex align-items-center justify-content-between w-100">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleToggleReveal(selectedPortfolio.id)}
              >
                <i className={`ti ${selectedPortfolio.revealed ? 'ti-eye-off' : 'ti-eye'} me-1`} />
                {selectedPortfolio.revealed ? 'Mask Customer PII' : 'Reveal Customer Name'}
              </button>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedPortfolio(null)}
                >
                  Close Drawer
                </button>
              </div>
            </div>
          }
        >
          <div className="p-2">
            {/* Header metadata */}
            <div className="card bg-light border-0 p-3 mb-3">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="text-muted fs-11 text-uppercase">Account Reference</div>
                  <div className="fw-bold fs-14 text-dark">{selectedPortfolio.brokerAccountRef}</div>
                  <div className="text-muted fs-12">{selectedPortfolio.brokerPartner}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-muted fs-11 text-uppercase">Total Portfolio Value</div>
                  <div className="fw-bold fs-16 text-success">
                    {fmtMoney(selectedPortfolio.portfolioValue, selectedPortfolio.currency)}
                  </div>
                  <div className="text-muted fs-11">Cash: {fmtMoney(selectedPortfolio.cashAtBroker, selectedPortfolio.currency)}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-muted fs-11 text-uppercase">Buying Power</div>
                  <div className="fw-bold fs-16 text-primary">
                    {fmtMoney(selectedPortfolio.buyingPower, selectedPortfolio.currency)}
                  </div>
                  <div className="text-muted fs-11">Status: {selectedPortfolio.status}</div>
                </div>
              </div>
            </div>

            {/* Holdings breakdown table */}
            <h6 className="fw-bold fs-13 mb-2">Custody Holdings Roster</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm align-middle fs-12 mb-0">
                <thead className="table-light text-muted">
                  <tr>
                    <th>Security</th>
                    <th>Shares Qty</th>
                    <th>Average Cost</th>
                    <th>Last Price</th>
                    <th>Value</th>
                    <th>Gain / Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPortfolio.holdings.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <span className="fw-bold text-dark">{h.ticker}</span>
                        <div className="text-muted fs-11">{h.securityName}</div>
                      </td>
                      <td className="font-sans fw-bold">{fmtNum(h.qty)}</td>
                      <td className="font-sans">{fmtMoney(h.averageCost, h.currency)}</td>
                      <td className="font-sans">{fmtMoney(h.lastPrice, h.currency)}</td>
                      <td className="font-sans fw-bold">{fmtMoney(h.value, h.currency)}</td>
                      <td className={`font-sans fw-bold ${h.gainLossPct >= 0 ? 'text-success' : 'text-danger'}`}>
                        {h.gainLossPct >= 0 ? `+${h.gainLossPct}%` : `${h.gainLossPct}%`}
                      </td>
                    </tr>
                  ))}
                  {selectedPortfolio.holdings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-muted">
                        No active holdings in this custodial portfolio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Compliance notes */}
            {selectedPortfolio.notes.length > 0 && (
              <div className="alert alert-secondary fs-12 mb-0">
                <strong>Compliance Notes:</strong>
                <ul className="mb-0 ps-3 mt-1">
                  {selectedPortfolio.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
