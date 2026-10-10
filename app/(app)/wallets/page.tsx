import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Wallets' };

import WalletsView from './view';

export default function WalletsPage() {
  return <WalletsView />;
}
