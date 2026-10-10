'use client';

/* Application shell: Paces Bootstrap 5 sidebar + topbar + footer, with all behaviors
 * (theme, sidebar collapse/mobile offcanvas, notifications, user menu, search)
 * implemented natively via React state. */

import React, { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, listOf } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { CUSTOMER_NAV, ADMIN_NAV, NavSection } from '@/lib/nav';
import { displayName, useUser, UserProvider, PaeUser } from '@/lib/auth';
import { AvatarInitials } from '@/components/ui';
import { CommandBarModal } from '@/components/admin/CommandBarModal';

const NOTIF_ICONS: Record<string, string> = {
  quote_created: 'ti-calculator',
  transaction_completed: 'ti-circle-check',
  transaction_failed: 'ti-circle-x',
  deposit_detected: 'ti-arrow-down-left',
  payout_sent: 'ti-send',
  payout_failed: 'ti-alert-circle',
  kyc_approved: 'ti-badge-check',
  kyc_rejected: 'ti-file-x',
  wallet_credited: 'ti-wallet',
  bill_payment_completed: 'ti-receipt',
  dispute_update: 'ti-scale',
};

interface Notif {
  id: string;
  type?: string;
  title?: string;
  subject?: string;
  body?: string;
  preview?: string;
  read_at?: string | null;
  created_at?: string;
}

function Brand({ home }: { home: string }) {
  return (
    <Link href={home} className="logo d-flex align-items-center gap-2 text-decoration-none py-1">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          backgroundColor: '#16B364',
          fontSize: 15,
        }}
      >
        P
      </div>
      <div className="d-flex flex-column leading-none">
        <span className="fw-bold fs-16 text-dark tracking-tight">PanaX</span>
      </div>
    </Link>
  );
}

function Sidebar({
  sections,
  pathname,
  onCloseMobile,
}: {
  sections: NavSection[];
  pathname: string;
  onCloseMobile: () => void;
}) {
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';

  // Track expanded submenu IDs
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.children && item.id) {
          const isChildActive = item.children.some((c) => {
            const cHref = c.href.length > 1 ? c.href.replace(/\/+$/, '') : c.href;
            return current === cHref || current.startsWith(cHref + '/');
          });
          if (isChildActive) init[item.id] = true;
        }
      });
    });
    return init;
  });

  const toggleSubmenu = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sidenav-menu">
      <div className="logo-box">
        <Brand home={sections === ADMIN_NAV ? '/admin' : '/'} />
      </div>

      <div className="scrollbar" data-simplebar>
        <ul className="side-nav">
          {sections.map((sec, secIdx) => (
            <Fragment key={sec.label || secIdx}>
              {sec.label && <li className="side-nav-title">{sec.label}</li>}
              {sec.items.map((it, itIdx) => {
                if (it.children && it.children.length > 0) {
                  const itemId = it.id || `menu-${secIdx}-${itIdx}`;
                  const isAnyChildActive = it.children.some((c) => {
                    const cHref = c.href.length > 1 ? c.href.replace(/\/+$/, '') : c.href;
                    return current === cHref || current.startsWith(cHref + '/');
                  });
                  const isOpen = expanded[itemId] ?? isAnyChildActive;

                  return (
                    <li key={itemId} className={`side-nav-item ${isOpen ? 'menuopen' : ''}`}>
                      <button
                        type="button"
                        className={`side-nav-link w-100 text-start border-0 bg-transparent ${
                          isAnyChildActive ? 'active' : ''
                        }`}
                        onClick={() => toggleSubmenu(itemId)}
                        aria-expanded={isOpen}
                      >
                        <span className="menu-icon">
                          <i className={`ti ${it.icon}`} />
                        </span>
                        <span className="menu-text">{it.label}</span>
                        {it.badge && (
                          <span className={it.badgeVariant || 'badge bg-primary'}>{it.badge}</span>
                        )}
                        <span className="menu-arrow" />
                      </button>

                      <div className={`collapse ${isOpen ? 'show' : ''}`}>
                        <ul className="sub-menu">
                          {it.children.map((sub) => {
                            const subHref = sub.href.length > 1 ? sub.href.replace(/\/+$/, '') : sub.href;
                            const isSubActive = current === subHref;
                            return (
                              <li key={sub.href} className="side-nav-item">
                                <Link
                                  href={sub.href}
                                  className={`side-nav-link ${isSubActive ? 'active' : ''}`}
                                  onClick={onCloseMobile}
                                >
                                  <span className="menu-text">{sub.label}</span>
                                  {sub.badge && (
                                    <span className={sub.badgeVariant || 'badge bg-info-subtle text-info'}>
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                }

                // Direct menu link
                const href = it.href || '#';
                const baseHref = href.length > 1 ? href.replace(/\/+$/, '') : href;
                const active = href === '/admin' ? current === '/admin' : current === baseHref || current.startsWith(baseHref + '/');

                return (
                  <li key={it.href || it.label} className="side-nav-item">
                    <Link
                      href={href}
                      className={`side-nav-link ${active ? 'active' : ''}`}
                      onClick={onCloseMobile}
                    >
                      <span className="menu-icon">
                        <i className={`ti ${it.icon}`} />
                      </span>
                      <span className="menu-text">{it.label}</span>
                      {it.badge && (
                        <span className={it.badgeVariant || 'badge bg-primary'}>{it.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </Fragment>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Notifications({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifs = useCallback(() => {
    setLoading(true);
    api
      .get<any>('/notifications?limit=8')
      .then((data) => {
        const arr: Notif[] = listOf<Notif>(data);
        setItems(arr);
        setUnreadCount(arr.filter((n) => !n.read_at).length);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 45_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open, onClose]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };

  const markOneRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="dropdown position-relative" ref={dropRef}>
      <button
        type="button"
        className="topbar-link btn btn-link px-2 text-reset position-relative"
        onClick={onToggle}
        aria-label="Notifications"
      >
        <i className="ti ti-bell fs-22" />
        {unreadCount > 0 && (
          <span className="badge bg-danger rounded-pill position-absolute top-0 end-0 translate-middle-y fs-10">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-lg p-0"
          style={{
            position: 'absolute',
            inset: '0px 0px auto auto',
            transform: 'translate3d(0px, 46px, 0px)',
            width: 360,
            maxWidth: '90vw',
            zIndex: 1050,
          }}
        >
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light rounded-top">
            <h6 className="m-0 fs-14 fw-bold">Notifications</h6>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 fs-12 text-primary text-decoration-none"
                onClick={markAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {loading && items.length === 0 ? (
              <div className="text-center py-4 text-muted fs-13">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="ti ti-bell-off fs-24 d-block mb-1" />
                <span className="fs-13">No notifications right now</span>
              </div>
            ) : (
              items.map((n) => {
                const icon = NOTIF_ICONS[n.type || ''] || 'ti-bell';
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    className={`p-3 border-bottom d-flex align-items-start gap-3 text-reset text-decoration-none cursor-pointer ${
                      isUnread ? 'bg-primary-subtle bg-opacity-25' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (isUnread) markOneRead(n.id);
                      onClose();
                      router.push('/notifications');
                    }}
                  >
                    <div className="avatar-xs flex-shrink-0">
                      <span className={`avatar-title rounded-circle ${isUnread ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                        <i className={`ti ${icon} fs-16`} />
                      </span>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className={`fs-13 ${isUnread ? 'fw-bold text-dark' : 'text-muted'}`}>
                          {n.title || n.subject || 'Notice'}
                        </span>
                        {n.created_at && (
                          <small className="text-muted fs-11 flex-shrink-0 ms-2">
                            {fmtDate(n.created_at)}
                          </small>
                        )}
                      </div>
                      <p className="fs-12 text-muted mb-0 text-truncate">
                        {n.preview || n.body || ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-top text-center bg-light rounded-bottom">
            <Link
              href="/notifications"
              className="fs-12 fw-semibold text-primary text-decoration-none"
              onClick={onClose}
            >
              View all notification history
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Splash() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
          <span className="visually-hidden">Loading…</span>
        </div>
        <div className="fs-13 text-muted fw-medium font-monospace">Synchronizing Control Room Desks…</div>
      </div>
    </div>
  );
}

function ShellInner({ kind, children }: { kind: 'customer' | 'admin'; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, activeRole, setActiveRole, impersonatingUser, setImpersonatingUser } = useUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  /* Restore persisted UI prefs */
  useEffect(() => {
    const savedTheme = (localStorage.getItem('pacesTheme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    const savedSize = localStorage.getItem('pacesSidenavSize');
    const isCondensed = savedSize === 'condensed';
    setCollapsed(isCondensed);
    document.documentElement.setAttribute('data-sidenav-size', isCondensed ? 'condensed' : 'default');
  }, []);

  /* Listen to clicks outside user dropdown */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  /* ⌘K shortcut listener */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandBarOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* Handle window resize for mobile offcanvas */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992 && mobileOpen) {
        setMobileOpen(false);
        document.documentElement.classList.remove('sidebar-enable');
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);

  function toggleSidebar() {
    if (window.innerWidth < 992) {
      const nextMobile = !mobileOpen;
      setMobileOpen(nextMobile);
      if (nextMobile) {
        document.documentElement.classList.add('sidebar-enable');
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.classList.remove('sidebar-enable');
        document.body.style.overflow = '';
      }
    } else {
      const nextCollapsed = !collapsed;
      setCollapsed(nextCollapsed);
      const size = nextCollapsed ? 'condensed' : 'default';
      document.documentElement.setAttribute('data-sidenav-size', size);
      localStorage.setItem('pacesSidenavSize', size);
    }
  }

  function closeMobile() {
    setMobileOpen(false);
    document.documentElement.classList.remove('sidebar-enable');
    document.body.style.overflow = '';
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('pacesTheme', next);
    window.dispatchEvent(new Event('pae-theme'));
  }

  function logout() {
    api.post('/auth/logout').catch(() => {}).finally(() => {
      api.clearTokens();
      router.replace('/login');
    });
  }

  if (!ready) return <Splash />;

  const sections = kind === 'admin' ? ADMIN_NAV : CUSTOMER_NAV;
  const name = displayName(user as PaeUser | null);
  const email = (user && (user.email || user.phone_number)) || '';

  return (
    <div className="wrapper">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="offcanvas-backdrop fade show" onClick={closeMobile} style={{ zIndex: 1040 }} />
      )}

      {/* Sidenav Sidebar */}
      <Sidebar
        sections={sections}
        pathname={pathname || '/'}
        onCloseMobile={closeMobile}
      />

      {/* Page Container wrapping topbar and content-page */}
      <div className="page-container">
        {/* Environment Staging Banner */}
        {kind === 'admin' && (
          <div className="environment-banner-staging d-flex align-items-center justify-content-between px-3 py-1">
            <div className="d-flex align-items-center gap-2">
              <span
                className="badge rounded-pill fw-semibold"
                style={{ backgroundColor: '#E2E8F0', color: '#475467', fontSize: '10px' }}
              >
                STAGING
              </span>
              <span className="text-secondary" style={{ fontSize: '12px' }}>
                Simulated provider sandboxes active
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 fs-11 text-muted">
              <span className="d-none d-md-inline">Dual Control: Active</span>
              <span className="d-none d-md-inline">PII Guard: Logged</span>
              <span className="font-monospace text-muted">v1.4.2</span>
            </div>
          </div>
        )}

        {/* Impersonation Banner if active (6.4) */}
        {impersonatingUser && (
          <div className="bg-danger text-white px-3 py-2 fs-13 d-flex align-items-center justify-content-between shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-eye-exclamation fs-18" />
              <span>
                <strong>IMPERSONATION ACTIVE:</strong> Viewing as <strong>{displayName(impersonatingUser)}</strong>.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-light py-0 px-2 fw-semibold fs-12 text-danger"
              onClick={() => setImpersonatingUser(null)}
            >
              Exit
            </button>
          </div>
        )}

        {/* Topbar */}
        <header className="app-topbar">
          <div className="container-fluid topbar-menu">
            <div className="d-flex align-items-center gap-2">
              {/* Topbar Brand Logo for mobile */}
              <div className="logo-topbar d-lg-none">
                <Link href={kind === 'admin' ? '/admin' : '/'} className="d-flex align-items-center gap-2 text-decoration-none">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: 28, height: 28, backgroundColor: '#16B364', fontSize: 13 }}
                  >
                    P
                  </div>
                  <span className="fw-bold fs-16 text-dark">PanaX</span>
                </Link>
              </div>

              {/* Sidenav Toggle Button */}
              <button
                type="button"
                className="sidenav-toggle-button btn btn-light btn-icon"
                onClick={toggleSidebar}
                aria-label="Toggle Navigation"
              >
                <i className="ti ti-menu-4 fs-18"></i>
              </button>

              {/* Quick Search triggering CommandBarModal */}
              <div
                className="app-search d-none d-xl-flex cursor-pointer"
                onClick={() => setCommandBarOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="text"
                  readOnly
                  className="form-control rounded-pill topbar-search cursor-pointer"
                  placeholder="Global search: tx, users, orders… (⌘K)"
                  onClick={() => setCommandBarOpen(true)}
                />
                <i className="ti ti-search app-search-icon text-muted"></i>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Role Switcher for Least Privilege Preview */}
              {kind === 'admin' && (
                <div className="dropdown position-relative d-none d-md-block">
                  <button
                    className="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center gap-1 rounded-pill px-3 py-1 fs-12 text-secondary"
                    type="button"
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  >
                    <i className="ti ti-user-shield text-muted" />
                    <span>Role: {activeRole.toUpperCase()}</span>
                  </button>
                  {roleMenuOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show shadow-sm fs-12 py-1 border"
                      style={{ position: 'absolute', zIndex: 1050, minWidth: 180 }}
                    >
                      <h6 className="dropdown-header text-uppercase fs-11 py-1 text-muted">Simulate Role</h6>
                      {['superadmin', 'operations', 'compliance', 'finance', 'engineering', 'leadership'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          className={`dropdown-item d-flex align-items-center justify-content-between py-1 px-3 ${
                            activeRole === r ? 'active bg-light text-dark fw-bold' : ''
                          }`}
                          onClick={() => {
                            setActiveRole(r);
                            setRoleMenuOpen(false);
                          }}
                        >
                          <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                          {activeRole === r && <i className="ti ti-check fs-14 ms-2 text-success" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dark/Light mode toggle */}
              <button
                type="button"
                className="topbar-link btn btn-link px-2 text-reset"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'} fs-22`} />
              </button>

              {/* Notifications */}
              <Notifications
                open={notifOpen}
                onToggle={() => setNotifOpen((v) => !v)}
                onClose={() => setNotifOpen(false)}
              />

              {/* User Profile */}
              <div className="dropdown position-relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="topbar-link btn btn-link d-flex align-items-center gap-2 p-1 text-reset text-decoration-none"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <AvatarInitials
                    text={name}
                    src={user?.avatar_url as string | undefined}
                    className="avatar-sm rounded-circle"
                  />
                  <div className="d-none d-lg-block text-start">
                    <span className="d-block fw-semibold fs-14">{name}</span>
                    <span className="d-block text-muted fs-12">
                      {kind === 'admin' ? (user?.department as string || 'Operations Desk') : 'Customer'}
                    </span>
                  </div>
                  <i className="ti ti-chevron-down fs-12 d-none d-lg-block text-muted ms-1" />
                </button>

                {menuOpen && (
                  <div
                    className="dropdown-menu dropdown-menu-end show shadow-lg py-2"
                    style={{
                      position: 'absolute',
                      inset: '0px 0px auto auto',
                      transform: 'translate3d(0px, 46px, 0px)',
                      minWidth: 220,
                      zIndex: 1050,
                    }}
                  >
                    <div className="px-3 py-2 border-bottom">
                      <h6 className="fs-13 fw-semibold m-0">{name}</h6>
                      <small className="text-muted text-truncate d-block">{email || '—'}</small>
                    </div>

                    <Link
                      href={kind === 'admin' ? '/admin/profile' : '/profile'}
                      className="dropdown-item d-flex align-items-center gap-2 py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="ti ti-user-circle fs-16" />
                      <span>{kind === 'admin' ? 'My Staff Profile' : 'My Profile'}</span>
                    </Link>

                    <Link
                      href="/admin"
                      className="dropdown-item d-flex align-items-center gap-2 py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="ti ti-dashboard fs-16" />
                      <span>Command Centre</span>
                    </Link>

                    <Link
                      href="/admin/approvals"
                      className="dropdown-item d-flex align-items-center gap-2 py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="ti ti-checklist fs-16" />
                      <span>Pending Approvals</span>
                    </Link>

                    <Link
                      href="/admin/audit-logs"
                      className="dropdown-item d-flex align-items-center gap-2 py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="ti ti-file-certificate fs-16" />
                      <span>Audit Logs</span>
                    </Link>

                    <div className="dropdown-divider my-1" />

                    <a
                      href="#logout"
                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      <i className="ti ti-logout fs-16" />
                      <span>Sign Out</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="content-page">
          <div className="container-fluid py-3">{children}</div>

          <footer className="footer">
            <div className="container-fluid">
              <div className="row align-items-center">
                <div className="col-md-6 text-center text-md-start">
                  © {new Date().getFullYear()} <span className="fw-semibold">Pan-African Exchange / Apex Finance</span> · Institutional Back Office
                </div>
                <div className="col-md-6">
                  <div className="d-none d-md-flex justify-content-end gap-3">
                    <span className="text-muted fs-12">Secured with ISO 27001 Dual-Control</span>
                    <Link href="/admin/legal" className="link-reset text-muted fs-12">Regulatory Register</Link>
                    <Link href="/admin/incidents" className="link-reset text-muted fs-12">Status Page</Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Command Bar Modal (⌘K) */}
      <CommandBarModal isOpen={commandBarOpen} onClose={() => setCommandBarOpen(false)} />
    </div>
  );
}

export function AppShell({ kind, children }: { kind: 'customer' | 'admin'; children: ReactNode }) {
  return (
    <UserProvider kind={kind}>
      <ShellInner kind={kind}>{children}</ShellInner>
    </UserProvider>
  );
}
