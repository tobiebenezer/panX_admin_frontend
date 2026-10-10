'use client';

import React, { useState, useEffect } from 'react';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { dispatchWorkerComputation } from '@/lib/analyticsWorker';

export interface PEFund {
  id: string;
  name: string;
  vintage: number;
  committedUSD: number;
  calledUSD: number;
  dryPowderUSD: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  netIRR: number;
  status: 'ACTIVE_INVESTING' | 'HARVESTING' | 'CLOSED';
}

export interface InvesteeCompany {
  id: string;
  name: string;
  fundId: string;
  sector: 'Fintech' | 'Agri-Logistics' | 'Clean Energy' | 'B2B SaaS' | 'Healthtech' | 'Trade Finance';
  stage: 'Seed' | 'Series A' | 'Series B' | 'Growth' | 'Buyout';
  initialInvestmentUSD: number;
  currentValuationUSD: number;
  ownershipPercent: number;
  moic: number; // Multiple on Invested Capital
  ltmRevenueUSD: number;
  ebitdaMarginPercent: number;
  boardSeat: 'Full Board Seat' | 'Board Observer' | 'Advisory Only';
  esgRating: 'Tier 1 Prime' | 'Tier 2 Compliant';
  investmentDate: string;
}

const SAMPLE_FUNDS: PEFund[] = [
  {
    id: 'FUND-TECH-01',
    name: 'PanaX Africa Tech Fund I',
    vintage: 2024,
    committedUSD: 50000000,
    calledUSD: 38500000,
    dryPowderUSD: 11500000,
    tvpi: 2.12,
    dpi: 0.44,
    rvpi: 1.68,
    netIRR: 28.4,
    status: 'ACTIVE_INVESTING',
  },
  {
    id: 'FUND-AGRI-02',
    name: 'West Africa Agribusiness Growth Fund',
    vintage: 2025,
    committedUSD: 30000000,
    calledUSD: 18000000,
    dryPowderUSD: 12000000,
    tvpi: 1.48,
    dpi: 0.18,
    rvpi: 1.30,
    netIRR: 19.2,
    status: 'ACTIVE_INVESTING',
  },
  {
    id: 'FUND-CREDIT-03',
    name: 'Pan-African Infrastructure Credit Fund',
    vintage: 2024,
    committedUSD: 75000000,
    calledUSD: 50000000,
    dryPowderUSD: 25000000,
    tvpi: 1.72,
    dpi: 0.41,
    rvpi: 1.31,
    netIRR: 22.8,
    status: 'HARVESTING',
  },
];

const SAMPLE_INVESTEES: InvesteeCompany[] = [
  {
    id: 'PE-001',
    name: 'OmniRails B2B Payment Core',
    fundId: 'FUND-TECH-01',
    sector: 'Fintech',
    stage: 'Series B',
    initialInvestmentUSD: 6000000,
    currentValuationUSD: 16800000,
    ownershipPercent: 18.5,
    moic: 2.8,
    ltmRevenueUSD: 14200000,
    ebitdaMarginPercent: 22.4,
    boardSeat: 'Full Board Seat',
    esgRating: 'Tier 1 Prime',
    investmentDate: '2024-03-15',
  },
  {
    id: 'PE-002',
    name: 'KaziHarvest Cold Chain Logistics',
    fundId: 'FUND-AGRI-02',
    sector: 'Agri-Logistics',
    stage: 'Series A',
    initialInvestmentUSD: 4500000,
    currentValuationUSD: 7200000,
    ownershipPercent: 24.0,
    moic: 1.6,
    ltmRevenueUSD: 8900000,
    ebitdaMarginPercent: 18.0,
    boardSeat: 'Full Board Seat',
    esgRating: 'Tier 1 Prime',
    investmentDate: '2025-01-20',
  },
  {
    id: 'PE-003',
    name: 'SaharaSun Mini-Grid Utilities',
    fundId: 'FUND-CREDIT-03',
    sector: 'Clean Energy',
    stage: 'Growth',
    initialInvestmentUSD: 12000000,
    currentValuationUSD: 21600000,
    ownershipPercent: 15.0,
    moic: 1.8,
    ltmRevenueUSD: 24500000,
    ebitdaMarginPercent: 31.5,
    boardSeat: 'Board Observer',
    esgRating: 'Tier 1 Prime',
    investmentDate: '2024-06-10',
  },
  {
    id: 'PE-004',
    name: 'AfriPharm Smart Diagnostics',
    fundId: 'FUND-TECH-01',
    sector: 'Healthtech',
    stage: 'Series A',
    initialInvestmentUSD: 3500000,
    currentValuationUSD: 8400000,
    ownershipPercent: 20.0,
    moic: 2.4,
    ltmRevenueUSD: 6200000,
    ebitdaMarginPercent: 14.5,
    boardSeat: 'Board Observer',
    esgRating: 'Tier 1 Prime',
    investmentDate: '2024-09-05',
  },
  {
    id: 'PE-005',
    name: 'AtlasTrade Export Securitization',
    fundId: 'FUND-CREDIT-03',
    sector: 'Trade Finance',
    stage: 'Growth',
    initialInvestmentUSD: 8500000,
    currentValuationUSD: 14450000,
    ownershipPercent: 12.5,
    moic: 1.7,
    ltmRevenueUSD: 18100000,
    ebitdaMarginPercent: 26.0,
    boardSeat: 'Full Board Seat',
    esgRating: 'Tier 2 Compliant',
    investmentDate: '2024-11-18',
  },
];

export interface PECustomerCommitment {
  id: string;
  customerId: string;
  customerName: string;
  entityType: 'Institutional LP' | 'Family Office' | 'HNW Accredited' | 'Sovereign Wealth' | 'Corporate Treasury';
  advisorStaffId: string;
  advisorStaffName: string;
  fundId: string;
  fundName: string;
  committedAmountUSD: number;
  calledAmountUSD: number;
  distributedUSD: number;
  uncalledCapitalUSD: number;
  kycTier: 'Tier 3 Institutional' | 'Tier 3 HNW' | 'PEP Verified';
  status: 'ACTIVE_LP' | 'PENDING_SUBSCRIPTION' | 'DEFAULT_NOTICE';
  subscriptionDate: string;
}

export interface PECustomerOrder {
  id: string;
  orderType: 'LP_SUBSCRIPTION' | 'CAPITAL_DRAWDOWN' | 'SECONDARY_TRANSFER' | 'LP_DISTRIBUTION_PAYOUT';
  customerId: string;
  customerName: string;
  fundId: string;
  fundName: string;
  orderAmountUSD: number;
  placedByStaffId: string;
  placedByStaffName: string;
  approvalStatus: 'APPROVED' | 'PENDING_DUAL_CONTROL' | 'REJECTED' | 'EXECUTED';
  executionStatus: 'SETTLED' | 'AWAITING_WIRE' | 'CSCS_ESCROW_LOCKED';
  wireReference: string;
  notes: string;
  timestamp: string;
}

export const SAMPLE_PE_CUSTOMERS: PECustomerCommitment[] = [
  {
    id: 'LP-COM-001',
    customerId: 'CUST-INST-101',
    customerName: 'Meridian Capital Partners',
    entityType: 'Institutional LP',
    advisorStaffId: 'STF-01',
    advisorStaffName: 'Aliko Adeleke',
    fundId: 'FUND-TECH-01',
    fundName: 'PanaX Africa Tech Fund I',
    committedAmountUSD: 10000000,
    calledAmountUSD: 7700000,
    distributedUSD: 3388000,
    uncalledCapitalUSD: 2300000,
    kycTier: 'Tier 3 Institutional',
    status: 'ACTIVE_LP',
    subscriptionDate: '2024-02-10',
  },
  {
    id: 'LP-COM-002',
    customerId: 'CUST-FO-202',
    customerName: 'Ahmadu Bello Family Office',
    entityType: 'Family Office',
    advisorStaffId: 'STF-02',
    advisorStaffName: 'Fatima Kyari',
    fundId: 'FUND-AGRI-02',
    fundName: 'West Africa Agribusiness Growth Fund',
    committedAmountUSD: 5000000,
    calledAmountUSD: 3000000,
    distributedUSD: 540000,
    uncalledCapitalUSD: 2000000,
    kycTier: 'Tier 3 HNW',
    status: 'ACTIVE_LP',
    subscriptionDate: '2025-01-14',
  },
  {
    id: 'LP-COM-003',
    customerId: 'CUST-SWF-303',
    customerName: 'Kigali Sovereign Holdings',
    entityType: 'Sovereign Wealth',
    advisorStaffId: 'STF-01',
    advisorStaffName: 'Aliko Adeleke',
    fundId: 'FUND-CREDIT-03',
    fundName: 'Pan-African Infrastructure Credit Fund',
    committedAmountUSD: 15000000,
    calledAmountUSD: 10000000,
    distributedUSD: 4100000,
    uncalledCapitalUSD: 5000000,
    kycTier: 'Tier 3 Institutional',
    status: 'ACTIVE_LP',
    subscriptionDate: '2024-05-18',
  },
  {
    id: 'LP-COM-004',
    customerId: 'CUST-HNW-404',
    customerName: 'Folashade Adeleke Trust',
    entityType: 'HNW Accredited',
    advisorStaffId: 'STF-03',
    advisorStaffName: 'Chidi Okafor',
    fundId: 'FUND-TECH-01',
    fundName: 'PanaX Africa Tech Fund I',
    committedAmountUSD: 2500000,
    calledAmountUSD: 1925000,
    distributedUSD: 847000,
    uncalledCapitalUSD: 575000,
    kycTier: 'Tier 3 HNW',
    status: 'ACTIVE_LP',
    subscriptionDate: '2024-04-22',
  },
  {
    id: 'LP-COM-005',
    customerId: 'CUST-CORP-505',
    customerName: 'Zenith Global Treasury Ltd',
    entityType: 'Corporate Treasury',
    advisorStaffId: 'STF-04',
    advisorStaffName: 'Amara Nwosu',
    fundId: 'FUND-CREDIT-03',
    fundName: 'Pan-African Infrastructure Credit Fund',
    committedAmountUSD: 7500000,
    calledAmountUSD: 5000000,
    distributedUSD: 2050000,
    uncalledCapitalUSD: 2500000,
    kycTier: 'Tier 3 Institutional',
    status: 'ACTIVE_LP',
    subscriptionDate: '2024-07-30',
  },
];

export const SAMPLE_PE_ORDERS: PECustomerOrder[] = [
  {
    id: 'ORD-PE-901',
    orderType: 'LP_SUBSCRIPTION',
    customerId: 'CUST-INST-101',
    customerName: 'Meridian Capital Partners',
    fundId: 'FUND-TECH-01',
    fundName: 'PanaX Africa Tech Fund I',
    orderAmountUSD: 10000000,
    placedByStaffId: 'STF-01',
    placedByStaffName: 'Aliko Adeleke (Managing Director)',
    approvalStatus: 'EXECUTED',
    executionStatus: 'SETTLED',
    wireReference: 'SWIFT-FEDWIRE-882194',
    notes: 'Signed LP Limited Partnership Agreement on file with legal counsel.',
    timestamp: '2024-02-10 11:20:00',
  },
  {
    id: 'ORD-PE-902',
    orderType: 'CAPITAL_DRAWDOWN',
    customerId: 'CUST-FO-202',
    customerName: 'Ahmadu Bello Family Office',
    fundId: 'FUND-AGRI-02',
    fundName: 'West Africa Agribusiness Growth Fund',
    orderAmountUSD: 750000,
    placedByStaffId: 'STF-02',
    placedByStaffName: 'Fatima Kyari (Private Wealth)',
    approvalStatus: 'EXECUTED',
    executionStatus: 'SETTLED',
    wireReference: 'NIBSS-NIP-9901421',
    notes: 'Q2 Portfolio add-on round for KaziHarvest logistics expansion.',
    timestamp: '2026-09-15 09:40:12',
  },
  {
    id: 'ORD-PE-903',
    orderType: 'SECONDARY_TRANSFER',
    customerId: 'CUST-HNW-404',
    customerName: 'Folashade Adeleke Trust',
    fundId: 'FUND-TECH-01',
    fundName: 'PanaX Africa Tech Fund I',
    orderAmountUSD: 500000,
    placedByStaffId: 'STF-03',
    placedByStaffName: 'Chidi Okafor (Director)',
    approvalStatus: 'PENDING_DUAL_CONTROL',
    executionStatus: 'CSCS_ESCROW_LOCKED',
    wireReference: 'ESCROW-BLK-40291',
    notes: 'Secondary LP stake sale to institutional co-investor at 1.95x FMV.',
    timestamp: '2026-10-10 14:15:30',
  },
  {
    id: 'ORD-PE-904',
    orderType: 'LP_DISTRIBUTION_PAYOUT',
    customerId: 'CUST-SWF-303',
    customerName: 'Kigali Sovereign Holdings',
    fundId: 'FUND-CREDIT-03',
    fundName: 'Pan-African Infrastructure Credit Fund',
    orderAmountUSD: 820000,
    placedByStaffId: 'STF-01',
    placedByStaffName: 'Aliko Adeleke (Managing Director)',
    approvalStatus: 'APPROVED',
    executionStatus: 'AWAITING_WIRE',
    wireReference: 'WIRE-OUT-KGL-1092',
    notes: 'SaharaSun mezzanine yield payout to limited partners.',
    timestamp: '2026-10-09 16:30:00',
  },
];

export function PrivateEquityManagement() {
  const { toast } = useToast();
  const [funds, setFunds] = useState<PEFund[]>(SAMPLE_FUNDS);
  const [investees, setInvestees] = useState<InvesteeCompany[]>(SAMPLE_INVESTEES);
  const [customers, setCustomers] = useState<PECustomerCommitment[]>(SAMPLE_PE_CUSTOMERS);
  const [orders, setOrders] = useState<PECustomerOrder[]>(SAMPLE_PE_ORDERS);
  const [selectedFundId, setSelectedFundId] = useState<string>('ALL');
  const [peViewMode, setPeViewMode] = useState<'FUNDS_PORTFOLIO' | 'CUSTOMER_ORDERS'>('CUSTOMER_ORDERS');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Staff Place PE Order Modal
  const [createOrderModal, setCreateOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerId: 'CUST-INST-101',
    fundId: 'FUND-TECH-01',
    orderType: 'LP_SUBSCRIPTION' as PECustomerOrder['orderType'],
    orderAmountUSD: '1000000',
    placedByStaffName: 'Aliko Adeleke (Managing Director)',
    wireReference: 'WIRE-ORD-REF-' + Math.floor(100000 + Math.random() * 900000),
    notes: 'Institutional capital commitment signed under Master Subscription Agreement.',
  });

  // Call Capital on Customer Modal
  const [customerCallModal, setCustomerCallModal] = useState<{
    isOpen: boolean;
    customer: PECustomerCommitment | null;
    callAmountUSD: string;
  }>({
    isOpen: false,
    customer: null,
    callAmountUSD: '500000',
  });

  // Capital Call Modal
  const [callModal, setCallModal] = useState<{ isOpen: boolean; fund: PEFund | null }>({
    isOpen: false,
    fund: null,
  });
  const [callAmount, setCallAmount] = useState('2500000');
  const [callNoticeRef, setCallNoticeRef] = useState('CALL-2026-Q3-01');

  // Distribution Modal
  const [distModal, setDistModal] = useState<{ isOpen: boolean; fund: PEFund | null }>({
    isOpen: false,
    fund: null,
  });
  const [distAmount, setDistAmount] = useState('1800000');
  const [distType, setDistType] = useState<'CASH_DIVIDEND' | 'EXIT_PROCEEDS'>('EXIT_PROCEEDS');

  // Valuation Update Modal
  const [valModal, setValModal] = useState<{ isOpen: boolean; company: InvesteeCompany | null }>({
    isOpen: false,
    company: null,
  });
  const [newValuation, setNewValuation] = useState('20000000');

  const filteredInvestees = selectedFundId === 'ALL'
    ? investees
    : investees.filter((c) => c.fundId === selectedFundId);

  const filteredOrders = orders.filter((o) => {
    if (orderTypeFilter !== 'ALL' && o.orderType !== orderTypeFilter) return false;
    if (selectedFundId !== 'ALL' && o.fundId !== selectedFundId) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.wireReference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCommitted = funds.reduce((acc, f) => acc + f.committedUSD, 0);
  const totalCalled = funds.reduce((acc, f) => acc + f.calledUSD, 0);
  const totalDryPowder = funds.reduce((acc, f) => acc + f.dryPowderUSD, 0);

  // Background Worker Computed Allocation Stats for Customers
  const [customerWorkerMetrics, setCustomerWorkerMetrics] = useState<{
    totalCommitted: number;
    totalCalled: number;
    totalDistributed: number;
    uncalledCapital: number;
    aggregateCallRate: number;
    activeInvestorsCount: number;
    durationMs: number;
  } | null>(null);

  useEffect(() => {
    dispatchWorkerComputation({
      type: 'CALCULATE_PE_CUSTOMER_ALLOCATIONS',
      payload: {
        commitments: customers.map((c) => ({
          committedAmountUSD: c.committedAmountUSD,
          calledAmountUSD: c.calledAmountUSD,
          distributedUSD: c.distributedUSD,
        })),
      },
    }).then((res) => {
      setCustomerWorkerMetrics({
        ...res.data,
        durationMs: res.durationMs,
      });
    });
  }, [customers]);

  const [workerPeMetrics, setWorkerPeMetrics] = useState<{
    tvpi: number;
    dpi: number;
    rvpi: number;
    dryPowder: number;
    netIrr: number;
    durationMs: number;
  } | null>(null);

  useEffect(() => {
    const totalDistributions = funds.reduce((acc, f) => acc + f.calledUSD * f.dpi, 0);
    const totalNav = funds.reduce((acc, f) => acc + f.calledUSD * f.rvpi, 0);

    dispatchWorkerComputation({
      type: 'COMPUTE_PE_METRICS',
      payload: {
        committed: totalCommitted,
        called: totalCalled,
        distributions: totalDistributions,
        nav: totalNav,
        cashflows: [],
      },
    }).then((res) => {
      setWorkerPeMetrics({
        tvpi: res.data.tvpi,
        dpi: res.data.dpi,
        rvpi: res.data.rvpi,
        dryPowder: res.data.dryPowder,
        netIrr: res.data.netIrr,
        durationMs: res.durationMs,
      });
    });
  }, [totalCommitted, totalCalled, funds]);

  const handleExecuteCapitalCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callModal.fund) return;
    const amount = parseFloat(callAmount) || 0;
    toast('success', `Capital Call notice dispatched for $${fmtNum(amount)} from ${callModal.fund.name} LPs.`);
    setCallModal({ isOpen: false, fund: null });
  };

  const handleExecuteDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distModal.fund) return;
    const amount = parseFloat(distAmount) || 0;
    toast('success', `LP Distribution of $${fmtNum(amount)} processed for ${distModal.fund.name} partners.`);
    setDistModal({ isOpen: false, fund: null });
  };

  const handleExecuteValuationUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valModal.company) return;
    const updatedVal = parseFloat(newValuation) || valModal.company.currentValuationUSD;
    const updatedMoic = Number((updatedVal / valModal.company.initialInvestmentUSD).toFixed(2));
    setInvestees((prev) =>
      prev.map((c) =>
        c.id === valModal.company?.id ? { ...c, currentValuationUSD: updatedVal, moic: updatedMoic } : c
      )
    );
    toast('success', `Valuation updated for ${valModal.company.name}: $${fmtNum(updatedVal)} (${updatedMoic}x MOIC)`);
    setValModal({ isOpen: false, company: null });
  };

  const handleCreateCustomerOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newOrderForm.orderAmountUSD) || 0;
    if (amount <= 0) {
      toast('error', 'Order amount must be greater than zero.');
      return;
    }

    const selectedCust = customers.find((c) => c.customerId === newOrderForm.customerId);
    const selectedFund = funds.find((f) => f.id === newOrderForm.fundId);

    const newOrder: PECustomerOrder = {
      id: `ORD-PE-${Math.floor(900 + Math.random() * 99)}`,
      orderType: newOrderForm.orderType,
      customerId: newOrderForm.customerId,
      customerName: selectedCust ? selectedCust.customerName : 'Accredited Customer',
      fundId: newOrderForm.fundId,
      fundName: selectedFund ? selectedFund.name : 'PanaX PE Fund',
      orderAmountUSD: amount,
      placedByStaffId: 'STF-CURRENT',
      placedByStaffName: newOrderForm.placedByStaffName,
      approvalStatus: amount >= 1000000 ? 'PENDING_DUAL_CONTROL' : 'APPROVED',
      executionStatus: 'AWAITING_WIRE',
      wireReference: newOrderForm.wireReference,
      notes: newOrderForm.notes,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If subscription, update commitment
    if (newOrderForm.orderType === 'LP_SUBSCRIPTION') {
      if (selectedCust) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCust.id
              ? {
                  ...c,
                  committedAmountUSD: c.committedAmountUSD + amount,
                  uncalledCapitalUSD: c.uncalledCapitalUSD + amount,
                }
              : c
          )
        );
      }
    }

    toast(
      'success',
      `Order ${newOrder.id} (${newOrder.orderType}) placed successfully for ${newOrder.customerName}. ${amount >= 1000000 ? 'Dual-Control Quorum routing active.' : 'Approved for settlement.'}`
    );
    setCreateOrderModal(false);
  };

  const handleApproveOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, approvalStatus: 'EXECUTED', executionStatus: 'SETTLED' }
          : o
      )
    );
    toast('success', `Order ${orderId} dual-signoff verified and settlement executed.`);
  };

  const handleExecuteCustomerCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCallModal.customer) return;
    const callAmt = parseFloat(customerCallModal.callAmountUSD) || 0;
    const cust = customerCallModal.customer;

    if (callAmt > cust.uncalledCapitalUSD) {
      toast('error', `Cannot call more than remaining uncalled capital ($${fmtNum(cust.uncalledCapitalUSD)}).`);
      return;
    }

    // Record new order
    const callOrder: PECustomerOrder = {
      id: `ORD-CALL-${Math.floor(800 + Math.random() * 199)}`,
      orderType: 'CAPITAL_DRAWDOWN',
      customerId: cust.customerId,
      customerName: cust.customerName,
      fundId: cust.fundId,
      fundName: cust.fundName,
      orderAmountUSD: callAmt,
      placedByStaffId: cust.advisorStaffId,
      placedByStaffName: cust.advisorStaffName,
      approvalStatus: 'APPROVED',
      executionStatus: 'AWAITING_WIRE',
      wireReference: `CALL-WIRE-${cust.id}-${Date.now().toString().slice(-4)}`,
      notes: `Capital drawdown against active LP commitment in ${cust.fundName}.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setOrders((prev) => [callOrder, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === cust.id
          ? {
              ...c,
              calledAmountUSD: c.calledAmountUSD + callAmt,
              uncalledCapitalUSD: c.uncalledCapitalUSD - callAmt,
            }
          : c
      )
    );

    toast(
      'success',
      `Drawdown order ${callOrder.id} created: $${fmtNum(callAmt)} drawn against ${cust.customerName}.`
    );
    setCustomerCallModal({ isOpen: false, customer: null, callAmountUSD: '0' });
  };

  return (
    <div className="d-flex flex-column gap-3 font-sans">
      {/* Institutional PE Scorecards */}
      <div className="row g-3 font-monospace">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">TOTAL PE COMMITTED</span>
            <h3 className="fw-bold fs-22 text-dark m-0 mt-1">${fmtNum(totalCommitted)}</h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Called: ${fmtNum(totalCalled)} ({((totalCalled / totalCommitted) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">DRY POWDER (RESERVES)</span>
            <h3 className="fw-bold fs-22 text-primary m-0 mt-1" style={{ color: '#16B364' }}>
              ${fmtNum(totalDryPowder)}
            </h3>
            <div className="mt-2 fs-11 text-muted">
              <span>Uncalled LP capital for deal pipeline</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">PORTFOLIO TVPI &amp; DPI</span>
              {workerPeMetrics && (
                <span className="badge bg-success-subtle text-success fs-10 px-1 py-0">
                  Worker {workerPeMetrics.durationMs}ms
                </span>
              )}
            </div>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <h3 className="fw-bold fs-22 text-success m-0">
                {workerPeMetrics ? `${workerPeMetrics.tvpi}x TVPI` : '1.84x TVPI'}
              </h3>
              <span className="text-muted fs-12">
                • {workerPeMetrics ? `${workerPeMetrics.dpi}x DPI` : '0.38x DPI'}
              </span>
            </div>
            <div className="mt-2 fs-11 text-secondary">
              <span>RVPI: {workerPeMetrics ? `${workerPeMetrics.rvpi}x` : '1.46x'} active unrealized value</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
            <span className="text-muted fs-11 fw-semibold text-uppercase tracking-wider">WEIGHTED NET IRR</span>
            <h3 className="fw-bold fs-22 text-dark m-0 mt-1">24.6%</h3>
            <div className="mt-2 fs-11 text-success d-flex align-items-center gap-1">
              <i className="ti ti-arrow-up-right" /> Top-quartile African VC/PE benchmark
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Bar: Customer Orders vs Institutional Fund Portfolios */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-0 d-flex align-items-center justify-content-between flex-wrap">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 fs-13 fw-semibold ${peViewMode === 'CUSTOMER_ORDERS' ? 'active text-success' : 'text-muted'}`}
                style={peViewMode === 'CUSTOMER_ORDERS' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setPeViewMode('CUSTOMER_ORDERS')}
              >
                <i className="ti ti-users-group me-1" /> Customer PE Commitments &amp; Orders ({orders.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 fs-13 fw-semibold ${peViewMode === 'FUNDS_PORTFOLIO' ? 'active text-success' : 'text-muted'}`}
                style={peViewMode === 'FUNDS_PORTFOLIO' ? { color: '#16B364', borderBottom: '2px solid #16B364' } : undefined}
                onClick={() => setPeViewMode('FUNDS_PORTFOLIO')}
              >
                <i className="ti ti-briefcase me-1" /> PE Funds &amp; Investee Portfolio ({funds.length})
              </button>
            </li>
          </ul>

          <div className="p-3 d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm fs-12"
              value={selectedFundId}
              onChange={(e) => setSelectedFundId(e.target.value)}
            >
              <option value="ALL">All Active Funds ({funds.length})</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.vintage})
                </option>
              ))}
            </select>

            {peViewMode === 'CUSTOMER_ORDERS' && (
              <button
                type="button"
                className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
                onClick={() => setCreateOrderModal(true)}
              >
                <i className="ti ti-plus" /> Place PE Order for Customer
              </button>
            )}
          </div>
        </div>
      </div>

      {peViewMode === 'CUSTOMER_ORDERS' ? (
        <>
          {/* Customer Commitment Roster */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark m-0 fs-14">
                  <i className="ti ti-user-shield text-success me-1" /> Customer LP Commitments &amp; Uncalled Capital
                </h6>
                <span className="text-muted fs-12">
                  Staff advisors managing limited partner capital calls, distributions, and allocation health
                </span>
              </div>
              {customerWorkerMetrics && (
                <span className="badge bg-light text-secondary border font-monospace fs-11">
                  Worker {customerWorkerMetrics.durationMs}ms · Call Rate: {customerWorkerMetrics.aggregateCallRate}%
                </span>
              )}
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
                  <thead className="table-light fs-12 text-muted border-bottom">
                    <tr>
                      <th className="ps-4">LP / Customer Entity</th>
                      <th>Assigned Fund</th>
                      <th>Committed</th>
                      <th>Called Capital</th>
                      <th>Uncalled Capital</th>
                      <th>Distributions</th>
                      <th>Advisory Partner</th>
                      <th>KYC / Status</th>
                      <th className="pe-4 text-end">Staff Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark font-sans">{c.customerName}</div>
                          <span className="text-muted fs-11 font-sans">{c.entityType} · {c.customerId}</span>
                        </td>
                        <td>
                          <span className="text-dark fw-medium font-sans fs-12">{c.fundName}</span>
                        </td>
                        <td className="fw-bold text-dark">${fmtNum(c.committedAmountUSD)}</td>
                        <td className="text-secondary">${fmtNum(c.calledAmountUSD)}</td>
                        <td className="text-success fw-semibold">${fmtNum(c.uncalledCapitalUSD)}</td>
                        <td className="text-primary">${fmtNum(c.distributedUSD)}</td>
                        <td>
                          <div className="font-sans text-dark fw-medium fs-12">{c.advisorStaffName}</div>
                          <span className="text-muted fs-10 font-sans">{c.advisorStaffId}</span>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success fs-10 font-sans d-block mb-1">
                            {c.kycTier}
                          </span>
                          <span className="badge bg-light text-secondary border fs-10 font-sans">
                            {c.status}
                          </span>
                        </td>
                        <td className="pe-4 text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-success py-0 px-2 fs-11 font-sans"
                              style={{ borderColor: '#16B364', color: '#16B364' }}
                              onClick={() => {
                                setCustomerCallModal({
                                  isOpen: true,
                                  customer: c,
                                  callAmountUSD: String(Math.min(500000, c.uncalledCapitalUSD)),
                                });
                              }}
                            >
                              Call Capital
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary py-0 px-2 fs-11 font-sans"
                              onClick={() => {
                                setNewOrderForm({
                                  customerId: c.customerId,
                                  fundId: c.fundId,
                                  orderType: 'SECONDARY_TRANSFER',
                                  orderAmountUSD: '250000',
                                  placedByStaffName: c.advisorStaffName,
                                  wireReference: 'SEC-TX-' + Math.floor(1000 + Math.random() * 9000),
                                  notes: `Secondary transfer order drafted for ${c.customerName}.`,
                                });
                                setCreateOrderModal(true);
                              }}
                            >
                              New Order
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer PE Order Stream */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark m-0 fs-14">
                  <i className="ti ti-file-invoice text-success me-1" /> Customer Private Equity Order Stream
                </h6>
                <span className="text-muted fs-12">
                  Institutional subscriptions, capital drawdown execution, and secondary market transfers
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm fs-12 font-sans"
                  placeholder="Filter customer or wire ref..."
                  style={{ width: 200 }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />

                <select
                  className="form-select form-select-sm fs-12"
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Order Types</option>
                  <option value="LP_SUBSCRIPTION">LP Subscription</option>
                  <option value="CAPITAL_DRAWDOWN">Capital Drawdown</option>
                  <option value="SECONDARY_TRANSFER">Secondary Transfer</option>
                  <option value="LP_DISTRIBUTION_PAYOUT">Distribution Payout</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
                  <thead className="table-light fs-12 text-muted border-bottom">
                    <tr>
                      <th className="ps-4">Order ID &amp; Type</th>
                      <th>Customer / LP</th>
                      <th>Fund</th>
                      <th>Amount (USD)</th>
                      <th>Placed By (Staff)</th>
                      <th>Approval Status</th>
                      <th>Settlement / Wire</th>
                      <th>Timestamp</th>
                      <th className="pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark">{o.id}</div>
                          <span className="badge bg-light text-secondary border fs-10 font-sans">
                            {o.orderType.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="font-sans text-dark fw-medium">{o.customerName}</div>
                          <span className="text-muted fs-11 font-sans">{o.customerId}</span>
                        </td>
                        <td>
                          <span className="font-sans text-muted fs-12">{o.fundName}</span>
                        </td>
                        <td className="fw-bold text-dark fs-14">
                          ${fmtNum(o.orderAmountUSD)}
                        </td>
                        <td>
                          <div className="font-sans text-dark fs-12">{o.placedByStaffName}</div>
                          <span className="text-muted fs-10 font-sans">{o.placedByStaffId}</span>
                        </td>
                        <td>
                          <span
                            className={`badge fs-10 font-sans ${
                              o.approvalStatus === 'EXECUTED'
                                ? 'bg-success-subtle text-success'
                                : o.approvalStatus === 'PENDING_DUAL_CONTROL'
                                ? 'bg-warning-subtle text-warning border border-warning'
                                : 'bg-primary-subtle text-primary'
                            }`}
                          >
                            {o.approvalStatus === 'PENDING_DUAL_CONTROL' ? 'Dual-Control Required' : o.approvalStatus}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fs-10 font-sans d-block mb-1">
                            {o.executionStatus}
                          </span>
                          <span className="text-muted fs-10">{o.wireReference}</span>
                        </td>
                        <td className="text-muted fs-11">{o.timestamp}</td>
                        <td className="pe-4 text-end">
                          {o.approvalStatus === 'PENDING_DUAL_CONTROL' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning py-0 px-2 fs-11 font-sans"
                              onClick={() => handleApproveOrder(o.id)}
                            >
                              Approve Signoff
                            </button>
                          ) : (
                            <span className="badge bg-light text-muted border fs-10 font-sans">
                              Audit Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Active PE Funds Roster */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark m-0 fs-14">
                  <i className="ti ti-briefcase text-success me-1" /> Institutional Private Equity Funds
                </h6>
                <span className="text-muted fs-12">Fund vintages, dry powder, and institutional investor multiples</span>
              </div>
            </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Fund Name</th>
                  <th>Vintage</th>
                  <th>Committed</th>
                  <th>Called Capital</th>
                  <th>Dry Powder</th>
                  <th>TVPI</th>
                  <th>DPI</th>
                  <th>Net IRR</th>
                  <th className="pe-4 text-end">LP Operations</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark font-sans">{f.name}</div>
                      <span className="badge rounded-pill bg-light text-secondary border fs-10">
                        {f.status}
                      </span>
                    </td>
                    <td>{f.vintage}</td>
                    <td className="fw-semibold text-dark">${fmtNum(f.committedUSD)}</td>
                    <td>${fmtNum(f.calledUSD)}</td>
                    <td className="text-success fw-semibold">${fmtNum(f.dryPowderUSD)}</td>
                    <td className="fw-bold text-dark">{f.tvpi}x</td>
                    <td className="text-secondary">{f.dpi}x</td>
                    <td className="fw-bold text-success">+{f.netIRR}%</td>
                    <td className="pe-4 text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary py-0 px-2 fs-11"
                          onClick={() => setCallModal({ isOpen: true, fund: f })}
                        >
                          Capital Call
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary py-0 px-2 fs-11"
                          onClick={() => setDistModal({ isOpen: true, fund: f })}
                        >
                          Distribute
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Investee / Portfolio Companies Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-14">
              <i className="ti ti-building text-primary me-1" /> Portfolio Investee Companies
            </h6>
            <span className="text-muted fs-12">Growth metrics, board governance, MOIC multiples, and valuation audits</span>
          </div>
          <span className="badge rounded-pill bg-light text-secondary border font-monospace">
            {filteredInvestees.length} Direct Investments
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13 font-monospace">
              <thead className="table-light fs-12 text-muted border-bottom">
                <tr>
                  <th className="ps-4">Company</th>
                  <th>Sector &amp; Stage</th>
                  <th>Invested Capital</th>
                  <th>Current FMV</th>
                  <th>Stake %</th>
                  <th>MOIC</th>
                  <th>LTM Revenue</th>
                  <th>Governance Seat</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestees.map((c) => (
                  <tr key={c.id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark font-sans">{c.name}</div>
                      <span className="text-muted fs-11 font-sans">Invested {fmtDate(c.investmentDate)}</span>
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark border fs-10 font-sans me-1">
                        {c.sector}
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary fs-10 font-sans">
                        {c.stage}
                      </span>
                    </td>
                    <td>${fmtNum(c.initialInvestmentUSD)}</td>
                    <td className="fw-bold text-dark">${fmtNum(c.currentValuationUSD)}</td>
                    <td className="fw-semibold text-secondary">{c.ownershipPercent}%</td>
                    <td>
                      <span className="badge bg-success-subtle text-success fs-11 fw-bold">
                        {c.moic}x
                      </span>
                    </td>
                    <td>${fmtNum(c.ltmRevenueUSD)} <small className="text-muted font-sans">({c.ebitdaMarginPercent}% EBITDA)</small></td>
                    <td>
                      <span className="badge bg-light text-dark border fs-11 font-sans">
                        <i className="ti ti-id-badge-2 me-1" /> {c.boardSeat}
                      </span>
                    </td>
                    <td className="pe-4 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11 font-sans"
                        onClick={() => {
                          setValModal({ isOpen: true, company: c });
                          setNewValuation(String(c.currentValuationUSD));
                        }}
                      >
                        Revalue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Staff Place PE Order for Customer Modal */}
      {createOrderModal && (
        <Modal
          title="Place Private Equity Order for Customer"
          open={true}
          onClose={() => setCreateOrderModal(false)}
        >
          <form onSubmit={handleCreateCustomerOrder}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Customer / LP Entity</label>
              <select
                className="form-select form-select-sm fs-12"
                value={newOrderForm.customerId}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, customerId: e.target.value })}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.customerId}>
                    {c.customerName} ({c.entityType}) — KYC: {c.kycTier}
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-dark">Order Type</label>
                <select
                  className="form-select form-select-sm fs-12"
                  value={newOrderForm.orderType}
                  onChange={(e: any) => setNewOrderForm({ ...newOrderForm, orderType: e.target.value })}
                  required
                >
                  <option value="LP_SUBSCRIPTION">LP Commitment Subscription</option>
                  <option value="CAPITAL_DRAWDOWN">Capital Call Drawdown</option>
                  <option value="SECONDARY_TRANSFER">Secondary Stake Transfer</option>
                  <option value="LP_DISTRIBUTION_PAYOUT">Distribution Capital Payout</option>
                </select>
              </div>

              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-dark">Target Fund</label>
                <select
                  className="form-select form-select-sm fs-12"
                  value={newOrderForm.fundId}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, fundId: e.target.value })}
                  required
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-2 mb-3 font-monospace">
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-dark font-sans">Order Amount (USD)</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={newOrderForm.orderAmountUSD}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, orderAmountUSD: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-dark font-sans">Depository / Wire Ref</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={newOrderForm.wireReference}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, wireReference: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Executing Staff Wealth Partner</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newOrderForm.placedByStaffName}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, placedByStaffName: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Audit &amp; Mandate Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={newOrderForm.notes}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
              />
              <span className="text-muted fs-11 mt-1 d-block">
                Orders &ge; $1,000,000 automatically route to Dual-Control 4-Eyes quorum before settlement.
              </span>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setCreateOrderModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success text-white"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Execute Order Routing
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Customer Capital Drawdown Modal */}
      {customerCallModal.isOpen && customerCallModal.customer && (
        <Modal
          title={`Execute Capital Drawdown: ${customerCallModal.customer.customerName}`}
          open={true}
          onClose={() => setCustomerCallModal({ isOpen: false, customer: null, callAmountUSD: '0' })}
        >
          <form onSubmit={handleExecuteCustomerCall}>
            <div className="bg-light p-3 rounded mb-3 font-monospace fs-12">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Target PE Fund:</span>
                <strong className="text-dark font-sans">{customerCallModal.customer.fundName}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Total Commitment:</span>
                <strong>${fmtNum(customerCallModal.customer.committedAmountUSD)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Already Called:</span>
                <span>${fmtNum(customerCallModal.customer.calledAmountUSD)}</span>
              </div>
              <div className="d-flex justify-content-between text-success border-top pt-1 mt-1">
                <span>Available Uncalled Capital:</span>
                <strong>${fmtNum(customerCallModal.customer.uncalledCapitalUSD)}</strong>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Drawdown Amount (USD)</label>
              <div className="input-group input-group-sm font-monospace">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  value={customerCallModal.callAmountUSD}
                  onChange={(e) => setCustomerCallModal({ ...customerCallModal, callAmountUSD: e.target.value })}
                  max={customerCallModal.customer.uncalledCapitalUSD}
                  required
                />
              </div>
              <span className="text-muted fs-11 mt-1 d-block">
                Calls will debit client omnibus cash escrow and credit fund investment reserves.
              </span>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setCustomerCallModal({ isOpen: false, customer: null, callAmountUSD: '0' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success text-white"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Confirm Drawdown Order
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Capital Call Modal */}
      {callModal.isOpen && callModal.fund && (
        <Modal
          title={`Dispatch Capital Call Notice: ${callModal.fund.name}`}
          open={true}
          onClose={() => setCallModal({ isOpen: false, fund: null })}
        >
          <form onSubmit={handleExecuteCapitalCall}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Call Notice Reference</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={callNoticeRef}
                onChange={(e) => setCallNoticeRef(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Drawdown Amount (USD)</label>
              <input
                type="number"
                className="form-control form-control-sm font-monospace"
                value={callAmount}
                onChange={(e) => setCallAmount(e.target.value)}
                required
              />
              <span className="text-muted fs-11 mt-1 d-block">
                Dry Powder Remaining: ${fmtNum(callModal.fund.dryPowderUSD)}
              </span>
            </div>
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setCallModal({ isOpen: false, fund: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success text-white"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Issue Capital Call Notice
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LP Distribution Modal */}
      {distModal.isOpen && distModal.fund && (
        <Modal
          title={`Process LP Distribution: ${distModal.fund.name}`}
          open={true}
          onClose={() => setDistModal({ isOpen: false, fund: null })}
        >
          <form onSubmit={handleExecuteDistribution}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Distribution Type</label>
              <select
                className="form-select form-select-sm fs-12"
                value={distType}
                onChange={(e: any) => setDistType(e.target.value)}
              >
                <option value="EXIT_PROCEEDS">Realized Exit Proceeds (Return of Capital + Profit)</option>
                <option value="CASH_DIVIDEND">Portfolio Operating Dividend Flow</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Distribution Total (USD)</label>
              <input
                type="number"
                className="form-control form-control-sm font-monospace"
                value={distAmount}
                onChange={(e) => setDistAmount(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDistModal({ isOpen: false, fund: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success text-white"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Execute LP Wire Transfers
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Valuation Update Modal */}
      {valModal.isOpen && valModal.company && (
        <Modal
          title={`Update Fair Value: ${valModal.company.name}`}
          open={true}
          onClose={() => setValModal({ isOpen: false, company: null })}
        >
          <form onSubmit={handleExecuteValuationUpdate}>
            <div className="mb-2">
              <span className="text-muted fs-12">Initial Invested Capital: </span>
              <strong className="text-dark font-monospace">${fmtNum(valModal.company.initialInvestmentUSD)}</strong>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-dark">Audited Fair Market Value (USD)</label>
              <input
                type="number"
                className="form-control form-control-sm font-monospace"
                value={newValuation}
                onChange={(e) => setNewValuation(e.target.value)}
                required
              />
              <span className="text-muted fs-11 mt-1 d-block">
                Implied MOIC: {(parseFloat(newValuation || '0') / valModal.company.initialInvestmentUSD).toFixed(2)}x
              </span>
            </div>
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setValModal({ isOpen: false, company: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                style={{ backgroundColor: '#16B364', borderColor: '#16B364' }}
              >
                Save Audited Valuation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
