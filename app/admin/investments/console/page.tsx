'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { PortfolioConsole } from '@/components/admin/investments/PortfolioConsole';

export default function PortfolioConsolePage() {
  return (
    <div>
      <PageHeader
        title="Portfolio Console (Broker Staff Desk)"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Custody &amp; STP Brokerage</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> All Investment Desks
            </Link>
            <Link href="/admin/investments/terminal" className="btn btn-outline-primary btn-sm">
              <i className="ti ti-chart-arrows me-1" /> Trader Terminal
            </Link>
            <Link href="/admin/investments/custody" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-safe me-1" /> Custody &amp; Orders
            </Link>
          </div>
        }
      />

      <PortfolioConsole />
    </div>
  );
}
