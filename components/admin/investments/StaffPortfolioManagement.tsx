'use client';

import React, { useState } from 'react';
import { fmtMoney, fmtNum } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';

export interface AdvisorBook {
  advisorId: string;
  name: string;
  role: string;
  totalAUMUSD: number;
  assignedAccountsCount: number;
  mandatesDiscretionaryUSD: number;
  mandatesAdvisoryUSD: number;
  ytdReturnPercent: number;
  benchmarkAlphaPercent: number;
  activeDriftFlagsCount: number;
}

export interface ClientMandateAccount {
  accountId: string;
  clientName: string;
  advisorId: string;
  advisorName: string;
  portfolioValueUSD: number;
  mandateType: 'Discretionary' | 'Advisory' | 'Execution-Only';
  targetAllocation: string;
  currentAllocation: string;
  driftPercent: number;
  uninvestedCashUSD: number;
  cashDragPercent: number;
  suitabilityStatus: 'COMPLIANT' | 'DRIFT_WARNING' | 'ANNUAL_REVIEW_DUE';
}

const SAMPLE_ADVISORS: AdvisorBook[] = [
  {
    advisorId: 'STF-01',
    name: 'Aliko Adeleke',
    role: 'Managing Director & Principal Wealth Partner',
    totalAUMUSD: 5200000,
    assignedAccountsCount: 24,
    mandatesDiscretionaryUSD: 4100000,
    mandatesAdvisoryUSD: 1100000,
    ytdReturnPercent: 21.4,
    benchmarkAlphaPercent: 4.8,
    activeDriftFlagsCount: 1,
  },
  {
    advisorId: 'STF-02',
    name: 'Fatima Kyari',
    role: 'Senior Private Wealth Director',
    totalAUMUSD: 3800000,
    assignedAccountsCount: 42,
    mandatesDiscretionaryUSD: 2400000,
    mandatesAdvisoryUSD: 1400000,
    ytdReturnPercent: 18.7,
    benchmarkAlphaPercent: 2.1,
    activeDriftFlagsCount: 0,
  },
  {
    advisorId: 'STF-04',
    name: 'Emeka Eze',
    role: 'Treasury & Fixed Income Strategist',
    totalAUMUSD: 4100000,
    assignedAccountsCount: 35,
    mandatesDiscretionaryUSD: 1800000,
    mandatesAdvisoryUSD: 2300000,
    ytdReturnPercent: 15.2,
    benchmarkAlphaPercent: 1.4,
    activeDriftFlagsCount: 2,
  },
  {
    advisorId: 'STF-03',
    name: 'Babajide Sanwo',
    role: 'Equities & Venture Syndicate Specialist',
    totalAUMUSD: 1720400,
    assignedAccountsCount: 28,
    mandatesDiscretionaryUSD: 950000,
    mandatesAdvisoryUSD: 770400,
    ytdReturnPercent: 24.1,
    benchmarkAlphaPercent: 7.5,
    activeDriftFlagsCount: 1,
  },
];

const SAMPLE_ACCOUNTS: ClientMandateAccount[] = [
  {
    accountId: 'ACC-MAND-881',
    clientName: 'Meridian Capital Partners Ltd',
    advisorId: 'STF-01',
    advisorName: 'Aliko Adeleke',
    portfolioValueUSD: 1450000,
    mandateType: 'Discretionary',
    targetAllocation: '60% Equities / 40% T-Bills',
    currentAllocation: '72% Equities / 28% T-Bills',
    driftPercent: 12.0,
    uninvestedCashUSD: 48000,
    cashDragPercent: 3.3,
    suitabilityStatus: 'DRIFT_WARNING',
  },
  {
    accountId: 'ACC-MAND-904',
    clientName: 'Oluwaseun Adenuga Family Office',
    advisorId: 'STF-01',
    advisorName: 'Aliko Adeleke',
    portfolioValueUSD: 2100000,
    mandateType: 'Discretionary',
    targetAllocation: '50% Equities / 30% Bonds / 20% PE',
    currentAllocation: '51% Equities / 30% Bonds / 19% PE',
    driftPercent: 1.0,
    uninvestedCashUSD: 12000,
    cashDragPercent: 0.5,
    suitabilityStatus: 'COMPLIANT',
  },
  {
    accountId: 'ACC-MAND-612',
    clientName: 'Kofi Mensah Holding Corp',
    advisorId: 'STF-02',
    advisorName: 'Fatima Kyari',
    portfolioValueUSD: 850000,
    mandateType: 'Advisory',
    targetAllocation: '40% Equities / 60% Sovereign Debt',
    currentAllocation: '40% Equities / 60% Sovereign Debt',
    driftPercent: 0.0,
    uninvestedCashUSD: 5200,
    cashDragPercent: 0.6,
    suitabilityStatus: 'COMPLIANT',
  },
  {
    accountId: 'ACC-MAND-720',
    clientName: 'Dr. Amina Bello Private Trust',
    advisorId: 'STF-04',
    advisorName: 'Emeka Eze',
    portfolioValueUSD: 1250000,
    mandateType: 'Discretionary',
    targetAllocation: '30% Equities / 70% Fixed Income',
    currentAllocation: '22% Equities / 78% Fixed Income',
    driftPercent: 8.0,
    uninvestedCashUSD: 110000,
    cashDragPercent: 8.8,
    suitabilityStatus: 'DRIFT_WARNING',
  },
  {
    accountId: 'ACC-MAND-531',
    clientName: 'Tariq Al-Mansoor Corporate Fund',
    advisorId: 'STF-03',
    advisorName: 'Babajide Sanwo',
    portfolioValueUSD: 680000,
    mandateType: 'Discretionary',
    targetAllocation: '80% US Tech / 20% Liquidity',
    currentAllocation: '85% US Tech / 15% Liquidity',
    driftPercent: 5.0,
    uninvestedCashUSD: 14000,
    cashDragPercent: 2.0,
    suitabilityStatus: 'COMPLIANT',
  },
];

export function StaffPortfolioManagement() {
  const { toast } = useToast();
  const [advisors, setAdvisors] = useState<AdvisorBook[]>(SAMPLE_ADVISORS);
  const [accounts, setAccounts] = useState<ClientMandateAccount[]>(SAMPLE_ACCOUNTS);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('ALL');

  // Rebalance Block Modal
  const [rebalanceModal, setRebalanceModal] = useState<{
    isOpen: boolean;
    account: ClientMandateAccount | null;
  }>({
    isOpen: false,
    account: null,
  });
  const [rebalanceNotes, setRebalanceNotes] = useState('Rebalancing equity overweight back to target mandate (selling 12% MTNN / buying FGN 2029 T-Bills).');

  const filteredAccounts = selectedAdvisorId === 'ALL'
    ? accounts
    : accounts.filter((a) => a.advisorId === selectedAdvisorId);

  const totalAssignedAUM = advisors.reduce((acc, a) => acc + a.totalAUMUSD, 0);
  const totalClientAccounts = advisors.reduce((acc, a) => acc + a.assignedAccountsCount, 0);
  const totalDriftAlerts = accounts.filter((a) => a.suitabilityStatus === 'DRIFT_WARNING').length;

  const handleExecuteRebalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebalanceModal.account) return;
    toast('success', `Mandate rebalancing block order executed for ${rebalanceModal.account.clientName}. Target allocations restored.`);
    setAccounts((prev) =>
      prev.map((a) =>
        a.accountId === rebalanceModal.account?.accountId
          ? { ...a, driftPercent: 0.5, suitabilityStatus: 'COMPLIANT' }
          : a
      )
    );
    setRebalanceModal({ isOpen: false, account: null });
  };

  return (
    <div className="d-flex flex-column gap-3 font-sans">
      {/* Top Level Advisor Desks Scorecards */}
      <div className="row g-3 font-monospace">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">ADVISOR-MANAGED AUM</span>
            <h3 className="fw-bold fs-22 text-dark m-0 mt-1">${fmtNum(totalAssignedAUM)}</h3>
            <div className="mt-2 fs-11 text-muted">
              <span>{totalClientAccounts} High-net-worth client books</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">DISCRETIONARY MANDATES</span>
            <h3 className="fw-bold fs-22 text-success m-0 mt-1">$9.25M</h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Full staff fiduciary management</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">AVERAGE ADVISOR ALPHA</span>
            <h3 className="fw-bold fs-22 text-success m-0 mt-1">+3.85%</h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Excess return over NGX ASI / S&amp;P 500</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">MANDATE DRIFT ALERTS</span>
            <h3 className={`fw-bold fs-22 m-0 mt-1 ${totalDriftAlerts > 0 ? 'text-warning' : 'text-success'}`}>
              {totalDriftAlerts} Portfolios
            </h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Require portfolio rebalancing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisor Roster Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-14">
              <i className="ti ti-id-badge-2 text-success me-1" /> Staff Wealth Advisors &amp; Portfolio Desks
            </h6>
            <span className="text-muted fs-12">Assigned client books, discretionary authority, and YTD performance</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm fs-12"
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
            >
              <option value="ALL">All Staff Desks ({advisors.length})</option>
              {advisors.map((adv) => (
                <option key={adv.advisorId} value={adv.advisorId}>
                  {adv.name} ({adv.advisorId})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Advisor</th>
                  <th>Assigned AUM</th>
                  <th>Client Books</th>
                  <th>Discretionary</th>
                  <th>Advisory</th>
                  <th>YTD Return</th>
                  <th>Benchmark Alpha</th>
                  <th className="pe-4 text-end">Drift Flags</th>
                </tr>
              </thead>
              <tbody>
                {advisors.map((adv) => (
                  <tr key={adv.advisorId}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark font-sans">{adv.name}</div>
                      <span className="text-muted fs-11 font-sans">{adv.role}</span>
                    </td>
                    <td className="fw-bold text-dark">${fmtNum(adv.totalAUMUSD)}</td>
                    <td>{adv.assignedAccountsCount} Accounts</td>
                    <td>${fmtNum(adv.mandatesDiscretionaryUSD)}</td>
                    <td className="text-muted">${fmtNum(adv.mandatesAdvisoryUSD)}</td>
                    <td className="text-success fw-bold">+{adv.ytdReturnPercent}%</td>
                    <td className="text-success fw-semibold">+{adv.benchmarkAlphaPercent}%</td>
                    <td className="pe-4 text-end">
                      {adv.activeDriftFlagsCount > 0 ? (
                        <span className="badge bg-warning-subtle text-warning border fs-11 font-sans">
                          {adv.activeDriftFlagsCount} Drift Alert
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success fs-11 font-sans">
                          100% On-Target
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client Accounts & Mandate Drift Governance Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-14">
              <i className="ti ti-scale text-primary me-1" /> Assigned Client Portfolios &amp; Mandate Compliance
            </h6>
            <span className="text-muted fs-12">Suitability tracking, asset allocation drift, and uninvested cash buffer</span>
          </div>
          <span className="badge rounded-pill bg-light text-secondary border font-monospace">
            {filteredAccounts.length} Mandate Accounts
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Client Mandate</th>
                  <th>Assigned Advisor</th>
                  <th>Portfolio Value</th>
                  <th>Type</th>
                  <th>Target vs Current Allocation</th>
                  <th>Drift %</th>
                  <th>Cash Drag</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => {
                  const hasDrift = acc.driftPercent >= 5.0;
                  return (
                    <tr key={acc.accountId}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark font-sans">{acc.clientName}</div>
                        <span className="text-muted fs-11">{acc.accountId}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fs-11 font-sans">
                          {acc.advisorName}
                        </span>
                      </td>
                      <td className="fw-bold text-dark">${fmtNum(acc.portfolioValueUSD)}</td>
                      <td>
                        <span className="badge rounded-pill bg-secondary-subtle text-secondary fs-10 font-sans">
                          {acc.mandateType}
                        </span>
                      </td>
                      <td>
                        <div className="text-muted fs-11 font-sans">Target: {acc.targetAllocation}</div>
                        <div className="fw-semibold text-dark fs-11 font-sans">Actual: {acc.currentAllocation}</div>
                      </td>
                      <td>
                        <span className={`badge ${hasDrift ? 'bg-warning-subtle text-warning border' : 'bg-light text-muted border'} fs-11`}>
                          {acc.driftPercent}%
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">${fmtNum(acc.uninvestedCashUSD)}</span>
                        <small className="text-muted d-block font-sans">({acc.cashDragPercent}%)</small>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-0 px-2 fs-11 font-sans"
                          style={{ borderColor: '#16B364', color: '#16B364' }}
                          onClick={() => setRebalanceModal({ isOpen: true, account: acc })}
                        >
                          Rebalance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Discretionary Rebalance Modal */}
      {rebalanceModal.isOpen && rebalanceModal.account && (
        <Modal
          title={`Execute Mandate Rebalance: ${rebalanceModal.account.clientName}`}
          open={true}
          onClose={() => setRebalanceModal({ isOpen: false, account: null })}
        >
          <form onSubmit={handleExecuteRebalance}>
            <div className="mb-2 p-2 rounded bg-light border font-monospace fs-12">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Client Account:</span>
                <span className="fw-bold text-dark">{rebalanceModal.account.accountId}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Target Mandate:</span>
                <span className="text-dark font-sans">{rebalanceModal.account.targetAllocation}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Current Drift:</span>
                <span className="text-warning fw-bold">{rebalanceModal.account.driftPercent}%</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Advisor Block Trade Rationale</label>
              <textarea
                className="form-control form-control-sm fs-12"
                rows={3}
                value={rebalanceNotes}
                onChange={(e) => setRebalanceNotes(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setRebalanceModal({ isOpen: false, account: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success text-white"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Dispatch Block Rebalance
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
