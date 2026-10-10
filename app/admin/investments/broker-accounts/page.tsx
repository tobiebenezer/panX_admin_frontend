'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { INITIAL_BROKER_ACCOUNTS, BrokerCustomerAccount, BrokerPartnerId } from '@/lib/investmentConsoleData';

export default function BrokerAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BrokerCustomerAccount[]>(INITIAL_BROKER_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [brokerFilter, setBrokerFilter] = useState<'ALL' | BrokerPartnerId>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BrokerCustomerAccount['status']>('ALL');

  // Retry Modal
  const [retryModal, setRetryModal] = useState<{
    isOpen: boolean;
    account: BrokerCustomerAccount | null;
    notes: string;
  }>({
    isOpen: false,
    account: null,
    notes: 'Updated document OCR scan with high contrast',
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.customerName.toLowerCase().includes(search.toLowerCase()) ||
        acc.customerId.toLowerCase().includes(search.toLowerCase()) ||
        acc.brokerAccountRef.toLowerCase().includes(search.toLowerCase());
      const matchBroker = brokerFilter === 'ALL' || acc.brokerPartner === brokerFilter;
      const matchStatus = statusFilter === 'ALL' || acc.status === statusFilter;
      return matchSearch && matchBroker && matchStatus;
    });
  }, [accounts, search, brokerFilter, statusFilter]);

  const handleOpenRetry = (acc: BrokerCustomerAccount) => {
    setRetryModal({
      isOpen: true,
      account: acc,
      notes: 'Updated client KYC passport package and cleared OCR error',
    });
  };

  const handleExecuteRetry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retryModal.account) return;
    const targetId = retryModal.account.id;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === targetId) {
          return {
            ...acc,
            status: 'ACTIVE',
            identityVerified: true,
            brokerAccountRef: `DW-USA-${Math.floor(10000 + Math.random() * 90000)}`,
            failureReason: undefined,
          };
        }
        return acc;
      })
    );

    toast('success', `Broker account opening retried and validated successfully with ${retryModal.account.brokerPartner}.`);
    setRetryModal({ isOpen: false, account: null, notes: '' });
  };

  return (
    <div>
      <PageHeader
        title="Broker Partner Customer Accounts"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Depository Custody Roster</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
            <Link href="/admin/investments/orders" className="btn btn-outline-primary btn-sm">
              <i className="ti ti-arrows-transfer-up me-1" /> Orders Monitor
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Total Broker Accounts</div>
            <div className="fs-22 fw-bold text-dark">{accounts.length}</div>
            <div className="fs-12 text-muted mt-1">Across 2 custodial brokers</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Active Accounts</div>
            <div className="fs-22 fw-bold text-success">{accounts.filter((a) => a.status === 'ACTIVE').length}</div>
            <div className="fs-12 text-muted mt-1">Clearing trades normally</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Failed Opening / Attention</div>
            <div className="fs-22 fw-bold text-danger">{accounts.filter((a) => a.status === 'FAILED_OPENING').length}</div>
            <div className="fs-12 text-muted mt-1">Awaiting retry or documentation</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Risk Disclosures Signed</div>
            <div className="fs-22 fw-bold text-primary">{accounts.filter((a) => a.riskDisclosureSigned).length} / {accounts.length}</div>
            <div className="fs-12 text-muted mt-1">100% regulatory coverage</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
                  placeholder="Search customer, ID, broker ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={brokerFilter}
                onChange={(e) => setBrokerFilter(e.target.value as any)}
              >
                <option value="ALL">All Broker Partners</option>
                <option value="NGX_CHAPEL_HILL">Chapel Hill Denham (NGX)</option>
                <option value="DRIVEWEALTH_US">DriveWealth LLC (US)</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="FAILED_OPENING">Failed Opening</option>
                <option value="PENDING_DOCUMENTATION">Pending Docs</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-end">
              <span className="badge bg-light text-muted border px-3 py-2">
                {filteredAccounts.length} accounts found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Broker Accounts Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Customer &amp; ID</th>
                <th>Broker Partner</th>
                <th>Broker Account Reference</th>
                <th>Opened Date</th>
                <th>ID Verification</th>
                <th>Risk Disclosure</th>
                <th>Status</th>
                <th className="pe-4 text-end">Staff Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.id}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{acc.customerName}</div>
                    <div className="text-muted font-sans fs-11">{acc.customerId}</div>
                  </td>
                  <td>
                    <span className={`badge ${acc.brokerPartner === 'NGX_CHAPEL_HILL' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                      {acc.brokerPartner === 'NGX_CHAPEL_HILL' ? 'Chapel Hill (NGX)' : 'DriveWealth (US)'}
                    </span>
                  </td>
                  <td>
                    <span className="font-sans fw-bold text-dark">{acc.brokerAccountRef}</span>
                  </td>
                  <td className="text-muted">{fmtDate(acc.openedDate)}</td>
                  <td>
                    {acc.identityVerified ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="ti ti-check me-1" /> Verified
                      </span>
                    ) : (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                        <i className="ti ti-x me-1" /> Incomplete
                      </span>
                    )}
                  </td>
                  <td>
                    {acc.riskDisclosureSigned ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="ti ti-file-certificate me-1" /> Signed
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {acc.status === 'ACTIVE' && <span className="badge bg-success text-white">ACTIVE</span>}
                    {acc.status === 'SUSPENDED' && <span className="badge bg-warning text-dark">SUSPENDED</span>}
                    {acc.status === 'FAILED_OPENING' && (
                      <div>
                        <span className="badge bg-danger text-white">FAILED OPENING</span>
                        {acc.failureReason && (
                          <div className="text-danger fs-11 mt-1">{acc.failureReason}</div>
                        )}
                      </div>
                    )}
                    {acc.status === 'PENDING_DOCUMENTATION' && (
                      <span className="badge bg-secondary text-white">PENDING DOCS</span>
                    )}
                  </td>
                  <td className="pe-4 text-end">
                    {acc.status === 'FAILED_OPENING' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-3 fs-12"
                        onClick={() => handleOpenRetry(acc)}
                      >
                        <i className="ti ti-refresh me-1" /> Retry Opening
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-3 fs-12"
                        onClick={() => toast('info', `Account ${acc.brokerAccountRef} profile re-synced with broker custodian.`)}
                      >
                        <i className="ti ti-refresh me-1" /> Re-sync
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No broker accounts found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retry Account Modal */}
      {retryModal.isOpen && retryModal.account && (
        <Modal
          title={`Retry Broker Account Onboarding: ${retryModal.account.customerName}`}
          open={true}
          onClose={() => setRetryModal({ isOpen: false, account: null, notes: '' })}
        >
          <form onSubmit={handleExecuteRetry} className="p-2">
            <div className="alert alert-warning fs-12 mb-3">
              <strong>Previous Failure:</strong> {retryModal.account.failureReason || 'Document ingestion failed'}
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Target Broker Partner</label>
              <input
                type="text"
                className="form-control form-control-sm bg-light"
                value={retryModal.account.brokerPartner}
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Remediation Notes / Evidence *</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={retryModal.notes}
                onChange={(e) => setRetryModal({ ...retryModal, notes: e.target.value })}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setRetryModal({ isOpen: false, account: null, notes: '' })}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Dispatch Account Opening Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
