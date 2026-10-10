import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Disputes' };

import DisputesView from './view';

export default function DisputesPage() {
  return <DisputesView />;
}
