import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bills & Airtime' };

import BillsView from './view';

export default function BillsPage() {
  return <BillsView />;
}
