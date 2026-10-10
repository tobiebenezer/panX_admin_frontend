'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { TraderTerminal } from '@/components/admin/investments/TraderTerminal';

export default function TraderTerminalPage() {
  return (
    <div>
      <PageHeader
        title="Trader's Execution Terminal"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Real-Time STP Tape</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-muted border px-2 py-1 fs-11">
              NGX: <strong className="text-secondary">CLOSED</strong>
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-11">
              US (NYSE/NASDAQ): <strong>OPEN</strong>
            </span>
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Desks
            </Link>
          </div>
        }
      />

      <TraderTerminal />
    </div>
  );
}
