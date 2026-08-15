import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTempGrievance, validateTempGrievance } from '../../lib/crm';
import { colors } from '../../lib/theme';
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
          {ITEMS.map((item) => {
            const done = !!checklist[item.key];
            return (
              <Pressable
                key={item.key}
                onPress={() => setChecklist((c) => ({ ...c, [item.key]: !c[item.key] }))}
                hitSlop={4}
                className="mb-3 flex-row items-center justify-between"
              >
                <Text className="flex-1 pr-3 text-sm text-ink">{item.label}</Text>
                <Ionicons name={done ? 'checkbox' : 'square-outline'} size={22} color={done ? colors.success : colors.faint} />
              </Pressable>
            );
          })}
        </Card>
        <PrimaryButton label="Submit Validation" icon="shield-checkmark" className="mt-4" loading={mutation.isPending} onPress={() => mutation.mutate()} />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
