'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { UserPortfoliosAnalytics } from '@/components/admin/investments/UserPortfoliosAnalytics';

export default function UserPortfoliosPage() {
  return (
    <div>
      <PageHeader
        title="Client Investment Portfolios & AUM"
        badge={<span className="badge bg-success-subtle text-success border border-success-subtle">Retail & Institutional</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2 py-1 fs-11 font-monospace">
              Total AUM: <strong>$14,820,400</strong>
            </span>
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Desks
            </Link>
          </div>
        }
      />

      <UserPortfoliosAnalytics />
    </div>
  );
}
