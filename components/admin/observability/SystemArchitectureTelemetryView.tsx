'use client';

import { Card } from '@/components/ui';
import { LineChart, BarChart, Sparkline } from '@/components/charts';

export function SystemArchitectureTelemetryView() {
  const daemons = [
    { name: 'sente-api', role: 'FastAPI REST Gateway', pid: 14201, uptime: '42d 18h', status: 'Healthy', cpu: '14.2%', mem: '340MB', restarts: 0 },
    { name: 'sente-worker', role: 'Celery / Redis Job Queue', pid: 14208, uptime: '42d 18h', status: 'Healthy', cpu: '22.8%', mem: '680MB', restarts: 0 },
    { name: 'sente-sweeper', role: 'Corridor Float Auto-Sweeper', pid: 14214, uptime: '18d 04h', status: 'Healthy', cpu: '4.1%', mem: '180MB', restarts: 0 },
    { name: 'sente-migrate', role: 'Database Schema Sync Sentinel', pid: 14220, uptime: 'Completed', status: 'Idle', cpu: '0.0%', mem: '45MB', restarts: 0 },
    { name: 'rotate-sensitive-data', role: 'Key & Secret Vault Vaultkeeper', pid: 14225, uptime: 'Cron (Daily)', status: 'Active', cpu: '1.2%', mem: '92MB', restarts: 0 },
  ];

  const circuitBreakers = [
    { provider: 'Flutterwave NIP', rail: 'NGN Payouts', state: 'CLOSED', failures: 0, threshold: '5 / 30s', fallback: 'Access Direct Wire', latency: '210ms' },
    { provider: 'DriveWealth LLC', rail: 'US Brokerage', state: 'CLOSED', failures: 0, threshold: '3 / 60s', fallback: 'Queued Staging Buffer', latency: '480ms' },
    { provider: 'YellowCard API', rail: 'USDT Liquidity', state: 'HALF_OPEN', failures: 2, threshold: '4 / 30s', fallback: 'Kraken Institutional OTC', latency: '820ms' },
    { provider: 'SmsGh / Twilio', rail: '2FA OTP Dispatches', state: 'CLOSED', failures: 0, threshold: '10 / 60s', fallback: 'Termii Backup Route', latency: '340ms' },
  ];

  const dbPoolLabels = ['Active', 'Idle in Pool', 'Max Overflow', 'Awaiting Queue'];
  const dbPoolSlots = [28, 72, 10, 0];

  const redisHours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  const redisMemoryMB = [210, 225, 240, 290, 310, 285];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Backend Daemon Architecture Matrix */}
      <Card className="p-3 shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">Backend Process Daemons & Microservice Supervisions</h6>
            <span className="text-muted fs-12">Systemd and supervisord managed core processes</span>
          </div>
          <span className="badge bg-success-subtle text-success px-2 py-1 fs-11">All Daemons Up</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-12">
            <thead>
              <tr className="text-muted text-uppercase fs-11 border-bottom">
                <th>Daemon / Service</th>
                <th>Role & Responsibility</th>
                <th>PID</th>
                <th>Uptime</th>
                <th>CPU</th>
                <th>Resident Mem</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {daemons.map((d) => (
                <tr key={d.name}>
                  <td className="fw-bold font-monospace text-dark">{d.name}</td>
                  <td className="text-secondary">{d.role}</td>
                  <td className="font-monospace text-muted">{d.pid}</td>
                  <td className="font-monospace">{d.uptime}</td>
                  <td className="font-monospace">{d.cpu}</td>
                  <td className="font-monospace">{d.mem}</td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === 'Healthy'
                          ? 'bg-success-subtle text-success'
                          : d.status === 'Idle'
                          ? 'bg-secondary-subtle text-secondary'
                          : 'bg-primary-subtle text-primary'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provider Circuit Breaker Failovers */}
      <Card className="p-3 shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">Provider Circuit Breaker & Failover Topology</h6>
            <span className="text-muted fs-12">Automated downstream fault isolation and zero-downtime routing</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-12">
            <thead>
              <tr className="text-muted text-uppercase fs-11 border-bottom">
                <th>Provider Target</th>
                <th>Operational Rail</th>
                <th>Circuit State</th>
                <th>Error Trip Threshold</th>
                <th>Automated Failover Target</th>
                <th>Round-Trip Latency</th>
              </tr>
            </thead>
            <tbody>
              {circuitBreakers.map((cb) => (
                <tr key={cb.provider}>
                  <td className="fw-semibold text-dark">{cb.provider}</td>
                  <td className="text-muted">{cb.rail}</td>
                  <td>
                    <span
                      className={`badge ${
                        cb.state === 'CLOSED'
                          ? 'bg-success-subtle text-success'
                          : cb.state === 'HALF_OPEN'
                          ? 'bg-warning-subtle text-warning'
                          : 'bg-danger-subtle text-danger'
                      }`}
                    >
                      {cb.state}
                    </span>
                  </td>
                  <td className="font-monospace text-muted">{cb.threshold}</td>
                  <td className="fw-medium text-dark">{cb.fallback}</td>
                  <td className="font-monospace text-muted">{cb.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Connection Pools & Redis Telemetry */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">PostgreSQL Connection Pool Allocation</h6>
              <span className="text-muted fs-12">SQLAlchemy async engine connection reuse slots</span>
            </div>
            <div style={{ height: 230 }}>
              <BarChart labels={dbPoolLabels} data={dbPoolSlots} color="#16B364" />
            </div>
            <div className="d-flex justify-content-between mt-3 pt-2 border-top fs-11 text-muted">
              <span>Pool Size: 100</span>
              <span>Available: 72 slots</span>
              <span>Wait Queuing: 0 requests</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="p-3 shadow-sm border-0 h-100">
            <div className="mb-3">
              <h6 className="fw-bold mb-0 text-dark">Redis Cache & Celery Broker Footprint</h6>
              <span className="text-muted fs-12">In-memory quotation buffer and task queue depth</span>
            </div>
            <div style={{ height: 230 }}>
              <LineChart labels={redisHours} data={redisMemoryMB} label="Redis Mem (MB)" color="#16B364" />
            </div>
            <div className="d-flex justify-content-between mt-3 pt-2 border-top fs-11 text-muted">
              <span>Peak: 310MB</span>
              <span>Eviction Policy: volatile-lru</span>
              <span>Key Hit Ratio: 99.4%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
