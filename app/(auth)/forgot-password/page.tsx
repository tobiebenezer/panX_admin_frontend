'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    setPending(true);
    try {
      await api.post('/auth/password/forgot', { identifier: identifier.trim() });
      toast('success', 'If the account exists, a reset code has been sent.');
      setTimeout(() => router.replace('/reset-password'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
      setPending(false);
    }
  }

  return (
    <>
      <div className="text-center mb-4">
        <h4 className="fw-bold text-dark">Forgot your password? 🔑</h4>
        <p className="text-muted fs-14">We'll send a reset code to your verified contact</p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="resetIdentifier" className="form-label">
            Email or phone number <span className="text-danger">*</span>
          </label>
          <div className="app-search">
            <input
              type="text"
              id="resetIdentifier"
              className="form-control"
              name="identifier"
              placeholder="you@example.com or +234..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <i className="ti ti-mail app-search-icon text-muted" />
          </div>
        </div>

        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Sending…</>
            ) : (
              <><i className="ti ti-send me-1" /> Send reset code</>
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-4">
        <Link href="/login" className="text-decoration-underline link-offset-3 text-muted fs-14">
          <i className="ti ti-arrow-left me-1" /> Back to sign in
        </Link>
      </div>
    </>
  );
}
