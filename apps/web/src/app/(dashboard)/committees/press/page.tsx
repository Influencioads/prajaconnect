'use client';

import { NetworkPage } from '@/components/crm/network-page';
import { NETWORK_VIEWS } from '@/lib/network-config';

export default function Page() {
  return <NetworkPage config={NETWORK_VIEWS['press']} />;
}
