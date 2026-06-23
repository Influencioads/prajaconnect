'use client';

import { useParams } from 'next/navigation';
import { NetworkProfile } from '@/components/crm/network-profile';
import { NETWORK_VIEWS } from '@/lib/network-config';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <NetworkProfile config={NETWORK_VIEWS['mandal-coordination-committee']} id={id} />;
}
