'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { StaffPortfolioManagement } from '@/components/admin/investments/StaffPortfolioManagement';

export default function StaffAdvisorsPage() {
  return (
    <div>
      <PageHeader
        title="Staff Portfolio Management & Advisor Books"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Discretionary & Advisory</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2 py-1 fs-11">
              Active Advisors: <strong>4 Mandated</strong>
            </span>
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Desks
            </Link>
          </div>
        }
      />

      <StaffPortfolioManagement />
    </div>
  );
}
