'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, listOf, getAccessToken } from '@/lib/api';
import { fmtMoney, fmtDate, qs, statusTone } from '@/lib/format';
import { Card, CountUp, DataTable, EmptyState, Modal, PageHeader, Skeleton, StatusPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface Tx {
  id?: string; reference?: string; status?: string;
  created_at?: string; updated_at?: string;
  source_asset?: string; source_amount?: unknown;
  destination_currency?: string; target_currency?: string;
  destination_amount?: unknown;
}
interface TxEvent {
  label?: string; event_type?: string; to_status?: string; status?: string;
  tone?: string; created_at?: string; at?: string;
}

const PAGE_SIZE = 10;

function toneOf(status: unknown): string {
  const map: Record<string, string> = { success: 'tone-success', failed: 'tone-danger', rejected: 'tone-danger' };
  return map[String(status).toLowerCase()] || '';
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [all, setAll] = useState<Tx[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState(() => qs('q') || '');
  const [debounced, setDebounced] = useState(() => qs('q') || '');
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTx, setDetailTx] = useState<Tx | null>(null);
  const [detailEvents, setDetailEvents] = useState<TxEvent[] | null>(null);
  const [refunding, setRefunding] = useState(false);
  const openedDeepLink = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setAll(null);
    setError(null);
    const params = new URLSearchParams({ limit: '100' });
    if (debounced) params.set('q', debounced);
    if (statusFilter) params.set('status', statusFilter);
    api
      .get(`/transactions?${params.toString()}`)
      .then((data) => {
        if (!alive) return;
        setAll(listOf<Tx>(data, 'transactions', 'items'));
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
        toast('error', (err && err.message) || 'Could not load transactions');
      });
    return () => {
      alive = false;
    };
  }, [debounced, statusFilter, toast]);

  const filtered = useMemo(() => {
    let rows = all || [];
    if (statusFilter) rows = rows.filter((t) => String(t.status).toLowerCase() === statusFilter);
    if (debounced) {
      const q = debounced.toLowerCase();
      rows = rows.filter((t) =>
        [t.reference, t.id, t.source_asset, t.destination_currency, t.status]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [all, statusFilter, debounced]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const rows = all || [];
    return {
      total: rows.length,
      success: rows.filter((t) => statusTone(t.status) === 'success').length,
      pending: rows.filter((t) => statusTone(t.status) === 'warning').length,
      failed: rows.filter((t) => statusTone(t.status) === 'danger').length,
    };
  }, [all]);

  const openDetail = useCallback(
    async (id: string) => {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailTx(null);
      setDetailEvents(null);
      try {
        const [txRes, evRes] = await Promise.all([
          api.get(`/transactions/${encodeURIComponent(id)}`),
          api.get(`/transactions/${encodeURIComponent(id)}/events`).catch(() => null),
        ]);
        const tx: Tx = txRes.transaction || txRes;
        setDetailTx(tx);
        setDetailEvents(listOf<TxEvent>(evRes ?? [], 'events', 'items'));
      } catch (err: any) {
        toast('error', err.message || 'Could not load transaction');
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!openedDeepLink.current && all && qs('tx')) {
      openedDeepLink.current = true;
      openDetail(qs('tx') as string);
    }
  }, [all, openDetail]);

  async function requestRefund(id: string) {
    setRefunding(true);
    try {
      await api.post(`/transactions/${encodeURIComponent(id)}/refund`, {});
      toast('success', 'Refund requested');
    } catch (err: any) {
      toast('error', err.message || 'Could not request refund');
    } finally {
      setRefunding(false);
    }
  }

  const refundable = detailTx ? /^(deposit_confirmed|settled|payout_failed|stalled)/.test(String(detailTx.status)) : false;
  const destCur = detailTx ? detailTx.destination_currency || detailTx.target_currency || '' : '';

  return (
    <div>
      <PageHeader
        title="Transaction History"
        breadcrumb="Transactions"
      />

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted fs-13 mb-1 text-uppercase fw-semibold">Total Transfers</p>
                <h3 className="mb-0 fw-bold font-monospace">
                  {all ? <CountUp value={stats.total} /> : <Skeleton width="56px" />}
                </h3>
              </div>
              <div
                className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="ti ti-arrows-exchange fs-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted fs-13 mb-1 text-uppercase fw-semibold">Completed</p>
                <h3 className="mb-0 fw-bold font-monospace text-success">
                  {all ? <CountUp value={stats.success} /> : <Skeleton width="56px" />}
                </h3>
              </div>
              <div
                className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="ti ti-circle-check fs-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted fs-13 mb-1 text-uppercase fw-semibold">In Progress</p>
                <h3 className="mb-0 fw-bold font-monospace text-warning">
                  {all ? <CountUp value={stats.pending} /> : <Skeleton width="56px" />}
                </h3>
              </div>
              <div
                className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="ti ti-clock fs-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted fs-13 mb-1 text-uppercase fw-semibold">Failed</p>
                <h3 className="mb-0 fw-bold font-monospace text-danger">
                  {all ? <CountUp value={stats.failed} /> : <Skeleton width="56px" />}
                </h3>
              </div>
              <div
                className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="ti ti-alert-triangle fs-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card
        title="Transaction History"
        subtitle="Complete record of all inbound and outbound transactions"
        actions={
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <div className="app-search position-relative">
              <input
                type="search"
                className="form-control form-control-sm"
                style={{ minWidth: 200 }}
                placeholder="Search reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search app-search-icon text-muted" />
            </div>
            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        }
      >
        {error ? (
          <EmptyState
            icon="ti-alert-circle"
            title="Could not load data"
            hint={(error as Error)?.message || 'Something went wrong while fetching transactions.'}
          />
        ) : (
          <>
            <DataTable<Tx>
              columns={['Transfer', 'Reference', 'Status', 'Date', 'Action']}
              rows={all ? pageRows : null}
              emptyIcon="ti-inbox"
              emptyTitle="No transactions found"
              emptyHint="Try adjusting your filter or search query."
              render={(t) => {
                const dest = t.destination_currency || t.target_currency || '';
                return [
                  <div className="d-flex align-items-center gap-2" key="a">
                    <span
                      className="rounded-circle bg-light border fw-bold text-dark d-inline-flex align-items-center justify-content-center fs-11 font-monospace"
                      style={{ width: 32, height: 32 }}
                    >
                      {dest.slice(0, 3) || 'TX'}
                    </span>
                    <div>
                      <strong className="d-block font-monospace fs-13">
                        {t.destination_amount != null ? fmtMoney(t.destination_amount, dest || 'USD') : String(t.source_amount ?? '') || '—'}
                      </strong>
                      <small className="text-muted fs-11">{t.source_asset || ''} → {dest}</small>
                    </div>
                  </div>,
                  <span
                    key="r"
                    className="font-monospace fs-12 text-muted cursor-pointer"
                    title="Click to copy ID"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      navigator.clipboard?.writeText(t.id || '');
                      toast('success', 'Transaction ID copied');
                    }}
                  >
                    {(t.reference || t.id || '').slice(0, 16)} <i className="ti ti-copy text-muted fs-11" />
                  </span>,
                  <StatusPill key="s" status={t.status} />,
                  <span className="text-muted fs-12" key="c">{fmtDate(t.created_at, true)}</span>,
                  <button
                    key="o"
                    className="btn btn-light btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => openDetail(t.id || '')}
                  >
                    <i className="ti ti-eye fs-14" /> Details
                  </button>,
                ];
              }}
            />

            {filtered.length > PAGE_SIZE || safePage > 1 ? (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
                <span className="text-muted fs-13">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} transfers
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <i className="ti ti-chevron-left" /> Prev
                  </button>
                  <span className="btn btn-light btn-sm disabled font-monospace">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <i className="ti ti-chevron-right" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Transaction Details" width="840px">
        {detailLoading ? (
          <div className="py-4">
            <Skeleton width="90%" />
            <Skeleton width="75%" />
            <Skeleton width="82%" />
          </div>
        ) : detailTx ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <span className="text-muted fs-12 text-uppercase fw-semibold">Transaction ID</span>
                <p className="font-monospace fs-13 mb-0 text-dark">{detailTx.id}</p>
              </div>
              <StatusPill status={detailTx.status} />
            </div>

            <div className="row g-4">
              <div className="col-lg-5">
                <div className="bg-light rounded p-3 border">
                  <div className="d-flex justify-content-between py-2 border-bottom fs-13">
                    <span className="text-muted">Destination Amount</span>
                    <strong className="font-monospace text-success fs-15">
                      {detailTx.destination_amount != null ? fmtMoney(detailTx.destination_amount, destCur || 'USD') : '—'}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom fs-13">
                    <span className="text-muted">Source Sent</span>
                    <span className="fw-semibold font-monospace">{detailTx.source_asset || ''} {String(detailTx.source_amount ?? '')}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom fs-13">
                    <span className="text-muted">Created</span>
                    <span>{fmtDate(detailTx.created_at, true)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 fs-13">
                    <span className="text-muted">Last Update</span>
                    <span>{fmtDate(detailTx.updated_at, true)}</span>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <h6 className="fw-semibold fs-14 mb-3">Timeline &amp; Audit Trail</h6>
                <div className="position-relative ps-3 border-start ms-2 mb-3">
                  {detailEvents?.length ? (
                    detailEvents.map((e, i) => {
                      const st = e.to_status || e.status || '';
                      return (
                        <div key={i} className="mb-3 position-relative">
                          <div
                            className="position-absolute rounded-circle bg-primary"
                            style={{ width: 10, height: 10, left: -21, top: 5 }}
                          />
                          <h6 className="fw-semibold mb-0 fs-13 text-capitalize">
                            {String(e.label || e.event_type || st || 'update').replace(/_/g, ' ')}
                          </h6>
                          <small className="text-muted fs-11">
                            {fmtDate(e.created_at || e.at, true)}
                          </small>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState icon="ti-history" title="No recorded events yet" />
                  )}
                </div>

                <div className="d-flex gap-2 mt-3 flex-wrap border-top pt-3">
                  {detailTx.id ? (
                    <a
                      href={`/v1/transactions/${encodeURIComponent(detailTx.id)}/receipt?token=${encodeURIComponent(getAccessToken() || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <i className="ti ti-download" /> Download Receipt
                    </a>
                  ) : null}
                  {refundable && detailTx.id ? (
                    <button
                      className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                      disabled={refunding}
                      onClick={() => requestRefund(detailTx.id as string)}
                    >
                      {refunding ? (
                        <>
                          <span className="spinner-border spinner-border-sm" /> Requesting…
                        </>
                      ) : (
                        <>
                          <i className="ti ti-rotate-clockwise" /> Request Refund
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
