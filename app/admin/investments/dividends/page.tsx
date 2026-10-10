'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import {
  INITIAL_PORTFOLIOS,
  INITIAL_CORPORATE_ACTIONS,
  ConsoleDividendAction,
  CorporateActionNotice,
} from '@/lib/investmentConsoleData';

const ALL_DIVIDENDS: ConsoleDividendAction[] = [
  ...INITIAL_PORTFOLIOS.flatMap((p) => p.dividends),
  {
    id: 'DIV-102',
    ticker: 'GTCO',
    recordDate: '2026-09-18',
    paymentDate: '2026-10-02',
    dividendPerShare: 1.0,
    currency: 'NGN',
    status: 'CREDITED_TO_CUSTOMERS',
    totalExpectedAmount: 112800,
    totalCreditedAmount: 112800,
    failedCustomersCount: 0,
    walletBatchRef: 'WLT-DIV-890',
  },
  {
    id: 'DIV-103',
    ticker: 'AAPL',
    recordDate: '2026-08-12',
    paymentDate: '2026-08-25',
    dividendPerShare: 0.25,
    currency: 'USD',
    status: 'MATCH_FAILED',
    totalExpectedAmount: 21.37,
    totalCreditedAmount: 0,
    failedCustomersCount: 1,
    walletBatchRef: 'WLT-ERR-991',
  },
];

export default function DividendProcessingPage() {
  const { toast } = useToast();
  const [dividends, setDividends] = useState<ConsoleDividendAction[]>(ALL_DIVIDENDS);
  const [corpActions, setCorpActions] = useState<CorporateActionNotice[]>(INITIAL_CORPORATE_ACTIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConsoleDividendAction['status']>('ALL');

  // Manual Credit Resolution Modal
  const [resolveModal, setResolveModal] = useState<{
    isOpen: boolean;
    dividend: ConsoleDividendAction | null;
    notes: string;
  }>({
    isOpen: false,
    dividend: null,
    notes: 'Re-validated customer custody wallet ledger; resolved routing discrepancy.',
  });

  const filteredDividends = useMemo(() => {
    return dividends.filter((d) => {
      const matchSearch =
        d.ticker.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        (d.walletBatchRef && d.walletBatchRef.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [dividends, search, statusFilter]);

  const handleOpenResolve = (div: ConsoleDividendAction) => {
    setResolveModal({
      isOpen: true,
      dividend: div,
      notes: 'Manually verified shareholder registry record and credited customer USD wallet.',
    });
  };

  const handleExecuteResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModal.dividend) return;
    const targetId = resolveModal.dividend.id;

    setDividends((prev) =>
      prev.map((d) => {
        if (d.id === targetId) {
          return {
            ...d,
            status: 'CREDITED_TO_CUSTOMERS',
            totalCreditedAmount: d.totalExpectedAmount,
            failedCustomersCount: 0,
            walletBatchRef: `WLT-RESOLVED-${Math.floor(100 + Math.random() * 900)}`,
          };
        }
        return d;
      })
    );

    toast(
      'success',
      `Dividend distribution ${resolveModal.dividend.id} successfully credited to customer wallet.`
    );
    setResolveModal({ isOpen: false, dividend: null, notes: '' });
  };

  return (
    <div>
      <PageHeader
        title="Dividend Processing &amp; Corporate Actions Desk"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Custody Income &amp; Capital Adjustments</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => toast('info', 'Dividend entitlement schedules synced with CSCS and DriveWealth clearing.')}
            >
              <i className="ti ti-refresh me-1" /> Sync Entitlements
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Total Expected Yield</div>
            <div className="fs-22 fw-bold text-dark">
              ₦{fmtNum(dividends.filter((d) => d.currency === 'NGN').reduce((acc, d) => acc + d.totalExpectedAmount, 0))}
            </div>
            <div className="fs-12 text-muted mt-1">
              + ${fmtNum(dividends.filter((d) => d.currency === 'USD').reduce((acc, d) => acc + d.totalExpectedAmount, 0))} USD
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Credited to Wallets</div>
            <div className="fs-22 fw-bold text-success">
              {dividends.filter((d) => d.status === 'CREDITED_TO_CUSTOMERS').length} batches
            </div>
            <div className="fs-12 text-muted mt-1">Successfully settled &amp; disbursed</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Match Failures (Attention)</div>
            <div className="fs-22 fw-bold text-danger">
              {dividends.filter((d) => d.status === 'MATCH_FAILED').length}
            </div>
            <div className="fs-12 text-danger mt-1">Requires manual reconciliation</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Corporate Action Notices</div>
            <div className="fs-22 fw-bold text-primary">{corpActions.length}</div>
            <div className="fs-12 text-muted mt-1">
              {corpActions.filter((c) => c.requiresManualHandling).length} pending manual queue
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search ticker, batch ref, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-4">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Dividend Statuses</option>
                <option value="CREDITED_TO_CUSTOMERS">Credited to Wallets</option>
                <option value="RECEIVED_FROM_BROKER">Received from Broker</option>
                <option value="EXPECTED">Expected</option>
                <option value="MATCH_FAILED">Match Failed (Action Required)</option>
              </select>
            </div>
            <div className="col-6 col-md-3 text-end">
              <span className="badge bg-light text-muted border px-3 py-2">
                {filteredDividends.length} dividend distributions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Dividends Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-0">
          <h6 className="card-title mb-0 fw-bold">Customer Dividend Credits Roster</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Distribution ID &amp; Ticker</th>
                <th>Record Date</th>
                <th>Payment Date</th>
                <th>Rate / Share</th>
                <th>Expected Total</th>
                <th>Credited Total</th>
                <th>Status</th>
                <th>Wallet Batch Reference</th>
                <th className="pe-4 text-end">Staff Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDividends.map((d) => (
                <tr key={d.id} className={d.status === 'MATCH_FAILED' ? 'table-danger-subtle' : ''}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{d.ticker}</div>
                    <div className="text-muted font-sans fs-11">{d.id}</div>
                  </td>
                  <td>{fmtDate(d.recordDate)}</td>
                  <td>{fmtDate(d.paymentDate)}</td>
                  <td className="fw-semibold font-sans">{fmtMoney(d.dividendPerShare, d.currency)}</td>
                  <td className="font-sans">{fmtMoney(d.totalExpectedAmount, d.currency)}</td>
                  <td className="font-sans fw-bold text-success">{fmtMoney(d.totalCreditedAmount, d.currency)}</td>
                  <td>
                    {d.status === 'CREDITED_TO_CUSTOMERS' && (
                      <span className="badge bg-success text-white">CREDITED</span>
                    )}
                    {d.status === 'MATCH_FAILED' && (
                      <span className="badge bg-danger text-white">MATCH FAILED</span>
                    )}
                    {d.status === 'EXPECTED' && (
                      <span className="badge bg-secondary text-white">EXPECTED</span>
                    )}
                  </td>
                  <td>
                    {d.walletBatchRef ? (
                      <span className="font-sans text-secondary">{d.walletBatchRef}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="pe-4 text-end">
                    {d.status === 'MATCH_FAILED' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary py-1 px-3 fs-12"
                        onClick={() => handleOpenResolve(d)}
                      >
                        <i className="ti ti-check me-1" /> Resolve Match
                      </button>
                    ) : (
                      <span className="text-muted fs-11">
                        <i className="ti ti-check text-success me-1" /> Disbursed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDividends.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    No dividends match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Actions Section */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0 fw-bold">Active Corporate Actions Queue</h6>
          <span className="badge bg-light text-muted border">Capital Adjustments</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Notice ID &amp; Ticker</th>
                <th>Type</th>
                <th>Details &amp; Rationale</th>
                <th>Effective Date</th>
                <th>Affected Accounts</th>
                <th>Status</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {corpActions.map((ca) => (
                <tr key={ca.id}>
                  <td className="ps-4">
                    <span className="fw-bold text-dark me-2">{ca.ticker}</span>
                    <span className="badge bg-light text-secondary border font-sans">{ca.id}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary border font-sans">
                      {ca.type}
                    </span>
                  </td>
                  <td className="text-muted" style={{ maxWidth: 350 }}>
                    {ca.details}
                  </td>
                  <td>{fmtDate(ca.effectiveDate)}</td>
                  <td className="fw-bold">{ca.affectedCustomersCount} accounts</td>
                  <td>
                    {ca.requiresManualHandling ? (
                      <span className="badge bg-warning text-dark">MANUAL QUEUE</span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        AUTOMATED
                      </span>
                    )}
                  </td>
                  <td className="pe-4 text-end">
                    {ca.requiresManualHandling ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning text-dark py-1 px-3 fs-12"
                        onClick={() => toast('info', `Reviewing corporate action file for ${ca.ticker}`)}
                      >
                        Review Conversion
                      </button>
                    ) : (
                      <span className="text-muted fs-11">Auto-applied</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Dividend Modal */}
      {resolveModal.isOpen && resolveModal.dividend && (
        <Modal
          title={`Resolve Dividend Discrepancy: ${resolveModal.dividend.ticker}`}
          open={true}
          onClose={() => setResolveModal({ isOpen: false, dividend: null, notes: '' })}
        >
          <form onSubmit={handleExecuteResolve} className="p-2">
            <div className="alert alert-info fs-12 mb-3">
              Crediting this batch will disburse {fmtMoney(resolveModal.dividend.totalExpectedAmount, resolveModal.dividend.currency)} to the customer's custodial cash balance.
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Audit Rationale *</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={resolveModal.notes}
                onChange={(e) => setResolveModal({ ...resolveModal, notes: e.target.value })}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setResolveModal({ isOpen: false, dividend: null, notes: '' })}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Confirm &amp; Disburse Credit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
