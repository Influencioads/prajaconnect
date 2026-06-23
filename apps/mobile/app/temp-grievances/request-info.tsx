import * as React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { requestTempGrievanceMoreInfo } from '../../lib/crm';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';

export default function RequestMoreInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [message, setMessage] = React.useState('');

  const mutation = useMutation({
    mutationFn: () => requestTempGrievanceMoreInfo(id!, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-temp-detail', id] });
      Alert.alert('Sent', 'More information requested');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Request failed'),
  });

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Request More Info" onBack={() => router.back()} />
        <Field label="Message to citizen / field team" value={message} onChangeText={setMessage} multiline />
        <PrimaryButton label="Send Request" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </ScrollView>
    </Screen>
  );
}
