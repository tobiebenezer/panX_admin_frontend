'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, Modal } from '@/components/ui';
import { fmtMoney, fmtNum, fmtDate } from '@/lib/format';
import { useToast } from '@/components/Toast';

export type BillCategory = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'CABLE_TV' | 'INTERNET' | 'EDUCATION';

export interface BillerRateConfig {
  id: string;
  billerCode: string;
  name: string;
  category: BillCategory;
  providerCostDiscountPct: number; // e.g. 3.0% discount given by telco/aggregator
  convenienceFeeType: 'FLAT_NGN' | 'PERCENTAGE';
  convenienceFeeValue: number; // e.g. 100 NGN or 1.5%
  customerCashbackPct: number; // e.g. 1.0% cashback back to client wallet
  minAmount: number;
  maxAmount: number;
  active: boolean;
  lastUpdated: string;
  updatedBy: string;
  dailyCapNGN: number;
}

export interface BillRateAuditLog {
  id: string;
  billerCode: string;
  category: BillCategory;
  changeDescription: string;
  oldRate: string;
  newRate: string;
  actor: string;
  reason: string;
  secondApprover?: string;
  timestamp: string;
}

const INITIAL_BILLER_RATES: BillerRateConfig[] = [
  // AIRTIME
  {
    id: 'RATE-AIR-01',
    billerCode: 'MTN_AIRTIME',
    name: 'MTN Nigeria Airtime (VTU)',
    category: 'AIRTIME',
    providerCostDiscountPct: 3.2,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.0,
    customerCashbackPct: 1.0,
    minAmount: 50,
    maxAmount: 100000,
    active: true,
    lastUpdated: '2026-10-09 11:30',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 25000000,
  },
  {
    id: 'RATE-AIR-02',
    billerCode: 'AIRTEL_AIRTIME',
    name: 'Airtel Nigeria Airtime',
    category: 'AIRTIME',
    providerCostDiscountPct: 3.0,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.0,
    customerCashbackPct: 1.0,
    minAmount: 50,
    maxAmount: 100000,
    active: true,
    lastUpdated: '2026-10-08 14:15',
    updatedBy: 'Fatima Kyari',
    dailyCapNGN: 20000000,
  },
  {
    id: 'RATE-AIR-03',
    billerCode: 'GLO_AIRTIME',
    name: 'Globacom Airtime',
    category: 'AIRTIME',
    providerCostDiscountPct: 4.0,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.0,
    customerCashbackPct: 1.5,
    minAmount: 50,
    maxAmount: 100000,
    active: true,
    lastUpdated: '2026-10-01 09:00',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 15000000,
  },
  {
    id: 'RATE-AIR-04',
    billerCode: '9MOBILE_AIRTIME',
    name: '9mobile Airtime',
    category: 'AIRTIME',
    providerCostDiscountPct: 4.5,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.0,
    customerCashbackPct: 1.5,
    minAmount: 50,
    maxAmount: 50000,
    active: true,
    lastUpdated: '2026-09-25 16:20',
    updatedBy: 'Treasury Desk',
    dailyCapNGN: 10000000,
  },

  // MOBILE DATA
  {
    id: 'RATE-DAT-01',
    billerCode: 'MTN_DATA_SME',
    name: 'MTN SME & Direct Data Bundles',
    category: 'DATA',
    providerCostDiscountPct: 4.0,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.5,
    customerCashbackPct: 0.5,
    minAmount: 200,
    maxAmount: 50000,
    active: true,
    lastUpdated: '2026-10-05 10:45',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 18000000,
  },
  {
    id: 'RATE-DAT-02',
    billerCode: 'AIRTEL_DATA',
    name: 'Airtel Gifting & Corporate Data',
    category: 'DATA',
    providerCostDiscountPct: 3.5,
    convenienceFeeType: 'PERCENTAGE',
    convenienceFeeValue: 0.5,
    customerCashbackPct: 0.5,
    minAmount: 200,
    maxAmount: 50000,
    active: true,
    lastUpdated: '2026-10-02 12:10',
    updatedBy: 'Fatima Kyari',
    dailyCapNGN: 12000000,
  },

  // ELECTRICITY
  {
    id: 'RATE-ELE-01',
    billerCode: 'IKEDC_ELECTRICITY',
    name: 'Ikeja Electric (IKEDC Prepaid & Postpaid)',
    category: 'ELECTRICITY',
    providerCostDiscountPct: 1.2,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 1000,
    maxAmount: 500000,
    active: true,
    lastUpdated: '2026-10-04 15:00',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 35000000,
  },
  {
    id: 'RATE-ELE-02',
    billerCode: 'EKEDC_ELECTRICITY',
    name: 'Eko Electricity Distribution (EKEDC)',
    category: 'ELECTRICITY',
    providerCostDiscountPct: 1.2,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 1000,
    maxAmount: 500000,
    active: true,
    lastUpdated: '2026-10-04 15:00',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 30000000,
  },
  {
    id: 'RATE-ELE-03',
    billerCode: 'AEDC_ELECTRICITY',
    name: 'Abuja Electricity Distribution (AEDC)',
    category: 'ELECTRICITY',
    providerCostDiscountPct: 1.0,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 1000,
    maxAmount: 300000,
    active: true,
    lastUpdated: '2026-10-04 15:00',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 20000000,
  },
  {
    id: 'RATE-ELE-04',
    billerCode: 'IBEDC_ELECTRICITY',
    name: 'Ibadan Electricity Distribution (IBEDC)',
    category: 'ELECTRICITY',
    providerCostDiscountPct: 1.0,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 1000,
    maxAmount: 250000,
    active: true,
    lastUpdated: '2026-09-30 11:20',
    updatedBy: 'Fatima Kyari',
    dailyCapNGN: 15000000,
  },

  // CABLE TV
  {
    id: 'RATE-TV-01',
    billerCode: 'DSTV_SUBSCRIPTION',
    name: 'DStv Subscription (MultiChoice)',
    category: 'CABLE_TV',
    providerCostDiscountPct: 1.4,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 3500,
    maxAmount: 50000,
    active: true,
    lastUpdated: '2026-10-07 16:40',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 20000000,
  },
  {
    id: 'RATE-TV-02',
    billerCode: 'GOTV_SUBSCRIPTION',
    name: 'GOtv Subscription (MultiChoice)',
    category: 'CABLE_TV',
    providerCostDiscountPct: 1.4,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.0,
    minAmount: 1900,
    maxAmount: 25000,
    active: true,
    lastUpdated: '2026-10-07 16:40',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 15000000,
  },
  {
    id: 'RATE-TV-03',
    billerCode: 'STARTIMES_TV',
    name: 'StarTimes Digital TV',
    category: 'CABLE_TV',
    providerCostDiscountPct: 2.0,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 50.0,
    customerCashbackPct: 0.0,
    minAmount: 1200,
    maxAmount: 20000,
    active: true,
    lastUpdated: '2026-09-18 10:15',
    updatedBy: 'Fatima Kyari',
    dailyCapNGN: 8000000,
  },

  // INTERNET & EDUCATION
  {
    id: 'RATE-INT-01',
    billerCode: 'SPECTRANET_BROADBAND',
    name: 'Spectranet 4G LTE Refill',
    category: 'INTERNET',
    providerCostDiscountPct: 2.5,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 100.0,
    customerCashbackPct: 0.5,
    minAmount: 2000,
    maxAmount: 80000,
    active: true,
    lastUpdated: '2026-09-20 14:00',
    updatedBy: 'Aliko Adeleke',
    dailyCapNGN: 10000000,
  },
  {
    id: 'RATE-EDU-01',
    billerCode: 'WAEC_PIN',
    name: 'WAEC Result Checker e-PIN',
    category: 'EDUCATION',
    providerCostDiscountPct: 5.0,
    convenienceFeeType: 'FLAT_NGN',
    convenienceFeeValue: 150.0,
    customerCashbackPct: 0.0,
    minAmount: 3500,
    maxAmount: 15000,
    active: true,
    lastUpdated: '2026-09-10 11:00',
    updatedBy: 'Fatima Kyari',
    dailyCapNGN: 5000000,
  },
];

const INITIAL_RATE_AUDITS: BillRateAuditLog[] = [
  {
    id: 'AUD-BR-101',
    billerCode: 'MTN_AIRTIME',
    category: 'AIRTIME',
    changeDescription: 'Updated client cashback from 0.5% to 1.0%',
    oldRate: 'Cashback 0.5% (Net Margin 2.7%)',
    newRate: 'Cashback 1.0% (Net Margin 2.2%)',
    actor: 'Aliko Adeleke',
    reason: 'Q4 Independence Day customer acquisition campaign',
    secondApprover: 'fatima.kyari@apexfinance.internal',
    timestamp: '2026-10-09 11:30:00',
  },
  {
    id: 'AUD-BR-102',
    billerCode: 'IKEDC_ELECTRICITY',
    category: 'ELECTRICITY',
    changeDescription: 'Harmonized convenience fee to ₦100 flat across all DISCOs',
    oldRate: '₦150 Flat Fee',
    newRate: '₦100 Flat Fee',
    actor: 'Fatima Kyari',
    reason: 'Alignment with national utility fee regulations',
    secondApprover: 'aliko.adeleke@apexfinance.internal',
    timestamp: '2026-10-04 15:00:00',
  },
];

export default function BillPaymentRatesPage() {
  const { toast } = useToast();
  const [rates, setRates] = useState<BillerRateConfig[]>(INITIAL_BILLER_RATES);
  const [audits, setAudits] = useState<BillRateAuditLog[]>(INITIAL_RATE_AUDITS);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | BillCategory>('ALL');
  const [search, setSearch] = useState('');

  // Simulator State
  const [simBillerId, setSimBillerId] = useState<string>('RATE-AIR-01');
  const [simAmount, setSimAmount] = useState<string>('5000');

  // Edit Rate Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    config: BillerRateConfig | null;
    feeType: 'FLAT_NGN' | 'PERCENTAGE';
    feeValue: string;
    providerCostPct: string;
    cashbackPct: string;
    reason: string;
    secondApprover: string;
  }>({
    isOpen: false,
    config: null,
    feeType: 'FLAT_NGN',
    feeValue: '100',
    providerCostPct: '1.2',
    cashbackPct: '0',
    reason: '',
    secondApprover: 'fatima.kyari@apexfinance.internal',
  });

  // Batch Update Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCategory, setBatchCategory] = useState<BillCategory>('ELECTRICITY');
  const [batchFeeValue, setBatchFeeValue] = useState('100');
  const [batchReason, setBatchReason] = useState('Standardizing DISCO utility surcharge across all regions');

  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.billerCode.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [rates, search, categoryFilter]);

  // Selected config for Simulator
  const simConfig = useMemo(() => {
    return rates.find((r) => r.id === simBillerId) || rates[0];
  }, [rates, simBillerId]);

  // Live simulation math
  const simResults = useMemo(() => {
    const amt = parseFloat(simAmount) || 0;
    if (!simConfig || amt <= 0) return { customerPays: 0, providerCost: 0, cashback: 0, netMargin: 0, marginPct: 0 };

    let convenienceFee = 0;
    if (simConfig.convenienceFeeType === 'FLAT_NGN') {
      convenienceFee = simConfig.convenienceFeeValue;
    } else {
      convenienceFee = (amt * simConfig.convenienceFeeValue) / 100;
    }

    const customerPays = amt + convenienceFee;
    const providerDiscount = (amt * simConfig.providerCostDiscountPct) / 100;
    const providerCost = amt - providerDiscount;
    const customerCashback = (amt * simConfig.customerCashbackPct) / 100;

    // Platform Net Profit = (customerPays - providerCost) - customerCashback
    const netProfit = (customerPays - providerCost) - customerCashback;
    const marginPct = customerPays > 0 ? (netProfit / customerPays) * 100 : 0;

    return {
      customerPays,
      providerCost,
      cashback: customerCashback,
      netMargin: netProfit,
      marginPct,
    };
  }, [simConfig, simAmount]);

  const handleOpenEdit = (config: BillerRateConfig) => {
    setEditModal({
      isOpen: true,
      config,
      feeType: config.convenienceFeeType,
      feeValue: String(config.convenienceFeeValue),
      providerCostPct: String(config.providerCostDiscountPct),
      cashbackPct: String(config.customerCashbackPct),
      reason: 'Periodic market spread adjustment per telco wholesale update',
      secondApprover: 'fatima.kyari@apexfinance.internal',
    });
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.config) return;
    const target = editModal.config;
    const newFee = parseFloat(editModal.feeValue) || 0;
    const newProviderCost = parseFloat(editModal.providerCostPct) || 0;
    const newCashback = parseFloat(editModal.cashbackPct) || 0;

    const oldDesc = `${target.convenienceFeeType === 'FLAT_NGN' ? `₦${target.convenienceFeeValue} fee` : `${target.convenienceFeeValue}% fee`}, ${target.customerCashbackPct}% cashback`;
    const newDesc = `${editModal.feeType === 'FLAT_NGN' ? `₦${newFee} fee` : `${newFee}% fee`}, ${newCashback}% cashback`;

    setRates((prev) =>
      prev.map((r) => {
        if (r.id === target.id) {
          return {
            ...r,
            convenienceFeeType: editModal.feeType,
            convenienceFeeValue: newFee,
            providerCostDiscountPct: newProviderCost,
            customerCashbackPct: newCashback,
            lastUpdated: 'Just now',
            updatedBy: 'Aliko Adeleke',
          };
        }
        return r;
      })
    );

    const auditEntry: BillRateAuditLog = {
      id: `AUD-BR-${Math.floor(100 + Math.random() * 900)}`,
      billerCode: target.billerCode,
      category: target.category,
      changeDescription: `Updated fee & commission parameters`,
      oldRate: oldDesc,
      newRate: newDesc,
      actor: 'Aliko Adeleke (Superadmin)',
      reason: editModal.reason.trim(),
      secondApprover: editModal.secondApprover,
      timestamp: '2026-10-10 10:40:00',
    };

    setAudits([auditEntry, ...audits]);
    toast('success', `Rate settings updated for ${target.name} under Dual-Control quorum.`);
    setEditModal({ isOpen: false, config: null, feeType: 'FLAT_NGN', feeValue: '', providerCostPct: '', cashbackPct: '', reason: '', secondApprover: '' });
  };

  const handleToggleBillerActive = (id: string) => {
    setRates((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextActive = !r.active;
          toast(nextActive ? 'success' : 'warning', `${r.name} payment gateway status set to ${nextActive ? 'ACTIVE' : 'PAUSED'}.`);
          return { ...r, active: nextActive };
        }
        return r;
      })
    );
  };

  const handleApplyBatchUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const feeVal = parseFloat(batchFeeValue) || 100;

    setRates((prev) =>
      prev.map((r) => {
        if (r.category === batchCategory) {
          return {
            ...r,
            convenienceFeeType: 'FLAT_NGN',
            convenienceFeeValue: feeVal,
            lastUpdated: 'Just now',
            updatedBy: 'Aliko Adeleke',
          };
        }
        return r;
      })
    );

    const auditEntry: BillRateAuditLog = {
      id: `AUD-BR-${Math.floor(100 + Math.random() * 900)}`,
      billerCode: `BATCH_${batchCategory}`,
      category: batchCategory,
      changeDescription: `Batch applied ₦${feeVal} flat fee across category`,
      oldRate: 'Mixed fee schedules',
      newRate: `₦${feeVal} Flat Fee`,
      actor: 'Aliko Adeleke',
      reason: batchReason.trim(),
      secondApprover: 'fatima.kyari@apexfinance.internal',
      timestamp: '2026-10-10 10:41:00',
    };

    setAudits([auditEntry, ...audits]);
    toast('success', `Batch convenience fee ₦${feeVal} applied to all ${batchCategory} billers.`);
    setBatchModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Bill Payment Rates, Markup &amp; Commission Desk"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">VAS Aggregation Engine</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/pricing" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> FX Corridors
            </Link>
            <Link href="/admin/fees" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-receipt-tax me-1" /> Fee Schedules
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setBatchModalOpen(true)}
            >
              <i className="ti ti-adjustments me-1" /> Batch Rate Update
            </button>
          </div>
        }
      />

      {/* KPI Overview Strip */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Average VAS Margin</div>
            <div className="fs-22 fw-bold text-success">2.18%</div>
            <div className="fs-12 text-muted mt-1">Blended spread across all categories</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">30d Gross Billed Volume</div>
            <div className="fs-22 fw-bold text-dark">₦48,250,000</div>
            <div className="fs-12 text-muted mt-1">+16.4% MoM organic growth</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Total Commission Captured</div>
            <div className="fs-22 fw-bold text-primary">₦1,051,850</div>
            <div className="fs-12 text-muted mt-1">Net non-interest revenue</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Active Biller Routes</div>
            <div className="fs-22 fw-bold text-info">{rates.filter((r) => r.active).length} / {rates.length}</div>
            <div className="fs-12 text-muted mt-1">Direct aggregators connected</div>
          </div>
        </div>
      </div>

      {/* Real-Time Spread & Profit Simulator Card */}
      <div className="card border-0 shadow-sm mb-4 bg-light-subtle border-start border-primary border-4">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="card-title mb-0 fw-bold d-flex align-items-center gap-2">
              <i className="ti ti-calculator fs-18 text-primary" />
              Live Bill Payment Spread &amp; Profit Simulator
            </h6>
            <span className="badge bg-light text-muted border fs-11">Real-Time Sandbox</span>
          </div>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-4">
              <label className="form-label fs-11 text-uppercase text-muted fw-bold">Select Biller / Service</label>
              <select
                className="form-select form-select-sm"
                value={simBillerId}
                onChange={(e) => setSimBillerId(e.target.value)}
              >
                {rates.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.category}] {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fs-11 text-uppercase text-muted fw-bold">Test Purchase Amount (₦)</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">₦</span>
                <input
                  type="number"
                  step="100"
                  className="form-control"
                  placeholder="5000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted fs-11">Customer Pays:</div>
                  <div className="fw-bold text-dark fs-13">₦{fmtNum(simResults.customerPays)}</div>
                </div>
                <div>
                  <div className="text-muted fs-11">Provider Deducts:</div>
                  <div className="fw-bold text-secondary fs-13">₦{fmtNum(simResults.providerCost)}</div>
                </div>
                {simResults.cashback > 0 && (
                  <div>
                    <div className="text-muted fs-11">Cashback:</div>
                    <div className="fw-bold text-info fs-13">₦{fmtNum(simResults.cashback)}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted fs-11">Platform Net Profit:</div>
                  <div className="fw-bold text-success fs-14">
                    +₦{fmtNum(simResults.netMargin)} ({simResults.marginPct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="d-flex flex-wrap gap-1">
                {(['ALL', 'AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE_TV', 'INTERNET', 'EDUCATION'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-light text-muted border'} px-2 py-1 fs-11`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === 'ALL' ? 'All Services' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search biller name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-2 text-end">
              <span className="badge bg-light text-muted border px-2 py-1">
                {filteredRates.length} billers configured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Biller Rates Table (Single Responsibility) */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Biller Service &amp; Code</th>
                <th>Category</th>
                <th>Provider Cost Discount</th>
                <th>Customer Markup / Fee</th>
                <th>Customer Cashback</th>
                <th>Net Spread / Unit</th>
                <th>Limits (Min – Max)</th>
                <th>Gateway Status</th>
                <th className="pe-4 text-end">Staff Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((r) => {
                const feeText =
                  r.convenienceFeeType === 'FLAT_NGN'
                    ? `₦${fmtNum(r.convenienceFeeValue)} Flat`
                    : `${r.convenienceFeeValue}%`;

                // Calculate nominal spread on ₦1,000 baseline
                const base = 1000;
                let conv = r.convenienceFeeType === 'FLAT_NGN' ? r.convenienceFeeValue : (base * r.convenienceFeeValue) / 100;
                let provDisc = (base * r.providerCostDiscountPct) / 100;
                let cashb = (base * r.customerCashbackPct) / 100;
                let netTake = (conv + provDisc) - cashb;
                let spreadPct = ((netTake) / (base + conv)) * 100;

                return (
                  <tr key={r.id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{r.name}</div>
                      <div className="text-muted font-sans fs-11">{r.billerCode}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border font-sans fs-10">
                        {r.category}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success-subtle font-sans fw-bold">
                        +{r.providerCostDiscountPct.toFixed(1)}% off wholesale
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{feeText}</div>
                      <div className="text-muted fs-11">Billed to client</div>
                    </td>
                    <td>
                      {r.customerCashbackPct > 0 ? (
                        <span className="badge bg-info-subtle text-info border border-info-subtle font-sans">
                          {r.customerCashbackPct.toFixed(1)}% reward
                        </span>
                      ) : (
                        <span className="text-muted fs-12">0.0%</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold text-success font-sans">
                        ~{spreadPct.toFixed(2)}% margin
                      </div>
                      <div className="text-muted fs-11">~₦{fmtNum(netTake)} / ₦1k</div>
                    </td>
                    <td>
                      <div className="text-muted fs-11">
                        ₦{fmtNum(r.minAmount)} – ₦{fmtNum(r.maxAmount)}
                      </div>
                      <div className="text-muted fs-10">Cap: ₦{fmtNum(r.dailyCapNGN)}/day</div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-xs ${r.active ? 'btn-outline-success' : 'btn-outline-danger'} py-0 px-2 fs-11`}
                        onClick={() => handleToggleBillerActive(r.id)}
                        title="Click to toggle gateway active status"
                      >
                        {r.active ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </td>
                    <td className="pe-4 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-3 fs-12"
                        onClick={() => handleOpenEdit(r)}
                      >
                        <i className="ti ti-edit me-1" /> Adjust Rates
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRates.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    No bill payment services match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Audit Trail for Rate Adjustments */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0 fw-bold">VAS Rates &amp; Fee Change Audit Log</h6>
          <span className="badge bg-light text-muted border">Dual-Control Audit Trail</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Audit ID</th>
                <th>Biller / Service</th>
                <th>Category</th>
                <th>Adjustment Made</th>
                <th>Previous Rate</th>
                <th>New Effective Rate</th>
                <th>Staff Actor &amp; 2nd Approver</th>
                <th className="pe-4 text-end">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id}>
                  <td className="ps-4 font-sans text-muted">{a.id}</td>
                  <td className="fw-bold text-dark">{a.billerCode}</td>
                  <td><span className="badge bg-light text-secondary border font-sans">{a.category}</span></td>
                  <td>
                    <div className="text-dark fw-semibold">{a.changeDescription}</div>
                    <div className="text-muted fs-11">Reason: {a.reason}</div>
                  </td>
                  <td className="text-muted font-sans">{a.oldRate}</td>
                  <td className="text-success fw-bold font-sans">{a.newRate}</td>
                  <td>
                    <div className="fw-semibold text-dark">{a.actor}</div>
                    <div className="text-muted fs-11">2nd: {a.secondApprover}</div>
                  </td>
                  <td className="pe-4 text-end text-muted font-sans fs-11">{a.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Rate Modal */}
      {editModal.isOpen && editModal.config && (
        <Modal
          title={`Adjust Bill Payment Rates: ${editModal.config.name}`}
          open={true}
          onClose={() => setEditModal({ isOpen: false, config: null, feeType: 'FLAT_NGN', feeValue: '', providerCostPct: '', cashbackPct: '', reason: '', secondApprover: '' })}
        >
          <form onSubmit={handleSaveRate} className="p-2">
            <div className="alert alert-info fs-12 mb-3">
              Configure upstream wholesale margins and customer-facing convenience fees for {editModal.config.name}.
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Provider Cost Discount (%)</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={editModal.providerCostPct}
                    onChange={(e) => setEditModal({ ...editModal, providerCostPct: e.target.value })}
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                <div className="text-muted fs-10 mt-1">Discount given to us by aggregator/telco</div>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Customer Cashback (%)</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={editModal.cashbackPct}
                    onChange={(e) => setEditModal({ ...editModal, cashbackPct: e.target.value })}
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                <div className="text-muted fs-10 mt-1">Loyalty reward returned to client</div>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">Convenience Fee Structure</label>
                <select
                  className="form-select form-select-sm"
                  value={editModal.feeType}
                  onChange={(e) => setEditModal({ ...editModal, feeType: e.target.value as any })}
                >
                  <option value="FLAT_NGN">Flat Fee (in NGN)</option>
                  <option value="PERCENTAGE">Percentage Markup (%)</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 text-uppercase text-muted fw-bold">
                  {editModal.feeType === 'FLAT_NGN' ? 'Convenience Fee Amount (₦)' : 'Markup Percentage (%)'}
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={editModal.feeValue}
                  onChange={(e) => setEditModal({ ...editModal, feeValue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Mandatory Operational Reason *</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={editModal.reason}
                onChange={(e) => setEditModal({ ...editModal, reason: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Designated Second Approver *</label>
              <input
                type="email"
                className="form-control form-control-sm"
                value={editModal.secondApprover}
                onChange={(e) => setEditModal({ ...editModal, secondApprover: e.target.value })}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setEditModal({ isOpen: false, config: null, feeType: 'FLAT_NGN', feeValue: '', providerCostPct: '', cashbackPct: '', reason: '', secondApprover: '' })}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Save &amp; Promote Rates
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Batch Rate Update Modal */}
      {batchModalOpen && (
        <Modal
          title="Batch Update Bill Payment Convenience Fees"
          open={true}
          onClose={() => setBatchModalOpen(false)}
        >
          <form onSubmit={handleApplyBatchUpdate} className="p-2">
            <div className="alert alert-warning fs-12 mb-3">
              This will update the convenience fee for all billers within the selected category simultaneously.
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Target Service Category</label>
              <select
                className="form-select form-select-sm"
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value as any)}
              >
                <option value="ELECTRICITY">All Electricity DISCOs (IKEDC, EKEDC, AEDC, IBEDC...)</option>
                <option value="CABLE_TV">All Cable &amp; TV Providers (DStv, GOtv, StarTimes...)</option>
                <option value="AIRTIME">All Mobile Airtime (MTN, Airtel, Glo, 9mobile)</option>
                <option value="DATA">All Mobile Data Bundles</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Flat Convenience Fee (₦) *</label>
              <input
                type="number"
                step="1"
                className="form-control form-control-sm"
                value={batchFeeValue}
                onChange={(e) => setBatchFeeValue(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-12 text-uppercase text-muted fw-bold">Regulatory / Business Rationale *</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setBatchModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Apply Category Batch Rate
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
