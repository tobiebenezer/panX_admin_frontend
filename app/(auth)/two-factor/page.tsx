'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setTokens } from '@/lib/api';
import { OtpInput } from '@/components/ui';

interface MfaResponse {
  tokens?: { access_token?: string; refresh_token?: string };
}

export default function TwoFactorPage() {
  const router = useRouter();
  const [ticket, setTicket] = useState('');
  const [method, setMethod] = useState('');
  const [destination, setDestination] = useState('');
  const [debug, setDebug] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem('pae_mfa_ticket') || '';
    if (!t) {
      router.replace('/login');
      return;
    }
    setTicket(t);
    setMethod(sessionStorage.getItem('pae_mfa_method') || '');
    setDestination(sessionStorage.getItem('pae_mfa_destination') || '');
    setDebug(sessionStorage.getItem('pae_mfa_debug') || '');
  }, [router]);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    setPending(true);
    try {
      const data = await api.post<MfaResponse>('/auth/login/mfa', {
        ticket,
        code,
        device: { platform: 'web', name: 'Browser' },
      });
      setTokens(data.tokens?.access_token, data.tokens?.refresh_token);
      sessionStorage.removeItem('pae_mfa_ticket');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setPending(false);
    }
  }

  if (!ticket) return null;

  return (
    <>
      <div className="text-center mb-4">
        <div className="avatar-lg bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56 }}>
          <i className="ti ti-shield-lock fs-24" />
        </div>
        <h4 className="fw-bold text-dark">Two-factor authentication 🛡️</h4>
        <p className="text-muted fs-14 mb-0">
          {method === 'sms' && destination ? `Enter the code sent to ${destination}` : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <OtpInput value={code} onChange={setCode} />
        {debug ? <p className="text-warning text-center fs-12 mb-3">Development mode code: <strong>{debug}</strong></p> : null}
        <div className="d-grid mt-3">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending || code.length < 6}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Verifying…</>
            ) : (
              <><i className="ti ti-shield-check me-1" /> Verify &amp; Sign In</>
            )}
          </button>
        </div>
      </form>

      <p className="text-muted text-center mt-4 mb-0 fs-13">
        Lost your device? Use a backup recovery code or contact support.
      </p>
    </>
  );
}
