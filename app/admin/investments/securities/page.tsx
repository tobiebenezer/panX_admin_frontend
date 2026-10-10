'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, DataTable, Modal, StatusPill } from '@/components/ui';
import { fmtMoney, fmtNum } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { INITIAL_SECURITIES, SecurityCatalogItem } from '@/lib/investmentConsoleData';

export default function SecuritiesCataloguePage() {
  const { toast } = useToast();
  const [securities, setSecurities] = useState<SecurityCatalogItem[]>(INITIAL_SECURITIES);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'NGX' | 'US'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EQUITY' | 'ETF' | 'BOND'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');

  // Add Instrument Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newMarket, setNewMarket] = useState<'NGX' | 'US'>('NGX');
  const [newCurrency, setNewCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [newType, setNewType] = useState<'EQUITY' | 'ETF' | 'BOND'>('EQUITY');
  const [newPrice, setNewPrice] = useState('');

  const filteredSecurities = useMemo(() => {
    return securities.filter((s) => {
      const matchSearch =
        s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase());
      const matchMarket = marketFilter === 'ALL' || s.market === marketFilter;
      const matchType = typeFilter === 'ALL' || s.assetType === typeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ENABLED' ? s.enabled : !s.enabled);
      return matchSearch && matchMarket && matchType && matchStatus;
    });
  }, [securities, search, marketFilter, typeFilter, statusFilter]);

  const handleToggleStatus = (ticker: string) => {
    setSecurities((prev) =>
      prev.map((s) => {
        if (s.ticker === ticker) {
          const nextState = !s.enabled;
          toast(
            nextState ? 'success' : 'warning',
            `${s.ticker} trading availability ${nextState ? 'ENABLED' : 'DISABLED'} for all clients.`
          );
          return { ...s, enabled: nextState };
        }
        return s;
      })
    );
  };

  const handleToggleDelay = (ticker: string) => {
    setSecurities((prev) =>
      prev.map((s) => {
        if (s.ticker === ticker) {
          const nextDelay = !s.delayedPrice;
          toast('info', `${s.ticker} pricing feed set to ${nextDelay ? '15-min Delayed' : 'Real-Time STP'}`);
          return { ...s, delayedPrice: nextDelay };
        }
        return s;
      })
    );
  };

  const handleAddInstrument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim() || !newName.trim()) {
      toast('error', 'Ticker symbol and security name are required.');
      return;
    }
    const item: SecurityCatalogItem = {
      ticker: newTicker.trim().toUpperCase(),
      name: newName.trim(),
      market: newMarket,
      currency: newCurrency,
      assetType: newType,
      enabled: true,
      delayedPrice: false,
      lastPrice: parseFloat(newPrice) || 100.0,
      lastConfirmedByBroker: 'Just now',
    };
    setSecurities([item, ...securities]);
    toast('success', `Instrument ${item.ticker} successfully onboarded to securities catalogue.`);
    setAddModalOpen(false);
    setNewTicker('');
    setNewName('');
    setNewPrice('');
  };

  return (
    <div>
      <PageHeader
        title="Securities Catalogue"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Instrument Master Desk</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddModalOpen(true)}
            >
              <i className="ti ti-plus me-1" /> Add Security
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Total Instruments</div>
            <div className="fs-22 fw-bold text-dark">{securities.length}</div>
            <div className="fs-12 text-muted mt-1">
              {securities.filter((s) => s.market === 'NGX').length} NGX · {securities.filter((s) => s.market === 'US').length} US Equities
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Active for Trading</div>
            <div className="fs-22 fw-bold text-success">{securities.filter((s) => s.enabled).length}</div>
            <div className="fs-12 text-muted mt-1">Live STP routing enabled</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Halted / Disabled</div>
            <div className="fs-22 fw-bold text-danger">{securities.filter((s) => !s.enabled).length}</div>
            <div className="fs-12 text-muted mt-1">Trading disabled by desk</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Pricing Feed Status</div>
            <div className="fs-22 fw-bold text-info">{securities.filter((s) => !s.delayedPrice).length} Real-Time</div>
            <div className="fs-12 text-muted mt-1">{securities.filter((s) => s.delayedPrice).length} delayed 15m</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search ticker, name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value as any)}
              >
                <option value="ALL">All Markets</option>
                <option value="NGX">NGX (Nigeria)</option>
                <option value="US">US (NYSE / NASDAQ)</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All Asset Types</option>
                <option value="EQUITY">Equities</option>
                <option value="ETF">ETFs</option>
                <option value="BOND">Bonds / Fixed Income</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ENABLED">Enabled Only</option>
                <option value="DISABLED">Halted / Disabled</option>
              </select>
            </div>
            <div className="col-6 col-md-2 text-end">
              <span className="badge bg-light text-muted border px-3 py-2">
                Showing {filteredSecurities.length} instruments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Securities Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Ticker &amp; Instrument</th>
                <th>Market</th>
                <th>Asset Type</th>
                <th>Currency</th>
                <th>Last Price</th>
                <th>Price Feed</th>
                <th>Broker Confirmed</th>
                <th>Trading Status</th>
                <th className="pe-4 text-end">Staff Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSecurities.map((sec) => (
                <tr key={sec.ticker}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{sec.ticker}</div>
                    <div className="text-muted fs-11">{sec.name}</div>
                  </td>
                  <td>
                    <span className={`badge ${sec.market === 'NGX' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                      {sec.market}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-light text-secondary border font-sans">{sec.assetType}</span>
                  </td>
                  <td className="fw-semibold text-secondary">{sec.currency}</td>
                  <td className="fw-bold text-dark">{fmtMoney(sec.lastPrice, sec.currency)}</td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-xs ${sec.delayedPrice ? 'btn-outline-warning' : 'btn-outline-success'} py-0 px-2 fs-11`}
                      onClick={() => handleToggleDelay(sec.ticker)}
                      title="Click to toggle Real-time vs Delayed Feed"
                    >
                      {sec.delayedPrice ? '15m Delayed' : 'Real-Time'}
                    </button>
                  </td>
                  <td className="text-muted font-sans fs-11">{sec.lastConfirmedByBroker}</td>
                  <td>
                    <span className={`badge ${sec.enabled ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                      {sec.enabled ? 'ACTIVE' : 'HALTED'}
                    </span>
                  </td>
                  <td className="pe-4 text-end">
                    <button
                      type="button"
                      className={`btn btn-sm ${sec.enabled ? 'btn-outline-danger' : 'btn-outline-success'} px-3 py-1 fs-12`}
                      onClick={() => handleToggleStatus(sec.ticker)}
                    >
                      <i className={`ti ${sec.enabled ? 'ti-player-pause' : 'ti-player-play'} me-1`} />
                      {sec.enabled ? 'Halt Trading' : 'Enable Trading'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSecurities.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <i className="ti ti-search-off fs-32 d-block mb-2 text-secondary" />
                    No securities match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Instrument Modal */}
      {addModalOpen && (
        <Modal
          title="Onboard New Security to Catalogue"
          open={true}
          onClose={() => setAddModalOpen(false)}
        >
          <form onSubmit={handleAddInstrument} className="p-2">
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Ticker Symbol *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. MSFT, ZENITHBANK"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Company / Instrument Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Microsoft Corporation"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Market</label>
                <select
                  className="form-select form-select-sm"
                  value={newMarket}
                  onChange={(e) => {
                    const m = e.target.value as 'NGX' | 'US';
                    setNewMarket(m);
                    setNewCurrency(m === 'NGX' ? 'NGN' : 'USD');
                  }}
                >
                  <option value="NGX">NGX (Nigeria)</option>
                  <option value="US">US (NYSE / NASDAQ)</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Asset Type</label>
                <select
                  className="form-select form-select-sm"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                >
                  <option value="EQUITY">Equity Stock</option>
                  <option value="ETF">ETF (Exchange Traded Fund)</option>
                  <option value="BOND">Fixed Income / Bond</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Initial Reference Price ({newCurrency})</label>
              <input
                type="number"
                step="0.01"
                className="form-control form-control-sm"
                placeholder="100.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
            <div className="alert alert-info fs-12 d-flex align-items-center gap-2 mb-4">
              <i className="ti ti-info-circle fs-16" />
              <span>
                Onboarding this instrument will sync with broker clearing feeds ({newMarket === 'NGX' ? 'Chapel Hill Denham' : 'DriveWealth LLC'}).
              </span>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Add Instrument
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
