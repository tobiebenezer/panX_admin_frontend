'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, listOf } from '@/lib/api';
import { PageHeader, Card, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { fmtDate } from '@/lib/format';

const NOTIF_ICONS: Record<string, string> = {
  quote_created: 'calculator',
  transaction_completed: 'circle-check',
  transaction_failed: 'circle-x',
  deposit_detected: 'arrow-down',
  payout_sent: 'send',
  payout_failed: 'alert-circle',
  kyc_approved: 'shield-check',
  kyc_rejected: 'file-x',
  wallet_credited: 'wallet',
  bill_payment_completed: 'receipt',
  dispute_update: 'scale',
};

const PAGE_SIZE = 20;

interface Notif {
  id?: string;
  type?: string;
  title?: string;
  subject?: string;
  body?: string;
  preview?: string;
  read_at?: string | null;
  created_at?: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState('');
  const offsetRef = useRef(0);

  const fetchPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (append) setMoreLoading(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(nextOffset));
        if (unreadOnly) params.set('unread_only', 'true');
        if (category) params.set('category', category);
        const data: any = await api.get(`/notifications?${params.toString()}`);
        const rows = listOf<Notif>(data, 'notifications', 'items', 'data');
        setItems((prev) => (append ? [...prev, ...rows] : rows));
        setHasMore(!!data.has_more);
        setError(null);
      } catch (err) {
        if (!append) setError(err);
        toast('error', (err as Error).message);
      } finally {
        setLoading(false);
        setMoreLoading(false);
        offsetRef.current = nextOffset + PAGE_SIZE;
      }
    },
    [unreadOnly, category, toast]
  );

  useEffect(() => {
    offsetRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  const categories = useMemo(() => {
    const seen: Record<string, boolean> = {};
    items.forEach((n) => {
      if (n.type) seen[n.type] = true;
    });
    return Object.keys(seen);
  }, [items]);

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all', {});
      fetchPage(0, false);
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  function markRead(n: Notif) {
    if (n.read_at || !n.id) return;
    n.read_at = new Date().toISOString();
    setItems((prev) => [...prev]);
    api.patch(`/notifications/${encodeURIComponent(n.id)}/read`).catch(() => {});
  }

  async function archive(n: Notif) {
    if (!n.id) return;
    try {
      await api.del(`/notifications/${encodeURIComponent(n.id)}`);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumb="Notifications"
        actions={
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={markAllRead}>
            <i className="ti ti-checks fs-14" /> Mark all read
          </button>
        }
      />
      <Card title="Notification Inbox" className="shadow-sm border-0" bodyClassName="p-0">
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom bg-light bg-opacity-25">
          <button
            className={`btn btn-sm ${!unreadOnly && !category ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => {
              setUnreadOnly(false);
              setCategory('');
            }}
          >
            All
          </button>
          <button
            className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            Unread
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setCategory(category === c ? '' : c)}
            >
              {String(c).replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="p-3">
            <Skeleton width="85%" />
            <Skeleton width="70%" />
            <Skeleton width="78%" />
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : items.length ? (
          <>
            <div className="notif-list">
              {items.map((n) => {
                const icon = NOTIF_ICONS[n.type || ''] || 'bell';
                return (
                  <div
                    key={n.id}
                    className={`d-flex align-items-start gap-3 p-3 border-bottom ${
                      n.read_at ? 'bg-white' : 'bg-primary-subtle bg-opacity-25'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => markRead(n)}
                  >
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 40, height: 40, fontSize: 18 }}
                    >
                      <i className={`ti ti-${icon}`} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className={`mb-0 fs-14 ${!n.read_at ? 'fw-bold text-dark' : 'fw-medium text-body'}`}>
                          {n.title || n.subject || 'Notification'}
                        </h6>
                        <span className="fs-12 text-muted ms-2 flex-shrink-0">{fmtDate(n.created_at, true)}</span>
                      </div>
                      <p className="fs-13 text-muted mb-0">{n.body || ''}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm p-1 border-0"
                      title="Archive"
                      onClick={(e) => {
                        e.stopPropagation();
                        archive(n);
                      }}
                    >
                      <i className="ti ti-trash fs-16" />
                    </button>
                  </div>
                );
              })}
            </div>
            {hasMore ? (
              <div className="text-center py-3">
                <button className="btn btn-outline-secondary btn-sm" disabled={moreLoading} onClick={() => fetchPage(items.length, true)}>
                  {moreLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState icon="ti-bell-off" title="Inbox zero" hint="Notifications about quotes, payouts and disputes land here." />
        )}
      </Card>
    </>
  );
}
