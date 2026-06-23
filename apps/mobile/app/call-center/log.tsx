import * as React from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCall, fetchCallAgents, fetchCallQueues } from '../../lib/call-center';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';

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

        <Card className="mb-4 space-y-3">
          <Field label="Caller number" value={callerNumber} onChangeText={setCallerNumber} keyboardType="phone-pad" />
          <Field label="Disposition" value={disposition} onChangeText={setDisposition} placeholder="Grievance, Info, etc." />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <Text className="text-sm font-medium text-gray-700">Queue</Text>
          {(queues ?? []).map((q: { id: string; name: string }) => (
            <Pressable
              key={q.id}
              onPress={() => setQueueId(q.id)}
              className="mb-2 rounded-lg border px-3 py-2"
              style={{ backgroundColor: queueId === q.id ? '#fef9c3' : '#fff' }}
            >
              <Text className="text-sm">{q.name}</Text>
            </Pressable>
          ))}

          <Text className="text-sm font-medium text-gray-700">Agent</Text>
          {(agents ?? []).map((a: { id: string; user: { name: string } }) => (
            <Pressable
              key={a.id}
              onPress={() => setAgentId(a.id)}
              className="mb-2 rounded-lg border px-3 py-2"
              style={{ backgroundColor: agentId === a.id ? '#fef9c3' : '#fff' }}
            >
              <Text className="text-sm">{a.user.name}</Text>
            </Pressable>
          ))}
        </Card>

        <PrimaryButton
          label={log.isPending ? 'Saving…' : 'Save call log'}
          onPress={callerNumber ? () => log.mutate() : undefined}
          loading={log.isPending}
        />
      </ScrollView>
    </Screen>
  );
}
