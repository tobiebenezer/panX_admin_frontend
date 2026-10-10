'use client';

import React, { useState } from 'react';

export interface InternalNote {
  id: string;
  author: string;
  avatarText?: string;
  createdAt: string;
  content: string;
  department: string;
  assignedTo?: string;
  isHandover?: boolean;
}

export function InternalNotesDrawer({
  isOpen,
  recordTitle,
  recordId,
  onClose,
}: {
  isOpen: boolean;
  recordTitle: string;
  recordId: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<InternalNote[]>([
    {
      id: 'nt-1',
      author: 'Fatima Kyari',
      avatarText: 'FK',
      createdAt: 'Today, 09:14 AM',
      department: 'Compliance Desk',
      content: 'Flagged suspicious velocity change on Tier 3 inbound volume. Reached out to user for supplementary audited financial statements.',
      assignedTo: 'Aliko Adeleke (Ops)',
      isHandover: true,
    },
    {
      id: 'nt-2',
      author: 'Emeka Eze',
      avatarText: 'EE',
      createdAt: 'Today, 11:30 AM',
      department: 'Treasury & Settlements',
      content: 'Bank statement verified against NIBSS direct settlement confirmation. Liquidity reserve balance adjusted.',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [assignee, setAssignee] = useState('');
  const [isHandover, setIsHandover] = useState(false);

  if (!isOpen) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newNote: InternalNote = {
      id: `nt-${Date.now()}`,
      author: 'Aliko Adeleke',
      avatarText: 'AA',
      createdAt: 'Just now',
      department: 'Executive Operations',
      content: inputVal.trim(),
      assignedTo: assignee ? assignee : undefined,
      isHandover,
    };

    setNotes([newNote, ...notes]);
    setInputVal('');
    setAssignee('');
    setIsHandover(false);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', zIndex: 1065 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-end h-100 my-0 me-0"
        style={{ maxWidth: 460, height: '100vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content h-100 rounded-0 border-0 shadow-lg d-flex flex-column">
          {/* Header */}
          <div className="p-3 border-bottom bg-light d-flex align-items-center justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-notes fs-18 text-primary" />
                <h6 className="m-0 fw-bold fs-14">Internal Notes & Hand-Over</h6>
              </div>
              <small className="text-muted fs-12 font-monospace">
                Record: {recordId} ({recordTitle})
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* Form */}
          <div className="p-3 border-bottom bg-white">
            <form onSubmit={handleAddNote}>
              <div className="mb-2">
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="Add internal note or handover instructions (@mention teammates)…"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-2 align-items-center">
                <div className="col-7">
                  <select
                    className="form-select form-select-sm fs-12"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  >
                    <option value="">No explicit assignment</option>
                    <option value="Fatima Kyari (Compliance)">Assign to: Fatima (Compliance)</option>
                    <option value="Emeka Eze (Treasury)">Assign to: Emeka (Treasury)</option>
                    <option value="Tunde Balogun (Engineering)">Assign to: Tunde (Eng on-call)</option>
                  </select>
                </div>
                <div className="col-5">
                  <div className="form-check form-switch fs-12 m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="handoverSwitch"
                      checked={isHandover}
                      onChange={(e) => setIsHandover(e.target.checked)}
                    />
                    <label className="form-check-label text-dark fw-medium" htmlFor="handoverSwitch">
                      Shift Handover
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-sm btn-primary fw-semibold px-3">
                  <i className="ti ti-send me-1" /> Post Note
                </button>
              </div>
            </form>
          </div>

          {/* Feed */}
          <div className="flex-grow-1 overflow-y-auto p-3 bg-light-subtle">
            <div className="d-flex flex-column gap-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`card border-0 shadow-sm p-3 rounded-3 ${
                    n.isHandover ? 'border-start border-4 border-warning bg-warning-subtle' : 'bg-white'
                  }`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary-subtle text-dark fs-11 fw-bold rounded-circle px-2 py-1">
                        {n.avatarText || 'ST'}
                      </span>
                      <div>
                        <div className="fw-semibold fs-13 text-dark leading-tight">{n.author}</div>
                        <span className="text-muted fs-11">{n.department}</span>
                      </div>
                    </div>
                    <span className="text-muted fs-11">{n.createdAt}</span>
                  </div>

                  <p className="fs-13 text-dark mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {n.content}
                  </p>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top fs-11">
                    {n.isHandover ? (
                      <span className="badge bg-warning text-dark px-2 py-0">
                        <i className="ti ti-arrow-forward-up me-1" />
                        Shift Hand-Over
                      </span>
                    ) : (
                      <span className="text-muted">Staff Internal</span>
                    )}
                    {n.assignedTo && (
                      <span className="text-primary fw-semibold">
                        <i className="ti ti-user-check me-1" />
                        {n.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
