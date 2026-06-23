import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { api } from '../../lib/api';
import { createCorrection, resolveCadreId } from '../../lib/attendance';
import { useAuth } from '../../lib/auth';

export default function AttendanceCorrectionsMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = React.useState('');
  const [cadreId, setCadreId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    resolveCadreId(user?.mobile).then(setCadreId).catch(() => undefined);
  }, [user?.mobile]);

  const { data: recent } = useQuery({
    queryKey: ['m-att-recent', cadreId],
    queryFn: async () => {
      const { data } = await api.get('/attendance/records', {
        params: { cadreId, page: 1, limit: 5 },
      });
      return data.data ?? [];
    },
    enabled: !!cadreId,
  });

  const [attendanceId, setAttendanceId] = React.useState('');

  React.useEffect(() => {
    if (recent?.[0]?.id) setAttendanceId(recent[0].id);
  }, [recent]);

  const submit = useMutation({
    mutationFn: () => createCorrection(attendanceId, reason.trim()),
    onSuccess: () => {
      setMessage('Correction request submitted');
      setReason('');
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Request Correction" subtitle="Fix incorrect check-in times or locations" onBack={() => router.back()} />
        <Card className="gap-4">
          <Field
            label="Attendance Record ID"
            value={attendanceId}
            onChangeText={setAttendanceId}
            placeholder="Record to correct"
          />
          <Field
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Explain the correction needed"
            multiline
          />
          <PrimaryButton
            label="Submit Request"
            loading={submit.isPending}
            onPress={() => {
              if (!attendanceId || !reason.trim()) {
                setMessage('Record ID and reason are required');
                return;
              }
              submit.mutate();
            }}
          />
          {message ? <Text className="text-sm text-green-600">{message}</Text> : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}
