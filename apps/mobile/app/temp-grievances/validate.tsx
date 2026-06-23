import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { fetchTempGrievance, validateTempGrievance } from '../../lib/crm';
import { Screen, ScreenHeader, Card, PrimaryButton, Loading } from '../../components/ui';

const ITEMS = [
  { key: 'citizenNameConfirmed', label: 'Citizen name confirmed' },
  { key: 'mobileConfirmed', label: 'Mobile confirmed' },
  { key: 'locationConfirmed', label: 'Location confirmed' },
  { key: 'categoryConfirmed', label: 'Category confirmed' },
  { key: 'descriptionVerified', label: 'Description verified' },
  { key: 'duplicateChecked', label: 'Duplicate checked' },
];

export default function ValidateTempGrievance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({ queryKey: ['m-temp-detail', id], queryFn: () => fetchTempGrievance(id!) });

  React.useEffect(() => {
    if (data?.validationChecklist) setChecklist(data.validationChecklist);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => validateTempGrievance(id!, checklist),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-temp-detail', id] });
      qc.invalidateQueries({ queryKey: ['m-temp-queue'] });
      Alert.alert('Success', 'Temp grievance validated');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Validation failed'),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Validate" subtitle={data?.tempTicketId} onBack={() => router.back()} />
        <Card>
          {ITEMS.map((item) => (
            <View key={item.key} className="mb-3 flex-row items-center justify-between">
              <Text className="flex-1 text-sm">{item.label}</Text>
              <PrimaryButton
                label={checklist[item.key] ? '✓' : '—'}
                onPress={() => setChecklist((c) => ({ ...c, [item.key]: !c[item.key] }))}
              />
            </View>
          ))}
        </Card>
        <PrimaryButton label="Submit Validation" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </ScrollView>
    </Screen>
  );
}
