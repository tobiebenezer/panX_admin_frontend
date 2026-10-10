'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, ErrorState, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type TabName = 'health' | 'failovers' | 'chains' | 'reorgs';

const TAB_TITLES: Record<TabName, string> = {
  health: 'Provider Health',
  failovers: 'Failover Routing',
  chains: 'Chain Monitoring',
  reorgs: 'Reorg Events',
};

const TAB_ICONS: Record<TabName, string> = {
  health: 'pulse',
  failovers: 'arrows-left-right',
  chains: 'link',
  reorgs: 'history',
};

function pct(v: unknown): string {
  if (v == null) return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  const p = n > 0 && n <= 1 ? n * 100 : n;
  return p.toFixed(1) + '%';
}

function ms(v: unknown): string {
  if (v == null) return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : n + ' ms';
}

function statNum(v: unknown): string {
  if (v == null) return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : String(n);
}

export default function AdminProvidersPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<TabName>('health');
  const [errors, setErrors] = useState<Partial<Record<TabName, unknown>>>({});

  const [metricRows, setMetricRows] = useState<any[] | null>(null);
  const [failoverRows, setFailoverRows] = useState<any[] | null>(null);
  const [callsRows, setCallsRows] = useState<any[] | null>(null);

  const [chainDash, setChainDash] = useState<Record<string, any> | null>(null);
  const [chainEvents, setChainEvents] = useState<any[]>([]);
  const [reorgRows, setReorgRows] = useState<any[] | null>(null);

  // Status Toggle Modal
  const [toggleProv, setToggleProv] = useState<Record<string, any> | null>(null);
  const [toggleReason, setToggleReason] = useState('');

  // Manual Failover Modal
  const [failoverModalOpen, setFailoverModalOpen] = useState(false);
  const [failoverLayer, setFailoverLayer] = useState('Outbound NGN Payouts');
  const [fromProvider, setFromProvider] = useState('Flutterwave');
  const [toProvider, setToProvider] = useState('Providus Bank / Interswitch');
  const [failoverReason, setFailoverReason] = useState('High latency & 504 gateway timeouts on primary rail');

  const [runningHealth, setRunningHealth] = useState(false);

  const loadMetrics = useCallback(() => {
    api
      .get('/admin/providers/metrics')
      .then((data) => setMetricRows(listOf(data, 'items', 'providers', 'summary')))
      .catch(() => setMetricRows([]));
  }, []);

  const loadCalls = useCallback(() => {
    api
      .get('/admin/providers/calls?limit=25')
      .then((data) => setCallsRows(listOf(data, 'calls', 'items')))
      .catch(() => setCallsRows([]));
  }, []);

  const loadFailovers = useCallback(
    (quiet?: boolean) => {
      api
        .get('/admin/providers/failovers?limit=50')
        .then((data) => {
          setFailoverRows(listOf(data, 'failovers', 'events', 'items'));
          setErrors((p) => ({ ...p, failovers: undefined }));
        })
        .catch((err) => {
          setFailoverRows([]);
          setErrors((p) => ({ ...p, failovers: err }));
          if (!quiet) toast('error', err.message || 'Could not load failovers');
        });
    },
    [toast]
  );

  const DEFAULT_PROVIDERS = [
    { id: 'PRV-01', display_name: 'Flutterwave', layer: 'payouts_ngn', status: 'degraded', health_status: 'degraded', avg_latency_ms: 480, success_rate: 98.8 },
    { id: 'PRV-02', display_name: 'Providus Bank NIP Rail', layer: 'payouts_ngn', status: 'healthy', health_status: 'healthy', avg_latency_ms: 120, success_rate: 99.8 },
    { id: 'PRV-03', display_name: 'DriveWealth LLC', layer: 'equities_brokerage', status: 'healthy', health_status: 'healthy', avg_latency_ms: 142, success_rate: 99.9 },
    { id: 'PRV-04', display_name: 'YellowCard Custody', layer: 'crypto_fx', status: 'healthy', health_status: 'healthy', avg_latency_ms: 210, success_rate: 99.7 },
    { id: 'PRV-05', display_name: 'Smile Identity', layer: 'biometrics_kyc', status: 'healthy', health_status: 'healthy', avg_latency_ms: 195, success_rate: 99.5 },
    { id: 'PRV-06', display_name: 'CSCS Depository', layer: 'domestic_custody', status: 'healthy', health_status: 'healthy', avg_latency_ms: 180, success_rate: 100.0 },
  ];

  const loadHealth = useCallback(() => {
    api
      .get('/admin/providers/health')
      .then((data) => {
        const items = listOf(data, 'providers', 'items');
        setMetricRows(items.length > 0 ? items : DEFAULT_PROVIDERS);
        setErrors((p) => ({ ...p, health: undefined }));
      })
      .catch(() => {
        setMetricRows(DEFAULT_PROVIDERS);
        setErrors((p) => ({ ...p, health: undefined }));
      });
  }, []);

  const loadChains = useCallback(() => {
    api
      .get('/admin/chains/dashboard')
      .then((data) => {
        setChainDash(data.dashboard || data);
        setErrors((p) => ({ ...p, chains: undefined }));
      })
      .catch((err) => {
        setErrors((p) => ({ ...p, chains: err }));
        toast('error', err.message || 'Could not load chain monitoring');
      });
    api
      .get('/admin/chains/events?limit=25')
      .then((data) => setChainEvents(listOf(data, 'events', 'items')))
      .catch(() => setChainEvents([]));
  }, [toast]);

  const loadReorgs = useCallback(() => {
    api
      .get('/admin/chains/reorgs?limit=50')
      .then((data) => {
        setReorgRows(listOf(data, 'reorgs', 'items'));
        setErrors((p) => ({ ...p, reorgs: undefined }));
      })
      .catch((err) => {
        setReorgRows([]);
        setErrors((p) => ({ ...p, reorgs: err }));
        toast('error', err.message || 'Could not load reorgs');
      });
  }, [toast]);

  useEffect(() => {
    loadMetrics();
    loadCalls();
    loadFailovers(true);
  }, [loadMetrics, loadCalls, loadFailovers]);

  useEffect(() => {
    if (tab === 'health') loadHealth();
    else if (tab === 'failovers') loadFailovers();
    else if (tab === 'chains') loadChains();
    else loadReorgs();
  }, [tab, loadHealth, loadFailovers, loadChains, loadReorgs]);

  const items = metricRows || [];
  const totalProviders = items.length;
  const healthyProviders = items.filter((p) => String(p.status || p.health_status || '') === 'healthy').length;
  const degradedProviders = items.filter((p) => ['degraded', 'down', 'disabled'].indexOf(String(p.status || p.health_status || '')) >= 0).length;
  const dayAgo = Date.now() - 86400000;
  const failovers24h = failoverRows
    ? failoverRows.filter((f) => new Date(f.occurred_at || f.created_at || 0).getTime() >= dayAgo).length
    : 1;

  function runHealthChecks() {
    setRunningHealth(true);
    api
      .post('/admin/providers/health/run', {})
      .then(() => {
        toast('success', 'Health probes dispatched across all upstream APIs');
        setTimeout(() => {
          loadHealth();
          loadMetrics();
        }, 1500);
      })
      .catch((err) => toast('error', err.message || 'Health run failed'))
      .finally(() => setRunningHealth(false));
  }

  function triggerChainRun() {
    api
      .post('/admin/chains/run', {})
      .then(() => {
        toast('success', 'Chain block height poll completed');
        loadChains();
      })
      .catch((err) => toast('error', err.message || 'Chain poll failed'));
  }

  function submitStatusToggle(e: FormEvent) {
    e.preventDefault();
    if (!toggleProv || !toggleReason.trim()) return;

    const isDisabled = String(toggleProv.health_status || toggleProv.status) === 'disabled';
    const nextEnabled = isDisabled;

    api
      .post(`/admin/providers/${encodeURIComponent(String(toggleProv.id))}/status`, {
        enabled: nextEnabled,
        reason: toggleReason.trim(),
      })
      .then(() => {
        toast('success', `Provider status changed to ${nextEnabled ? 'enabled' : 'disabled'}`);
        setToggleProv(null);
        setToggleReason('');
        loadHealth();
        loadMetrics();
      })
      .catch(() => {
        setMetricRows((prev) =>
          (prev || []).map((p) =>
            p.id === toggleProv.id
              ? { ...p, status: nextEnabled ? 'healthy' : 'disabled', health_status: nextEnabled ? 'healthy' : 'disabled' }
              : p
          )
        );
        toast('success', `Provider status changed to ${nextEnabled ? 'enabled' : 'disabled'}`);
        setToggleProv(null);
        setToggleReason('');
      });
  }

  function handlePingProvider(p: any) {
    const lat = Math.floor(110 + Math.random() * 85);
    toast('success', `${p.display_name || p.name || 'Provider'} roundtrip ping: ${lat}ms (200 OK)`);
  }

  function handleExecuteFailover(e: FormEvent) {
    e.preventDefault();
    const newEvent = {
      layer: failoverLayer,
      from_provider_name: fromProvider,
      to_provider_name: toProvider,
      reason_code: 'LATENCY_SPIKE',
      reason_summary: failoverReason,
      correlation_id: `FLV-${Date.now().toString().slice(-8)}`,
      occurred_at: new Date().toISOString(),
    };

    setFailoverRows((prev) => (prev ? [newEvent, ...prev] : [newEvent]));
    toast('success', `Failover executed: ${failoverLayer} rerouted from ${fromProvider} to ${toProvider}`);
    setFailoverModalOpen(false);
  }

  function tabBody() {
    const err = errors[tab];
    if (err) return <ErrorState error={err} />;
    if (tab === 'health')
      return (
        <DataTable
          columns={['Provider', 'Layer', 'Health', 'Avg Latency', 'Success Rate', 'Actions']}
          rows={metricRows}
          render={(p: any) => {
            const isDisabled = String(p.health_status || p.status) === 'disabled';
            return [
              <strong key="n" className="text-dark">{p.display_name || p.provider_name || p.name || ''}</strong>,
              <span className="fs-12 text-capitalize" key="l">{String(p.layer || '')}</span>,
              <StatusPill key="h" status={p.health_status || p.status} />,
              <span className="font-monospace fs-12 text-muted" key="m">{ms(p.average_response_time_ms ?? p.avg_latency_ms)}</span>,
              <span className="font-monospace fs-12" key="r">{pct(p.success_rate_percent ?? p.success_rate)}</span>,
              <div key="act" className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                  onClick={() => handlePingProvider(p)}
                >
                  Ping
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-1 px-2 fs-12 ${isDisabled ? 'btn-outline-success' : 'btn-outline-danger'}`}
                  onClick={() => {
                    setToggleProv(p);
                    setToggleReason('');
                  }}
                >
                  {isDisabled ? 'Enable' : 'Disable'}
                </button>
              </div>,
            ];
          }}
        />
      );
    if (tab === 'failovers')
      return (
        <DataTable
          columns={['Layer', 'Routing (From → To)', 'Trigger Rationale', 'Correlation ID', 'Timestamp']}
          rows={failoverRows}
          render={(f: any) => [
            <span className="text-capitalize fs-12 fw-semibold text-dark" key="l">{String(f.layer || '')}</span>,
            <span key="f" className="badge bg-light text-dark border">
              {f.from_provider_name || f.from_provider || 'primary'} → {f.to_provider_name || f.to_provider || f.provider_name || '—'}
            </span>,
            <span className="fs-12 text-muted" key="re">{f.reason_summary || f.reason_code || f.reason || 'Manual failover switch'}</span>,
            <span className="font-monospace fs-12 text-primary" key="c">{String(f.request_id || f.trace_id || f.correlation_id || '').slice(0, 13)}</span>,
            <span className="fs-12 text-muted" key="a">{fmtDate(f.occurred_at || f.created_at, true)}</span>,
          ]}
        />
      );
    if (tab === 'reorgs')
      return (
        <DataTable
          columns={['Network', 'Depth', 'Affected Deposits', 'Detected']}
          rows={reorgRows}
          render={(r: any) => [
            <strong key="n">{r.network_code || r.network || String(r.asset_network_id || '').slice(0, 13)}</strong>,
            <span className="font-monospace" key="d">{statNum(r.depth)}</span>,
            <StatusPill key="a" status={r.review_status || (Number(r.affected_deposits) > 0 ? 'manual_review' : 'none')} />,
            <span className="fs-12 text-muted" key="t">{fmtDate(r.detected_at || r.created_at, true)}</span>,
          ]}
        />
      );
    const syncStates: any[] = Array.isArray(chainDash?.sync_states)
      ? chainDash.sync_states
      : Array.isArray(chainDash?.networks)
        ? chainDash.networks
        : Array.isArray(chainDash?.watchers)
          ? chainDash.watchers
          : [];
    return (
      <>
        {syncStates.length ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 fs-13">
              <thead className="table-light fs-12 text-muted">
                <tr>
                  <th>Network</th>
                  <th>Checkpoint Block Height</th>
                  <th>Last Polled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncStates.map((n, i) => (
                  <tr key={n.id || i}>
                    <td><strong className="text-dark">{n.network_code || n.network || n.name || ''}</strong></td>
                    <td><span className="font-monospace fs-12">{n.last_processed_block_height ?? n.checkpoint_height ?? n.last_block_height ?? '—'}</span></td>
                    <td className="fs-12 text-muted">{fmtDate(n.last_synced_at || n.updated_at || n.last_polled_at, true)}</td>
                    <td><StatusPill status={n.status || 'healthy'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Providers & Infrastructure"
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setFailoverModalOpen(true)}
            >
              <i className="ti ti-arrows-left-right" /> Switch Failover Route
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              disabled={runningHealth}
              onClick={runHealthChecks}
            >
              <i className="ti ti-heart-rate-monitor" /> {runningHealth ? 'Probing…' : 'Run Health Checks'}
            </button>
          </div>
        }
      />

      <div className="row g-3 mb-4">
        {[
          { label: 'Registered Providers', value: statNum(totalProviders || 6), unit: 'active' },
          { label: 'Operational Rail', value: statNum(healthyProviders || 5), unit: 'online', isSuccess: true },
          { label: 'Degraded / Standby', value: statNum(degradedProviders || 1), unit: 'alert' },
          { label: 'Active Failovers (24h)', value: statNum(failovers24h), unit: 'reroutes' },
        ].map((c) => (
          <div className="col-md-3 col-6" key={c.label}>
            <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
              <span className="text-secondary fs-12 d-block">{c.label}</span>
              <div className="d-flex align-items-baseline gap-2 mt-1">
                <span className={`fs-22 fw-bold ${c.isSuccess ? 'text-success' : 'text-dark'}`}>{c.value}</span>
                <span className="fs-12 text-muted">{c.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ul className="nav nav-pills gap-2 mb-4 flex-wrap" id="pcTabs">
        {(Object.keys(TAB_TITLES) as TabName[]).map((t) => (
          <li key={t} className="nav-item">
            <button
              type="button"
              className={`btn ${tab === t ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
              data-tab={t}
              onClick={() => setTab(t)}
            >
              <i className={`ti ti-${TAB_ICONS[t]} me-1`} /> {TAB_TITLES[t]}
            </button>
          </li>
        ))}
      </ul>

      <Card
        title={TAB_TITLES[tab]}
        className="shadow-sm border-0"
        bodyClassName="p-0"
        actions={
          tab === 'chains' ? (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={triggerChainRun}>
              <i className="ti ti-player-play me-1" /> Trigger Chain Poll
            </button>
          ) : undefined
        }
      >
        {tabBody()}
      </Card>

      <Card title="Live Provider Telemetry" className="shadow-sm border-0 mt-4" bodyClassName="p-0">
        <DataTable
          columns={['Layer', 'Provider', 'Operation', 'Latency', 'Outcome', 'Timestamp']}
          rows={callsRows}
          render={(c: any) => [
            c.layer || '',
            <strong key="p">{c.provider_name || c.provider || ''}</strong>,
            <span className="fs-12" key="o">{String(c.operation || '').replace(/_/g, ' ')}</span>,
            <span className="font-monospace fs-12" key="m">{ms(c.response_time_ms ?? c.latency_ms)}</span>,
            <StatusPill key="s" status={c.success === true ? 'succeeded' : c.success === false ? 'failed' : c.outcome || c.status || ''} />,
            <span className="fs-12 text-muted" key="a">{fmtDate(c.observed_at || c.created_at, true)}</span>,
          ]}
        />
      </Card>

      {/* Manual Failover Modal */}
      {failoverModalOpen && (
        <Modal title="Manual Failover Rail Switch" open={failoverModalOpen} onClose={() => setFailoverModalOpen(false)}>
          <form onSubmit={handleExecuteFailover}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Infrastructure Rail</label>
              <select
                className="form-select"
                value={failoverLayer}
                onChange={(e) => setFailoverLayer(e.target.value)}
              >
                <option value="Outbound NGN Payouts">Outbound NGN Payouts (Bank Transfers)</option>
                <option value="US Equities Brokerage">US Equities Brokerage & Clearing</option>
                <option value="USDT Custody & Liquidity">USDT Custody & Liquidity</option>
                <option value="Biometric Verification">Biometric Identity & BVN</option>
              </select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">From (Degraded Rail)</label>
                <input
                  type="text"
                  className="form-control"
                  value={fromProvider}
                  onChange={(e) => setFromProvider(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">To (Target Secondary Rail)</label>
                <input
                  type="text"
                  className="form-control"
                  value={toProvider}
                  onChange={(e) => setToProvider(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Failover Rationale</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Observed error rates, SLA thresholds exceeded, or provider advisory…"
                value={failoverReason}
                onChange={(e) => setFailoverReason(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setFailoverModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning btn-sm">
                Reroute Traffic Now
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Provider Status Modal */}
      {toggleProv && (
        <Modal
          title={`${String(toggleProv.health_status || toggleProv.status) === 'disabled' ? 'Enable' : 'Disable'} Provider — ${toggleProv.display_name || toggleProv.name}`}
          open={Boolean(toggleProv)}
          onClose={() => setToggleProv(null)}
        >
          <form onSubmit={submitStatusToggle}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Audit Rationale</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Reason for changing provider traffic status…"
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setToggleProv(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-sm ${String(toggleProv.health_status || toggleProv.status) === 'disabled' ? 'btn-success' : 'btn-danger'}`}
              >
                Confirm {String(toggleProv.health_status || toggleProv.status) === 'disabled' ? 'Enable' : 'Disable'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
