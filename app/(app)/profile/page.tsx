'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader, Card, Skeleton, StatusPill, ErrorState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { fmtDate } from '@/lib/format';
import { useUser } from '@/lib/auth';

const LANGUAGES = [
  ['en', 'English'],
  ['fr', 'Français'],
  ['pt', 'Português'],
  ['sw', 'Kiswahili'],
  ['ar', 'العربية'],
  ['am', 'አማርኛ'],
];

interface Consent {
  id?: string;
  document_title?: string;
  document_type?: string;
  type?: string;
  recorded_at?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { refresh } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [tier, setTier] = useState<any>(null);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('');
  const [corridor, setCorridor] = useState('');
  const [language, setLanguage] = useState('en');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  const loadConsents = useCallback(() => {
    api
      .get('/legal/consents')
      .then((r: any) => setConsents(r.consents || r.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([api.get('/profile'), api.get('/account/tier'), api.get('/legal/consents'), api.get('/corridors')])
      .then(([p, t, c, corridors]: any[]) => {
        const profile = p.profile || p;
        setFullName(String(profile.full_name || profile.display_name || ''));
        setCurrency(String(profile.preferred_currency || ''));
        setCorridor(String(profile.preferred_corridor || ''));
        setLanguage(String(profile.language || 'en'));
        setEmail(String(profile.email || ''));
        setPhone(String(profile.phone_number || ''));
        setTier(t.tier || t);
        setConsents(c.consents || c.items || []);
        const list: any[] = corridors.corridors || (Array.isArray(corridors) ? corridors : []) || [];
        const seen: Record<string, boolean> = {};
        const codes: string[] = [];
        list.forEach((corr) => {
          [corr.source_currency, corr.destination_currency, corr.currency].forEach((code: string | undefined) => {
            if (code && !seen[code]) {
              seen[code] = true;
              codes.push(code);
            }
          });
        });
        setCurrencies(codes);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        toast('error', (err as Error).message);
      });
  }, [toast]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/profile', {
        full_name: fullName.trim() || null,
        preferred_currency: currency || null,
        preferred_corridor: corridor.trim() || null,
        language,
      });
      toast('success', 'Profile saved');
      refresh();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    try {
      await api.put('/profile/contact', {
        email: email.trim() || null,
        phone_number: phone.trim() || null,
      });
      toast('success', 'Contact updated — check for verification codes');
      refresh();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setSavingContact(false);
    }
  }

  async function recordConsent() {
    try {
      await api.post('/legal/consents', {});
      toast('success', 'Consent recorded');
      loadConsents();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="User Profile"
        breadcrumb="Profile"
      />
      <div className="row g-3">
        <div className="col-lg-7">
          <Card title="Personal Details" className="shadow-sm border-0 h-100">
            {loading ? (
              <>
                <Skeleton width="90%" />
                <Skeleton width="70%" />
              </>
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <>
                <form onSubmit={saveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ada Lovelace"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Display currency</label>
                      <select
                        className="form-select w-100"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="">Default</option>
                        {currencies.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Preferred corridor (source → destination)</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={corridor}
                        onChange={(e) => setCorridor(e.target.value)}
                        placeholder="NGN → GHS"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Language</label>
                      <select
                        className="form-select w-100"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        {LANGUAGES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={savingProfile}>
                    <i className="ti ti-check me-1" /> Save profile
                  </button>
                </form>

                <hr className="border-light my-4" />

                <h6 className="card-title mb-3">Contact details</h6>
                <form onSubmit={saveContact}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                      <small className="text-muted d-block mt-1">Changing triggers re-verification.</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+2348012345678"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-outline-secondary btn-sm mt-3" disabled={savingContact}>
                    <i className="ti ti-send me-1" /> Update contact
                  </button>
                </form>
              </>
            )}
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="Account tier" bodyClassName="quote-summary" className="mb-3">
            {loading ? (
              <>
                <Skeleton width="70%" />
                <Skeleton width="55%" />
              </>
            ) : tier ? (
              <>
                <div className="qs-row qs-total">
                  <span>Current tier</span>
                  <strong>{tier.name || tier.display_name || 'basic'}</strong>
                </div>
                <div className="qs-row">
                  <span>Daily limit</span>
                  <strong>{tier.daily_limit || '—'}</strong>
                </div>
                <div className="qs-row">
                  <span>Monthly limit</span>
                  <strong>{tier.monthly_limit || '—'}</strong>
                </div>
                <div className="qs-row">
                  <span>Status</span>
                  <StatusPill status={tier.status || 'active'} />
                </div>
              </>
            ) : (
              <Skeleton width="60%" />
            )}
          </Card>
          <Card title="Consents & legal">
            {loading ? (
              <Skeleton width="80%" />
            ) : consents.length ? (
              consents.map((c, i) => (
                <div
                  key={c.id || i}
                  className="d-flex justify-content-between align-items-center py-2 border-bottom border-light"
                >
                  <span className="fs-13">{c.document_title || c.document_type || c.type || 'Consent'}</span>
                  <span className="fs-12 text-muted">{fmtDate(c.recorded_at || c.created_at)}</span>
                </div>
              ))
            ) : (
              <>
                <p className="text-muted fs-13 mb-2">No recorded consents yet.</p>
                <button className="btn btn-outline-secondary btn-sm" onClick={recordConsent}>
                  <i className="ti ti-file-check me-1" /> Accept current terms
                </button>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
