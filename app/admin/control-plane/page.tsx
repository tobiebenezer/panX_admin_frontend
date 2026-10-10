'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, EmptyState, ErrorState, Modal, PageHeader, Skeleton, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type TabName = 'approvals' | 'killswitches' | 'breakers' | 'config' | 'audit';

const TABS: Array<{ id: TabName; icon: string; label: string }> = [
  { id: 'approvals', icon: 'file-check', label: 'Approvals' },
  { id: 'killswitches', icon: 'alert-octagon', label: 'Kill switches' },
  { id: 'breakers', icon: 'plug-off', label: 'Circuit breakers' },
  { id: 'config', icon: 'stack-2', label: 'Config versions' },
  { id: 'audit', icon: 'file-text', label: 'Audit logs' },
];

const TAB_TITLES: Record<TabName, string> = {
  approvals: 'Approval requests',
  killswitches: 'Kill switches',
  breakers: 'Circuit breakers',
  config: 'Staged configuration',
  audit: 'Audit logs',
};

const CONFIG_TABLES = ['fee_schedules', 'corridor_rules', 'provider_routing'];

export default function ControlPlanePage() {
  const { toast } = useToast();
  const router = useRouter();

  const [tab, setTab] = useState<TabName>('approvals');
  const [errors, setErrors] = useState<Partial<Record<TabName, unknown>>>({});

  const [approvals, setApprovals] = useState<any[] | null>(null);
  const [ksManual, setKsManual] = useState<any[] | null>(null);
  const [ksAuto, setKsAuto] = useState<any[] | null>(null);
  const [breakers, setBreakers] = useState<any[] | null>(null);
  const [cfgTable, setCfgTable] = useState('fee_schedules');
  const [versions, setVersions] = useState<any[] | null>(null);
  const [logs, setLogs] = useState<any[] | null>(null);

  const [impersonation, setImpersonation] = useState<Record<string, any> | null>(null);

  const [decision, setDecision] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [activateOpen, setActivateOpen] = useState(false);
  const [ksScope, setKsScope] = useState('');
  const [ksReason, setKsReason] = useState('');
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftJson, setDraftJson] = useState('');
  const [promotePreview, setPromotePreview] = useState<{ table: string; id: string; preview: unknown } | null>(null);

  const fail = useCallback(
    (t: TabName, err: unknown) => {
      setErrors((p) => ({ ...p, [t]: err }));
      const msg = err instanceof Error ? err.message : 'Request failed';
      toast('error', msg);
    },
    [toast]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem('pae_cfg_table');
    if (saved && CONFIG_TABLES.includes(saved)) setCfgTable(saved);
  }, []);

  const loadApprovals = useCallback(() => {
    api
      .get('/admin/approvals')
      .then((data) => {
        setApprovals(listOf(data, 'approvals', 'items'));
        setErrors((p) => ({ ...p, approvals: undefined }));
      })
      .catch((err) => {
        setApprovals([]);
        fail('approvals', err);
      });
  }, [fail]);

  const loadKillSwitches = useCallback(() => {
    Promise.all([
      api.get('/admin/kill-switches').catch(() => null),
      api.get('/admin/circuit-breakers').catch(() => null),
    ]).then(([k, cb]) => {
      setKsManual(listOf(k, 'kill_switches', 'items'));
      setKsAuto(listOf(cb, 'circuit_breakers', 'items'));
    });
  }, []);

  const loadBreakers = useCallback(() => {
    api
      .get('/admin/circuit-breakers')
      .then((data) => {
        setBreakers(listOf(data, 'circuit_breakers', 'breakers', 'items'));
        setErrors((p) => ({ ...p, breakers: undefined }));
      })
      .catch((err) => {
        setBreakers([]);
        fail('breakers', err);
      });
  }, [fail]);

  const loadConfig = useCallback(
    (table: string) => {
      api
        .get(`/admin/config/${encodeURIComponent(table)}`)
        .then((data) => {
          setVersions(listOf(data, 'versions', 'drafts', 'items'));
          setErrors((p) => ({ ...p, config: undefined }));
        })
        .catch((err) => {
          setVersions([]);
          fail('config', err);
        });
    },
    [fail]
  );

  const loadAudit = useCallback(() => {
    api
      .get('/admin/audit-logs?limit=100')
      .then((data) => {
        setLogs(listOf(data, 'logs', 'audit_logs', 'items'));
        setErrors((p) => ({ ...p, audit: undefined }));
      })
      .catch((err) => {
        setLogs([]);
        fail('audit', err);
      });
  }, [fail]);

  useEffect(() => {
    if (tab === 'approvals') loadApprovals();
    else if (tab === 'killswitches') loadKillSwitches();
    else if (tab === 'breakers') loadBreakers();
    else if (tab === 'config') loadConfig(cfgTable);
    else if (tab === 'audit') loadAudit();
  }, [tab, cfgTable, loadApprovals, loadKillSwitches, loadBreakers, loadConfig, loadAudit]);

  useEffect(() => {
    let alive = true;
    api
      .get('/admin/impersonation/context')
      .then((ctx) => {
        if (!alive) return;
        const active = ctx.impersonation || ctx.session;
        if (active && active.active) setImpersonation(active);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function endImpersonation() {
    if (!impersonation) return;
    api
      .post(`/admin/impersonation/${encodeURIComponent(impersonation.id || impersonation.session_id)}/end`, {})
      .then(() => router.refresh())
      .catch((err) => toast('error', err.message || 'Failed to end impersonation'));
  }

  function submitDecision() {
    if (!decision) return;
    if (decision.action === 'reject' && !decisionReason.trim()) return;
    api
      .post(
        `/admin/approvals/${encodeURIComponent(decision.id)}/${decision.action}`,
        decisionReason.trim() ? { reason: decisionReason.trim() } : {}
      )
      .then(() => {
        toast('success', decision.action === 'approve' ? 'Approval granted' : 'Approval rejected');
        setDecision(null);
        setDecisionReason('');
        loadApprovals();
      })
      .catch((err) => toast('error', err.message || 'Action failed'));
  }

  function submitActivate() {
    if (!ksScope.trim() || !ksReason.trim()) return;
    api
      .post('/admin/kill-switch/activate', { scope: ksScope.trim(), reason: ksReason.trim() })
      .then(() => {
        toast('success', 'Activated');
        setActivateOpen(false);
        setKsScope('');
        setKsReason('');
        loadKillSwitches();
      })
      .catch((err) => toast('error', err.message || 'Activation failed'));
  }

  function submitResolve() {
    if (!resolveId || !resolveNote.trim()) return;
    api
      .post(`/admin/kill-switches/${encodeURIComponent(resolveId)}/resolve`, { resolution_note: resolveNote.trim() })
      .then(() => {
        setResolveId(null);
        setResolveNote('');
        loadKillSwitches();
      })
      .catch((err) => toast('error', err.message || 'Resolve failed'));
  }

  function submitDraft() {
    let payload: unknown;
    try {
      payload = JSON.parse(draftJson);
    } catch {
      toast('error', 'Invalid JSON');
      return;
    }
    api
      .post(`/admin/config/${encodeURIComponent(cfgTable)}/draft`, payload)
      .then(() => {
        toast('success', 'Draft staged');
        setDraftOpen(false);
        setDraftJson('');
        loadConfig(cfgTable);
      })
      .catch((err) => toast('error', err.message || 'Draft failed'));
  }

  function openPromote(id: string) {
    api
      .get(`/admin/config/${encodeURIComponent(cfgTable)}/${encodeURIComponent(id)}/preview`)
      .then((pv) => setPromotePreview({ table: cfgTable, id, preview: pv?.preview ?? pv }))
      .catch((err) => toast('error', err.message || 'Preview failed'));
  }

  function confirmPromote() {
    if (!promotePreview) return;
    api
      .post(`/admin/config/${encodeURIComponent(promotePreview.table)}/${encodeURIComponent(promotePreview.id)}/promote`, {})
      .then(() => {
        toast('success', 'Config promoted');
        setPromotePreview(null);
        loadConfig(promotePreview.table);
      })
      .catch((err) => toast('error', err.message || 'Promote failed'));
  }

  const tabError = errors[tab];

  function tabBody() {
    if (tabError) return <ErrorState error={tabError} />;
    switch (tab) {
      case 'approvals':
        return (
          <DataTable
            columns={['ID', 'Action', 'Requested by', 'Status', 'Created', '']}
            rows={approvals}
            render={(ap) => [
              <span className="font-monospace fs-12" key="id">
                {String(ap.id || '').slice(0, 13)}…
              </span>,
              <span className="text-capitalize fs-12" key="a">
                {String(ap.action_type || ap.action || '').replace(/_/g, ' ')}
              </span>,
              <span className="fs-12" key="r">
                {ap.requested_by || ''}
              </span>,
              <StatusPill key="s" status={ap.status} />,
              <span className="fs-12 text-muted" key="c">
                {fmtDate(ap.created_at, true)}
              </span>,
              String(ap.status).toLowerCase() === 'pending' ? (
                <div className="d-flex gap-1" key="x">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm p-1"
                    title="Approve"
                    onClick={() => {
                      setDecision({ id: String(ap.id || ''), action: 'approve' });
                      setDecisionReason('');
                    }}
                  >
                    <i className="ti ti-check" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm p-1"
                    title="Reject"
                    onClick={() => {
                      setDecision({ id: String(ap.id || ''), action: 'reject' });
                      setDecisionReason('');
                    }}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
              ) : (
                <span key="x" />
              ),
            ]}
          />
        );
      case 'killswitches': {
        if (ksManual === null || ksAuto === null)
          return (
            <div className="p-3">
              <Skeleton width="85%" />
              <Skeleton width="70%" />
            </div>
          );
        if (!ksManual.length && !ksAuto.length)
          return <EmptyState icon="ti-shield-check" title="All clear" hint="No active switches or breakers." />;
        return (
          <>
            {ksManual.length ? (
              <div className="p-3">
                <h6 className="card-title mb-3">Manual & break-glass switches</h6>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Scope</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Activated</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ksManual.map((k, i) => {
                        const open = !/resolved|closed|inactive/.test(String(k.status).toLowerCase());
                        return (
                          <tr key={i}>
                            <td>
                              <strong>{k.scope || k.layer || ''}</strong>
                            </td>
                            <td className="fs-12">{k.reason || ''}</td>
                            <td>
                              <StatusPill status={k.status} />
                            </td>
                            <td className="fs-12 text-muted">{fmtDate(k.activated_at || k.created_at, true)}</td>
                            <td>
                              {open ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => {
                                    setResolveId(String(k.id));
                                    setResolveNote('');
                                  }}
                                >
                                  Resolve
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {ksAuto.length ? (
              <div className="p-3 border-top">
                <h6 className="card-title mb-3">Automatic layer breakers</h6>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Layer</th>
                        <th>State</th>
                        <th>Last trip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ksAuto.map((bk, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{bk.layer || bk.scope || ''}</strong>
                          </td>
                          <td>
                            <StatusPill status={bk.state || bk.status} />
                          </td>
                          <td className="fs-12 text-muted">{fmtDate(bk.last_transition_at || bk.updated_at, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        );
      }
      case 'breakers':
        return (
          <DataTable
            columns={['Layer', 'Provider', 'State', 'Failure count', 'Updated']}
            rows={breakers}
            render={(bk) => [
              <strong key="l">{bk.layer || ''}</strong>,
              bk.provider_name || bk.provider || '',
              <StatusPill key="s" status={bk.state || bk.status} />,
              <span className="font-monospace fs-12" key="f">
                {bk.failure_count != null ? bk.failure_count : '—'}
              </span>,
              <span className="fs-12 text-muted" key="u">
                {fmtDate(bk.last_transition_at || bk.updated_at, true)}
              </span>,
            ]}
          />
        );
      case 'config':
        return (
          <DataTable
            columns={['Version', 'Status', 'Created by', 'Created', '']}
            rows={versions}
            render={(v) => [
              <span className="font-monospace fs-12" key="v">
                {v.id || v.version || ''}
              </span>,
              <StatusPill key="s" status={v.status || v.state} />,
              <span className="fs-12" key="b">
                {v.created_by || ''}
              </span>,
              <span className="fs-12 text-muted" key="c">
                {fmtDate(v.created_at, true)}
              </span>,
              String(v.status).toLowerCase() === 'draft' ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  key="p"
                  onClick={() => openPromote(String(v.id))}
                >
                  Preview & promote
                </button>
              ) : (
                <span key="p" />
              ),
            ]}
          />
        );
      case 'audit':
        return (
          <DataTable
            columns={['Actor', 'Action', 'Target', 'Reason', 'At']}
            rows={logs}
            render={(l) => [
              <span className="fs-12" key="a">
                {l.actor_id || l.actor || ''}
              </span>,
              <span className="text-capitalize fs-12" key="ac">
                {String(l.action || '').replace(/_/g, ' ')}
              </span>,
              <span className="fs-12" key="t">
                {l.target_type || ''} {String(l.target_id || '').slice(0, 10)}
              </span>,
              <span className="fs-12 text-muted" key="r">
                {l.reason || ''}
              </span>,
              <span className="fs-12 text-muted" key="at">
                {fmtDate(l.created_at || l.at, true)}
              </span>,
            ]}
          />
        );
    }
  }

  return (
    <div>
      <PageHeader
        title="Control Plane"
        breadcrumb="Control Plane"
        actions={
          impersonation ? (
            <span className="badge bg-warning-subtle text-warning p-2">
              Impersonating {impersonation.target_user_id || impersonation.user_id || ''}{' '}
              <button type="button" className="btn btn-sm btn-link p-0 ms-2 text-warning" onClick={endImpersonation}>
                End
              </button>
            </span>
          ) : undefined
        }
      />

      <ul className="nav nav-pills gap-2 mb-4 flex-wrap" id="cpTabs">
        {TABS.map((t) => (
          <li key={t.id} className="nav-item">
            <button
              type="button"
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
              data-tab={t.id}
              onClick={() => setTab(t.id)}
            >
              <i className={`ti ti-${t.icon} me-1`} /> {t.label}
            </button>
          </li>
        ))}
      </ul>

      <Card
        title={TAB_TITLES[tab]}
        className="shadow-sm border-0"
        bodyClassName="p-0"
        actions={
          tab === 'killswitches' ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setActivateOpen(true);
                setKsScope('');
                setKsReason('');
              }}
            >
              <i className="ti ti-alert-octagon me-1" /> Activate kill switch
            </button>
          ) : tab === 'config' ? (
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select w-auto"
                value={cfgTable}
                onChange={(e) => {
                  const v = e.target.value;
                  sessionStorage.setItem('pae_cfg_table', v);
                  setCfgTable(v);
                }}
              >
                {CONFIG_TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm text-nowrap"
                onClick={() => {
                  setDraftOpen(true);
                  setDraftJson('');
                }}
              >
                <i className="ti ti-plus me-1" /> Stage draft
              </button>
            </div>
          ) : undefined
        }
      >
        {tabBody()}
      </Card>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.action === 'approve' ? 'Approve request' : 'Reject request'}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDecision(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${decision?.action === 'reject' ? 'btn-danger' : 'btn-primary'} btn-sm`}
              disabled={!!decision && decision.action === 'reject' && !decisionReason.trim()}
              onClick={submitDecision}
            >
              {decision?.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <p className="fs-12 text-muted mb-2">
          {decision?.action === 'approve' ? 'Optional note for the audit trail:' : 'Rejection reason:'}
        </p>
        <textarea
          className="form-control"
          rows={3}
          value={decisionReason}
          onChange={(e) => setDecisionReason(e.target.value)}
          autoFocus
        />
      </Modal>

      <Modal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate kill switch"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActivateOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={!ksScope.trim() || !ksReason.trim()}
              onClick={submitActivate}
            >
              Activate
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Scope</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. payout, settlement"
            value={ksScope}
            onChange={(e) => setKsScope(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Reason (audited)</label>
          <textarea className="form-control" rows={3} value={ksReason} onChange={(e) => setKsReason(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={!!resolveId}
        onClose={() => setResolveId(null)}
        title="Resolve kill switch"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setResolveId(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!resolveNote.trim()} onClick={submitResolve}>
              Resolve
            </button>
          </>
        }
      >
        <p className="fs-12 text-muted mb-2">Resolution note (mandatory retroactive review):</p>
        <textarea className="form-control" rows={3} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} autoFocus />
      </Modal>

      <Modal
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        title={`Stage draft — ${cfgTable.replace(/_/g, ' ')}`}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDraftOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!draftJson.trim()} onClick={submitDraft}>
              Stage draft
            </button>
          </>
        }
      >
        <p className="fs-12 text-muted mb-2">Draft configuration JSON:</p>
        <textarea
          className="form-control font-monospace"
          rows={8}
          value={draftJson}
          onChange={(e) => setDraftJson(e.target.value)}
          placeholder="{ }"
          autoFocus
        />
      </Modal>

      <Modal
        open={!!promotePreview}
        onClose={() => setPromotePreview(null)}
        title="Promote configuration version"
        width="640px"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPromotePreview(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={confirmPromote}>
              Promote
            </button>
          </>
        }
      >
        <pre className="font-monospace fs-12 p-3 bg-light rounded" style={{ maxHeight: 320, overflow: 'auto' }}>
          {promotePreview ? JSON.stringify(promotePreview.preview ?? {}, null, 2).slice(0, 1500) : ''}
        </pre>
      </Modal>
    </div>
  );
}
