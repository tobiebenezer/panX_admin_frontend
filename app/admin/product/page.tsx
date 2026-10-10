'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui';
import { InternalNotesDrawer } from '@/components/admin/InternalNotesDrawer';

interface TemplateItem {
  id: string;
  channel: 'PUSH' | 'EMAIL' | 'IN_APP_BANNER';
  name: string;
  subject: string;
  lastUpdated: string;
  status: 'PUBLISHED' | 'DRAFT';
}

interface BannerItem {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  severity: 'INFO' | 'WARNING' | 'MAINTENANCE';
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
}

const INITIAL_TEMPLATES: TemplateItem[] = [
  { id: 'TMPL-01', channel: 'PUSH', name: 'Stock Order Filled Notification', subject: 'Your {{symbol}} order has executed at {{price}}', lastUpdated: '2 days ago', status: 'PUBLISHED' },
  { id: 'TMPL-02', channel: 'EMAIL', name: 'Monthly Account & Dividend Statement', subject: 'Apex Finance Statement for {{month}}', lastUpdated: '1 week ago', status: 'PUBLISHED' },
  { id: 'TMPL-03', channel: 'IN_APP_BANNER', name: 'Scheduled Maintenance Advisory', subject: 'Planned Flutterwave rail upgrade this Saturday 02:00 - 04:00 UTC', lastUpdated: 'Just now', status: 'DRAFT' },
];

const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'BAN-01',
    title: 'Upstream Banking Rail Maintenance',
    message: 'Intermittent delays expected for NGN local bank payouts between 01:00 and 03:00 UTC on Sunday.',
    targetAudience: 'All Active Nigerian Accounts',
    severity: 'MAINTENANCE',
    status: 'ACTIVE',
  },
  {
    id: 'BAN-02',
    title: 'US Stock Market Daylight Savings Notice',
    message: 'NYSE & NASDAQ trading hours adjusted to 14:30 - 21:00 West Africa Time.',
    targetAudience: 'US Equities Traders',
    severity: 'INFO',
    status: 'ACTIVE',
  },
];

export default function ProductGrowthPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateItem[]>(INITIAL_TEMPLATES);
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);
  const [activeTab, setActiveTab] = useState<'messaging' | 'announcements'>('messaging');

  // Preview & Test Modal
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [testRecipient, setTestRecipient] = useState('ops-alerts@apexfinance.internal');

  // New Banner Modal
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerAudience, setBannerAudience] = useState('All Active Accounts');
  const [bannerSeverity, setBannerSeverity] = useState<'INFO' | 'WARNING' | 'MAINTENANCE'>('INFO');

  // Notes drawer
  const [notesTarget, setNotesTarget] = useState<{ id: string; title: string } | null>(null);

  const handleToggleTemplateStatus = (tmpl: TemplateItem) => {
    const nextStatus = tmpl.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTemplates((prev) =>
      prev.map((t) => (t.id === tmpl.id ? { ...t, status: nextStatus, lastUpdated: 'Just now' } : t))
    );
    toast('success', `Template ${tmpl.name} moved to ${nextStatus}`);
  };

  const handleSendTestDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewTemplate) return;

    toast('success', `Test dispatch sent to ${testRecipient}`);
    setPreviewTemplate(null);
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerMessage.trim()) return;

    const newBan: BannerItem = {
      id: `BAN-0${banners.length + 1}`,
      title: bannerTitle.trim(),
      message: bannerMessage.trim(),
      targetAudience: bannerAudience,
      severity: bannerSeverity,
      status: 'ACTIVE',
    };

    setBanners([newBan, ...banners]);
    setBannerModalOpen(false);
    setBannerTitle('');
    setBannerMessage('');
    toast('success', 'Announcement banner published to client surfaces');
  };

  const handleToggleBannerStatus = (ban: BannerItem) => {
    const nextStatus = ban.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    setBanners((prev) =>
      prev.map((b) => (b.id === ban.id ? { ...b, status: nextStatus } : b))
    );
    toast('success', `Banner ${ban.title} set to ${nextStatus}`);
  };

  return (
    <div className="container-fluid pb-5">
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold fs-20 text-dark m-0">Product & Comms</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeTab === 'announcements' && (
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => setBannerModalOpen(true)}
            >
              <i className="ti ti-plus" /> New Announcement
            </button>
          )}
          <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="ti ti-checklist" /> Approvals
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'messaging' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('messaging')}
              >
                <i className="ti ti-mail me-1" /> Notification Templates ({templates.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 fs-13 fw-semibold ${activeTab === 'announcements' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('announcements')}
              >
                <i className="ti ti-speakerphone me-1" /> In-App Announcements ({banners.filter((b) => b.status === 'ACTIVE').length} Live)
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === 'messaging' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light fs-12 text-muted">
                  <tr>
                    <th>Channel</th>
                    <th>Template Name</th>
                    <th>Message Pattern</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="badge bg-light text-dark font-monospace fs-11 border">
                          {t.channel}
                        </span>
                      </td>
                      <td className="fw-semibold text-dark">{t.name}</td>
                      <td className="text-muted font-monospace fs-12">{t.subject}</td>
                      <td>
                        <span
                          className={`badge ${
                            t.status === 'PUBLISHED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="text-muted fs-12">{t.lastUpdated}</td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => setPreviewTemplate(t)}
                          >
                            Preview & Test
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm py-1 px-2 fs-12 ${
                              t.status === 'PUBLISHED' ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                            onClick={() => handleToggleTemplateStatus(t)}
                          >
                            {t.status === 'PUBLISHED' ? 'Unpublish' : 'Publish Live'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                            onClick={() => setNotesTarget({ id: t.id, title: t.name })}
                          >
                            <i className="ti ti-notes" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="d-flex flex-column gap-3">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Title & Message</th>
                      <th>Target Audience</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className="fw-bold text-dark">{b.title}</div>
                          <div className="text-muted fs-12 mt-1">{b.message}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fs-11">{b.targetAudience}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              b.severity === 'MAINTENANCE'
                                ? 'bg-warning-subtle text-warning-emphasis'
                                : b.severity === 'WARNING'
                                ? 'bg-danger-subtle text-danger'
                                : 'bg-info-subtle text-info'
                            }`}
                          >
                            {b.severity}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className={`btn btn-sm py-1 px-2 fs-12 ${
                              b.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'
                            }`}
                            onClick={() => handleToggleBannerStatus(b)}
                          >
                            {b.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
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

      {/* Preview & Test Dispatch Modal */}
      {previewTemplate && (
        <Modal
          title={`Test Dispatch — ${previewTemplate.name}`}
          open={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
        >
          <form onSubmit={handleSendTestDispatch}>
            <div className="p-3 bg-light rounded-3 mb-3">
              <small className="text-muted d-block">Channel</small>
              <strong className="text-dark">{previewTemplate.channel}</strong>
              <small className="text-muted d-block mt-2">Pattern Preview</small>
              <div className="font-monospace fs-12 text-dark bg-white p-2 rounded border mt-1">
                {previewTemplate.subject}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Test Destination (Email / Push Device ID)</label>
              <input
                type="text"
                className="form-control"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPreviewTemplate(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Send Test Notification
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Announcement Modal */}
      {bannerModalOpen && (
        <Modal title="Compose In-App Announcement" open={bannerModalOpen} onClose={() => setBannerModalOpen(false)}>
          <form onSubmit={handleCreateBanner}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Banner Headline</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Scheduled Flutterwave Payout Maintenance"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Notice Body</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Short notice displayed prominently on user dashboards…"
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Target Audience</label>
                <select
                  className="form-select"
                  value={bannerAudience}
                  onChange={(e) => setBannerAudience(e.target.value)}
                >
                  <option value="All Active Accounts">All Active Accounts</option>
                  <option value="US Equities Traders">US Equities Traders</option>
                  <option value="High-Volume FX Desks">High-Volume FX Desks</option>
                  <option value="Nigerian Bank Payout Users">Nigerian Bank Payout Users</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fs-13 fw-semibold">Severity Display</label>
                <select
                  className="form-select"
                  value={bannerSeverity}
                  onChange={(e) => setBannerSeverity(e.target.value as any)}
                >
                  <option value="INFO">Informational (Neutral Blue)</option>
                  <option value="MAINTENANCE">Maintenance (Notice Amber)</option>
                  <option value="WARNING">Urgent Advisory (Caution Red)</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setBannerModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Publish Announcement
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
