'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: 44, height: 44 }}>
          <span className="visually-hidden">Loading Operations Console…</span>
        </div>
        <h5 className="text-muted fw-normal">Loading Core Banking Console…</h5>
      </div>
    </div>
  );
}
