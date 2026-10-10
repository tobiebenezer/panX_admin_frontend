import type { Metadata } from 'next';
import StaffDetailView from './view';

export const metadata: Metadata = {
  title: 'Staff Member Profile & Activities',
};

export async function generateStaticParams() {
  return [
    { id: 'stf-01' },
    { id: 'stf-02' },
    { id: 'stf-03' },
    { id: 'stf-04' },
    { id: 'stf-05' },
    { id: 'stf-06' },
  ];
}

export default async function StaffPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return <StaffDetailView staffId={resolved.id} />;
}
