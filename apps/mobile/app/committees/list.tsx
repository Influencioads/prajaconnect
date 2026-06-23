import { useLocalSearchParams } from 'expo-router';
import { NetworkListView } from '../../components/network-list';

export default function CommitteeList() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  return <NetworkListView viewKey={view ?? 'mandal-committee'} />;
}
