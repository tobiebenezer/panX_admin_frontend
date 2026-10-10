'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, listOf } from '@/lib/api';
import { OtpInput } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface Verification {
  ticket?: string;
  channel?: string;
  destination?: string;
  debug_code?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('individual');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [ticket, setTicket] = useState('');
  const [hint, setHint] = useState('We sent a one-time code');
  const [debugCode, setDebugCode] = useState('');
  const [code, setCode] = useState('');

  async function onRegister(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    if (!email.trim() && !phone.trim()) {
      setError('Provide an email address or phone number.');
      return;
    }
    setPending(true);
    try {
      const data = await api.post<{ verifications?: Verification[] }>('/auth/register', {
        email: email.trim() || null,
        phone_number: phone.trim() || null,
        password,
        user_type: userType,
        full_name: fullName.trim() || null,
      });
      const v = listOf<Verification>(data, 'verifications')[0] || {};
      setTicket(v.ticket || '');
      setHint(`We sent a code via ${v.channel || 'SMS/email'} to ${v.destination || 'your contact'}`);
      setDebugCode(v.debug_code || '');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setPending(false);
    }
  }

  async function onVerify(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    try {
      await api.post('/auth/verify-contact', { ticket, code });
      toast('success', 'Contact verified — please sign in.');
      router.replace('/login');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Verification failed');
    }
  }

  async function onResend() {
    try {
      await api.post('/auth/resend-verification', {});
    } catch {}
  }

  if (step === 'verify') {
    return (
      <>
        <div className="text-center mb-4">
          <div className="avatar-lg bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56 }}>
            <i className="ti ti-mail-check fs-24" />
          </div>
          <h4 className="fw-bold text-dark">Verify your contact</h4>
          <p className="text-muted fs-14 mb-0">{hint}</p>
        </div>

        <form onSubmit={onVerify}>
          <OtpInput value={code} onChange={setCode} />
          {debugCode ? (
            <p className="text-warning text-center fs-12 mb-3">Development mode code: <strong>{debugCode}</strong></p>
          ) : null}
          <div className="d-grid mt-3">
            <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending || code.length < 6}>
              <i className="ti ti-shield-check me-1" /> Verify &amp; Continue
            </button>
          </div>
        </form>

        <p className="text-muted text-center mt-4 mb-0 fs-14">
          <a href="#" className="text-decoration-underline link-offset-3 text-muted" onClick={(e) => { e.preventDefault(); onResend(); }}>
            Resend code
          </a>
          {' · '}
          <Link href="/login" className="text-decoration-underline link-offset-3 text-muted">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-4">
        <h4 className="fw-bold text-dark">Create your account 🚀</h4>
        <p className="text-muted fs-14">Exchange across 10+ African currencies in minutes</p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onRegister}>
        <div className="row g-3">
          <div className="col-12">
            <label htmlFor="fullName" className="form-label">
              Full name <span className="text-danger">*</span>
            </label>
            <div className="app-search">
              <input
                type="text"
                id="fullName"
                className="form-control"
                name="full_name"
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <i className="ti ti-user app-search-icon text-muted" />
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="userEmail" className="form-label">
              Email address
            </label>
            <div className="app-search">
              <input
                type="email"
                id="userEmail"
                className="form-control"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <i className="ti ti-mail app-search-icon text-muted" />
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="userPhone" className="form-label">
              Phone number
            </label>
            <div className="app-search">
              <input
                type="tel"
                id="userPhone"
                className="form-control"
                name="phone_number"
                placeholder="+2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <i className="ti ti-phone app-search-icon text-muted" />
            </div>
            <div className="form-text fs-12 text-muted">Provide email or phone — we send a one-time verification code.</div>
          </div>

          <div className="col-12">
            <label htmlFor="userType" className="form-label">
              Account type
            </label>
            <select
              id="userType"
              className="form-select"
              name="user_type"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="col-12">
            <label htmlFor="signupPassword" className="form-label">
              Password <span className="text-danger">*</span>
            </label>
            <div className="app-search position-relative">
              <input
                type={showPwd ? 'text' : 'password'}
                id="signupPassword"
                className="form-control"
                name="password"
                minLength={10}
                placeholder="Minimum 10 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i className="ti ti-lock-password app-search-icon text-muted" />
              <button
                type="button"
                className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none pe-3 border-0 bg-transparent shadow-none"
                style={{ zIndex: 10 }}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                <i className={showPwd ? 'ti ti-eye-off fs-16' : 'ti ti-eye fs-16'} />
              </button>
            </div>
          </div>
        </div>

        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Creating account…</>
            ) : (
              <><i className="ti ti-user-plus me-1" /> Create account</>
            )}
          </button>
        </div>
      </form>

      <p className="text-muted text-center mt-4 mb-0 fs-14">
        Already registered?{' '}
        <Link href="/login" className="text-decoration-underline link-offset-3 fw-semibold text-primary">
          Sign in
        </Link>
      </p>
    </>
  );
}
