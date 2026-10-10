'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface IncidentItem {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  commander: string;
  affectedComponents: string[];
  startedAt: string;
  latestUpdate: string;
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-2026-04',
    title: 'Intermittent Latency on Flutterwave NIP Bank Payout Direct Rail',
    severity: 'P2',
    status: 'IDENTIFIED',
    commander: 'Tunde Balogun (DevOps on-call)',
    affectedComponents: ['Outbound NGN Payouts', 'Bank Transfers'],
    startedAt: 'Today, 06:14 UTC',
    latestUpdate: 'Provider upstream gateway degraded. Circuit breaker rerouting 40% of traffic to fallback banking rail.',
  },
];

type ComponentStatus = 'OPERATIONAL' | 'DEGRADED_PERFORMANCE' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE';

interface ServiceComponent {
  name: string;
  status: ComponentStatus;
}

const INITIAL_COMPONENTS: ServiceComponent[] = [
  { name: 'Core Exchange Engine & API', status: 'OPERATIONAL' },
  { name: 'US Equities Trading (DriveWealth)', status: 'OPERATIONAL' },
  { name: 'NGX Domestic Stocks (CSCS)', status: 'OPERATIONAL' },
  { name: 'NGN Payouts & Transfers (NIP)', status: 'DEGRADED_PERFORMANCE' },
  { name: 'Crypto Custody & Liquidity (YellowCard)', status: 'OPERATIONAL' },
];

export default function IncidentsPage() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [activeTab, setActiveTab] = useState<'room' | 'status_page'>('room');
  const [components, setComponents] = useState<ServiceComponent[]>(INITIAL_COMPONENTS);

  // Declare Incident Modal State
  const [declareOpen, setDeclareOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<'P1' | 'P2' | 'P3'>('P2');
  const [newCommander, setNewCommander] = useState('Tunde Balogun (DevOps on-call)');
  const [newAffected, setNewAffected] = useState('US Equities, FX Swaps');
  const [newUpdate, setNewUpdate] = useState('');

  // Status Transition Modal
  const [transitionIncident, setTransitionIncident] = useState<IncidentItem | null>(null);
  const [nextStatus, setNextStatus] = useState<IncidentItem['status']>('MONITORING');
  const [statusNote, setStatusNote] = useState('');

  // Component Status Modal
  const [selectedComponent, setSelectedComponent] = useState<ServiceComponent | null>(null);
  const [componentNextStatus, setComponentNextStatus] = useState<ComponentStatus>('OPERATIONAL');

  // Broadcast Advisory Modal
  const [advisoryOpen, setAdvisoryOpen] = useState(false);
  const [advisoryTitle, setAdvisoryTitle] = useState('');
  const [advisoryBody, setAdvisoryBody] = useState('');

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleDeclareIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newInc: IncidentItem = {
      id: `INC-2026-0${incidents.length + 5}`,
      title: newTitle.trim(),
      severity: newSeverity,
      status: 'INVESTIGATING',
      commander: newCommander.trim(),
      affectedComponents: newAffected.split(',').map((s) => s.trim()).filter(Boolean),
      startedAt: 'Just now',
      latestUpdate: newUpdate.trim() || 'Incident declared. On-call response team mobilized for root-cause triage.',
    };

    setIncidents([newInc, ...incidents]);
    setDeclareOpen(false);
    setNewTitle('');
    setNewUpdate('');
    toast('success', `Incident ${newInc.id} declared (${newSeverity})`);
  };

  const handleStatusTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionIncident) return;

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === transitionIncident.id) {
          return {
            ...inc,
            status: nextStatus,
            latestUpdate: statusNote.trim() ? `${statusNote.trim()} (Status changed to ${nextStatus})` : inc.latestUpdate,
          };
        }
        return inc;
      })
    );

    toast('success', `Incident ${transitionIncident.id} transitioned to ${nextStatus}`);
    setTransitionIncident(null);
    setStatusNote('');
  };

  const handleComponentStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponent) return;

    setComponents((prev) =>
      prev.map((c) => (c.name === selectedComponent.name ? { ...c, status: componentNextStatus } : c))
    );

    toast('success', `${selectedComponent.name} status updated to ${componentNextStatus}`);
    setSelectedComponent(null);
  };

  const handleBroadcastAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryTitle.trim()) return;

    toast('success', 'Public status advisory published to status.apexfinance.com');
    setAdvisoryOpen(false);
    setAdvisoryTitle('');
    setAdvisoryBody('');
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Incident War Room</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
            onClick={() => setDeclareOpen(true)}
          >
            <i className="ti ti-plus" /> Declare Incident
          </button>
          <Link href="/admin/control-plane" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-flame" /> Kill Switch
          </Link>
          <Link href="/admin/audit-logs" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-file-certificate" /> Audit Logs
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'room' ? 'active text-danger' : 'text-muted'}`}
                onClick={() => setActiveTab('room')}
              >
                <i className="ti ti-flame me-1" /> Active War Room ({incidents.filter((i) => i.status !== 'RESOLVED').length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'status_page' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('status_page')}
              >
                <i className="ti ti-broadcast me-1" /> Public Status Page
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'room' && (
            <div className="d-flex flex-column gap-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`card border p-3 rounded-3 bg-white shadow-sm ${
                    inc.status === 'RESOLVED' ? 'border-light' : 'border-danger'
                  }`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge font-monospace fs-11 ${
                          inc.severity === 'P1'
                            ? 'bg-danger text-white'
                            : inc.severity === 'P2'
                            ? 'bg-warning-subtle text-warning-emphasis'
                            : 'bg-info-subtle text-info'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="fw-bold fs-15 text-dark">{inc.title}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge font-monospace fs-11 ${
                          inc.status === 'RESOLVED'
                            ? 'bg-success-subtle text-success'
                            : inc.status === 'INVESTIGATING'
                            ? 'bg-danger-subtle text-danger'
                            : 'bg-warning-subtle text-warning-emphasis'
                        }`}
                      >
                        {inc.status}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-1 px-2 fs-12"
                        onClick={() => {
                          setTransitionIncident(inc);
                          setNextStatus(
                            inc.status === 'INVESTIGATING'
                              ? 'IDENTIFIED'
                              : inc.status === 'IDENTIFIED'
                              ? 'MONITORING'
                              : 'RESOLVED'
                          );
                          setStatusNote('');
                        }}
                      >
                        Update Lifecycle
                      </button>
                    </div>
                  </div>

                  <p className="fs-13 text-dark mb-2 leading-relaxed">
                    <strong>Latest Operational Update:</strong> {inc.latestUpdate}
                  </p>

                  <div className="row g-2 pt-2 border-top fs-12 text-muted align-items-center">
                    <div className="col-md-3">
                      <span>Commander: <strong className="text-dark">{inc.commander}</strong></span>
                    </div>
                    <div className="col-md-3">
                      <span>Started: <strong className="text-dark">{inc.startedAt}</strong></span>
                    </div>
                    <div className="col-md-4">
                      <span>Systems: <strong className="text-dark">{inc.affectedComponents.join(', ')}</strong></span>
                    </div>
                    <div className="col-md-2 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                        onClick={() => setNotesTarget({ id: inc.id, title: inc.title })}
                      >
                        <i className="ti ti-notes" /> Notes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'status_page' && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold text-dark m-0">Live Platform Services</h6>
                  <span className="text-muted fs-12">Publicly visible status for customer trust</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-semibold px-3"
                  onClick={() => setAdvisoryOpen(true)}
                >
                  <i className="ti ti-broadcast me-1" /> Publish Status Advisory
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Infrastructure Component</th>
                      <th>Current Published Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c) => (
                      <tr key={c.name}>
                        <td className="fw-semibold text-dark">{c.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              c.status === 'OPERATIONAL'
                                ? 'bg-success-subtle text-success'
                                : c.status === 'DEGRADED_PERFORMANCE'
                                ? 'bg-warning-subtle text-warning'
                                : 'bg-danger-subtle text-danger'
                            }`}
                          >
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => {
                              setSelectedComponent(c);
                              setComponentNextStatus(c.status);
                            }}
                          >
                            Change State
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Declare Incident Modal */}
      {declareOpen && (
        <Modal title="Declare Production Incident" open={declareOpen} onClose={() => setDeclareOpen(false)}>
          <form onSubmit={handleDeclareIncident}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Incident Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Flutterwave NIP Payout Latency Spike"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Severity</label>
                <select
                  className="form-select"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                >
                  <option value="P1">P1 — Critical (Full service outage)</option>
                  <option value="P2">P2 — High (Major degraded performance)</option>
                  <option value="P3">P3 — Moderate (Isolated component delta)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Incident Commander</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCommander}
                  onChange={(e) => setNewCommander(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Affected Subsystems</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Outbound Payouts, Bank Transfers, FX Engine"
                value={newAffected}
                onChange={(e) => setNewAffected(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Initial Operational Note</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describe current symptoms, observed alerts, and initial triage steps…"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDeclareOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger btn-sm">
                Declare & Mobilize On-Call
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Incident Lifecycle Transition Modal */}
      {transitionIncident && (
        <Modal
          title={`Transition Incident — ${transitionIncident.id}`}
          open={Boolean(transitionIncident)}
          onClose={() => setTransitionIncident(null)}
        >
          <form onSubmit={handleStatusTransition}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Next Lifecycle State</label>
              <select
                className="form-select"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as any)}
              >
                <option value="INVESTIGATING">INVESTIGATING — Active triage underway</option>
                <option value="IDENTIFIED">IDENTIFIED — Root cause isolated</option>
                <option value="MONITORING">MONITORING — Fix applied, observing metrics</option>
                <option value="RESOLVED">RESOLVED — Normal operations restored</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Operational Update</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="State the technical resolution, rollback status, or current telemetry…"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setTransitionIncident(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save & Update War Room
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Component Status Modal */}
      {selectedComponent && (
        <Modal
          title={`Update Component State — ${selectedComponent.name}`}
          open={Boolean(selectedComponent)}
          onClose={() => setSelectedComponent(null)}
        >
          <form onSubmit={handleComponentStatusUpdate}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Published Status</label>
              <select
                className="form-select"
                value={componentNextStatus}
                onChange={(e) => setComponentNextStatus(e.target.value as any)}
              >
                <option value="OPERATIONAL">OPERATIONAL — All services normal</option>
                <option value="DEGRADED_PERFORMANCE">DEGRADED PERFORMANCE — High latency / partial timeouts</option>
                <option value="PARTIAL_OUTAGE">PARTIAL OUTAGE — Subsystem offline</option>
                <option value="MAJOR_OUTAGE">MAJOR OUTAGE — Complete rail downtime</option>
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSelectedComponent(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Component Status
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Broadcast Advisory Modal */}
      {advisoryOpen && (
        <Modal title="Publish Status Page Advisory" open={advisoryOpen} onClose={() => setAdvisoryOpen(false)}>
          <form onSubmit={handleBroadcastAdvisory}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Advisory Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Upstream Banking Network Settlement Delays"
                value={advisoryTitle}
                onChange={(e) => setAdvisoryTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Public Message</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Customer-facing communication explaining service impact and expected resolution…"
                value={advisoryBody}
                onChange={(e) => setAdvisoryBody(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAdvisoryOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Broadcast Advisory
              </button>
            </div>
          </form>
        </Modal>
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
