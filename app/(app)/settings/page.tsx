'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, listOf, clearTokens } from '@/lib/api';
import { PageHeader, Card, Skeleton, EmptyState, ErrorState, Modal, OtpInput, DataTable } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { fmtDate } from '@/lib/format';

const CHANNELS = ['email', 'sms', 'push'];

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  /* MFA */
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaError, setMfaError] = useState<unknown>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [setup, setSetup] = useState<null | {
    kind: 'sms' | 'totp';
    label: string;
    ticket?: string;
    secret?: string;
    info?: { secret: string; uri: string };
    devCode?: string;
  }>(null);
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const loadMfa = useCallback(() => {
    setMfaLoading(true);
    api
      .get('/auth/mfa')
      .then((data: any) => {
        setMethods(listOf<any>(data, 'methods', 'items'));
        setMfaError(null);
      })
      .catch((err) => setMfaError(err))
      .finally(() => setMfaLoading(false));
  }, []);

  useEffect(loadMfa, [loadMfa]);

  const totpMethod = methods.find((m) => /totp/i.test(String(m.method_type || m.type)));
  const smsMethod = methods.find((m) => /sms/i.test(String(m.method_type || m.type)));

  async function disableFactor(method: any) {
    try {
      await api.del(`/auth/mfa/${encodeURIComponent(method.id)}`);
      toast('success', 'Factor disabled');
      loadMfa();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  async function startSms() {
    try {
      const r: any = await api.post('/auth/mfa/sms/enable', {});
      setCode('');
      setSetup({
        kind: 'sms',
        label: 'Enter the code sent to your phone',
        ticket: r.ticket || '',
        devCode: r.debug_code || undefined,
      });
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  async function startTotp() {
    try {
      const r: any = await api.post('/auth/mfa/totp/setup', {});
      setCode('');
      setSetup({
        kind: 'totp',
        label: '2. Enter the current 6-digit code',
        secret: r.secret || '',
        info: { secret: r.secret || '', uri: r.otpauth_uri || '' },
      });
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setConfirming(true);
    try {
      const call = setup.ticket
        ? api.post('/auth/mfa/sms/confirm', { ticket: setup.ticket, code })
        : api.post('/auth/mfa/totp/confirm', { secret: setup.secret, code });
      const r: any = await call;
      toast('success', r.recovery_codes ? 'Enabled — save recovery codes' : 'Enabled');
      if (r.recovery_codes) setRecoveryCodes(r.recovery_codes || []);
      setSetup(null);
      setCode('');
      loadMfa();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setConfirming(false);
    }
  }

  /* Sessions */
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<unknown>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const loadSessions = useCallback(() => {
    setSessionsLoading(true);
    api
      .get('/auth/sessions')
      .then((data: any) => {
        setSessions(listOf<any>(data, 'sessions', 'items'));
        setSessionsError(null);
      })
      .catch((err) => setSessionsError(err))
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(loadSessions, [loadSessions]);

  async function revokeSession(id: string) {
    try {
      await api.del(`/auth/sessions/${encodeURIComponent(id)}`);
      loadSessions();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  async function logoutAll() {
    try {
      await api.post('/auth/logout-all', {});
      clearTokens();
      router.replace('/login');
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  /* Account settings */
  const [settings, setSettings] = useState({
    require_mfa_for_payouts: false,
    login_alerts: false,
    sms_notifications: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    api
      .get('/account/settings')
      .then((data: any) => {
        const s = data.settings || data;
        setSettings({
          require_mfa_for_payouts: !!s.require_mfa_for_payouts,
          login_alerts: !!s.login_alerts,
          sms_notifications: !!s.sms_notifications,
        });
      })
      .catch(() => {});
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.patch('/account/settings', settings);
      toast('success', 'Settings saved');
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  }

  /* Notification preferences */
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<unknown>(null);
  const [prefs, setPrefs] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/notifications/preferences')
      .then((data: any) => {
        setPrefs(data.preferences || data.items || []);
        setPrefsError(null);
      })
      .catch((err) => setPrefsError(err))
      .finally(() => setPrefsLoading(false));
  }, []);

  async function togglePref(eventType: string, channel: string, checked: boolean) {
    const channels = CHANNELS.filter((ch) => {
      if (ch === channel) return checked;
      const row = prefs.find((p) => String(p.event_type || p.event) === eventType);
      return row ? String(row.channels || '').indexOf(ch) >= 0 : false;
    });
    setPrefs((prev) =>
      prev.map((p) => (String(p.event_type || p.event) === eventType ? { ...p, channels: channels.join(',') } : p))
    );
    try {
      await api.put('/notifications/preferences', [{ event: eventType, channels }]);
      toast('success', 'Preferences updated');
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  /* API keys */
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<unknown>(null);
  const [keyConsentNeeded, setKeyConsentNeeded] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyOpen, setNewKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [shownSecret, setShownSecret] = useState('');

  const loadKeys = useCallback(() => {
    setKeysLoading(true);
    api
      .get('/api-keys')
      .then((data: any) => {
        setKeys(data.keys || data.api_keys || data.items || []);
        setKeysError(null);
        setKeyConsentNeeded(false);
      })
      .catch((err) => {
        if (err && typeof err === 'object' && (err as any).status === 403) setKeyConsentNeeded(true);
        else setKeysError(err);
      })
      .finally(() => setKeysLoading(false));
  }, []);

  useEffect(loadKeys, [loadKeys]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const k: any = await api.post('/api-keys', { name: newKeyName.trim(), scopes: ['read:transactions'] });
      setNewKeyOpen(false);
      setNewKeyName('');
      const secret = k.secret || k.key || k.plaintext;
      if (secret) setShownSecret(String(secret));
      else toast('success', 'API key created');
      loadKeys();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id: string) {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await api.del(`/api-keys/${encodeURIComponent(id)}`);
      loadKeys();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Account Settings"
        breadcrumb="Settings"
      />
      <div className="row g-3">
        <div className="col-lg-6">
          <Card
            title="Multi-Factor Authentication"
            className="shadow-sm border-0 mb-3"
          >
            {mfaLoading ? (
              <Skeleton width="60%" />
            ) : mfaError ? (
              <ErrorState error={mfaError} />
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="d-flex align-items-center">
                    <i className="ti ti-device-mobile me-2 text-muted fs-18" />
                    SMS factor
                  </span>
                  <button className="btn btn-outline-secondary btn-sm" onClick={smsMethod ? () => disableFactor(smsMethod) : startSms}>
                    {smsMethod ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="d-flex align-items-center">
                    <i className="ti ti-shield-lock me-2 text-muted fs-18" />
                    Authenticator app (TOTP)
                  </span>
                  <button className="btn btn-outline-secondary btn-sm" onClick={totpMethod ? () => disableFactor(totpMethod) : startTotp}>
                    {totpMethod ? 'Disable' : 'Set up'}
                  </button>
                </div>
                {setup ? (
                  <div id="mfaSetupBox" className="mt-3 p-3 bg-light rounded">
                    {setup.devCode ? (
                      <p className="fs-12 text-warning mb-2">Development mode code: <strong>{setup.devCode}</strong></p>
                    ) : null}
                    {setup.info ? (
                      <div className="alert alert-info mb-3">
                        <strong className="d-block mb-1">1. Add this secret to your authenticator app:</strong>
                        <code className="text-monospace user-select-all d-block bg-white p-2 rounded mb-1">{setup.info.secret}</code>
                        <small className="text-muted d-block text-break">{setup.info.uri}</small>
                      </div>
                    ) : null}
                    <form onSubmit={confirmSetup} className="mt-2">
                      <label className="form-label mb-2">{setup.label}</label>
                      <OtpInput value={code} onChange={setCode} />
                      <div className="mt-3 text-center">
                        <button type="submit" className="btn btn-primary btn-sm" disabled={confirming || code.length < 6}>
                          <i className="ti ti-check me-1" /> Confirm
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </>
            )}
          </Card>

          <Card title="Notification preferences" className="mb-3">
            {prefsLoading ? (
              <>
                <Skeleton width="70%" />
                <Skeleton width="55%" />
              </>
            ) : prefsError ? (
              <ErrorState error={prefsError} />
            ) : prefs.length ? (
              prefs.map((p, i) => {
                const eventType = String(p.event_type || p.event);
                const on = (ch: string) => String(p.channels || '').indexOf(ch) >= 0;
                return (
                  <div key={eventType || i} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-capitalize fs-13">{eventType.replace(/_/g, ' ')}</span>
                    <div className="d-flex gap-2">
                      {CHANNELS.map((ch) => (
                        <div key={ch} className="form-check form-check-inline m-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={on(ch)}
                            onChange={(e) => togglePref(eventType, ch, e.target.checked)}
                            title={ch}
                            id={`pref-${eventType}-${ch}`}
                          />
                          <label className="form-check-label fs-11 text-muted text-uppercase" htmlFor={`pref-${eventType}-${ch}`}>
                            {ch}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState icon="ti-bell-off" title="No preference entries" hint="Defaults apply." />
            )}
          </Card>

          <Card title="Account Settings" subtitle="Security policies &amp; direct alerts" className="shadow-sm border-0 mb-3">
            <form onSubmit={saveSettings}>
              <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light">
                <span className="fs-13">Two-factor required for payouts</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={settings.require_mfa_for_payouts}
                    onChange={(e) => setSettings({ ...settings, require_mfa_for_payouts: e.target.checked })}
                  />
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light">
                <span className="fs-13">Login alerts by email</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={settings.login_alerts}
                    onChange={(e) => setSettings({ ...settings, login_alerts: e.target.checked })}
                  />
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between py-2">
                <span className="fs-13">SMS notifications</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={settings.sms_notifications}
                    onChange={(e) => setSettings({ ...settings, sms_notifications: e.target.checked })}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn btn-outline-secondary btn-sm" disabled={savingSettings}>
                  <i className="ti ti-check me-1" /> Save settings
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="col-lg-6">
          <Card
            title="Active Sessions"
            subtitle="Logged in devices and browser sessions"
            className="shadow-sm border-0 mb-3"
            bodyClassName="p-0"
            actions={
              <button className="btn btn-outline-danger btn-sm" onClick={logoutAll}>
                <i className="ti ti-logout me-1" /> Sign out everywhere
              </button>
            }
          >
            {sessionsLoading ? (
              <div className="p-3">
                <Skeleton width="80%" />
                <Skeleton width="65%" />
              </div>
            ) : sessionsError ? (
              <ErrorState error={sessionsError} />
            ) : (
              <DataTable
                columns={['Device', 'Platform', 'Last active', '']}
                rows={sessions}
                emptyIcon="ti-inbox"
                emptyTitle="No active sessions"
                emptyHint="Sign-ins appear here."
                render={(s) => [
                  <span key="d" className="fw-medium">{s.device_name || s.name || 'Browser'}</span>,
                  <span key="p" className="fs-12 text-muted">
                    {s.platform || s.user_agent || ''}
                  </span>,
                  <span key="t" className="fs-12 text-muted">{fmtDate(s.last_active_at || s.created_at, true)}</span>,
                  <button
                    key="r"
                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                    onClick={() => revokeSession(s.id)}
                  >
                    Revoke
                  </button>,
                ]}
              />
            )}
          </Card>

          <Card
            title="API Keys"
            subtitle="Business API access (requires consent)"
            className="shadow-sm border-0 mb-3"
            bodyClassName="p-0"
            actions={
              <button className="btn btn-primary btn-sm" onClick={() => setNewKeyOpen(true)}>
                <i className="ti ti-key me-1" /> New key
              </button>
            }
          >
            {keyConsentNeeded ? (
              <div className="alert alert-warning m-3">
                Accept the api_client consent in Profile → Consents to manage API keys.
              </div>
            ) : null}
            {keysLoading ? (
              <div className="p-3">
                <Skeleton width="75%" />
                <Skeleton width="55%" />
              </div>
            ) : keysError ? (
              <ErrorState error={keysError} />
            ) : keys.length ? (
              <div className="p-3">
                {keys.map((k) => (
                  <div key={k.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <div>
                      <strong className="fs-13 d-block">{k.name || k.label || 'API key'}</strong>
                      <small className="d-block font-monospace text-muted">
                        {k.prefix || k.masked_key || ''}… · {(k.scopes || []).join(', ') || ''}
                      </small>
                    </div>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => revokeKey(k.id)}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            ) : keyConsentNeeded ? null : (
              <EmptyState icon="ti-key" title="No API keys yet" />
            )}
          </Card>
        </div>
      </div>

      <Modal open={newKeyOpen} onClose={() => setNewKeyOpen(false)} title="Create API key">
        <form onSubmit={createKey}>
          <div className="mb-3">
            <label className="form-label">Key name</label>
            <input
              type="text"
              className="form-control"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Production server"
              required
              autoFocus
            />
          </div>
          <small className="text-muted d-block mb-3">Scope: read:transactions</small>
          <button type="submit" className="btn btn-primary btn-sm" disabled={creatingKey || !newKeyName.trim()}>
            <i className="ti ti-key me-1" /> Create key
          </button>
        </form>
      </Modal>

      <Modal open={!!shownSecret} onClose={() => setShownSecret('')} title="Save this secret now — it is shown once">
        <code className="font-monospace user-select-all text-break d-block p-3 bg-light rounded">{shownSecret}</code>
      </Modal>

      <Modal open={recoveryCodes.length > 0} onClose={() => setRecoveryCodes([])} title="Recovery codes (save them now)">
        <ul className="mb-0 ps-3 font-monospace">
          {recoveryCodes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
