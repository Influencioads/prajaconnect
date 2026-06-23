import * as React from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTempGrievance } from '../../lib/crm';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';

export default function NewTempGrievance() {
  const router = useRouter();
  const qc = useQueryClient();
  const [citizenName, setCitizenName] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [issueSummary, setIssueSummary] = React.useState('');
  const [issueDescription, setIssueDescription] = React.useState('');

  const mutation = useMutation({
    mutationFn: () => createTempGrievance({
      source: 'Manual',
      citizenName: citizenName || undefined,
      mobileNumber: mobileNumber || undefined,
      issueSummary: issueSummary || undefined,
      issueDescription,
      priority: 'Medium',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-temp-queue'] });
      qc.invalidateQueries({ queryKey: ['m-temp-analytics'] });
      Alert.alert('Created', 'Temp grievance logged');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to create'),
  });

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Create Temp Grievance" onBack={() => router.back()} />
        <Field label="Citizen name" value={citizenName} onChangeText={setCitizenName} />
        <Field label="Mobile" value={mobileNumber} onChangeText={setMobileNumber} />
        <Field label="Summary" value={issueSummary} onChangeText={setIssueSummary} />
        <Field label="Description *" value={issueDescription} onChangeText={setIssueDescription} multiline />
        <PrimaryButton label="Create" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </ScrollView>
    </Screen>
  );
}
