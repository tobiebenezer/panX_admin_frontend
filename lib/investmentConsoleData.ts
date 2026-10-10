export type BrokerPartnerId = 'NGX_CHAPEL_HILL' | 'DRIVEWEALTH_US';

export interface BrokerHealth {
  id: BrokerPartnerId;
  name: string;
  market: 'NGX (Nigeria)' | 'US (NYSE / NASDAQ)';
  currency: 'NGN' | 'USD';
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  lastSyncTime: string;
  orderCutoffTime: string;
  calendarStatus: 'OPEN' | 'CLOSED';
  nextOpenTime: string;
  marketHours: string;
  orderPlacingDisabled: boolean;
}

export interface SecurityCatalogItem {
  ticker: string;
  name: string;
  market: 'NGX' | 'US';
  currency: 'NGN' | 'USD';
  assetType: 'EQUITY' | 'ETF' | 'BOND';
  enabled: boolean;
  delayedPrice: boolean;
  lastPrice: number;
  lastConfirmedByBroker: string;
}

export interface CustomerPortfolio {
  id: string;
  customerId: string;
  customerName: string;
  maskedName: string;
  revealed: boolean;
  brokerAccountRef: string;
  brokerPartner: BrokerPartnerId;
  market: 'NGX' | 'US';
  currency: 'NGN' | 'USD';
  portfolioValue: number;
  cashAtBroker: number;
  buyingPower: number;
  pendingFunding: number;
  changeTodayPct: number;
  openOrdersCount: number;
  status: 'ACTIVE' | 'RESTRICTED' | 'CLOSED';
  investingEligibility: 'ELIGIBLE' | 'ACCREDITED_ONLY' | 'PENDING_W8BEN' | 'RESTRICTED';
  needsAttention: boolean;
  attentionReason?: string;
  lastSynced: string;
  brokerConfirmedAt: string;
  holdings: CustomerHolding[];
  orders: ConsoleOrder[];
  dividends: ConsoleDividendAction[];
  notes: string[];
}

export interface CustomerHolding {
  id: string;
  ticker: string;
  securityName: string;
  qty: number;
  averageCost: number;
  lastPrice: number;
  value: number;
  gainLossPct: number;
  currency: 'NGN' | 'USD';
  brokerConfirmedAt: string;
  delayedPrice: boolean;
}

export interface ConsoleOrder {
  id: string;
  customerId: string;
  customerName: string;
  brokerOrderRef: string;
  brokerPartner: BrokerPartnerId;
  ticker: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  filledQty: number;
  status: 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'FAILED' | 'CANCELLED';
  failureReason?: string;
  nextStep?: string;
  ageMinutes: number;
  walletDebitAmount: number;
  fxConversionRate?: number;
  staffAssisted: boolean;
  staffAssistedDetails?: {
    staffName: string;
    channel: 'PHONE_VERIFIED' | 'SECURE_INBOX' | 'IN_PERSON_BRANCH';
    instructionTime: string;
    evidenceRef: string;
    secondApprover: string;
  };
  timestamp: string;
  brokerConfirmedAt: string;
}

export interface SecurityConcentration {
  ticker: string;
  name: string;
  market: 'NGX' | 'US';
  currency: 'NGN' | 'USD';
  holdersCount: number;
  totalQty: number;
  totalValue: number;
  shareOfTotalAumPct: number;
  brokerOmnibusQty: number;
  deltaQty: number;
}

export interface HoldingReconciliationRow {
  id: string;
  ticker: string;
  customerId: string;
  customerName: string;
  brokerPartner: BrokerPartnerId;
  ourQty: number;
  brokerQty: number;
  qtyGap: number;
  ourCash: number;
  brokerCash: number;
  cashGap: number;
  ageDays: number;
  owner: string;
  status: 'NEW' | 'INVESTIGATING' | 'CORRECTION_REQUESTED' | 'RESOLVED';
  resolutionNote?: string;
  lastAuditedAt: string;
}

export interface CashFundingTransfer {
  id: string;
  customerId: string;
  customerName: string;
  brokerPartner: BrokerPartnerId;
  walletAmount: number;
  walletCurrency: string;
  brokerAmount: number;
  brokerCurrency: string;
  fxRateUsed: number;
  status: 'SETTLED' | 'PENDING' | 'DELAYED' | 'FAILED';
  delayReason?: string;
  nextStep?: string;
  tradeSettlementExpectedDate?: string;
  isClientOwed: boolean;
  timestamp: string;
}

export interface ConsoleDividendAction {
  id: string;
  ticker: string;
  recordDate: string;
  paymentDate: string;
  dividendPerShare: number;
  currency: 'NGN' | 'USD';
  status: 'EXPECTED' | 'RECEIVED_FROM_BROKER' | 'CREDITED_TO_CUSTOMERS' | 'MATCH_FAILED';
  totalExpectedAmount: number;
  totalCreditedAmount: number;
  failedCustomersCount: number;
  walletBatchRef?: string;
}

export interface CorporateActionNotice {
  id: string;
  ticker: string;
  type: 'STOCK_SPLIT' | 'REVERSE_SPLIT' | 'MERGER_ACQUISITION' | 'SYMBOL_CHANGE' | 'DELISTING';
  details: string;
  affectedCustomersCount: number;
  effectiveDate: string;
  requiresManualHandling: boolean;
  status: 'AUTOMATED_APPLIED' | 'MANUAL_QUEUE_PENDING' | 'COMPLETED';
}

export interface BrokerCustomerAccount {
  id: string;
  customerId: string;
  customerName: string;
  brokerPartner: BrokerPartnerId;
  brokerAccountRef: string;
  openedDate: string;
  identityVerified: boolean;
  riskDisclosureSigned: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'FAILED_OPENING' | 'PENDING_DOCUMENTATION';
  failureReason?: string;
}

export interface StaffAuditActionLog {
  id: string;
  timestamp: string;
  staffName: string;
  staffRole: string;
  actionType:
    | 'SYNC_BROKER'
    | 'RETRY_ORDER'
    | 'CANCEL_ORDER'
    | 'PLACE_STAFF_ASSISTED_ORDER'
    | 'RESTRICT_PORTFOLIO'
    | 'UNRESTRICT_PORTFOLIO'
    | 'RECON_CORRECTION_REQUEST'
    | 'TOGGLE_SECURITY_CATALOG'
    | 'RAISE_DISPUTE';
  targetPortfolioOrOrder: string;
  reason: string;
  secondApprover?: string;
  resultStatus: 'EXECUTED' | 'PENDING_APPROVAL' | 'REJECTED';
}

export interface DisputeRecord {
  id: string;
  portfolioId: string;
  customerName: string;
  relatedItem: 'ORDER' | 'HOLDING' | 'DIVIDEND';
  claimAmount: number;
  currency: 'NGN' | 'USD';
  reason: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'REFUND_APPROVED' | 'REJECTED';
  brokerRef?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// SEED MOCK DATA
// -------------------------------------------------------------

export const BROKER_HEALTH: Record<BrokerPartnerId, BrokerHealth> = {
  NGX_CHAPEL_HILL: {
    id: 'NGX_CHAPEL_HILL',
    name: 'Chapel Hill Denham Securities (NGX Clearing)',
    market: 'NGX (Nigeria)',
    currency: 'NGN',
    status: 'ONLINE',
    latencyMs: 142,
    lastSyncTime: 'Just now (10:20:14)',
    orderCutoffTime: '02:00 PM WAT',
    calendarStatus: 'CLOSED',
    nextOpenTime: 'Mon 09:30 AM WAT',
    marketHours: '09:30 AM – 02:30 PM WAT',
    orderPlacingDisabled: false,
  },
  DRIVEWEALTH_US: {
    id: 'DRIVEWEALTH_US',
    name: 'DriveWealth LLC / DTC Custody (US Clearing)',
    market: 'US (NYSE / NASDAQ)',
    currency: 'USD',
    status: 'ONLINE',
    latencyMs: 89,
    lastSyncTime: 'Just now (10:20:14)',
    orderCutoffTime: '03:55 PM EST',
    calendarStatus: 'OPEN',
    nextOpenTime: 'Mon 09:30 AM EST',
    marketHours: '09:30 AM – 04:00 PM EST',
    orderPlacingDisabled: false,
  },
};

export const INITIAL_SECURITIES: SecurityCatalogItem[] = [
  { ticker: 'MTNN', name: 'MTN Nigeria Communications Plc', market: 'NGX', currency: 'NGN', assetType: 'EQUITY', enabled: true, delayedPrice: false, lastPrice: 245.0, lastConfirmedByBroker: '10:18:22' },
  { ticker: 'AIRTELAFRI', name: 'Airtel Africa Plc', market: 'NGX', currency: 'NGN', assetType: 'EQUITY', enabled: true, delayedPrice: false, lastPrice: 1950.0, lastConfirmedByBroker: '10:18:22' },
  { ticker: 'GTCO', name: 'Guaranty Trust Holding Co Plc', market: 'NGX', currency: 'NGN', assetType: 'EQUITY', enabled: true, delayedPrice: false, lastPrice: 48.5, lastConfirmedByBroker: '10:18:22' },
  { ticker: 'AAPL', name: 'Apple Inc.', market: 'US', currency: 'USD', assetType: 'EQUITY', enabled: true, delayedPrice: false, lastPrice: 232.45, lastConfirmedByBroker: '10:19:05' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', market: 'US', currency: 'USD', assetType: 'EQUITY', enabled: true, delayedPrice: false, lastPrice: 124.5, lastConfirmedByBroker: '10:19:05' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', market: 'US', currency: 'USD', assetType: 'ETF', enabled: true, delayedPrice: true, lastPrice: 581.5, lastConfirmedByBroker: '10:15:00' },
  { ticker: 'TSLA', name: 'Tesla Inc.', market: 'US', currency: 'USD', assetType: 'EQUITY', enabled: false, delayedPrice: false, lastPrice: 228.1, lastConfirmedByBroker: '10:19:05' },
];

export const INITIAL_PORTFOLIOS: CustomerPortfolio[] = [
  {
    id: 'PF-001',
    customerId: 'CUST-NG-881',
    customerName: 'Babajide Adeleke',
    maskedName: 'B•••••• A••••••',
    revealed: false,
    brokerAccountRef: 'CHD-NGX-90142',
    brokerPartner: 'NGX_CHAPEL_HILL',
    market: 'NGX',
    currency: 'NGN',
    portfolioValue: 12450000,
    cashAtBroker: 850000,
    buyingPower: 850000,
    pendingFunding: 0,
    changeTodayPct: 1.45,
    openOrdersCount: 0,
    status: 'ACTIVE',
    investingEligibility: 'ELIGIBLE',
    needsAttention: false,
    lastSynced: '2 mins ago',
    brokerConfirmedAt: '10:18:00',
    holdings: [
      { id: 'H-01', ticker: 'MTNN', securityName: 'MTN Nigeria', qty: 25000, averageCost: 238.0, lastPrice: 245.0, value: 6125000, gainLossPct: 2.94, currency: 'NGN', brokerConfirmedAt: '10:18:00', delayedPrice: false },
      { id: 'H-02', ticker: 'GTCO', securityName: 'GTCO Plc', qty: 112800, averageCost: 46.2, lastPrice: 48.5, value: 5470800, gainLossPct: 4.97, currency: 'NGN', brokerConfirmedAt: '10:18:00', delayedPrice: false },
    ],
    orders: [
      { id: 'ORD-101', customerId: 'CUST-NG-881', customerName: 'Babajide Adeleke', brokerOrderRef: 'NGX-CHD-8812', brokerPartner: 'NGX_CHAPEL_HILL', ticker: 'MTNN', side: 'BUY', qty: 2500, price: 245.0, filledQty: 2500, status: 'FILLED', ageMinutes: 120, walletDebitAmount: 612500, staffAssisted: false, timestamp: '08:15:00', brokerConfirmedAt: '08:15:10' },
    ],
    dividends: [
      { id: 'DIV-101', ticker: 'MTNN', recordDate: '2026-09-15', paymentDate: '2026-09-28', dividendPerShare: 5.6, currency: 'NGN', status: 'CREDITED_TO_CUSTOMERS', totalExpectedAmount: 140000, totalCreditedAmount: 140000, failedCustomersCount: 0, walletBatchRef: 'WLT-DIV-889' },
    ],
    notes: ['Customer requested high dividend focus for Q4.'],
  },
  {
    id: 'PF-002',
    customerId: 'CUST-US-102',
    customerName: 'Chioma Okonjo',
    maskedName: 'C••••• O•••••',
    revealed: false,
    brokerAccountRef: 'DW-USA-55219',
    brokerPartner: 'DRIVEWEALTH_US',
    market: 'US',
    currency: 'USD',
    portfolioValue: 38450.75,
    cashAtBroker: 3240.25,
    buyingPower: 3240.25,
    pendingFunding: 1000.0,
    changeTodayPct: 0.82,
    openOrdersCount: 1,
    status: 'ACTIVE',
    investingEligibility: 'ELIGIBLE',
    needsAttention: false,
    lastSynced: '1 min ago',
    brokerConfirmedAt: '10:19:10',
    holdings: [
      { id: 'H-03', ticker: 'AAPL', securityName: 'Apple Inc.', qty: 85.5, averageCost: 221.0, lastPrice: 232.45, value: 19874.48, gainLossPct: 5.18, currency: 'USD', brokerConfirmedAt: '10:19:10', delayedPrice: false },
      { id: 'H-04', ticker: 'NVDA', securityName: 'NVIDIA Corp', qty: 123.15, averageCost: 118.2, lastPrice: 124.5, value: 15332.18, gainLossPct: 5.33, currency: 'USD', brokerConfirmedAt: '10:19:10', delayedPrice: false },
    ],
    orders: [
      { id: 'ORD-102', customerId: 'CUST-US-102', customerName: 'Chioma Okonjo', brokerOrderRef: 'DW-ORD-9912', brokerPartner: 'DRIVEWEALTH_US', ticker: 'AAPL', side: 'BUY', qty: 15.0, price: 232.45, filledQty: 0, status: 'PENDING', ageMinutes: 14, walletDebitAmount: 3486.75, staffAssisted: false, timestamp: '10:06:00', brokerConfirmedAt: '10:06:05' },
    ],
    dividends: [],
    notes: ['Tax certification W-8BEN validated through 2027.'],
  },
  {
    id: 'PF-003',
    customerId: 'CUST-US-103',
    customerName: 'Emeka Eze',
    maskedName: 'E•••• E••',
    revealed: false,
    brokerAccountRef: 'DW-USA-77301',
    brokerPartner: 'DRIVEWEALTH_US',
    market: 'US',
    currency: 'USD',
    portfolioValue: 14200.5,
    cashAtBroker: 120.0,
    buyingPower: 120.0,
    pendingFunding: 0,
    changeTodayPct: -2.15,
    openOrdersCount: 1,
    status: 'RESTRICTED',
    investingEligibility: 'RESTRICTED',
    needsAttention: true,
    attentionReason: 'Order DW-ORD-4401 failed to reach broker (Stale FIX session). Holdings discrepancy 0.5 shares TSLA.',
    lastSynced: 'Just now',
    brokerConfirmedAt: '10:19:30',
    holdings: [
      { id: 'H-05', ticker: 'TSLA', securityName: 'Tesla Inc.', qty: 61.5, averageCost: 242.0, lastPrice: 228.1, value: 14028.15, gainLossPct: -5.74, currency: 'USD', brokerConfirmedAt: '10:19:30', delayedPrice: false },
    ],
    orders: [
      { id: 'ORD-103', customerId: 'CUST-US-103', customerName: 'Emeka Eze', brokerOrderRef: 'DW-ORD-4401', brokerPartner: 'DRIVEWEALTH_US', ticker: 'TSLA', side: 'SELL', qty: 4.0, price: 228.1, filledQty: 0, status: 'FAILED', failureReason: 'FIX Session timeout during pre-trade credit validation', nextStep: 'Review FIX connection & retry order with supervisor quorum', ageMinutes: 45, walletDebitAmount: 0, staffAssisted: false, timestamp: '09:35:00', brokerConfirmedAt: '09:35:12' },
    ],
    dividends: [],
    notes: ['Restricted by compliance pending margin confirmation.'],
  },
  {
    id: 'PF-004',
    customerId: 'CUST-NG-884',
    customerName: 'Folashade Adeleke',
    maskedName: 'F•••••••• A••••••',
    revealed: false,
    brokerAccountRef: 'CHD-NGX-94811',
    brokerPartner: 'NGX_CHAPEL_HILL',
    market: 'NGX',
    currency: 'NGN',
    portfolioValue: 48900000,
    cashAtBroker: 4500000,
    buyingPower: 4500000,
    pendingFunding: 0,
    changeTodayPct: 0.12,
    openOrdersCount: 0,
    status: 'ACTIVE',
    investingEligibility: 'ELIGIBLE',
    needsAttention: false,
    lastSynced: '5 mins ago',
    brokerConfirmedAt: '10:15:00',
    holdings: [
      { id: 'H-06', ticker: 'AIRTELAFRI', securityName: 'Airtel Africa', qty: 22500, averageCost: 1910.0, lastPrice: 1950.0, value: 43875000, gainLossPct: 2.09, currency: 'NGN', brokerConfirmedAt: '10:15:00', delayedPrice: false },
    ],
    orders: [],
    dividends: [],
    notes: ['Institutional tier corporate account.'],
  },
];

export const INITIAL_RECONCILIATION: HoldingReconciliationRow[] = [
  {
    id: 'REC-01',
    ticker: 'TSLA',
    customerId: 'CUST-US-103',
    customerName: 'Emeka Eze',
    brokerPartner: 'DRIVEWEALTH_US',
    ourQty: 62.0,
    brokerQty: 61.5,
    qtyGap: -0.5,
    ourCash: 120.0,
    brokerCash: 120.0,
    cashGap: 0,
    ageDays: 1,
    owner: 'Operations (STF-02)',
    status: 'INVESTIGATING',
    resolutionNote: 'Awaiting DriveWealth fractional lot settlement batch confirmation.',
    lastAuditedAt: '2026-10-10 10:00:00',
  },
  {
    id: 'REC-02',
    ticker: 'GTCO',
    customerId: 'CUST-NG-881',
    customerName: 'Babajide Adeleke',
    brokerPartner: 'NGX_CHAPEL_HILL',
    ourQty: 112800,
    brokerQty: 112800,
    qtyGap: 0,
    ourCash: 850000,
    brokerCash: 850000,
    cashGap: 0,
    ageDays: 0,
    owner: 'Treasury Desk',
    status: 'RESOLVED',
    resolutionNote: 'CSCS depository matched 100% against client subledger.',
    lastAuditedAt: '2026-10-10 09:30:00',
  },
  {
    id: 'REC-03',
    ticker: 'AAPL',
    customerId: 'CUST-US-102',
    customerName: 'Chioma Okonjo',
    brokerPartner: 'DRIVEWEALTH_US',
    ourQty: 85.5,
    brokerQty: 85.5,
    qtyGap: 0,
    ourCash: 3240.25,
    brokerCash: 3240.25,
    cashGap: 0,
    ageDays: 0,
    owner: 'System Auto-Audit',
    status: 'RESOLVED',
    resolutionNote: 'Zero variance confirmed on overnight omnibus sweep.',
    lastAuditedAt: '2026-10-10 09:30:00',
  },
];

export const INITIAL_TRANSFERS: CashFundingTransfer[] = [
  {
    id: 'TRF-901',
    customerId: 'CUST-US-102',
    customerName: 'Chioma Okonjo',
    brokerPartner: 'DRIVEWEALTH_US',
    walletAmount: 1540000,
    walletCurrency: 'NGN',
    brokerAmount: 1000.0,
    brokerCurrency: 'USD',
    fxRateUsed: 1540.0,
    status: 'PENDING',
    delayReason: 'ACH batch cutoff queued for 12:00 PM EST window',
    nextStep: 'Awaiting partner custodian wire clearance confirmation',
    tradeSettlementExpectedDate: '2026-10-12',
    isClientOwed: true,
    timestamp: '2026-10-10 09:15:00',
  },
  {
    id: 'TRF-902',
    customerId: 'CUST-NG-881',
    customerName: 'Babajide Adeleke',
    brokerPartner: 'NGX_CHAPEL_HILL',
    walletAmount: 2500000,
    walletCurrency: 'NGN',
    brokerAmount: 2500000,
    brokerCurrency: 'NGN',
    fxRateUsed: 1.0,
    status: 'SETTLED',
    isClientOwed: true,
    timestamp: '2026-10-10 08:30:00',
  },
];

export const INITIAL_BROKER_ACCOUNTS: BrokerCustomerAccount[] = [
  { id: 'BAC-01', customerId: 'CUST-NG-881', customerName: 'Babajide Adeleke', brokerPartner: 'NGX_CHAPEL_HILL', brokerAccountRef: 'CHD-NGX-90142', openedDate: '2025-04-10', identityVerified: true, riskDisclosureSigned: true, status: 'ACTIVE' },
  { id: 'BAC-02', customerId: 'CUST-US-102', customerName: 'Chioma Okonjo', brokerPartner: 'DRIVEWEALTH_US', brokerAccountRef: 'DW-USA-55219', openedDate: '2025-06-18', identityVerified: true, riskDisclosureSigned: true, status: 'ACTIVE' },
  { id: 'BAC-03', customerId: 'CUST-US-103', customerName: 'Emeka Eze', brokerPartner: 'DRIVEWEALTH_US', brokerAccountRef: 'DW-USA-77301', openedDate: '2025-08-22', identityVerified: true, riskDisclosureSigned: true, status: 'SUSPENDED', failureReason: 'Compliance temporary freeze pending margin review' },
  { id: 'BAC-04', customerId: 'CUST-US-104', customerName: 'Kofi Mensah', brokerPartner: 'DRIVEWEALTH_US', brokerAccountRef: 'DW-PENDING-001', openedDate: '2026-10-08', identityVerified: false, riskDisclosureSigned: true, status: 'FAILED_OPENING', failureReason: 'Passport image blurred during DriveWealth KYC ingestion' },
];

export const INITIAL_CORPORATE_ACTIONS: CorporateActionNotice[] = [
  { id: 'CA-01', ticker: 'AAPL', type: 'STOCK_SPLIT', details: 'No active splits announced for current fiscal quarter.', affectedCustomersCount: 0, effectiveDate: '2026-12-01', requiresManualHandling: false, status: 'AUTOMATED_APPLIED' },
  { id: 'CA-02', ticker: 'FMCG-MERG', type: 'MERGER_ACQUISITION', details: 'Delisting tender offer pending court sanction; manual share conversion required.', affectedCustomersCount: 14, effectiveDate: '2026-10-25', requiresManualHandling: true, status: 'MANUAL_QUEUE_PENDING' },
];

export const INITIAL_ACTIVITY_LOGS: StaffAuditActionLog[] = [
  { id: 'LOG-01', timestamp: '2026-10-10 10:18:22', staffName: 'Aliko Adeleke', staffRole: 'superadmin', actionType: 'SYNC_BROKER', targetPortfolioOrOrder: 'ALL_PORTFOLIOS', reason: 'Scheduled automated synchronization with DriveWealth and Chapel Hill', resultStatus: 'EXECUTED' },
  { id: 'LOG-02', timestamp: '2026-10-10 09:40:11', staffName: 'Fatima Kyari', staffRole: 'compliance', actionType: 'RESTRICT_PORTFOLIO', targetPortfolioOrOrder: 'PF-003 (Emeka Eze)', reason: 'Stalled FIX order and holding variance investigation', resultStatus: 'EXECUTED' },
];

export const INITIAL_DISPUTES: DisputeRecord[] = [
  {
    id: 'DISP-INV-01',
    portfolioId: 'PF-003',
    customerName: 'Emeka Eze',
    relatedItem: 'ORDER',
    claimAmount: 912.4,
    currency: 'USD',
    reason: 'Order ORD-103 timed out on broker gateway, customer requesting cancellation credit',
    status: 'UNDER_REVIEW',
    brokerRef: 'DW-ORD-4401',
    createdAt: '2026-10-10 09:45:00',
  },
  {
    id: 'DISP-INV-02',
    portfolioId: 'PF-001',
    customerName: 'Babajide Adeleke',
    relatedItem: 'DIVIDEND',
    claimAmount: 14000,
    currency: 'NGN',
    reason: 'Withholding tax calculation discrepancy on MTNN Q3 dividend',
    status: 'REFUND_APPROVED',
    brokerRef: 'DIV-101',
    createdAt: '2026-10-09 14:20:00',
  },
];
