'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { qs } from '@/lib/format';
import { OtpInput } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = qs('ticket') || '';
    if (!t) router.replace('/login');
    else setTicket(t);
  }, [router]);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    setPending(true);
    try {
      await api.post('/auth/verify-contact', { ticket, code });
      toast('success', 'Verified — please sign in.');
      setTimeout(() => router.replace('/login'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setPending(false);
    }
  }

  async function onResend() {
    try {
      await api.post('/auth/resend-verification', {});
    } catch {}
  }

  if (!ticket) return null;

  return (
    <>
      <div className="text-center mb-4">
        <div className="avatar-lg bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56 }}>
          <i className="ti ti-mail-check fs-24" />
        </div>
        <h4 className="fw-bold text-dark">Verify your contact ✉️</h4>
        <p className="text-muted fs-14 mb-0">Enter the one-time code we sent you</p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <OtpInput value={code} onChange={setCode} />
        <div className="d-grid mt-3">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending || code.length < 6}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Verifying…</>
            ) : (
              <><i className="ti ti-shield-check me-1" /> Verify</>
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-4">
        <a href="#" className="text-decoration-underline link-offset-3 text-muted fs-14" onClick={(e) => { e.preventDefault(); onResend(); }}>
          Resend code
        </a>
        {' · '}
        <Link href="/login" className="text-decoration-underline link-offset-3 text-muted fs-14">
          Sign in instead
        </Link>
      </div>
    </>
  );
}
