'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { fmtMoney, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { INITIAL_DISPUTES, DisputeRecord } from '@/lib/investmentConsoleData';

export default function InvestmentDisputesPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeRecord[]>(INITIAL_DISPUTES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DisputeRecord['status']>('ALL');
  const [itemFilter, setItemFilter] = useState<'ALL' | DisputeRecord['relatedItem']>('ALL');

  // New Dispute Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [portfolioId, setPortfolioId] = useState('PF-002 (Chioma Okonjo)');
  const [relatedItem, setRelatedItem] = useState<'ORDER' | 'HOLDING' | 'DIVIDEND'>('ORDER');
  const [claimAmount, setClaimAmount] = useState('150.00');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');
  const [reason, setReason] = useState('');
  const [brokerRef, setBrokerRef] = useState('DW-ORD-9912');

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchSearch =
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.portfolioId.toLowerCase().includes(search.toLowerCase()) ||
        (d.brokerRef && d.brokerRef.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchItem = itemFilter === 'ALL' || d.relatedItem === itemFilter;
      return matchSearch && matchStatus && matchItem;
    });
  }, [disputes, search, statusFilter, itemFilter]);

  const handleResolveDispute = (id: string, outcome: 'REFUND_APPROVED' | 'REJECTED') => {
    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          toast(
            outcome === 'REFUND_APPROVED' ? 'success' : 'info',
            `Dispute ${d.id} set to ${outcome}. Client wallet balance credited accordingly.`
          );
          return { ...d, status: outcome };
        }
        return d;
      })
    );
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast('error', 'Operational reason is required.');
      return;
    }

    const created: DisputeRecord = {
      id: `DISP-INV-${Math.floor(10 + Math.random() * 90)}`,
      portfolioId: portfolioId.split('(')[0].trim(),
      customerName: portfolioId.split('(')[1]?.replace(')', '').trim() || 'Client',
      relatedItem,
      claimAmount: parseFloat(claimAmount) || 0,
      currency,
      reason: reason.trim(),
      status: 'UNDER_REVIEW',
      brokerRef: brokerRef.trim() || undefined,
      createdAt: 'Just now',
    };

    setDisputes([created, ...disputes]);
    toast('success', `Investment dispute ${created.id} escalated to Disputes &amp; Support desk.`);
    setNewModalOpen(false);
    setReason('');
  };

  return (
    <div>
      <PageHeader
        title="Investment Disputes &amp; Claims Desk"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Order, Holding &amp; Dividend Exceptions</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setNewModalOpen(true)}
            >
              <i className="ti ti-plus me-1" /> Raise Investment Dispute
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Total Disputes</div>
            <div className="fs-22 fw-bold text-dark">{disputes.length}</div>
            <div className="fs-12 text-muted mt-1">Across all brokers &amp; securities</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Under Active Review</div>
            <div className="fs-22 fw-bold text-warning">
              {disputes.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'NEW').length}
            </div>
            <div className="fs-12 text-warning mt-1">Awaiting broker response</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Refunds Approved</div>
            <div className="fs-22 fw-bold text-success">
              {disputes.filter((d) => d.status === 'REFUND_APPROVED').length}
            </div>
            <div className="fs-12 text-muted mt-1">Adjustments posted to wallet</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Disputes Rejected</div>
            <div className="fs-22 fw-bold text-secondary">
              {disputes.filter((d) => d.status === 'REJECTED').length}
            </div>
            <div className="fs-12 text-muted mt-1">Broker trade confirmed valid</div>
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
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value as any)}
              >
                <option value="ALL">All Categories</option>
                <option value="ORDER">Order Execution</option>
                <option value="HOLDING">Custody Holding</option>
                <option value="DIVIDEND">Dividend &amp; Yield</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REFUND_APPROVED">Refund Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-end">
              <span className="badge bg-light text-muted border px-3 py-2">
                {filteredDisputes.length} disputes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Disputes Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Dispute ID</th>
                <th>Customer &amp; Portfolio</th>
                <th>Category</th>
                <th>Claim Amount</th>
                <th>Broker Reference</th>
                <th>Reason &amp; Description</th>
                <th>Status</th>
                <th className="pe-4 text-end">Resolution Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map((d) => (
                <tr key={d.id}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{d.id}</div>
                    <div className="text-muted fs-11">{d.createdAt}</div>
                  </td>
                  <td>
                    <div className="fw-semibold text-dark">{d.customerName}</div>
                    <div className="text-muted font-sans fs-11">{d.portfolioId}</div>
                  </td>
                  <td>
                    <span className="badge bg-light text-secondary border font-sans">{d.relatedItem}</span>
                  </td>
                  <td className="font-sans fw-bold text-danger">{fmtMoney(d.claimAmount, d.currency)}</td>
                  <td>
                    <span className="font-sans text-muted">{d.brokerRef || '—'}</span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div className="text-truncate text-secondary" title={d.reason}>{d.reason}</div>
                  </td>
                  <td>
                    {d.status === 'UNDER_REVIEW' && (
                      <span className="badge bg-warning text-dark">UNDER REVIEW</span>
                    )}
                    {d.status === 'REFUND_APPROVED' && (
                      <span className="badge bg-success text-white">REFUND APPROVED</span>
                    )}
                    {d.status === 'REJECTED' && (
                      <span className="badge bg-secondary text-white">REJECTED</span>
                    )}
                  </td>
                  <td className="pe-4 text-end">
                    {d.status === 'UNDER_REVIEW' ? (
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-1 px-2 fs-12"
                          onClick={() => handleResolveDispute(d.id, 'REFUND_APPROVED')}
                        >
                          Approve Refund
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2 fs-12"
                          onClick={() => handleResolveDispute(d.id, 'REJECTED')}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted fs-11">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDisputes.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No investment disputes match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Dispute Modal */}
      {newModalOpen && (
        <Modal
          title="Raise Investment Dispute or Exception"
          open={true}
          onClose={() => setNewModalOpen(false)}
        >
          <form onSubmit={handleCreateDispute} className="p-2">
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Customer Portfolio *</label>
              <select
                className="form-select form-select-sm"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
              >
                <option value="PF-001 (Babajide Adeleke)">Babajide Adeleke (PF-001) - Chapel Hill</option>
                <option value="PF-002 (Chioma Okonjo)">Chioma Okonjo (PF-002) - DriveWealth</option>
                <option value="PF-003 (Emeka Eze)">Emeka Eze (PF-003) - DriveWealth</option>
              </select>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Dispute Category</label>
                <select
                  className="form-select form-select-sm"
                  value={relatedItem}
                  onChange={(e) => setRelatedItem(e.target.value as any)}
                >
                  <option value="ORDER">Order Execution / Timeout</option>
                  <option value="HOLDING">Custody Share Discrepancy</option>
                  <option value="DIVIDEND">Dividend / Tax Issue</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Broker Order / Batch Ref</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={brokerRef}
                  onChange={(e) => setBrokerRef(e.target.value)}
                />
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Claim Amount</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Currency</label>
                <select
                  className="form-select form-select-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                >
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Dispute Description &amp; Details *</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="Explain the trade execution timeout, missing share lot, or tax mismatch..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setNewModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Dispatch Dispute
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
