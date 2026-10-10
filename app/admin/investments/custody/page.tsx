'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { OrdersAndCustody, SAMPLE_ORDERS, SAMPLE_CUSTODY, SAMPLE_DIVIDENDS } from '@/components/admin/investments/OrdersAndCustody';
import { fmtMoney } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function CustodyAndOrdersPage() {
  const { toast } = useToast();
  const [dividendModal, setDividendModal] = useState<{
    isOpen: boolean;
    item: (typeof SAMPLE_DIVIDENDS)[0] | null;
    isExecuting: boolean;
  }>({
    isOpen: false,
    item: null,
    isExecuting: false,
  });

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
    <div>
      <PageHeader
        title="Omnibus Custody, Execution & Corporate Actions"
        badge={<span className="badge bg-success-subtle text-success border border-success-subtle">CSCS / DTC Depository</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2 py-1 fs-11">
              Reconciliation: <strong>Zero Variance</strong>
            </span>
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Desks
            </Link>
          </div>
        }
      />

      <OrdersAndCustody
        orders={SAMPLE_ORDERS}
        custody={SAMPLE_CUSTODY}
        dividends={SAMPLE_DIVIDENDS}
        onOpenDividendModal={(div) => setDividendModal({ isOpen: true, item: div, isExecuting: false })}
      />

      {/* Dividend Execution Confirmation Modal */}
      {dividendModal.isOpen && dividendModal.item && (
        <Modal
          open={dividendModal.isOpen}
          title={`Execute Dividend Distribution: ${dividendModal.item.ticker}`}
          onClose={() => setDividendModal({ isOpen: false, item: null, isExecuting: false })}
          footer={
            <div className="d-flex justify-content-end gap-2">
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
                {dividendModal.isExecuting ? 'Crediting Wallets...' : 'Confirm & Credit Wallets'}
              </button>
            </div>
          }
        >
          <div className="fs-13">
            <p className="text-secondary mb-3">
              Distribute scheduled dividend per share directly into retail and institutional customer cash wallets.
            </p>
            <div className="bg-light p-3 rounded mb-3 font-monospace">
              <div className="d-flex justify-content-between mb-1">
                <span>Per Share Rate:</span>
                <strong>{fmtMoney(dividendModal.item.amountPerShare, dividendModal.item.currency)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Eligible Shares:</span>
                <strong>{dividendModal.item.eligibleShares.toLocaleString()}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Gross Distribution:</span>
                <strong>{fmtMoney(dividendModal.item.amountPerShare * dividendModal.item.eligibleShares, dividendModal.item.currency)}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted border-top pt-1 mt-1">
                <span>Statutory 10% WHT:</span>
                <span>{fmtMoney(dividendModal.item.amountPerShare * dividendModal.item.eligibleShares * 0.1, dividendModal.item.currency)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
