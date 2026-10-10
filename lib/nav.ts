/* Sidebar navigation configuration for the Institutional Back Office & Control Room */

export interface SubNavItem {
  href: string;
  label: string;
  badge?: string;
  badgeVariant?: string;
}

export interface NavItem {
  id?: string;
  href?: string;
  icon: string;
  label: string;
  badge?: string;
  badgeVariant?: string;
  children?: SubNavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin',
        icon: 'ti-dashboard',
        label: 'Command Centre',
      },
      {
        href: '/admin/executive',
        icon: 'ti-chart-pie-2',
        label: 'Executive & Board',
      },
      {
        href: '/admin/approvals',
        icon: 'ti-checklist',
        label: 'Pending Approvals',
        badge: '3',
        badgeVariant: 'badge bg-light text-secondary border font-monospace',
      },
      {
        href: '/admin/audit-logs',
        icon: 'ti-history',
        label: 'Activity & Audit Logs',
      },
      {
        href: '/admin/profile',
        icon: 'ti-user-circle',
        label: 'My Staff Profile',
      },
      {
        href: '/admin/staff',
        icon: 'ti-users-group',
        label: 'Staff Directory',
      },
    ],
  },
  {
    label: 'Operations & Ledgers',
    items: [
      {
        id: 'nav-transactions-desk',
        icon: 'ti-receipt-2',
        label: 'Transactions & Recon',
        children: [
          { href: '/admin/transactions', label: 'Global Ledger' },
          { href: '/admin/reconciliation', label: 'Reconciliation Desk' },
        ],
      },
      {
        id: 'nav-investments-desk',
        icon: 'ti-chart-candle',
        label: 'Investments & Capital',
        children: [
          { href: '/admin/investments/terminal', label: "Trader's Terminal" },
          { href: '/admin/investments/portfolios', label: 'Client Portfolios (AUM)' },
          { href: '/admin/investments/private-equity', label: 'Private Equity (PE)' },
          { href: '/admin/investments/advisors', label: 'Staff Advisor Books' },
          { href: '/admin/investments/custody', label: 'Omnibus Custody & Orders' },
        ],
      },
      {
        id: 'nav-customer-desk',
        icon: 'ti-users',
        label: 'Customers & KYB',
        children: [
          { href: '/admin/users', label: 'Customer 360' },
          { href: '/admin/kyc', label: 'Identity & Business Review' },
        ],
      },
      {
        href: '/admin/disputes',
        icon: 'ti-headset',
        label: 'Disputes & Support',
      },
    ],
  },
  {
    label: 'Finance & Risk',
    items: [
      {
        id: 'nav-finance-desk',
        icon: 'ti-wallet',
        label: 'Treasury & Finance',
        children: [
          { href: '/admin/finance', label: 'Treasury & Runways' },
          { href: '/admin/pricing', label: 'Corridors & FX Rates' },
          { href: '/admin/fees', label: 'Fee Schedules' },
        ],
      },
      {
        href: '/admin/compliance',
        icon: 'ti-shield-check',
        label: 'Compliance & AML',
      },
      {
        href: '/admin/legal',
        icon: 'ti-scale',
        label: 'Legal & Regulatory',
      },
    ],
  },
  {
    label: 'Engineering & Platform',
    items: [
      {
        id: 'nav-eng-desk',
        icon: 'ti-server',
        label: 'Engineering & Ops',
        children: [
          { href: '/admin/engineering', label: 'Developer Console' },
          { href: '/admin/providers', label: 'Provider Health' },
          { href: '/admin/control-plane', label: 'Platform Control & Kill Switch' },
        ],
      },
      {
        href: '/admin/product',
        icon: 'ti-speakerphone',
        label: 'Product & Comms',
      },
      {
        href: '/admin/rbac',
        icon: 'ti-shield-lock',
        label: 'Roles & Permissions',
      },
      {
        href: '/admin/people',
        icon: 'ti-id-badge-2',
        label: 'People & On-Call',
      },
      {
        href: '/admin/incidents',
        icon: 'ti-activity',
        label: 'Live Incident Room',
      },
    ],
  },
];

/* Kept for secondary reference or testing sandbox */
export const CUSTOMER_NAV: NavSection[] = [
  {
    label: 'Client Simulator',
    items: [
      { href: '/exchange', icon: 'ti-arrows-exchange', label: 'Exchange Sandbox' },
      { href: '/wallets', icon: 'ti-wallet', label: 'Wallets Preview' },
      { href: '/bills', icon: 'ti-device-mobile', label: 'Bills Sandbox' },
    ],
  },
];
