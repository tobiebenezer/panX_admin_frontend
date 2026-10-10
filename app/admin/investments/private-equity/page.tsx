'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { PrivateEquityManagement } from '@/components/admin/investments/PrivateEquityManagement';

export default function PrivateEquityPage() {
  return (
    <div>
      <PageHeader
        title="Private Equity Portfolio Management"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">$155M Committed AUM</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2 py-1 fs-11">
              Active Funds: <strong>3 Funds</strong>
            </span>
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Desks
            </Link>
          </div>
        }
      />

      <PrivateEquityManagement />
    </div>
  );
}
