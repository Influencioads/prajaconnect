import * as React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { convertTempGrievance, fetchGrievanceOptions, fetchTempGrievance } from '../../lib/crm';
import { Screen, ScreenHeader, Field, PrimaryButton, Loading } from '../../components/ui';

export default function ConvertTempGrievanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');

  const { data, isLoading } = useQuery({ queryKey: ['m-temp-detail', id], queryFn: () => fetchTempGrievance(id!) });
  const { data: opts } = useQuery({ queryKey: ['m-grievance-options'], queryFn: fetchGrievanceOptions });

  React.useEffect(() => {
    if (data) {
      setTitle(data.issueSummary ?? '');
      setDescription(data.issueDescription ?? '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => convertTempGrievance(id!, { title, description, departmentId: departmentId || undefined, notifyCitizen: true }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['m-temp-detail', id] });
      Alert.alert('Converted', `Grievance ${res.code} created`);
      router.replace(`/grievance/${res.grievanceId}`);
    },
    onError: () => Alert.alert('Error', 'Conversion failed'),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Convert" subtitle={data?.tempTicketId} onBack={() => router.back()} />
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Field label="Department ID (optional)" value={departmentId} onChangeText={setDepartmentId} placeholder={opts?.departments?.[0]?.name} />
        <PrimaryButton label="Convert to Grievance" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </ScrollView>
    </Screen>
  );
}
