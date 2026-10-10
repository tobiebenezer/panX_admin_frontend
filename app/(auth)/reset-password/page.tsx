'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { qs } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    setPending(true);
    try {
      await api.post('/auth/password/reset', {
        ticket: qs('ticket') || '',
        code: code.trim(),
        new_password: newPassword,
      });
      toast('success', 'Password updated — sign in with your new password.');
      setTimeout(() => router.replace('/login'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setPending(false);
    }
  }

  return (
    <>
      <div className="text-center mb-4">
        <h4 className="fw-bold text-dark">Set a new password 🔒</h4>
        <p className="text-muted fs-14">Enter the code you received and choose a strong password</p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="resetCode" className="form-label">
            Reset code <span className="text-danger">*</span>
          </label>
          <div className="app-search">
            <input
              type="text"
              id="resetCode"
              className="form-control font-monospace"
              name="code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <i className="ti ti-key app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            New password <span className="text-danger">*</span>
          </label>
          <div className="app-search">
            <input
              type="password"
              id="newPassword"
              className="form-control"
              name="new_password"
              minLength={10}
              placeholder="Minimum 10 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <i className="ti ti-lock-password app-search-icon text-muted" />
          </div>
        </div>

        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Resetting…</>
            ) : (
              <><i className="ti ti-check me-1" /> Reset password</>
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
