import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { colors } from '../../lib/theme';
import { submitFieldReport, resolveCadreId } from '../../lib/attendance';
import { useAuth } from '../../lib/auth';

export default function AttendanceFieldReportMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = React.useState('');
  const [tasksCompleted, setTasksCompleted] = React.useState('0');
  const [cadreId, setCadreId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    resolveCadreId(user?.mobile).then(setCadreId).catch(() => undefined);
  }, [user?.mobile]);

  const submit = useMutation({
    mutationFn: () => {
      if (!cadreId) throw new Error('Cadre profile not found');
      return submitFieldReport({
        cadreId,
        summary: summary.trim(),
        tasksCompleted: parseInt(tasksCompleted, 10) || 0,
      });
    },
    onSuccess: () => {
      setMessage('Field report submitted');
      setSummary('');
      setTasksCompleted('0');
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Daily Field Report" subtitle="Summarize today's field activities" onBack={() => router.back()} />
        <Card className="gap-4">
          <Field
            label="Tasks Completed"
            value={tasksCompleted}
            onChangeText={setTasksCompleted}
            keyboardType="numeric"
            icon="checkmark-done"
          />
          <Field
            label="Summary"
            value={summary}
            onChangeText={setSummary}
            placeholder="Household visits, meetings, outreach…"
            multiline
          />
          <PrimaryButton
            label="Submit Report"
            icon="send"
            loading={submit.isPending}
            onPress={() => {
              if (!summary.trim()) {
                setMessage('Summary is required');
                return;
              }
              submit.mutate();
            }}
          />
          {message ? <Text className="text-sm font-medium" style={{ color: colors.success }}>{message}</Text> : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}
