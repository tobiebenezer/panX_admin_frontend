'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { StatusPill, PageHeader, Card, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { useToast } from '@/components/Toast';

const STEPS = [
  { id: 'stepStart', icon: 'file-text', label: 'Start application' },
  { id: 'stepDocs', icon: 'id', label: 'Documents' },
  { id: 'stepLive', icon: 'scan', label: 'Liveness' },
  { id: 'stepReview', icon: 'hourglass', label: 'Review' },
];

const FALLBACK_TYPES = ['passport', 'national_id', 'proof_of_address'];

interface KycDoc {
  id?: string;
  document_type?: string;
  type?: string;
  status?: string;
}

export default function KycPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [status, setStatus] = useState<string>('not started');
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'start' | 'docs' | 'done'>('start');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>(FALLBACK_TYPES);
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [livenessDone, setLivenessDone] = useState(false);
  const [limits, setLimits] = useState<Array<[string, string]>>([]);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const appIdRef = useRef<string>('');
  const docTypeRef = useRef<HTMLSelectElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadLimits = useCallback((tier: any) => {
    if (!tier) return;
    const rows: Array<[string, string]> = [];
    if (tier.daily_limit != null) rows.push(['Daily limit', String(tier.daily_limit)]);
    if (tier.monthly_limit != null) rows.push(['Monthly limit', String(tier.monthly_limit)]);
    if (tier.per_transaction_limit != null) rows.push(['Per-transaction limit', String(tier.per_transaction_limit)]);
    rows.push(['Tier', String(tier.name || tier.display_name || 'basic')]);
    setLimits(rows);
    setLimitsLoading(false);
  }, []);

  const paint = useCallback(async () => {
    try {
      const data: any = await api.get('/kyc/status');
      const st = String(data.status || data.kyc_status || 'not_started');
      setStatus(st === 'not_started' ? 'not started' : st);
      const tier = data.tier || data.account_tier;
      if (tier) loadLimits(tier);
      if (/^(approved|verified)/.test(st)) {
        setStep(3);
        setPhase('done');
        setMessage('Your identity is verified. Higher tier limits are active.');
        return;
      }
      if (/^(in_review|under_review|review)$/.test(st)) {
        setStep(3);
        setMessage('Application is under review.');
        return;
      }
      if (!data.application_id) {
        setStep(0);
        return;
      }
      appIdRef.current = data.application_id;
      const detail: any = await api.get(`/kyc/applications/${encodeURIComponent(data.application_id)}`);
      const appDocs: KycDoc[] =
        detail.documents || (detail.application && detail.application.documents) || [];
      const liveDone = /approved|passed/.test(String(detail.liveness_status || ''));
      const submitted = /^(submitted|pending_review|in_review|under_review)/.test(String(detail.status || ''));
      if (submitted) {
        setStep(3);
        setPhase('done');
        setMessage('Submitted — compliance is reviewing.');
        return;
      }
      setDocs(appDocs);
      setLivenessDone(liveDone);
      setStep(2);
      setPhase('docs');
    } catch (err) {
      setError(err);
      toast('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadLimits, toast]);

  useEffect(() => {
    api
      .get('/kyc/requirements')
      .then((r: any) => {
        const reqs: any[] = r.requirements || r.items || [];
        const types: string[] = [];
        reqs.forEach((x) => {
          const t = x.document_type || x.type;
          if (t && types.indexOf(String(t)) < 0) types.push(String(t));
        });
        const list = types.length ? types : FALLBACK_TYPES;
        setDocTypes(list);
        setRequirements(list);
      })
      .catch(() => {});
    api
      .get('/account/tier')
      .then((t: any) => loadLimits(t.tier || t))
      .catch(() => {});
    paint();
  }, [paint, loadLimits]);

  async function startApplication() {
    setBusy(true);
    try {
      const data: any = await api.post('/kyc/applications', {});
      appIdRef.current = (data.application || data).id;
      toast('success', 'Application created');
      setStep(1);
      setPhase('docs');
      setDocs([]);
      setLivenessDone(false);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const documentType = docTypeRef.current?.value;
    if (!file || !documentType || !appIdRef.current) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('document_type', documentType);
      fd.append('file', file);
      await api.upload(`/kyc/applications/${encodeURIComponent(appIdRef.current)}/documents`, fd);
      toast('success', 'Document uploaded');
      if (fileRef.current) fileRef.current.value = '';
      setLoading(true);
      await paint();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoc(id: string) {
    try {
      await api.del(
        `/kyc/applications/${encodeURIComponent(appIdRef.current)}/documents/${encodeURIComponent(id)}`
      );
      setLoading(true);
      await paint();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  async function runLiveness() {
    setBusy(true);
    try {
      await api.post(`/kyc/applications/${encodeURIComponent(appIdRef.current)}/liveness`, {});
      toast('success', 'Liveness passed');
      setLivenessDone(true);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication() {
    setBusy(true);
    try {
      await api.post(`/kyc/applications/${encodeURIComponent(appIdRef.current)}/submit`, {});
      toast('success', 'Submitted for review');
      setStep(3);
      setPhase('done');
      setMessage('Submitted — compliance is reviewing.');
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const showSubmit = phase === 'docs' && docs.length > 0 && livenessDone;

  return (
    <>
      <PageHeader
        title="Identity &amp; Limits"
        breadcrumb="KYC Verification"
      />
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <Card
            title="Verification Progress"
            className="shadow-sm border-0 h-100"
            actions={<StatusPill status={status} />}
          >
            <div className="pae-steps">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`pae-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                  <div className="pae-step-dot">
                    <i className={`ti ti-${s.icon}`} />
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
            {message ? <div className="alert alert-info d-flex align-items-center mb-3"><i className="ti ti-info-circle me-2 fs-16" /><span>{message}</span></div> : null}
            {loading ? (
              <>
                <Skeleton width="70%" />
                <Skeleton width="50%" />
              </>
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <>
                {phase === 'start' ? (
                  <>
                    <p className="text-secondary text-sm mb-3">
                      {requirements.length
                        ? `Required: ${requirements.join(', ')}`
                        : 'Loading requirements…'}
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={startApplication} disabled={busy}>
                      <i className="ti ti-flag me-1" /> Start application
                    </button>
                  </>
                ) : null}
                {phase === 'docs' ? (
                  <>
                    <h6 className="card-title mb-3">Upload documents</h6>
                    <div className="mb-3">
                      {docs.length ? (
                        docs.map((d) => (
                          <div
                            key={d.id}
                            className="d-flex justify-content-between align-items-center py-2 border-bottom border-light"
                          >
                            <span className="d-flex align-items-center">
                              <i className="ti ti-file me-2 text-muted fs-16" />
                              <span className="fw-medium text-capitalize me-2">{(d.document_type || d.type || '').replace(/_/g, ' ')}</span>
                              <StatusPill status={d.status || 'uploaded'} />
                            </span>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => d.id && deleteDoc(d.id)}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-secondary text-sm">No documents uploaded yet.</p>
                      )}
                    </div>
                    <form className="row g-2 align-items-end" onSubmit={uploadDocument}>
                      <div className="col-md-5">
                        <label className="form-label">Document type</label>
                        <select ref={docTypeRef} className="form-select w-100">
                          {docTypes.map((t) => (
                            <option key={t} value={t}>
                              {String(t).replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-7">
                        <label className="form-label">File (JPG/PNG/PDF, max 10 MB)</label>
                        <input
                          ref={fileRef}
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png,application/pdf"
                          required
                        />
                      </div>
                      <div className="col-12 mt-3">
                        <button type="submit" className="btn btn-outline-secondary btn-sm" disabled={busy}>
                          <i className="ti ti-upload me-1" /> Upload document
                        </button>
                      </div>
                    </form>
                  </>
                ) : null}
                {phase === 'docs' && docs.length > 0 ? (
                  <div className="mt-4 pt-3 border-top">
                    <h6 className="card-title mb-2">Liveness check</h6>
                    <p className="text-secondary text-sm">Capture a short selfie video to confirm you match your ID.</p>
                    {!livenessDone ? (
                      <button className="btn btn-primary btn-sm" onClick={runLiveness} disabled={busy}>
                        <i className="ti ti-scan me-1" /> Start liveness capture
                      </button>
                    ) : (
                      <div className="badge bg-success-subtle text-success p-2">
                        <i className="ti ti-circle-check me-1" /> Liveness verified
                      </div>
                    )}
                  </div>
                ) : null}
                {showSubmit ? (
                  <div className="mt-3">
                    <button className="btn btn-success btn-sm" onClick={submitApplication} disabled={busy}>
                      <i className="ti ti-send me-1" /> Submit for review
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </Card>
        </div>
        <div className="col-lg-4">
          <Card
            title="Tier Limits"
            className="shadow-sm border-0 h-100"
            bodyClassName="quote-summary"
          >
            {limitsLoading ? (
              <>
                <Skeleton width="80%" />
                <Skeleton width="60%" />
              </>
            ) : limits.length ? (
              limits.map(([label, value]) => (
                <div key={label} className="qs-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))
            ) : (
              <EmptyState icon="layers-subtract" title="No tier information" hint="Tier limits appear once your account is provisioned." />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
