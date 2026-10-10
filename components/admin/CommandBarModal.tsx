'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  category: 'Desks & Workspaces' | 'Quick Actions' | 'Entities (Customers/Tx)';
  title: string;
  subtitle: string;
  href?: string;
  action?: () => void;
  icon: string;
  badge?: string;
}

const COMMAND_REGISTRY: CommandItem[] = [
  // Desks
  { id: 'desk-cmd', category: 'Desks & Workspaces', title: 'Command Centre', subtitle: 'Live operations, circuit breakers & incident banner', href: '/admin', icon: 'ti-dashboard' },
  { id: 'desk-exec', category: 'Desks & Workspaces', title: 'Executive & Stakeholder Scorecard', subtitle: 'Board metrics, gross margin, corridor economics & targets', href: '/admin/executive', icon: 'ti-chart-pie-2' },
  { id: 'desk-users', category: 'Desks & Workspaces', title: 'Customer 360 & KYB Directory', subtitle: 'Search users, tiers, risk profiles, and business accounts', href: '/admin/users', icon: 'ti-users' },
  { id: 'desk-recon', category: 'Desks & Workspaces', title: 'Reconciliation Desk', subtitle: 'Provider ledger vs internal ledger mismatches & stalled queue', href: '/admin/reconciliation', icon: 'ti-arrows-diff', badge: 'Exceptions' },
  { id: 'desk-inv', category: 'Desks & Workspaces', title: 'Investments & Custody Back Office', subtitle: 'NGX & US securities catalog, broker feeds & dividend actions', href: '/admin/investments', icon: 'ti-chart-candle' },
  { id: 'desk-comp', category: 'Desks & Workspaces', title: 'Compliance & AML Monitor', subtitle: 'Sanctions flags, SAR filings & STR regulatory register', href: '/admin/compliance', icon: 'ti-shield-check', badge: 'Alerts' },
  { id: 'desk-disp', category: 'Desks & Workspaces', title: 'Disputes & Support Ops', subtitle: 'Chargebacks, stalled payouts & customer ticket resolution', href: '/admin/disputes', icon: 'ti-headset' },
  { id: 'desk-fin', category: 'Desks & Workspaces', title: 'Treasury & Liquidity Desk', subtitle: 'Provider prefunding runways, fiat bank balances & fx spreads', href: '/admin/finance', icon: 'ti-wallet' },
  { id: 'desk-ctrl', category: 'Desks & Workspaces', title: 'Platform Control & Emergency Kill-Switches', subtitle: 'Superadmin overrides, corridor pauses & gateway breakers', href: '/admin/control-plane', icon: 'ti-alert-octagon', badge: 'Protected' },
  { id: 'desk-appr', category: 'Desks & Workspaces', title: 'Maker-Checker Approval Queue', subtitle: 'Dual authorization queue for refunds, limits & rate changes', href: '/admin/approvals', icon: 'ti-checklist', badge: '3 Pending' },
  { id: 'desk-eng', category: 'Desks & Workspaces', title: 'Engineering Console', subtitle: 'Dead letter replays, webhook logs, database migrations & queues', href: '/admin/engineering', icon: 'ti-server' },
  { id: 'desk-prod', category: 'Desks & Workspaces', title: 'Product & Comms Desk', subtitle: 'In-app announcements, email templates & conversion funnels', href: '/admin/product', icon: 'ti-speakerphone' },
  { id: 'desk-legal', category: 'Desks & Workspaces', title: 'Legal & Regulatory Calendar', subtitle: 'SEC/CBN reporting deadlines, policy registry & auditor access', href: '/admin/legal', icon: 'ti-scale' },
  { id: 'desk-ppl', category: 'Desks & Workspaces', title: 'People, Access & On-Call Desk', subtitle: 'Staff RBAC directory, on-call schedules & incident rotations', href: '/admin/people', icon: 'ti-id-badge-2' },
  { id: 'desk-audit', category: 'Desks & Workspaces', title: 'Immutable Audit Trail', subtitle: 'Tamper-evident logs of every staff action & PII access record', href: '/admin/audit-logs', icon: 'ti-file-certificate' },

  // Quick Actions
  { id: 'act-killswitch', category: 'Quick Actions', title: 'Emergency Kill-Switch (All Outbound Rails)', subtitle: 'Requires 2nd Approver — halts all NGN and USD outbound payouts', href: '/admin/control-plane?action=killswitch', icon: 'ti-flame', badge: 'Maker-Checker' },
  { id: 'act-prov-switch', category: 'Quick Actions', title: 'Toggle Provider Circuit Breaker (Flutterwave / YellowCard)', subtitle: 'Reroute live traffic immediately to fallback provider', href: '/admin/providers', icon: 'ti-toggle-right' },
  { id: 'act-recon-run', category: 'Quick Actions', title: 'Trigger Automated Nightly Recon Batch', subtitle: 'Compare internal ledgers against DriveWealth & Anchor bank files', href: '/admin/reconciliation?trigger=auto', icon: 'ti-refresh' },

  // Sample Entities
  { id: 'ent-usr-1', category: 'Entities (Customers/Tx)', title: 'Chioma Okonjo (USR-9921)', subtitle: 'Tier 3 · KYB Director · chioma.o@meridiancorp.ng', href: '/admin/users?id=USR-9921', icon: 'ti-user' },
  { id: 'ent-tx-1', category: 'Entities (Customers/Tx)', title: 'TX-NGN-884210 (₦2,450,000.00)', subtitle: 'Status: PENDING_PROVIDER · Corridors: NGN ➔ USD', href: '/admin/transactions?q=TX-NGN-884210', icon: 'ti-receipt' },
  { id: 'ent-sec-1', category: 'Entities (Customers/Tx)', title: 'MTN Nigeria Communications (MTNN)', subtitle: 'NGX:MTNN · ₦245.00 · Trading Open', href: '/admin/investments?ticker=MTNN', icon: 'ti-chart-dots' },
];

export function CommandBarModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation & shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open is handled by parent, but if needed we can emit
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = COMMAND_REGISTRY.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(10, 16, 26, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Search Input Bar */}
          <div className="p-3 border-bottom d-flex align-items-center gap-2 bg-light-subtle">
            <i className="ti ti-search fs-18 text-muted" />
            <input
              type="text"
              className="form-control form-control-lg border-0 bg-transparent shadow-none fs-15 px-1 py-1"
              placeholder="Search workspaces, customers, tx hashes, runbooks or jump to screen… (Esc to exit)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              autoFocus
            />
            <span className="badge bg-secondary-subtle text-secondary fs-11 px-2 py-1 rounded">ESC</span>
          </div>

          {/* Results List */}
          <div className="p-2 overflow-y-auto" style={{ maxHeight: 420 }}>
            {filtered.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ti ti-search-off fs-32 d-block mb-2" />
                <p className="fs-14 mb-0">No matching commands or entities found for "{query}"</p>
                <small className="text-tertiary">Try searching "Treasury", "Recon", "TX", or "Chioma"</small>
              </div>
            ) : (
              filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer transition-all ${
                    idx === selectedIndex ? 'bg-primary-subtle border-start border-3 border-primary' : 'hover-bg-light'
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="d-flex align-items-center gap-3 min-w-0">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: idx === selectedIndex ? 'rgba(22, 179, 100, 0.15)' : '#F2F4F7',
                        color: idx === selectedIndex ? '#0E9F57' : '#475467',
                      }}
                    >
                      <i className={`ti ${item.icon} fs-18`} />
                    </div>
                    <div className="min-w-0 text-truncate">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold fs-14 text-dark text-truncate">{item.title}</span>
                        {item.badge && (
                          <span className="badge bg-danger-subtle text-danger fs-11 py-0 px-2 rounded-pill">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <small className="text-muted fs-12 d-block text-truncate">{item.subtitle}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0 ps-2">
                    <span className="badge bg-light text-muted fs-11 border">{item.category}</span>
                    <i className="ti ti-chevron-right fs-14 text-muted" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Footer hint */}
          <div className="px-3 py-2 bg-light border-top d-flex align-items-center justify-content-between fs-12 text-muted">
            <div className="d-flex align-items-center gap-3">
              <span><kbd className="bg-white border text-dark px-1">↑</kbd> <kbd className="bg-white border text-dark px-1">↓</kbd> to navigate</span>
              <span><kbd className="bg-white border text-dark px-1">Enter</kbd> to select</span>
            </div>
            <span>Institutional Back Office · Apex Finance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
