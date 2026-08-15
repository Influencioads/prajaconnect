import * as React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCall, fetchCallAgents, fetchCallQueues } from '../../lib/call-center';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, PrimaryButton, Field, Chip } from '../../components/ui';

export default function CallCenterLog() {
  const router = useRouter();
  const [callerNumber, setCallerNumber] = React.useState('');
  const [disposition, setDisposition] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [queueId, setQueueId] = React.useState('');
  const [agentId, setAgentId] = React.useState('');

  const { data: queues } = useQuery({ queryKey: ['m-call-queues'], queryFn: fetchCallQueues });
  const { data: agents } = useQuery({ queryKey: ['m-call-agents'], queryFn: fetchCallAgents });

  const log = useMutation({
    mutationFn: () =>
      createCall({
        direction: 'Inbound',
        callerNumber,
        disposition,
        notes,
        queueId: queueId || undefined,
        agentId: agentId || undefined,
      }),
    onSuccess: () => {
      Alert.alert('Logged', 'Call recorded successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Log Call" subtitle="Helpline call intake" onBack={() => router.back()} />

        <Card className="mb-4">
          <Field
            label="Caller number"
            value={callerNumber}
            onChangeText={setCallerNumber}
            keyboardType="phone-pad"
            icon="call"
          />
          <Field
            label="Disposition"
            value={disposition}
            onChangeText={setDisposition}
            placeholder="Grievance, Info, etc."
            icon="pricetag"
          />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Queue</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {(queues ?? []).map((q: { id: string; name: string }) => (
              <Chip key={q.id} label={q.name} active={queueId === q.id} onPress={() => setQueueId(q.id)} />
            ))}
          </View>

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Agent</Text>
          <View className="flex-row flex-wrap gap-2">
            {(agents ?? []).map((a: { id: string; user: { name: string } }) => (
              <Chip key={a.id} label={a.user.name} active={agentId === a.id} onPress={() => setAgentId(a.id)} />
            ))}
          </View>
        </Card>

        <PrimaryButton
          label={log.isPending ? 'Saving…' : 'Save call log'}
          icon="checkmark-circle"
          onPress={callerNumber ? () => log.mutate() : undefined}
          loading={log.isPending}
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
