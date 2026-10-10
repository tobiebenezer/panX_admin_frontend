'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { api, getAccessToken, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Card, DataTable, EmptyState, ErrorState, Modal, PageHeader, Skeleton, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

type TabName = 'applications' | 'alerts';

const TAB_TITLES: Record<TabName, string> = {
  applications: 'Applications',
  alerts: 'AML alerts',
};

const ALERT_RESOLUTIONS: Array<{ value: string; label: string }> = [
  { value: 'under_review', label: 'Mark under review' },
  { value: 'escalated', label: 'Escalate' },
  { value: 'closed_false_positive', label: 'Resolve – false positive' },
  { value: 'closed_suspicious', label: 'Resolve – suspicious activity' },
  { value: 'reported', label: 'Close as reported (STR filed)' },
];

function stat(v: unknown): string {
  if (v == null) return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : String(n);
}

export default function AdminKycPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<TabName>('applications');
  const [errors, setErrors] = useState<Partial<Record<TabName, unknown>>>({});

  const [dash, setDash] = useState<Record<string, any> | null>(null);
  const [appRows, setAppRows] = useState<any[] | null>(null);
  const [alertRows, setAlertRows] = useState<any[] | null>(null);

  const [detail, setDetail] = useState<Record<string, any> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [meId, setMeId] = useState('');
  const [alertAction, setAlertAction] = useState<Record<string, any> | null>(null);
  const [alertResolution, setAlertResolution] = useState('under_review');
  const [alertNotes, setAlertNotes] = useState('');
  const [runningMonitoring, setRunningMonitoring] = useState(false);
  const [runningExpiry, setRunningExpiry] = useState(false);

  const loadDash = useCallback(() => {
    api
      .get('/admin/kyc/dashboard')
      .then((data) => setDash(data.dashboard || data))
      .catch(() => {});
  }, []);

  const loadApps = useCallback(() => {
    api
      .get('/admin/kyc/applications?limit=100')
      .then((data) => {
        setAppRows(listOf(data, 'applications', 'items'));
        setErrors((p) => ({ ...p, applications: undefined }));
      })
      .catch((err) => {
        setAppRows([]);
        setErrors((p) => ({ ...p, applications: err }));
        toast('error', err.message || 'Could not load applications');
      });
  }, [toast]);

  const loadAlerts = useCallback(() => {
    api
      .get('/admin/compliance/aml-alerts?limit=100')
      .then((data) => {
        setAlertRows(listOf(data, 'alerts', 'items'));
        setErrors((p) => ({ ...p, alerts: undefined }));
      })
      .catch((err) => {
        setAlertRows([]);
        setErrors((p) => ({ ...p, alerts: err }));
        toast('error', err.message || 'Could not load AML alerts');
      });
  }, [toast]);

  useEffect(() => {
    loadDash();
    api
      .get('/auth/me')
      .then((data) => setMeId(String(data.user?.id || '')))
      .catch(() => {});
  }, [loadDash]);

  useEffect(() => {
    if (tab === 'applications') loadApps();
    else loadAlerts();
  }, [tab, loadApps, loadAlerts]);

  function openApp(id: string) {
    setDetailLoading(true);
    api
      .get(`/admin/kyc/applications/${encodeURIComponent(id)}`)
      .then((data) => {
        setDetail(data.application || data);
        setTimeout(() => document.getElementById('appDetailCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      })
      .catch((err) => toast('error', err.message || 'Could not open application'))
      .finally(() => setDetailLoading(false));
  }

  function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const f = e.currentTarget;
    const fd = new FormData(f);
    api
      .post(`/admin/kyc/applications/${encodeURIComponent(String(detail.id))}/review`, {
        decision: String(fd.get('decision') || ''),
        notes: String(fd.get('notes') || '').trim() || null,
      })
      .then(() => {
        toast('success', 'Review recorded');
        f.reset();
        setDetail(null);
        loadApps();
        loadDash();
      })
      .catch((err) => toast('error', err.message || 'Review failed'));
  }

  function assignSelf(id: string) {
    if (!meId) {
      toast('error', 'Current admin identity unavailable');
      return;
    }
    api
      .post(`/admin/kyc/applications/${encodeURIComponent(id)}/assign`, { assignee_id: meId })
      .then(() => {
        toast('success', 'Assigned');
        loadApps();
      })
      .catch((err) => toast('error', err.message || 'Assignment failed'));
  }

  function submitAlertResolution() {
    if (!alertAction || !alertNotes.trim()) return;
    api
      .post(`/admin/compliance/aml-alerts/${encodeURIComponent(String(alertAction.id))}/review`, {
        status: alertResolution,
        notes: alertNotes.trim(),
      })
      .then(() => {
        toast('success', 'Alert reviewed');
        setAlertAction(null);
        setAlertNotes('');
        loadAlerts();
        loadDash();
      })
      .catch((err) => toast('error', err.message || 'Review failed'));
  }

  function runMonitoring() {
    setRunningMonitoring(true);
    api
      .post('/admin/compliance/monitoring/run', {})
      .then(() => {
        toast('success', 'Transaction monitoring triggered');
        loadDash();
      })
      .catch((err) => toast('error', err.message || 'Monitoring run failed'))
      .finally(() => setRunningMonitoring(false));
  }

  function runExpiry() {
    setRunningExpiry(true);
    api
      .post('/admin/compliance/expiry/run', {})
      .then(() => {
        toast('success', 'Expiry checks triggered');
        loadDash();
      })
      .catch((err) => toast('error', err.message || 'Expiry run failed'))
      .finally(() => setRunningExpiry(false));
  }

  const docs: any[] = Array.isArray(detail?.documents) ? detail.documents : [];

  return (
    <div>
      <PageHeader
        title="Identity & Business Review"
        breadcrumb="KYC & AML"
        actions={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" disabled={runningMonitoring} onClick={runMonitoring}>
              <i className="ti ti-refresh fs-14" /> Monitoring
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" disabled={runningExpiry} onClick={runExpiry}>
              <i className="ti ti-clock-check fs-14" /> Expiry Checks
            </button>
          </div>
        }
      />

      <div className="row g-3 mb-4">
        {[
          { label: 'Pending applications', value: stat(dash?.pending_count ?? (Number(dash?.submitted) || 0) + (Number(dash?.in_review) || 0)), unit: 'queue' },
          { label: 'Approved (period)', value: stat(dash?.approved_count ?? dash?.approved), unit: 'verified', isSuccess: true },
          { label: 'Open AML alerts', value: stat(dash?.open_alerts ?? dash?.open_aml_alerts), unit: 'review' },
          { label: 'Docs expiring soon', value: stat(dash?.expiring_soon ?? dash?.expiring_in_30_days), unit: '&lt; 30d' },
        ].map((c) => {
          return (
            <div className="col-md-3 col-6" key={c.label}>
              <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
                <span className="text-secondary fs-12 d-block">{c.label}</span>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <span className={`fs-22 fw-bold ${c.isSuccess ? 'text-success' : 'text-dark'}`}>{c.value}</span>
                  <span className="fs-12 text-muted">{c.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="nav nav-pills gap-2 mb-4 flex-wrap" id="kcTabs">
        {(Object.keys(TAB_TITLES) as TabName[]).map((t) => (
          <li key={t} className="nav-item">
            <button
              type="button"
              className={`btn ${tab === t ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
              data-tab={t}
              onClick={() => setTab(t)}
            >
              <i className={`ti ti-${t === 'applications' ? 'file-text' : 'alert-triangle'} me-1`} /> {TAB_TITLES[t]}
            </button>
          </li>
        ))}
      </ul>

      <Card title={TAB_TITLES[tab]} className="shadow-sm border-0" bodyClassName="pt-0">
        {errors[tab] ? (
          <ErrorState error={errors[tab]} />
        ) : tab === 'applications' ? (
          <DataTable
            columns={['Applicant', 'Tier requested', 'Reviewer', 'Status', 'Submitted', '']}
            rows={appRows}
            render={(a: any) => {
              const pending = /^(submitted|pending_review|in_review|under_review)/.test(String(a.status));
              const assigned = a.reviewer_id || a.assigned_to;
              return [
                a.full_name || a.applicant_name || a.user_id || '',
                <span className="fs-12 text-capitalize" key="t">
                  {String(a.tier || a.requested_tier || a.verification_level || '')}
                </span>,
                <span className="fs-12" key="r">{assigned ? String(a.reviewer_name || assigned).slice(0, 13) + '…' : 'unassigned'}</span>,
                <StatusPill key="s" status={a.status} />,
                <span className="fs-12 text-muted" key="d">{fmtDate(a.submitted_at || a.created_at, true)}</span>,
                <div key="actions" className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-default btn-icon btn-sm"
                    title="Inspect Application & Documents"
                    onClick={() => openApp(String(a.id))}
                  >
                    <i className="ti ti-eye fs-lg" />
                  </button>
                  {pending && !assigned ? (
                    <button
                      type="button"
                      className="btn btn-ghost-primary btn-icon btn-sm"
                      title="Assign to Me"
                      onClick={() => assignSelf(String(a.id))}
                    >
                      <i className="ti ti-user-plus fs-lg" />
                    </button>
                  ) : null}
                </div>,
              ];
            }}
          />
        ) : (
          <DataTable
            columns={['Alert', 'Rule', 'Severity', 'Status', 'Detected', 'Actions']}
            rows={alertRows}
            render={(al: any) => {
              const open = !/resolved|dismissed|closed/.test(String(al.status).toLowerCase());
              return [
                <span className="font-monospace fs-12" key="i">
                  {String(al.id || '').slice(0, 13)}…
                </span>,
                <span className="fs-12" key="ru">{al.rule_name || al.rule || ''}</span>,
                <span key="se"><StatusPill status={al.severity || 'medium'} /></span>,
                <StatusPill key="st" status={al.status} />,
                <span className="fs-12 text-muted" key="d">{fmtDate(al.detected_at || al.opened_at || al.created_at, true)}</span>,
                open ? (
                  <div key="act" className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost-danger btn-icon btn-sm"
                      title="Review & Resolve Alert"
                      onClick={() => {
                        setAlertAction(al);
                        setAlertResolution('under_review');
                        setAlertNotes('');
                      }}
                    >
                      <i className="ti ti-shield-search fs-lg" />
                    </button>
                  </div>
                ) : (
                  <span key="act" className="text-muted fs-11">—</span>
                ),
              ];
            }}
          />
        )}
      </Card>

      {detailLoading ? (
        <Card title="Application detail" className="mt-4">
          <Skeleton width="80%" />
          <Skeleton width="65%" />
        </Card>
      ) : detail ? (
        <Card
          title="Application Detail"
          subtitle={String(detail.id)}
          className="shadow-sm border-0 mt-4"
          bodyClassName="row g-4"
          actions={
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDetail(null)}>
              <i className="ti ti-x me-1" /> Close
            </button>
          }
        >
          <div className="col-lg-6 quote-summary">
            <div className="qs-row qs-total">
              <span>Status</span>
              <strong><StatusPill status={detail.status} /></strong>
            </div>
            <div className="qs-row">
              <span>User</span>
              <strong className="text-break">{String(detail.user_id || '')}</strong>
            </div>
            <div className="qs-row">
              <span>Tier</span>
              <strong>{detail.tier || detail.verification_level || '—'}</strong>
            </div>
            <div className="qs-row">
              <span>Liveness</span>
              <strong><StatusPill status={detail.liveness_status || 'not_started'} /></strong>
            </div>
            <div className="qs-row">
              <span>Screening</span>
              <strong><StatusPill status={detail.screening_status || detail.sanctions_status || 'pending'} /></strong>
            </div>
          </div>
          <div className="col-lg-6">
            <h6 className="card-title mb-2">Documents</h6>
            <div className="mb-3">
              {docs.length ? (
                docs.map((d, i) => (
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" key={d.id || i}>
                    <span className="fs-13 d-flex align-items-center">
                      <i className="ti ti-file me-2 text-muted" />
                      <span className="me-2">{d.document_type || d.type}</span>
                      <StatusPill status={d.status || ''} />
                    </span>
                    <a
                      className="btn btn-outline-secondary btn-sm p-1"
                      href={`/v1/admin/kyc/documents/${encodeURIComponent(String(d.id))}/content?token=${encodeURIComponent(getAccessToken() || '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="ti ti-download" />
                    </a>
                  </div>
                ))
              ) : (
                <EmptyState icon="ti-file-x" title="No documents" />
              )}
            </div>
            <form onSubmit={submitReview} data-validate>
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label">Decision</label>
                  <select className="form-select w-100" name="decision" defaultValue="approve">
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                    <option value="request_more">Request more info</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" name="notes" placeholder="Reviewer notes (audited)" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm mt-3">
                <i className="ti ti-check me-1" /> Submit review
              </button>
            </form>
          </div>
        </Card>
      ) : null}

      <Modal
        open={!!alertAction}
        onClose={() => setAlertAction(null)}
        title="Review AML alert"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAlertAction(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!alertNotes.trim()} onClick={submitAlertResolution}>
              Submit resolution
            </button>
          </>
        }
      >
        <p className="fs-12 text-muted mb-2">
          Alert <span className="font-monospace">{alertAction ? String(alertAction.id).slice(0, 13) : ''}…</span> — reviewer note is required and audited.
        </p>
        <select className="form-select w-100 mb-2" value={alertResolution} onChange={(e) => setAlertResolution(e.target.value)}>
          {ALERT_RESOLUTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea className="form-control" rows={3} placeholder="Reviewer note (required)" value={alertNotes} onChange={(e) => setAlertNotes(e.target.value)} autoFocus />
      </Modal>
    </div>
  );
}
