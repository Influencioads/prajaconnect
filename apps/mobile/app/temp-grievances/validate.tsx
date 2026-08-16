import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTempGrievance, fetchTempGrievanceAiSuggestions, validateTempGrievance } from '../../lib/crm';
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
  const { data: ai } = useQuery({
    queryKey: ['m-temp-ai', id],
    queryFn: () => fetchTempGrievanceAiSuggestions(id!),
    enabled: !!id,
  });

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
        {ai?.triage ? (
          <Card className="mb-3">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={14} color={colors.navy} />
              <Text className="ml-1 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">AI Suggestion</Text>
            </View>
            <Text className="mt-1 text-sm font-medium text-ink">
              {ai.triage.category ?? '—'} · {ai.triage.priority ?? '—'}
              {typeof ai.triage.confidence === 'number' ? ` · ${ai.triage.confidence}%` : ''}
              {ai.triage.suggestedDepartmentName ? ` · ${ai.triage.suggestedDepartmentName}` : ''}
            </Text>
            {ai.triage.reasoning ? <Text className="mt-0.5 text-xs text-muted">{ai.triage.reasoning}</Text> : null}
          </Card>
        ) : null}
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
