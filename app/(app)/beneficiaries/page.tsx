import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Beneficiaries' };

import BeneficiariesView from './view';

export default function BeneficiariesPage() {
  return <BeneficiariesView />;
}
