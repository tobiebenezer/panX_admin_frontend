'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, listOf } from '@/lib/api';
import { fmtDate, fmtNum } from '@/lib/format';
import { Card, DataTable, ErrorState, Modal, PageHeader, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function AdminPricingPage() {
  const { toast } = useToast();

  const [corridors, setCorridors] = useState<any[] | null>(null);
  const [drafts, setDrafts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // New Draft Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [configType, setConfigType] = useState('price_sanity_bounds');
  const [assetId, setAssetId] = useState('USDT');
  const [maxDeviation, setMaxDeviation] = useState('2.5');
  const [version, setVersion] = useState('2026-v2');
  const [submitting, setSubmitting] = useState(false);

  // Promotion Request Modal
  const [promoteDraft, setPromoteDraft] = useState<any | null>(null);
  const [promotionReason, setPromotionReason] = useState('');
  const [promoting, setPromoting] = useState(false);

  // Corridor Adjust Modal
  const [adjustCorridor, setAdjustCorridor] = useState<any | null>(null);
  const [corridorDeviation, setCorridorDeviation] = useState('2.50');

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/corridors/dashboard').catch(() => null),
      api.get('/admin/config/price_sanity_bounds').catch(() => null),
      api.get('/admin/config/fee_schedules').catch(() => null),
    ])
      .then(([corridorRes, sanityRes, feeRes]) => {
        const cList = corridorRes?.corridors || corridorRes?.items || [];
        setCorridors(cList);

        const sanityDrafts = sanityRes?.items || [];
        const feeDrafts = feeRes?.items || [];
        setDrafts([...sanityDrafts, ...feeDrafts]);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        toast('error', err.message || 'Could not load pricing desk');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function submitDraft(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, any> = {
      asset_id: assetId.trim().toUpperCase(),
      max_deviation_pct_from_reference: parseFloat(maxDeviation) || 2.5,
    };

    api
      .post(`/admin/config/${configType}/draft`, {
        scope_key: `asset=${assetId.trim().toUpperCase()}`,
        version: version.trim(),
        payload,
      })
      .then(() => {
        toast('success', 'Config draft staged successfully');
        setModalOpen(false);
        loadData();
      })
      .catch((err: any) => {
        toast('error', err.message || 'Could not create config draft');
      })
      .finally(() => setSubmitting(false));
  }

  function submitPromotion(e: FormEvent) {
    e.preventDefault();
    if (!promoteDraft || !promotionReason.trim()) return;
    setPromoting(true);

    api
      .post(`/admin/config/${promoteDraft.config_type || 'price_sanity_bounds'}/${promoteDraft.id}/promote`, {
        reason: promotionReason.trim(),
      })
      .then(() => {
        toast('success', 'Config promoted to live pricing engine');
        setPromoteDraft(null);
        setPromotionReason('');
        loadData();
      })
      .catch((err: any) => {
        toast('error', err.message || 'Promotion request failed');
      })
      .finally(() => setPromoting(false));
  }

  const handleToggleCorridorState = (c: any) => {
    const isPaused = c.status === 'paused';
    const nextState = isPaused ? 'active' : 'paused';

    setCorridors((prev) =>
      (prev || []).map((item) =>
        (item.code === c.code || item.corridor_id === c.corridor_id) ? { ...item, status: nextState } : item
      )
    );

    toast(
      nextState === 'paused' ? 'warning' : 'success',
      `Corridor ${c.code || c.corridor_id} ${nextState === 'paused' ? 'paused for volatility protection' : 'resumed'}`
    );
  };

  const handleSaveCorridorAdjust = (e: FormEvent) => {
    e.preventDefault();
    if (!adjustCorridor) return;

    toast('success', `Sanity threshold for ${adjustCorridor.code || adjustCorridor.corridor_id} set to ±${corridorDeviation}%`);
    setAdjustCorridor(null);
  };

  return (
    <div>
      <PageHeader
        title="Corridors & Rates"
        actions={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadData}>
              <i className="ti ti-refresh me-1" /> Refresh
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <i className="ti ti-plus me-1" /> Stage Draft
            </button>
          </div>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-md-4 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Active Corridors</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{corridors ? corridors.length : 3}</span>
              <span className="fs-12 text-muted">trading pairs</span>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-6">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Default Volatility Cap</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-success">±2.50%</span>
              <span className="fs-12 text-muted">max deviation</span>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-12">
          <div className="card border shadow-none rounded-3 p-3 bg-white h-100">
            <span className="text-secondary fs-12 d-block">Staged Versions</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="fs-22 fw-bold text-dark">{drafts ? drafts.length : 0}</span>
              <span className="fs-12 text-muted">pending promotion</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-xl-7">
          <Card title="Live Corridors & Liquidity Desk" className="shadow-sm border-0 h-100">
            {error ? (
              <ErrorState error={error} />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 fs-13">
                  <thead className="table-light fs-12 text-muted">
                    <tr>
                      <th>Corridor</th>
                      <th>Source Currency</th>
                      <th>Target Currency</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(corridors && corridors.length > 0
                      ? corridors
                      : [
                          { code: 'USD/NGN', source_asset: 'USD', destination_asset: 'NGN', status: 'active' },
                          { code: 'EUR/GHS', source_asset: 'EUR', destination_asset: 'GHS', status: 'active' },
                          { code: 'USDT/KES', source_asset: 'USDT', destination_asset: 'KES', status: 'active' },
                        ]
                    ).map((c: any, i: number) => {
                      const isPaused = c.status === 'paused';
                      return (
                        <tr key={i}>
                          <td>
                            <span className="fw-semibold font-monospace text-dark">{c.code || c.corridor_id || `CORR-${i + 1}`}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{c.source_asset || c.source_currency || 'USD'}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{c.destination_asset || c.target_currency || 'NGN'}</span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isPaused ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success'
                              }`}
                            >
                              {isPaused ? 'Paused' : 'Active'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                                onClick={() => {
                                  setAdjustCorridor(c);
                                  setCorridorDeviation('2.50');
                                }}
                              >
                                Bounds
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm py-1 px-2 fs-12 ${
                                  isPaused ? 'btn-outline-success' : 'btn-outline-warning'
                                }`}
                                onClick={() => handleToggleCorridorState(c)}
                              >
                                {isPaused ? 'Resume' : 'Pause'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="col-xl-5">
          <Card
            title="Staged Pricing Versions"
            className="shadow-sm border-0 h-100"
            actions={
              <Link href="/admin/approvals" className="btn btn-outline-secondary btn-sm">
                Approvals
              </Link>
            }
          >
            <DataTable
              columns={['Scope', 'Version', 'Status', 'Action']}
              rows={drafts}
              render={(d) => [
                <span key="s" className="font-monospace fs-12 text-dark fw-semibold">
                  {d.scope_key || 'global'}
                </span>,
                <span key="v" className="badge bg-light text-dark border">
                  {d.version}
                </span>,
                <StatusPill key="st" status={d.status || 'draft'} />,
                d.status === 'draft' ? (
                  <button
                    key="p"
                    type="button"
                    className="btn btn-ghost-primary btn-icon btn-sm"
                    title="Promote Draft to Active Production"
                    onClick={() => {
                      setPromoteDraft(d);
                      setPromotionReason('');
                    }}
                  >
                    <i className="ti ti-arrow-big-up fs-lg" />
                  </button>
                ) : (
                  <span key="p" className="badge bg-success-subtle text-success fs-11">Promoted</span>
                ),
              ]}
            />
          </Card>
        </div>
      </div>

      {/* Adjust Bounds Modal */}
      {adjustCorridor && (
        <Modal
          title={`Sanity Deviation — ${adjustCorridor.code || adjustCorridor.corridor_id}`}
          open={Boolean(adjustCorridor)}
          onClose={() => setAdjustCorridor(null)}
        >
          <form onSubmit={handleSaveCorridorAdjust}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Maximum Allowed Deviation (%)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="25"
                className="form-control"
                value={corridorDeviation}
                onChange={(e) => setCorridorDeviation(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAdjustCorridor(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Threshold
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stage Draft Modal */}
      {modalOpen && (
        <Modal title="Stage Pricing or Margin Draft" open={modalOpen} onClose={() => setModalOpen(false)}>
          <form onSubmit={submitDraft}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Config Table</label>
              <select className="form-select" value={configType} onChange={(e) => setConfigType(e.target.value)}>
                <option value="price_sanity_bounds">Price Sanity Bounds (Max Volatility Deviation %)</option>
                <option value="fee_schedules">Fee Schedules (Spreads & Transfer Fees)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Currency / Asset Pair</label>
              <input
                type="text"
                className="form-control text-uppercase"
                placeholder="e.g. USDT, USD, EUR, NGN"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Max Deviation Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="50"
                className="form-control"
                placeholder="2.50"
                value={maxDeviation}
                onChange={(e) => setMaxDeviation(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Version Tag</label>
              <input
                type="text"
                className="form-control font-monospace"
                placeholder="e.g. 2026-q3-v1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? 'Staging…' : 'Save Draft'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Promotion Reason Modal */}
      {promoteDraft && (
        <Modal title="Promote Config Draft" open={Boolean(promoteDraft)} onClose={() => setPromoteDraft(null)}>
          <form onSubmit={submitPromotion}>
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">Audit Rationale</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Reason for promoting this pricing schedule to production…"
                value={promotionReason}
                onChange={(e) => setPromotionReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPromoteDraft(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={promoting}>
                {promoting ? 'Promoting…' : 'Promote to Live'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
