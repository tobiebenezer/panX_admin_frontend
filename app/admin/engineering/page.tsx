'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface QueueJob {
  id: string;
  queue: string;
  payload: string;
  failedReason: string;
  attemptCount: number;
  failedAt: string;
}

const SAMPLE_DEAD_LETTER_JOBS: QueueJob[] = [
  {
    id: 'JOB-DLQ-1049',
    queue: 'webhook_dispatch_queue',
    payload: '{"event":"payout.completed","recipient":"https://api.partner.ng/webhook","tx_id":"TX-88190"}',
    failedReason: 'HTTP 504 Gateway Timeout after 3 retries',
    attemptCount: 3,
    failedAt: '12 mins ago',
  },
  {
    id: 'JOB-DLQ-1050',
    queue: 'stock_order_sync_worker',
    payload: '{"order_id":"DW-ORD-8812","symbol":"AAPL","side":"BUY","qty":14}',
    failedReason: 'Socket closed prematurely by remote host',
    attemptCount: 5,
    failedAt: '45 mins ago',
  },
];

export default function EngineeringConsolePage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<QueueJob[]>(SAMPLE_DEAD_LETTER_JOBS);
  const [activeTab, setActiveTab] = useState<'health' | 'dlq' | 'flags' | 'migrations'>('health');

  // Feature Flags
  const [flags, setFlags] = useState([
    { id: 'flag_us_stocks_fractional', name: 'Fractional US Stock Trading', enabled: true, rollout: 100 },
    { id: 'flag_instant_nip_payouts', name: 'Instant NIP Direct Rail Payouts', enabled: true, rollout: 100 },
    { id: 'flag_virtual_card_issuing', name: 'Virtual Dollar Mastercards', enabled: false, rollout: 10 },
  ]);

  // Operational Action Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'retry_job' | 'discard_job' | 'edit_flag';
    job?: QueueJob;
    flag?: (typeof flags)[0];
  }>({ isOpen: false, type: 'retry_job' });

  // Form states
  const [retryBackoff, setRetryBackoff] = useState('immediate');
  const [discardReason, setDiscardReason] = useState('Malformed webhook recipient host');
  const [targetRollout, setTargetRollout] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAction = (type: 'retry_job' | 'discard_job' | 'edit_flag', job?: QueueJob, flag?: any) => {
    setActionModal({ isOpen: true, type, job, flag });
    if (flag) {
      setTargetRollout(flag.rollout);
    }
  };

  const handleExecuteAction = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      if (actionModal.type === 'retry_job' && actionModal.job) {
        const jId = actionModal.job.id;
        setJobs((prev) => prev.filter((item) => item.id !== jId));
        toast('success', `Job ${jId} re-injected into ${actionModal.job.queue} with ${retryBackoff} execution.`);
      } else if (actionModal.type === 'discard_job' && actionModal.job) {
        const jId = actionModal.job.id;
        setJobs((prev) => prev.filter((item) => item.id !== jId));
        toast('info', `Job ${jId} archived to discarded queue.`);
      } else if (actionModal.type === 'edit_flag' && actionModal.flag) {
        const fId = actionModal.flag.id;
        setFlags((prev) =>
          prev.map((f) => (f.id === fId ? { ...f, rollout: targetRollout, enabled: targetRollout > 0 } : f))
        );
        toast('success', `Feature flag ${fId} rollout updated to ${targetRollout}%.`);
      }

      setActionModal({ isOpen: false, type: 'retry_job' });
    }, 500);
  };

  const toggleFlagStatus = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          const nextState = !f.enabled;
          toast('success', `${f.name} ${nextState ? 'enabled' : 'disabled'}`);
          return { ...f, enabled: nextState, rollout: nextState ? (f.rollout === 0 ? 100 : f.rollout) : 0 };
        }
        return f;
      })
    );
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Engineering Console</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/control-plane" className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-flame" /> Emergency Controls
          </Link>
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Health Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Services</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">12 / 12</span>
              <span className="fs-12 text-muted">healthy</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Active Workers</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">48</span>
              <span className="fs-12 text-muted">consumers</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Dead-Letter Queue</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{jobs.length}</span>
              <span className="fs-12 text-muted">stalled</span>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Current Release</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-20 fw-bold font-monospace text-dark">v2.4.12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'health' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('health')}
              >
                <i className="ti ti-server me-1" /> Core Service Telemetry
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'dlq' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('dlq')}
              >
                <i className="ti ti-refresh-alert me-1" /> Dead-Letter Queue ({jobs.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'flags' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('flags')}
              >
                <i className="ti ti-toggle-right me-1" /> Feature Flags ({flags.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'migrations' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('migrations')}
              >
                <i className="ti ti-database me-1" /> Database Migrations
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'health' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Service Name</th>
                    <th>Runtime / Cluster</th>
                    <th>Uptime</th>
                    <th>Latency (p50 / p99)</th>
                    <th>Error Rate</th>
                    <th>Health Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'exchange-core-api', env: 'Go 1.22 / EKS node-prod-01', uptime: '99.99%', latency: '18ms / 85ms', error: '0.01%', status: 'HEALTHY' },
                    { name: 'broker-drivewealth-sync', env: 'Node 20 / EKS node-prod-02', uptime: '99.95%', latency: '45ms / 142ms', error: '0.04%', status: 'HEALTHY' },
                    { name: 'settlement-nip-worker', env: 'Go 1.22 / Worker Pod 4', uptime: '99.98%', latency: '110ms / 480ms', error: '0.08%', status: 'HEALTHY' },
                    { name: 'aml-screening-engine', env: 'Python 3.11 / Worker Pod 8', uptime: '100.0%', latency: '24ms / 95ms', error: '0.00%', status: 'HEALTHY' },
                  ].map((s) => (
                    <tr key={s.name}>
                      <td className="fw-bold font-monospace text-dark">{s.name}</td>
                      <td className="text-muted fs-12">{s.env}</td>
                      <td className="fw-semibold text-success">{s.uptime}</td>
                      <td className="font-monospace fs-12">{s.latency}</td>
                      <td className="font-monospace fs-12">{s.error}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success fs-11">
                          {s.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => toast('info', `Probed ${s.name}: HTTP 200 OK (${s.latency.split('/')[0].trim()})`)}
                        >
                          Ping Probe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dlq' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Job ID / Queue</th>
                    <th>Payload Preview</th>
                    <th>Failure Root Cause</th>
                    <th>Attempts</th>
                    <th>Failed Time</th>
                    <th className="text-end">Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <div className="fw-bold font-monospace text-dark">{j.id}</div>
                        <small className="text-muted font-monospace">{j.queue}</small>
                      </td>
                      <td>
                        <code className="fs-11 text-break p-1 bg-light rounded" style={{ maxWidth: 320, display: 'inline-block' }}>
                          {j.payload}
                        </code>
                      </td>
                      <td className="text-danger fw-semibold fs-12">{j.failedReason}</td>
                      <td className="font-monospace">{j.attemptCount} tries</td>
                      <td className="text-muted fs-12">{j.failedAt}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Retry job execution"
                            onClick={() => handleOpenAction('retry_job', j)}
                          >
                            <i className="ti ti-refresh me-1" /> Retry
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Discard poison job"
                            onClick={() => handleOpenAction('discard_job', j)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Open notes"
                            onClick={() => setNotesTarget({ id: j.id, title: j.queue })}
                          >
                            <i className="ti ti-notes" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        <i className="ti ti-circle-check fs-24 text-success d-block mb-1" />
                        Dead-Letter Queue is empty. All workers consuming cleanly.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="d-flex flex-column gap-3">
              {flags.map((f) => (
                <div key={f.id} className="p-3 border rounded-3 bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="fw-bold text-dark m-0">{f.name}</h6>
                    <small className="text-muted font-monospace">{f.id} · Rollout: {f.rollout}%</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm ${f.enabled ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => toggleFlagStatus(f.id)}
                    >
                      {f.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenAction('edit_flag', undefined, f)}
                    >
                      Configure Rollout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'migrations' && (
            <div className="p-4 bg-light rounded text-center text-muted">
              <i className="ti ti-database fs-36 d-block mb-2 text-primary" />
              <h6 className="fw-bold text-dark mb-1">Database Schema Version 20261009_02_ledger</h6>
              <p className="fs-13 mb-0">148 PostgreSQL migrations applied with zero downtime replication.</p>
            </div>
          )}
        </div>
      </div>

      {/* Operational Modal */}
      {actionModal.isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setActionModal({ isOpen: false, type: 'retry_job' })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light py-3 px-4 border-bottom">
                <h5 className="modal-title fw-bold fs-16 text-dark m-0">
                  {actionModal.type === 'retry_job' && 'Retry Dead-Letter Queue Job'}
                  {actionModal.type === 'discard_job' && 'Discard / Archive Poison Job'}
                  {actionModal.type === 'edit_flag' && `Configure Feature Rollout: ${actionModal.flag?.name}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActionModal({ isOpen: false, type: 'retry_job' })}
                />
              </div>

              <div className="modal-body p-4 fs-13">
                {actionModal.type === 'retry_job' && actionModal.job && (
                  <div>
                    <div className="p-2 bg-light rounded mb-3">
                      <div><strong>Queue:</strong> <span className="font-monospace">{actionModal.job.queue}</span></div>
                      <div><strong>Failed:</strong> {actionModal.job.failedReason}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Retry Execution Schedule</label>
                      <select
                        className="form-select form-select-sm"
                        value={retryBackoff}
                        onChange={(e) => setRetryBackoff(e.target.value)}
                      >
                        <option value="immediate">Immediate Dispatch (Now)</option>
                        <option value="5m exponential backoff">5 Minutes Exponential Backoff</option>
                        <option value="15m delay">15 Minutes Delayed Window</option>
                      </select>
                    </div>
                  </div>
                )}

                {actionModal.type === 'discard_job' && actionModal.job && (
                  <div>
                    <p className="text-muted fs-13 mb-3">
                      Permanently remove job <strong className="font-monospace text-dark">{actionModal.job.id}</strong> from active retry loops and store in dead-letter archives.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark">Discard Reason</label>
                      <select
                        className="form-select form-select-sm"
                        value={discardReason}
                        onChange={(e) => setDiscardReason(e.target.value)}
                      >
                        <option value="Malformed webhook recipient host">Malformed webhook recipient host</option>
                        <option value="Duplicate transaction event already committed">Duplicate transaction event already committed</option>
                        <option value="Development test event payload">Development test event payload</option>
                      </select>
                    </div>
                  </div>
                )}

                {actionModal.type === 'edit_flag' && actionModal.flag && (
                  <div>
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-medium text-dark d-flex justify-content-between">
                        <span>Rollout Percentage:</span>
                        <strong>{targetRollout}%</strong>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        step="5"
                        value={targetRollout}
                        onChange={(e) => setTargetRollout(parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div className="p-2 border rounded bg-white text-muted fs-12">
                      When set to {targetRollout}%, hashed customer UUIDs within this bucket will receive this feature flag in their client payload.
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setActionModal({ isOpen: false, type: 'retry_job' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`btn btn-sm ${actionModal.type === 'discard_job' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleExecuteAction}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes Drawer */}
      {notesTarget && (
        <InternalNotesDrawer
          isOpen={true}
          recordId={notesTarget.id}
          recordTitle={notesTarget.title}
          onClose={() => setNotesTarget(null)}
        />
      )}
    </div>
  );
}
