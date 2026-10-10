'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { TraderTerminal, SAMPLE_INSTRUMENTS, InstrumentQuote } from '@/components/admin/investments/TraderTerminal';
import { UserPortfoliosAnalytics } from '@/components/admin/investments/UserPortfoliosAnalytics';
import { PrivateEquityManagement } from '@/components/admin/investments/PrivateEquityManagement';
import { StaffPortfolioManagement } from '@/components/admin/investments/StaffPortfolioManagement';
import { OrdersAndCustody, SAMPLE_ORDERS, SAMPLE_DIVIDENDS, SAMPLE_CUSTODY } from '@/components/admin/investments/OrdersAndCustody';

type InvestmentDeskTab = 'terminal' | 'portfolios' | 'private_equity' | 'staff_advisors' | 'orders_custody';

function InvestmentsDeskContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get('tab') as InvestmentDeskTab | null;

  const [activeTab, setActiveTab] = useState<InvestmentDeskTab>(
    queryTab && ['terminal', 'portfolios', 'private_equity', 'staff_advisors', 'orders_custody'].includes(queryTab)
      ? queryTab
      : 'terminal'
  );

  // Market session switches
  const [ngxOpen, setNgxOpen] = useState(false);
  const [usOpen, setUsOpen] = useState(true);

  // Trading Halt Operational Modal
  const [haltModal, setHaltModal] = useState<{
    isOpen: boolean;
    instrument: InstrumentQuote | null;
    isHalting: boolean;
    reason: string;
  }>({
    isOpen: false,
    instrument: null,
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

  const handleOpenHalt = (inst: InstrumentQuote) => {
    const isHalting = inst.tradingStatus === 'ACTIVE';
    setHaltModal({
      isOpen: true,
      instrument: inst,
      isHalting,
      reason: isHalting
        ? 'Corporate Action Pending (Earnings Announcement & Volatility Breaker)'
        : 'Trading resumed following market open confirmation',
    });
  };

  const handleExecuteHalt = () => {
    if (!haltModal.instrument) return;
    toast(
      haltModal.isHalting ? 'warning' : 'success',
      `Trading ${haltModal.isHalting ? 'halted' : 'resumed'} for ${haltModal.instrument.ticker}. Rationale logged: ${haltModal.reason}`
    );
    setHaltModal({ isOpen: false, instrument: null, isHalting: true, reason: '' });
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

  return (
    <div className="container-fluid pb-5">
      {/* Title & Market Overrides Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold fs-20 text-dark m-0">Investments &amp; Capital Suite</h4>
            <span className="badge rounded-pill bg-success-subtle text-success fs-11 font-monospace">
              Multi-Asset Institutional Desk
            </span>
          </div>
          <p className="text-muted fs-12 mb-0 mt-1">
            Execution terminal, client AUM, private equity fund governance, and staff advisory mandates
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Market Status Overrides */}
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border fs-12 text-secondary shadow-sm">
            <span>NGX:</span>
            <span
              className={`badge cursor-pointer ${ngxOpen ? 'bg-success text-white' : 'bg-light text-muted border'}`}
              style={ngxOpen ? { backgroundColor: '#16B364' } : undefined}
              onClick={() => {
                setNgxOpen(!ngxOpen);
                toast('info', `NGX market session switched to ${!ngxOpen ? 'OPEN' : 'CLOSED'}`);
              }}
            >
              {ngxOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <span className="ms-2">US (NYSE/NASDAQ):</span>
            <span
              className={`badge cursor-pointer ${usOpen ? 'bg-success text-white' : 'bg-light text-muted border'}`}
              style={usOpen ? { backgroundColor: '#16B364' } : undefined}
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

      {/* Primary Sub-Desk Navigation Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'terminal' ? 'active text-success' : 'text-muted'}`}
                style={activeTab === 'terminal' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setActiveTab('terminal')}
              >
                <i className="ti ti-chart-line me-1" /> Trader&apos;s Terminal &amp; Stocks
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'portfolios' ? 'active text-success' : 'text-muted'}`}
                style={activeTab === 'portfolios' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setActiveTab('portfolios')}
              >
                <i className="ti ti-chart-pie me-1" /> User Portfolios &amp; AUM
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'private_equity' ? 'active text-success' : 'text-muted'}`}
                style={activeTab === 'private_equity' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setActiveTab('private_equity')}
              >
                <i className="ti ti-briefcase me-1" /> Private Equity Funds ($155M)
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'staff_advisors' ? 'active text-success' : 'text-muted'}`}
                style={activeTab === 'staff_advisors' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setActiveTab('staff_advisors')}
              >
                <i className="ti ti-id-badge-2 me-1" /> Staff Advisor Books &amp; Mandates
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'orders_custody' ? 'active text-success' : 'text-muted'}`}
                style={activeTab === 'orders_custody' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setActiveTab('orders_custody')}
              >
                <i className="ti ti-building-bank me-1" /> Orders &amp; Depository Custody
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'terminal' && (
            <TraderTerminal onOpenHaltModal={handleOpenHalt} />
          )}

          {activeTab === 'portfolios' && (
            <UserPortfoliosAnalytics />
          )}

          {activeTab === 'private_equity' && (
            <PrivateEquityManagement />
          )}

          {activeTab === 'staff_advisors' && (
            <StaffPortfolioManagement />
          )}

          {activeTab === 'orders_custody' && (
            <OrdersAndCustody
              orders={SAMPLE_ORDERS}
              custody={SAMPLE_CUSTODY}
              dividends={SAMPLE_DIVIDENDS}
              onOpenDividendModal={(div) => setDividendModal({ isOpen: true, item: div, isExecuting: false })}
            />
          )}
        </div>
      </div>

      {/* Trading Halt / Volatility Breaker Modal */}
      {haltModal.isOpen && haltModal.instrument && (
        <Modal
          title={`${haltModal.isHalting ? 'Engage Trading Halt' : 'Resume Trading Session'}: ${haltModal.instrument.ticker}`}
          open={true}
          onClose={() => setHaltModal({ isOpen: false, instrument: null, isHalting: true, reason: '' })}
        >
          <div className="mb-2 p-2 rounded bg-light border font-monospace fs-12">
            <div>Symbol: <strong>{haltModal.instrument.ticker}</strong> ({haltModal.instrument.name})</div>
            <div>Market: {haltModal.instrument.market} • Venue: {haltModal.instrument.venue}</div>
            <div>Last Price: {fmtMoney(haltModal.instrument.lastPrice, haltModal.instrument.currency)}</div>
          </div>

          <div className="mb-3">
            <label className="form-label fs-12 fw-semibold text-dark">Administrative / Regulatory Justification</label>
            <textarea
              className="form-control form-control-sm fs-12"
              rows={3}
              value={haltModal.reason}
              onChange={(e) => setHaltModal({ ...haltModal, reason: e.target.value })}
              required
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setHaltModal({ isOpen: false, instrument: null, isHalting: true, reason: '' })}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm ${haltModal.isHalting ? 'btn-danger' : 'btn-success text-white'}`}
              style={!haltModal.isHalting ? { backgroundColor: '#16B364', borderColor: '#16B364' } : undefined}
              onClick={handleExecuteHalt}
            >
              Confirm {haltModal.isHalting ? 'Halt' : 'Resume'}
            </button>
          </div>
        </Modal>
      )}

      {/* Dividend Execution Modal */}
      {dividendModal.isOpen && dividendModal.item && (
        <Modal
          title={`Distribute Corporate Cash Dividend: ${dividendModal.item.ticker}`}
          open={true}
          onClose={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
        >
          <div className="mb-3 p-3 rounded bg-light border fs-12">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Eligible Registered Holders:</span>
              <strong className="text-dark font-monospace">{fmtNum(dividendModal.item.eligibleShares)} shares</strong>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Gross Distribution:</span>
              <strong className="text-dark font-monospace">
                {fmtMoney(dividendModal.item.eligibleShares * dividendModal.item.amountPerShare, dividendModal.item.currency)}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Statutory 10% Withholding Tax (WHT):</span>
              <strong className="text-warning font-monospace">
                {fmtMoney(dividendModal.item.eligibleShares * dividendModal.item.amountPerShare * 0.1, dividendModal.item.currency)}
              </strong>
            </div>
          </div>

          <p className="fs-12 text-secondary mb-3">
            Executing this distribution will credit the funding wallet of all eligible beneficial owners on ex-date {fmtDate(dividendModal.item.exDate)} and post tax remittance entries to the GL.
          </p>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success text-white"
              style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              disabled={dividendModal.isExecuting}
              onClick={handleExecuteDividend}
            >
              {dividendModal.isExecuting ? 'Processing Payouts...' : 'Execute Dividend Credit'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function InvestmentsBackOfficePage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted">Loading Investments Suite...</div>}>
      <InvestmentsDeskContent />
    </Suspense>
  );
}
