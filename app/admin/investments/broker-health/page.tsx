'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { BROKER_HEALTH, BrokerPartnerId, BrokerHealth } from '@/lib/investmentConsoleData';

export default function BrokerPartnerHealthPage() {
  const { toast } = useToast();
  const [healthMap, setHealthMap] = useState<Record<BrokerPartnerId, BrokerHealth>>(BROKER_HEALTH);

  const handleToggleDegraded = (id: BrokerPartnerId) => {
    setHealthMap((prev) => {
      const current = prev[id];
      const nextStatus = current.status === 'ONLINE' ? 'DEGRADED' : 'ONLINE';
      const orderDisabled = nextStatus === 'DEGRADED';

      toast(
        orderDisabled ? 'warning' : 'success',
        `${current.name} status manually set to ${nextStatus}. Order routing is ${orderDisabled ? 'HALTED' : 'ACTIVE'}.`
      );

      return {
        ...prev,
        [id]: {
          ...current,
          status: nextStatus,
          orderPlacingDisabled: orderDisabled,
        },
      };
    });
  };

  const handleSyncTelemetry = (id: BrokerPartnerId) => {
    toast('info', `Heartbeat ping sent to ${healthMap[id].name}. Latency updated.`);
    setHealthMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        latencyMs: Math.floor(60 + Math.random() * 90),
        lastSyncTime: 'Just now (live heartbeat)',
      },
    }));
  };

  return (
    <div>
      <PageHeader
        title="Broker Partner Health &amp; Market Calendars"
        badge={<span className="badge bg-primary-subtle text-primary border border-primary-subtle">Custodial API Telemetry</span>}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/investments/console" className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-arrow-left me-1" /> Console Overview
            </Link>
          </div>
        }
      />

      {/* Broker Partner Cards */}
      <div className="row g-4 mb-4">
        {(Object.keys(healthMap) as BrokerPartnerId[]).map((brokerId) => {
          const broker = healthMap[brokerId];
          const isDegraded = broker.status !== 'ONLINE';

          return (
            <div key={broker.id} className="col-12 col-lg-6">
              <div className={`card border-0 shadow-sm h-100 ${isDegraded ? 'border-start border-warning border-4' : 'border-start border-success border-4'}`}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">{broker.name}</h5>
                      <span className="text-muted fs-12">{broker.market} · Base Currency: {broker.currency}</span>
                    </div>
                    <span className={`badge ${broker.status === 'ONLINE' ? 'bg-success text-white' : 'bg-warning text-dark'} px-3 py-2 fs-12`}>
                      {broker.status}
                    </span>
                  </div>

                  {isDegraded && (
                    <div className="alert alert-warning fs-12 d-flex align-items-center gap-2 mb-3">
                      <i className="ti ti-alert-triangle fs-18 text-warning" />
                      <div>
                        <strong>Connection Degraded:</strong> Order submission to this broker partner is temporarily paused by platform circuit breakers to protect client capital.
                      </div>
                    </div>
                  )}

                  <div className="row g-3 my-2">
                    <div className="col-6">
                      <div className="p-3 bg-light rounded">
                        <div className="text-muted fs-11 text-uppercase fw-semibold">API Latency</div>
                        <div className="fs-18 fw-bold text-dark mt-1">
                          {broker.latencyMs} ms
                          <span className="ms-2 fs-11 text-success">STP Socket</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded">
                        <div className="text-muted fs-11 text-uppercase fw-semibold">Last Heartbeat</div>
                        <div className="fs-14 fw-bold text-dark mt-1">{broker.lastSyncTime}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded">
                        <div className="text-muted fs-11 text-uppercase fw-semibold">Daily Cut-off Time</div>
                        <div className="fs-14 fw-bold text-dark mt-1">{broker.orderCutoffTime}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded">
                        <div className="text-muted fs-11 text-uppercase fw-semibold">Market Session</div>
                        <div className="fs-14 fw-bold mt-1">
                          <span className={`badge ${broker.calendarStatus === 'OPEN' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'}`}>
                            {broker.calendarStatus}
                          </span>
                          <span className="text-muted fs-11 ms-2">{broker.marketHours}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleSyncTelemetry(broker.id)}
                    >
                      <i className="ti ti-refresh me-1" /> Ping Heartbeat
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${isDegraded ? 'btn-success' : 'btn-outline-warning text-dark'}`}
                      onClick={() => handleToggleDegraded(broker.id)}
                    >
                      <i className={`ti ${isDegraded ? 'ti-check' : 'ti-alert-circle'} me-1`} />
                      {isDegraded ? 'Resume Normal Routing' : 'Trip Circuit Breaker (Halt)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Calendar Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-0">
          <h6 className="card-title mb-0 fw-bold">Exchange Operating Calendar &amp; Statutory Holidays</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4">Market / Exchange</th>
                <th>Standard Hours</th>
                <th>Order Cut-off</th>
                <th>Settlement Cycle</th>
                <th>Upcoming Holiday</th>
                <th className="pe-4 text-end">Session Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ps-4">
                  <div className="fw-bold text-dark">Nigerian Exchange (NGX)</div>
                  <div className="text-muted fs-11">Clearing: Central Securities Clearing System (CSCS)</div>
                </td>
                <td>09:30 AM – 02:30 PM WAT</td>
                <td className="fw-semibold text-danger">02:00 PM WAT</td>
                <td><span className="badge bg-light text-secondary border">T+2 Rolling</span></td>
                <td>Mon 28 Dec (Boxing Day Observance)</td>
                <td className="pe-4 text-end">
                  <span className="badge bg-secondary text-white">CLOSED</span>
                </td>
              </tr>
              <tr>
                <td className="ps-4">
                  <div className="fw-bold text-dark">US Markets (NYSE / NASDAQ)</div>
                  <div className="text-muted fs-11">Clearing: Depository Trust Company (DTC) via DriveWealth</div>
                </td>
                <td>09:30 AM – 04:00 PM EST</td>
                <td className="fw-semibold text-danger">03:55 PM EST</td>
                <td><span className="badge bg-light text-secondary border">T+1 Rapid</span></td>
                <td>Thu 26 Nov (Thanksgiving Day)</td>
                <td className="pe-4 text-end">
                  <span className="badge bg-success text-white">OPEN</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
