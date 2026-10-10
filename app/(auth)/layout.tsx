'use client';

/* Auth split-screen layout: branded left panel + form on the right.
 * Redirects signed-in users to the dashboard. */

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) router.replace('/');
  }, [router]);

  return (
    <div className="position-relative min-vh-100 overflow-hidden bg-body-tertiary">
      {/* Paces Decorative Background SVGs */}
      <div className="position-absolute top-0 end-0 d-none d-md-block opacity-75" style={{ pointerEvents: 'none', maxWidth: '450px' }}>
        <img src="/paces/images/auth-card-bg.svg" className="img-fluid" alt="auth-bg-top" />
      </div>
      <div className="position-absolute bottom-0 start-0 d-none d-md-block opacity-75" style={{ pointerEvents: 'none', maxWidth: '450px', transform: 'rotate(180deg)' }}>
        <img src="/paces/images/auth-card-bg.svg" className="img-fluid" alt="auth-bg-bottom" />
      </div>

      <div className="auth-box d-flex align-items-center min-vh-100 py-4 py-md-5">
        <div className="container-xxl">
          <div className="row align-items-center justify-content-center">
            <div className="col-xl-10 col-lg-11">
              <div className="card shadow-lg border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
                <div className="row justify-content-between g-0">
                  {/* Left Column: Form Content */}
                  <div className="col-lg-6">
                    <div className="card-body p-4 p-sm-5">
                      <div className="auth-brand text-center mb-4">
                        <Link href="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
                          <img src="/paces/images/logo-sm.png" alt="PanaX" height="32" />
                          <span className="fs-22 fw-bold text-dark">
                            Pana<span className="text-primary">X</span>
                          </span>
                        </Link>
                      </div>
                      {children}
                    </div>
                  </div>

                  {/* Right Column: Hero Side Banner */}
                  <div className="col-lg-6 d-none d-lg-block">
                    <div
                      className="h-100 position-relative card-side-img overflow-hidden"
                      style={{
                        backgroundImage: 'url(/paces/images/auth.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '520px',
                      }}
                    >
                      <div className="p-4 p-xl-5 card-img-overlay auth-overlay d-flex flex-column justify-content-end text-white">
                        <span className="badge bg-primary text-white mb-3 align-self-start px-3 py-2 rounded-pill fs-12">
                          <i className="ti ti-bolt me-1" /> Instant Payouts
                        </span>
                        <h3 className="text-white fw-bold mb-2">Move money across Africa in minutes</h3>
                        <p className="text-white-50 fs-14 mb-4">
                          Crypto-to-fiat exchange · NGN ZAR KES GHS TZS UGX RWF XOF XAF · Bank, mobile money &amp; USSD payouts.
                        </p>
                        <div className="d-flex align-items-center gap-4 text-white-50 fs-13">
                          <div className="d-flex align-items-center gap-1">
                            <i className="ti ti-shield-check text-primary fs-16" />
                            <span className="text-white">Regulated &amp; Audited</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <i className="ti ti-device-mobile text-primary fs-16" />
                            <span className="text-white">USSD &amp; Mobile Money</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
