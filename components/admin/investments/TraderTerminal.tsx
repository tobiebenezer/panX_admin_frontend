'use client';

import React, { useState, useEffect } from 'react';
import { fmtMoney, fmtNum } from '@/lib/format';
import { Sparkline } from '@/components/charts';
import { useToast } from '@/components/Toast';
import { dispatchWorkerComputation } from '@/lib/analyticsWorker';

export interface InstrumentQuote {
  ticker: string;
  name: string;
  market: 'NGX' | 'US' | 'BONDS';
  currency: 'NGN' | 'USD';
  lastPrice: number;
  change24h: number;
  changePercent: number;
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  vwap: number;
  volume24h: number;
  marketCap: number;
  peRatio?: number;
  beta?: number;
  yieldBps?: number;
  venue: string;
  tradingStatus: 'ACTIVE' | 'HALTED' | 'CIRCUIT_TRIPPED';
  sparkline: number[];
}

export const SAMPLE_INSTRUMENTS: InstrumentQuote[] = [
  {
    ticker: 'MTNN',
    name: 'MTN Nigeria Communications Plc',
    market: 'NGX',
    currency: 'NGN',
    lastPrice: 245.0,
    change24h: 3.5,
    changePercent: 1.45,
    bid: 244.5,
    bidSize: 45000,
    ask: 245.0,
    askSize: 18200,
    dayHigh: 247.0,
    dayLow: 241.0,
    yearHigh: 285.0,
    yearLow: 190.0,
    vwap: 244.2,
    volume24h: 3420000,
    marketCap: 4980000000000,
    peRatio: 12.8,
    beta: 0.94,
    venue: 'NGX CSCS Central',
    tradingStatus: 'ACTIVE',
    sparkline: [241, 242.5, 241.8, 243.2, 244.0, 243.5, 245.0],
  },
  {
    ticker: 'AIRTELAFRI',
    name: 'Airtel Africa Plc',
    market: 'NGX',
    currency: 'NGN',
    lastPrice: 1950.0,
    change24h: -15.0,
    changePercent: -0.76,
    bid: 1948.0,
    bidSize: 5200,
    ask: 1952.0,
    askSize: 3100,
    dayHigh: 1975.0,
    dayLow: 1940.0,
    yearHigh: 2200.0,
    yearLow: 1450.0,
    vwap: 1955.4,
    volume24h: 420000,
    marketCap: 7330000000000,
    peRatio: 15.4,
    beta: 0.88,
    venue: 'NGX CSCS Central',
    tradingStatus: 'ACTIVE',
    sparkline: [1970, 1965, 1958, 1960, 1952, 1948, 1950],
  },
  {
    ticker: 'GTCO',
    name: 'Guaranty Trust Holding Co. Plc',
    market: 'NGX',
    currency: 'NGN',
    lastPrice: 48.5,
    change24h: 1.2,
    changePercent: 2.54,
    bid: 48.4,
    bidSize: 120000,
    ask: 48.5,
    askSize: 84000,
    dayHigh: 49.0,
    dayLow: 47.1,
    yearHigh: 54.0,
    yearLow: 32.5,
    vwap: 48.15,
    volume24h: 18450000,
    marketCap: 1428000000000,
    peRatio: 4.8,
    beta: 1.15,
    venue: 'NGX CSCS Central',
    tradingStatus: 'ACTIVE',
    sparkline: [47.1, 47.4, 47.8, 48.0, 48.2, 48.1, 48.5],
  },
  {
    ticker: 'DANGCEM',
    name: 'Dangote Cement Plc',
    market: 'NGX',
    currency: 'NGN',
    lastPrice: 650.0,
    change24h: 0.0,
    changePercent: 0.0,
    bid: 649.0,
    bidSize: 14000,
    ask: 650.0,
    askSize: 9500,
    dayHigh: 655.0,
    dayLow: 648.0,
    yearHigh: 760.0,
    yearLow: 520.0,
    vwap: 650.0,
    volume24h: 1120000,
    marketCap: 11075000000000,
    peRatio: 22.1,
    beta: 0.72,
    venue: 'Chapel Hill Denham Omnibus',
    tradingStatus: 'ACTIVE',
    sparkline: [650, 651, 650, 649, 652, 650, 650],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    currency: 'USD',
    lastPrice: 232.45,
    change24h: 2.3,
    changePercent: 1.0,
    bid: 232.4,
    bidSize: 800,
    ask: 232.45,
    askSize: 1200,
    dayHigh: 233.8,
    dayLow: 230.1,
    yearHigh: 237.23,
    yearLow: 164.08,
    vwap: 232.1,
    volume24h: 48200000,
    marketCap: 3540000000000,
    peRatio: 33.8,
    beta: 1.08,
    venue: 'DriveWealth LLC / DTC',
    tradingStatus: 'ACTIVE',
    sparkline: [230.2, 231.0, 231.8, 231.5, 232.1, 232.0, 232.45],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    market: 'US',
    currency: 'USD',
    lastPrice: 228.1,
    change24h: -4.2,
    changePercent: -1.81,
    bid: 228.05,
    bidSize: 1400,
    ask: 228.15,
    askSize: 900,
    dayHigh: 234.5,
    dayLow: 226.4,
    yearHigh: 271.0,
    yearLow: 138.8,
    vwap: 229.4,
    volume24h: 64100000,
    marketCap: 728000000000,
    peRatio: 68.2,
    beta: 2.34,
    venue: 'DriveWealth LLC / DTC',
    tradingStatus: 'ACTIVE',
    sparkline: [234.0, 232.5, 231.0, 229.5, 227.8, 228.5, 228.1],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    currency: 'USD',
    lastPrice: 134.8,
    change24h: 6.4,
    changePercent: 4.98,
    bid: 134.75,
    bidSize: 2400,
    ask: 134.82,
    askSize: 1800,
    dayHigh: 136.0,
    dayLow: 129.2,
    yearHigh: 140.76,
    yearLow: 39.23,
    vwap: 133.6,
    volume24h: 112000000,
    marketCap: 3310000000000,
    peRatio: 52.4,
    beta: 1.68,
    venue: 'DriveWealth LLC / DTC',
    tradingStatus: 'ACTIVE',
    sparkline: [129.5, 131.0, 132.8, 133.5, 133.0, 134.2, 134.8],
  },
  {
    ticker: 'FGN-2029',
    name: 'Federal Republic of Nigeria 14.55% Apr 2029',
    market: 'BONDS',
    currency: 'NGN',
    lastPrice: 98.4,
    change24h: 0.15,
    changePercent: 0.15,
    bid: 98.35,
    bidSize: 50000000,
    ask: 98.45,
    askSize: 30000000,
    dayHigh: 98.6,
    dayLow: 98.2,
    yearHigh: 104.2,
    yearLow: 92.0,
    vwap: 98.38,
    volume24h: 185000000,
    marketCap: 750000000000,
    yieldBps: 1540,
    venue: 'FMDQ Securities Exchange',
    tradingStatus: 'ACTIVE',
    sparkline: [98.2, 98.25, 98.3, 98.32, 98.38, 98.35, 98.4],
  },
];

export function TraderTerminal({
  onOpenHaltModal,
}: {
  onOpenHaltModal?: (instrument: InstrumentQuote) => void;
} = {}) {
  const { toast } = useToast();
  const [instruments, setInstruments] = useState<InstrumentQuote[]>(SAMPLE_INSTRUMENTS);
  const [selectedTicker, setSelectedTicker] = useState<string>('MTNN');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'NGX' | 'US' | 'BONDS'>('ALL');
  const [search, setSearch] = useState('');
  const [chartInterval, setChartInterval] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [internalHaltModal, setInternalHaltModal] = useState<InstrumentQuote | null>(null);
  const [workerMetric, setWorkerMetric] = useState<{ vwap: number; volatility: number; durationMs: number } | null>(null);

  const activeInstrument = instruments.find((i) => i.ticker === selectedTicker) || instruments[0];

  useEffect(() => {
    // Generate synthetic trade tick window for the active instrument
    const syntheticTrades = [
      { price: activeInstrument.dayLow, volume: 150000, timestamp: Date.now() - 3600000 * 4 },
      { price: activeInstrument.lastPrice * 0.995, volume: 450000, timestamp: Date.now() - 3600000 * 3 },
      { price: activeInstrument.lastPrice, volume: 820000, timestamp: Date.now() - 3600000 * 2 },
      { price: activeInstrument.dayHigh, volume: 600000, timestamp: Date.now() - 3600000 },
      { price: activeInstrument.lastPrice, volume: 350000, timestamp: Date.now() },
    ];

    dispatchWorkerComputation({
      type: 'CALCULATE_VWAP_VOLATILITY',
      payload: { trades: syntheticTrades },
    }).then((res) => {
      setWorkerMetric({
        vwap: res.data.vwap,
        volatility: res.data.volatility,
        durationMs: res.durationMs,
      });
    });
  }, [activeInstrument.ticker, activeInstrument.lastPrice, activeInstrument.dayLow, activeInstrument.dayHigh]);

  const handleHaltClick = (instrument: InstrumentQuote) => {
    if (onOpenHaltModal) {
      onOpenHaltModal(instrument);
    } else {
      setInternalHaltModal(instrument);
    }
  };

  const filteredInstruments = instruments.filter((i) => {
    if (marketFilter !== 'ALL' && i.market !== marketFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Simulated live Order Book Depth (5 levels bid / ask)
  const orderBookBids = [
    { price: activeInstrument.bid, size: activeInstrument.bidSize, total: activeInstrument.bidSize },
    { price: Number((activeInstrument.bid * 0.998).toFixed(2)), size: Math.round(activeInstrument.bidSize * 0.85), total: Math.round(activeInstrument.bidSize * 1.85) },
    { price: Number((activeInstrument.bid * 0.995).toFixed(2)), size: Math.round(activeInstrument.bidSize * 1.4), total: Math.round(activeInstrument.bidSize * 3.25) },
    { price: Number((activeInstrument.bid * 0.992).toFixed(2)), size: Math.round(activeInstrument.bidSize * 0.7), total: Math.round(activeInstrument.bidSize * 3.95) },
    { price: Number((activeInstrument.bid * 0.988).toFixed(2)), size: Math.round(activeInstrument.bidSize * 2.1), total: Math.round(activeInstrument.bidSize * 6.05) },
  ];

  const orderBookAsks = [
    { price: activeInstrument.ask, size: activeInstrument.askSize, total: activeInstrument.askSize },
    { price: Number((activeInstrument.ask * 1.002).toFixed(2)), size: Math.round(activeInstrument.askSize * 0.9), total: Math.round(activeInstrument.askSize * 1.9) },
    { price: Number((activeInstrument.ask * 1.005).toFixed(2)), size: Math.round(activeInstrument.askSize * 1.6), total: Math.round(activeInstrument.askSize * 3.5) },
    { price: Number((activeInstrument.ask * 1.008).toFixed(2)), size: Math.round(activeInstrument.askSize * 0.8), total: Math.round(activeInstrument.askSize * 4.3) },
    { price: Number((activeInstrument.ask * 1.012).toFixed(2)), size: Math.round(activeInstrument.askSize * 2.4), total: Math.round(activeInstrument.askSize * 6.7) },
  ];

  const maxDepth = Math.max(orderBookBids[4].total, orderBookAsks[4].total);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Real-time Indices Ticker Tape */}
      <div className="bg-dark text-white rounded-3 p-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-3 fs-12 shadow-sm font-monospace">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <span className="text-secondary fw-semibold text-uppercase tracking-wider">
            <i className="ti ti-broadcast text-success me-1" /> Multi-Exchange Tape
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">NGX ASI:</span>
            <span className="text-white fw-bold">98,410.22</span>
            <span className="text-success"><i className="ti ti-arrow-up-right" /> +1.42%</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">S&amp;P 500:</span>
            <span className="text-white fw-bold">5,815.03</span>
            <span className="text-success"><i className="ti ti-arrow-up-right" /> +0.35%</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">GSE Composite:</span>
            <span className="text-white fw-bold">3,780.12</span>
            <span className="text-danger"><i className="ti ti-arrow-down-right" /> -0.12%</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">US 10Y Yield:</span>
            <span className="text-white fw-bold">4.28%</span>
            <span className="text-muted">+2 bps</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Brent Crude:</span>
            <span className="text-white fw-bold">$78.40/bbl</span>
            <span className="text-success">+0.8%</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill bg-success-subtle text-success fs-10 px-2 py-1">
            <i className="ti ti-check" /> STP Venues Live
          </span>
        </div>
      </div>

      {/* Main Terminal Workspace Layout: Left Watchlist, Right Deep Monitor */}
      <div className="row g-3">
        {/* Left Column: Instruments Watchlist */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold text-dark m-0 fs-14">
                  <i className="ti ti-chart-line text-success me-1" /> Instruments Watchlist
                </h6>
                <span className="badge bg-light text-secondary border font-monospace fs-11">
                  {filteredInstruments.length} Listed
                </span>
              </div>
              <div className="input-group input-group-sm mb-2">
                <span className="input-group-text bg-light border-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-light fs-12"
                  placeholder="Filter by symbol or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="btn-group btn-group-sm w-100">
                {(['ALL', 'NGX', 'US', 'BONDS'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`btn btn-sm ${marketFilter === m ? 'btn-success text-white' : 'btn-outline-light text-dark border'}`}
                    style={marketFilter === m ? { backgroundColor: '#16B364', borderColor: '#16B364' } : undefined}
                    onClick={() => setMarketFilter(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body p-0 overflow-auto" style={{ maxHeight: 600 }}>
              <div className="list-group list-group-flush">
                {filteredInstruments.map((inst) => {
                  const isSelected = inst.ticker === activeInstrument.ticker;
                  const isPositive = inst.changePercent >= 0;
                  return (
                    <button
                      key={inst.ticker}
                      type="button"
                      className={`list-group-item list-group-item-action p-3 border-bottom d-flex align-items-center justify-content-between ${
                        isSelected ? 'bg-light border-start border-3 border-success' : ''
                      }`}
                      onClick={() => setSelectedTicker(inst.ticker)}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark fs-14 font-monospace">{inst.ticker}</span>
                          <span className="badge rounded-pill bg-light text-secondary border fs-10">
                            {inst.market}
                          </span>
                          {inst.tradingStatus !== 'ACTIVE' && (
                            <span className="badge bg-danger text-white fs-10">HALTED</span>
                          )}
                        </div>
                        <div className="text-muted fs-11 text-truncate" style={{ maxWidth: 160 }}>
                          {inst.name}
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-dark font-monospace fs-13">
                          {fmtMoney(inst.lastPrice, inst.currency)}
                        </div>
                        <div className={`fs-11 fw-semibold font-monospace ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? '+' : ''}{inst.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <div className="d-none d-sm-block ms-2">
                        <Sparkline
                          data={inst.sparkline}
                          color={isPositive ? '#16B364' : '#F04438'}
                          height={28}
                          width={60}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deep Instrument Workspace */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark m-0 fs-18 font-monospace">{activeInstrument.ticker}</h5>
                  <span className="badge rounded-pill bg-success-subtle text-success fs-11 px-2 py-1">
                    {activeInstrument.venue}
                  </span>
                  <span className={`badge rounded-pill ${activeInstrument.tradingStatus === 'ACTIVE' ? 'bg-light text-success border border-success' : 'bg-danger text-white'} fs-11`}>
                    {activeInstrument.tradingStatus}
                  </span>
                </div>
                <div className="text-muted fs-12 mt-1">{activeInstrument.name}</div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${activeInstrument.tradingStatus === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'} d-flex align-items-center gap-1`}
                  onClick={() => handleHaltClick(activeInstrument)}
                >
                  <i className={activeInstrument.tradingStatus === 'ACTIVE' ? 'ti ti-player-pause' : 'ti ti-player-play'} />
                  {activeInstrument.tradingStatus === 'ACTIVE' ? 'Engage Trading Halt' : 'Resume Trading Session'}
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              {/* Top Key Metrics Banner */}
              <div className="row g-2 mb-3 font-monospace">
                <div className="col-6 col-md-3">
                  <div className="p-2 rounded bg-light bg-opacity-50 border">
                    <span className="text-muted fs-11 d-block">LAST TRADED PRICE</span>
                    <span className="fw-bold fs-18 text-dark">
                      {fmtMoney(activeInstrument.lastPrice, activeInstrument.currency)}
                    </span>
                    <span className={`fs-11 fw-semibold ms-2 ${activeInstrument.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                      {activeInstrument.changePercent >= 0 ? '+' : ''}{activeInstrument.changePercent}%
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2 rounded bg-light bg-opacity-50 border">
                    <span className="text-muted fs-11 d-block">BID / ASK SPREAD</span>
                    <span className="fw-semibold fs-14 text-dark">
                      {fmtMoney(activeInstrument.bid, activeInstrument.currency)} / {fmtMoney(activeInstrument.ask, activeInstrument.currency)}
                    </span>
                    <span className="text-muted fs-11 d-block">
                      {((activeInstrument.ask - activeInstrument.bid) / activeInstrument.lastPrice * 10000).toFixed(1)} bps spread
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2 rounded bg-light bg-opacity-50 border">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted fs-11 d-block">DAY RANGE</span>
                      {workerMetric && (
                        <span className="badge bg-success-subtle text-success fs-10 px-1 py-0">
                          Worker {workerMetric.durationMs}ms
                        </span>
                      )}
                    </div>
                    <span className="fw-semibold fs-13 text-dark">
                      {fmtMoney(activeInstrument.dayLow, activeInstrument.currency)} - {fmtMoney(activeInstrument.dayHigh, activeInstrument.currency)}
                    </span>
                    <span className="text-muted fs-11 d-block">
                      VWAP: {fmtMoney(workerMetric ? workerMetric.vwap : activeInstrument.vwap, activeInstrument.currency)}
                      {workerMetric && <span className="ms-1 text-secondary">({workerMetric.volatility}% vol)</span>}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2 rounded bg-light bg-opacity-50 border">
                    <span className="text-muted fs-11 d-block">24H VOLUME &amp; CAP</span>
                    <span className="fw-semibold fs-13 text-dark">
                      {fmtNum(activeInstrument.volume24h)} units
                    </span>
                    <span className="text-muted fs-11 d-block">Cap: ${(activeInstrument.marketCap / 1e9).toFixed(2)}B</span>
                  </div>
                </div>
              </div>

              {/* Chart Section Header with Intervals */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-semibold text-secondary">
                  <i className="ti ti-chart-area-line text-success me-1" /> Intraday Execution Price Feed
                </span>
                <div className="btn-group btn-group-sm">
                  {(['1D', '1W', '1M', '1Y'] as const).map((iv) => (
                    <button
                      key={iv}
                      type="button"
                      className={`btn btn-sm ${chartInterval === iv ? 'btn-primary' : 'btn-light border'}`}
                      style={chartInterval === iv ? { backgroundColor: '#16B364', borderColor: '#16B364' } : undefined}
                      onClick={() => setChartInterval(iv)}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Resolution SVG Canvas Area Chart */}
              <div
                className="rounded-3 border p-3 mb-3 bg-white"
                style={{ height: 260, position: 'relative' }}
              >
                <svg width="100%" height="100%" viewBox="0 0 700 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16B364" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#16B364" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="700" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="110" x2="700" y2="110" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="170" x2="700" y2="170" stroke="#F1F5F9" strokeWidth="1" />

                  {/* Shaded Area */}
                  <path
                    d="M 20 180 Q 120 130 200 150 T 380 90 T 520 120 T 680 60 L 680 210 L 20 210 Z"
                    fill="url(#areaGradient)"
                  />
                  {/* Price Polyline */}
                  <path
                    d="M 20 180 Q 120 130 200 150 T 380 90 T 520 120 T 680 60"
                    fill="none"
                    stroke="#16B364"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Active Price Pulse Point */}
                  <circle cx="680" cy="60" r="5" fill="#16B364" />
                  <circle cx="680" cy="60" r="10" fill="#16B364" fillOpacity="0.3" />
                </svg>

                <div className="d-flex justify-content-between text-muted fs-10 font-monospace pt-2 border-top">
                  <span>09:30 AM (Open)</span>
                  <span>11:30 AM</span>
                  <span>01:30 PM</span>
                  <span>03:30 PM (Close)</span>
                </div>
              </div>

              {/* Order Book Depth & Institutional Indicators Grid */}
              <div className="row g-3">
                {/* 5-Level Order Book (Depth) */}
                <div className="col-12 col-lg-7">
                  <div className="card border rounded-3 p-3 bg-light bg-opacity-25 h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold fs-12 text-uppercase text-secondary">
                        <i className="ti ti-stack-2 me-1" /> Order Book Depth Ladder
                      </span>
                      <span className="text-muted fs-11">CSCS &amp; DTC Aggregated</span>
                    </div>

                    <div className="row g-2 fs-11 font-monospace">
                      {/* Bids Column */}
                      <div className="col-6">
                        <div className="d-flex justify-content-between text-muted pb-1 border-bottom fw-bold">
                          <span>BID QTY</span>
                          <span>PRICE</span>
                        </div>
                        {orderBookBids.map((b, i) => (
                          <div
                            key={i}
                            className="d-flex justify-content-between py-1 position-relative"
                            style={{ zIndex: 1 }}
                          >
                            <span className="text-secondary">{fmtNum(b.size)}</span>
                            <span className="fw-bold text-success">{fmtMoney(b.price, activeInstrument.currency)}</span>
                            <div
                              className="position-absolute top-0 end-0 bottom-0 bg-success bg-opacity-10"
                              style={{ width: `${(b.total / maxDepth) * 100}%`, zIndex: -1 }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Asks Column */}
                      <div className="col-6">
                        <div className="d-flex justify-content-between text-muted pb-1 border-bottom fw-bold">
                          <span>PRICE</span>
                          <span>ASK QTY</span>
                        </div>
                        {orderBookAsks.map((a, i) => (
                          <div
                            key={i}
                            className="d-flex justify-content-between py-1 position-relative"
                            style={{ zIndex: 1 }}
                          >
                            <span className="fw-bold text-danger">{fmtMoney(a.price, activeInstrument.currency)}</span>
                            <span className="text-secondary">{fmtNum(a.size)}</span>
                            <div
                              className="position-absolute top-0 start-0 bottom-0 bg-danger bg-opacity-10"
                              style={{ width: `${(a.total / maxDepth) * 100}%`, zIndex: -1 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institutional Metrics & Fundamental Specs */}
                <div className="col-12 col-lg-5">
                  <div className="card border rounded-3 p-3 bg-white h-100">
                    <span className="fw-bold fs-12 text-uppercase text-secondary mb-2">
                      <i className="ti ti-info-circle me-1" /> Institutional Stats
                    </span>

                    <div className="d-flex flex-column gap-2 fs-12">
                      <div className="d-flex justify-content-between pb-1 border-bottom">
                        <span className="text-muted">P/E Ratio (TTM)</span>
                        <span className="font-monospace text-dark fw-semibold">{activeInstrument.peRatio || '—'}</span>
                      </div>
                      <div className="d-flex justify-content-between pb-1 border-bottom">
                        <span className="text-muted">Beta (5Y Monthly)</span>
                        <span className="font-monospace text-dark fw-semibold">{activeInstrument.beta || '—'}</span>
                      </div>
                      <div className="d-flex justify-content-between pb-1 border-bottom">
                        <span className="text-muted">52-Week Range</span>
                        <span className="font-monospace text-dark fw-semibold fs-11">
                          {fmtMoney(activeInstrument.yearLow, activeInstrument.currency)} - {fmtMoney(activeInstrument.yearHigh, activeInstrument.currency)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between pb-1 border-bottom">
                        <span className="text-muted">Custody Venue</span>
                        <span className="text-dark fw-medium fs-11 text-truncate" style={{ maxWidth: 140 }}>
                          {activeInstrument.venue}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">SEC Suitability Gate</span>
                        <span className="text-success fw-medium">
                          <i className="ti ti-shield-check" /> Verified Retail &amp; Corp
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Trading Halt Modal if rendered standalone */}
      {internalHaltModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setInternalHaltModal(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-danger text-white py-3 px-4">
                <h5 className="modal-title fw-bold fs-16 m-0 d-flex align-items-center gap-2">
                  <i className="ti ti-alert-octagon fs-20" />
                  Volatility Circuit Breaker Intervention
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setInternalHaltModal(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p className="fs-14 text-dark mb-3">
                  You are preparing to halt or resume trading on <strong>{internalHaltModal.ticker}</strong> ({internalHaltModal.name}).
                </p>
                <div className="p-3 bg-light rounded-3 border mb-3 fs-12">
                  <div><strong>Venue:</strong> {internalHaltModal.venue}</div>
                  <div><strong>Last Price:</strong> {fmtMoney(internalHaltModal.lastPrice, internalHaltModal.currency)}</div>
                  <div><strong>Current Status:</strong> {internalHaltModal.tradingStatus}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fs-12 fw-semibold text-muted">Administrative Reason &amp; SEC Circular Ref</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="E.g., Volatility breaker tripped (+10% in 15m), awaiting company disclosure…"
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setInternalHaltModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${internalHaltModal.tradingStatus === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => {
                      const nextStatus = internalHaltModal.tradingStatus === 'ACTIVE' ? 'HALTED' : 'ACTIVE';
                      setInstruments((prev) =>
                        prev.map((i) => (i.ticker === internalHaltModal.ticker ? { ...i, tradingStatus: nextStatus } : i))
                      );
                      toast('success', `${internalHaltModal.ticker} trading status set to ${nextStatus}`);
                      setInternalHaltModal(null);
                    }}
                  >
                    Confirm &amp; Broadcast to Exchanges
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
