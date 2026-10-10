'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { fmtMoney, fmtNum } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { INITIAL_PORTFOLIOS, ConsoleOrder, BrokerPartnerId } from '@/lib/investmentConsoleData';

// Extract all orders from initial portfolios
const ALL_ORDERS: ConsoleOrder[] = INITIAL_PORTFOLIOS.flatMap((p) => p.orders);

export default function OrdersMonitorPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ConsoleOrder[]>(ALL_ORDERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIALLY_FILLED' | 'FAILED' | 'FILLED'>('ALL');
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'STAFF_ONLY' | 'DIRECT_ONLY'>('ALL');

  // Retry / Cancel Order Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    order: ConsoleOrder | null;
    actionType: 'RETRY' | 'CANCEL';
    reason: string;
    secondApprover: string;
  }>({
    isOpen: false,
    order: null,
    actionType: 'RETRY',
    reason: '',
    secondApprover: 'fatima.kyari@apexfinance.internal',
  });

  // Place Staff-Assisted Order Modal
  const [placeOrderModal, setPlaceOrderModal] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('Chioma Okonjo (CUST-US-102)');
  const [newOrderBroker, setNewOrderBroker] = useState<BrokerPartnerId>('DRIVEWEALTH_US');
  const [newOrderTicker, setNewOrderTicker] = useState('AAPL');
  const [newOrderSide, setNewOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [newOrderQty, setNewOrderQty] = useState('10');
  const [newOrderPrice, setNewOrderPrice] = useState('232.45');
  const [newOrderChannel, setNewOrderChannel] = useState<'PHONE_VERIFIED' | 'SECURE_INBOX' | 'IN_PERSON_BRANCH'>('PHONE_VERIFIED');
  const [newOrderEvidence, setNewOrderEvidence] = useState('REF-CALL-LOG-20261010-8812');
  const [newOrderApprover, setNewOrderApprover] = useState('fatima.kyari@apexfinance.internal');

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
        ord.brokerOrderRef.toLowerCase().includes(search.toLowerCase()) ||
        ord.ticker.toLowerCase().includes(search.toLowerCase()) ||
        ord.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || ord.status === statusFilter;
      const matchStaff =
        staffFilter === 'ALL' ||
        (staffFilter === 'STAFF_ONLY' ? ord.staffAssisted : !ord.staffAssisted);
      return matchSearch && matchStatus && matchStaff;
    });
  }, [orders, search, statusFilter, staffFilter]);

  const handleOpenAction = (order: ConsoleOrder, actionType: 'RETRY' | 'CANCEL') => {
    setActionModal({
      isOpen: true,
      order,
      actionType,
      reason: actionType === 'RETRY' ? 'Pre-trade FIX socket reconnection confirmed by infra' : 'Customer instructed cancellation before cut-off',
      secondApprover: 'fatima.kyari@apexfinance.internal',
    });
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.order) return;
    const { order, actionType, secondApprover, reason } = actionModal;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === order.id) {
          if (actionType === 'RETRY') {
            return {
              ...o,
              status: 'PENDING',
              failureReason: undefined,
              nextStep: 'Order re-routed to broker STP gateway',
            };
          } else {
            return {
              ...o,
              status: 'CANCELLED',
              failureReason: `Cancelled by staff (${reason})`,
            };
          }
        }
        return o;
      })
    );

    toast(
      'success',
      `Order ${order.id} ${actionType === 'RETRY' ? 'retried' : 'cancelled'} with Dual Approver (${secondApprover}).`
    );
    setActionModal({ isOpen: false, order: null, actionType: 'RETRY', reason: '', secondApprover: '' });
  };

  const handleCreateStaffOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newOrderQty) || 1;
    const price = parseFloat(newOrderPrice) || 100;
    const currency = newOrderBroker === 'NGX_CHAPEL_HILL' ? 'NGN' : 'USD';

    const createdOrder: ConsoleOrder = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      customerId: 'CUST-US-102',
      customerName: newOrderCustomer.split('(')[0].trim(),
      brokerOrderRef: `${newOrderBroker === 'NGX_CHAPEL_HILL' ? 'NGX-CHD' : 'DW-ORD'}-${Math.floor(1000 + Math.random() * 9000)}`,
      brokerPartner: newOrderBroker,
      ticker: newOrderTicker.toUpperCase(),
      side: newOrderSide,
      qty,
      price,
      filledQty: 0,
      status: 'PENDING',
      ageMinutes: 1,
      walletDebitAmount: qty * price,
      staffAssisted: true,
      staffAssistedDetails: {
        staffName: 'Aliko Adeleke (Superadmin)',
        channel: newOrderChannel,
        instructionTime: '2026-10-10 10:20:00',
        evidenceRef: newOrderEvidence,
        secondApprover: newOrderApprover,
      },
      timestamp: 'Just now',
      brokerConfirmedAt: 'Pending gateway ack',
    };

    setOrders([createdOrder, ...orders]);
    toast('success', `Staff-assisted order ${createdOrder.id} dispatched to ${newOrderBroker} under Dual-Control quorum.`);
    setPlaceOrderModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Orders Monitor &amp; Execution Gate"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">STP Broker Feeds</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setPlaceOrderModal(true)}
            >
              <i className="ti ti-plus me-1" /> Place Staff-Assisted Order
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Open / Pending Orders</div>
            <div className="fs-22 fw-bold text-primary">
              {orders.filter((o) => o.status === 'PENDING').length}
            </div>
            <div className="fs-12 text-muted mt-1">Awaiting broker fill</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Failed Orders (Needs Attention)</div>
            <div className="fs-22 fw-bold text-danger">
              {orders.filter((o) => o.status === 'FAILED').length}
            </div>
            <div className="fs-12 text-danger mt-1">Requires retry or cancellation</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Filled Orders Today</div>
            <div className="fs-22 fw-bold text-success">
              {orders.filter((o) => o.status === 'FILLED').length}
            </div>
            <div className="fs-12 text-muted mt-1">Successfully routed &amp; executed</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Staff-Assisted Orders</div>
            <div className="fs-22 fw-bold text-dark">
              {orders.filter((o) => o.staffAssisted).length}
            </div>
            <div className="fs-12 text-muted mt-1">Dual-control verified instructions</div>
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
                  placeholder="Search order ref, customer, ticker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Order Statuses</option>
                <option value="PENDING">Pending Fills</option>
                <option value="PARTIALLY_FILLED">Partially Filled</option>
                <option value="FAILED">Failed (Attention Needed)</option>
                <option value="FILLED">Filled</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value as any)}
              >
                <option value="ALL">All Channels</option>
                <option value="STAFF_ONLY">Staff-Assisted Only</option>
                <option value="DIRECT_ONLY">Direct Client Only</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-end">
              <span className="badge bg-light text-muted border px-3 py-2">
                {filteredOrders.length} orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Orders Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Order ID &amp; Ref</th>
                <th>Customer</th>
                <th>Broker &amp; Ticker</th>
                <th>Side &amp; Qty</th>
                <th>Price &amp; Total</th>
                <th>Wait Time</th>
                <th>Status &amp; Diagnosis</th>
                <th className="pe-4 text-end">Dual-Control Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const currency = ord.brokerPartner === 'NGX_CHAPEL_HILL' ? 'NGN' : 'USD';
                return (
                  <tr key={ord.id} className={ord.status === 'FAILED' ? 'table-danger-subtle' : ''}>
                    <td className="ps-4">
                      <div className="fw-bold font-sans text-dark">{ord.id}</div>
                      <div className="text-muted font-sans fs-11">{ord.brokerOrderRef}</div>
                      {ord.staffAssisted && (
                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle fs-10 mt-1">
                          <i className="ti ti-headset me-1" /> Staff Assisted
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{ord.customerName}</div>
                      <div className="text-muted fs-11">{ord.customerId}</div>
                    </td>
                    <td>
                      <div>
                        <span className="fw-bold text-dark me-1">{ord.ticker}</span>
                        <span className={`badge ${ord.brokerPartner === 'NGX_CHAPEL_HILL' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} fs-10`}>
                          {ord.brokerPartner === 'NGX_CHAPEL_HILL' ? 'NGX' : 'US'}
                        </span>
                      </div>
                      <div className="text-muted fs-11">{ord.timestamp}</div>
                    </td>
                    <td>
                      <span className={`badge ${ord.side === 'BUY' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} fw-bold me-2`}>
                        {ord.side}
                      </span>
                      <span className="font-sans fw-bold">{fmtNum(ord.qty)}</span>
                      <div className="text-muted fs-11">Filled: {fmtNum(ord.filledQty)}</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{fmtMoney(ord.price, currency)}</div>
                      <div className="text-muted fs-11">Val: {fmtMoney(ord.qty * ord.price, currency)}</div>
                    </td>
                    <td>
                      <span className={`badge ${ord.ageMinutes > 30 ? 'bg-warning-subtle text-dark border border-warning-subtle' : 'bg-light text-muted border'} font-sans`}>
                        {ord.ageMinutes}m ago
                      </span>
                    </td>
                    <td>
                      {ord.status === 'PENDING' && (
                        <span className="badge bg-warning text-dark">PENDING FILL</span>
                      )}
                      {ord.status === 'FILLED' && (
                        <span className="badge bg-success text-white">FILLED</span>
                      )}
                      {ord.status === 'CANCELLED' && (
                        <span className="badge bg-secondary text-white">CANCELLED</span>
                      )}
                      {ord.status === 'FAILED' && (
                        <div>
                          <span className="badge bg-danger text-white">FAILED</span>
                          {ord.failureReason && (
                            <div className="text-danger fs-11 fw-semibold mt-1">
                              {ord.failureReason}
                            </div>
                          )}
                          {ord.nextStep && (
                            <div className="text-muted fs-11 mt-0">
                              <i className="ti ti-arrow-right me-1" />
                              {ord.nextStep}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      {ord.status === 'FAILED' && (
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-1 px-2 fs-12"
                            onClick={() => handleOpenAction(ord, 'RETRY')}
                          >
                            <i className="ti ti-refresh me-1" /> Retry Order
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2 fs-12"
                            onClick={() => handleOpenAction(ord, 'CANCEL')}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {ord.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                          onClick={() => handleOpenAction(ord, 'CANCEL')}
                        >
                          Cancel Open Order
                        </button>
                      )}
                      {ord.status === 'FILLED' && (
                        <span className="text-muted fs-11">
                          <i className="ti ti-check text-success me-1" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Approver Action Modal */}
      {actionModal.isOpen && actionModal.order && (
        <Modal
          title={`Order Action: ${actionModal.actionType} ${actionModal.order.id}`}
          open={true}
          onClose={() => setActionModal({ isOpen: false, order: null, actionType: 'RETRY', reason: '', secondApprover: '' })}
        >
          <form onSubmit={handleExecuteAction} className="p-2">
            <div className="alert alert-info fs-12 mb-3">
              Dual-Control Protocol: This action directly impacts client cash balances and broker custody records.
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Order Details</label>
              <div className="bg-light p-2 rounded fs-12">
                <div><strong>Ref:</strong> {actionModal.order.brokerOrderRef}</div>
                <div><strong>Customer:</strong> {actionModal.order.customerName}</div>
                <div><strong>Trade:</strong> {actionModal.order.side} {actionModal.order.qty} {actionModal.order.ticker}</div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Operational Justification *</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={actionModal.reason}
                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Designated Second Approver *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={actionModal.secondApprover}
                onChange={(e) => setActionModal({ ...actionModal, secondApprover: e.target.value })}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setActionModal({ isOpen: false, order: null, actionType: 'RETRY', reason: '', secondApprover: '' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-sm ${actionModal.actionType === 'RETRY' ? 'btn-primary' : 'btn-danger'}`}
              >
                Confirm &amp; Dispatch {actionModal.actionType}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Place Staff Assisted Order Modal */}
      {placeOrderModal && (
        <Modal
          title="Place Staff-Assisted Order (Client Mandate)"
          open={true}
          onClose={() => setPlaceOrderModal(false)}
        >
          <form onSubmit={handleCreateStaffOrder} className="p-2">
            <div className="alert alert-warning fs-12 mb-3">
              <strong>Mandatory Compliance Check:</strong> Staff-assisted orders must be supported by an auditable customer instruction record.
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Customer Account *</label>
              <select
                className="form-select form-select-sm"
                value={newOrderCustomer}
                onChange={(e) => setNewOrderCustomer(e.target.value)}
              >
                <option value="Chioma Okonjo (CUST-US-102)">Chioma Okonjo (CUST-US-102) - DriveWealth USD</option>
                <option value="Babajide Adeleke (CUST-NG-881)">Babajide Adeleke (CUST-NG-881) - Chapel Hill NGN</option>
                <option value="Folashade Adeleke (CUST-NG-884)">Folashade Adeleke (CUST-NG-884) - Chapel Hill NGN</option>
              </select>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Broker Partner</label>
                <select
                  className="form-select form-select-sm"
                  value={newOrderBroker}
                  onChange={(e) => setNewOrderBroker(e.target.value as any)}
                >
                  <option value="DRIVEWEALTH_US">DriveWealth LLC (US)</option>
                  <option value="NGX_CHAPEL_HILL">Chapel Hill Denham (NGX)</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Ticker Symbol *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={newOrderTicker}
                  onChange={(e) => setNewOrderTicker(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-4">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Side</label>
                <select
                  className="form-select form-select-sm"
                  value={newOrderSide}
                  onChange={(e) => setNewOrderSide(e.target.value as any)}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className="col-4">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Quantity *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={newOrderQty}
                  onChange={(e) => setNewOrderQty(e.target.value)}
                  required
                />
              </div>
              <div className="col-4">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Limit Price *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={newOrderPrice}
                  onChange={(e) => setNewOrderPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Instruction Channel *</label>
                <select
                  className="form-select form-select-sm"
                  value={newOrderChannel}
                  onChange={(e) => setNewOrderChannel(e.target.value as any)}
                >
                  <option value="PHONE_VERIFIED">Recorded Telephone (Verified)</option>
                  <option value="SECURE_INBOX">Secure In-App Message</option>
                  <option value="IN_PERSON_BRANCH">In-Person Branch Mandate</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Evidence Reference *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={newOrderEvidence}
                  onChange={(e) => setNewOrderEvidence(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Second Approver Email *</label>
              <input
                type="email"
                className="form-control form-control-sm"
                value={newOrderApprover}
                onChange={(e) => setNewOrderApprover(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPlaceOrderModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Dispatch Staff-Assisted Order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
