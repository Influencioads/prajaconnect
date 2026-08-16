import * as React from 'react';
import { View, ScrollView, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SERVICE_REQUEST_TYPES,
  createServiceRequest,
  fetchServiceDeskOptions,
} from '../../lib/service-desk';
import { colors } from '../../lib/theme';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip, SectionTitle } from '../../components/ui';

export default function NewServiceRequest() {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = React.useState<string>('IncomeCertificate');
  const [applicantName, setApplicantName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [villageId, setVillageId] = React.useState('');
  const [details, setDetails] = React.useState('');

  const { data: options } = useQuery({ queryKey: ['m-service-desk-options'], queryFn: fetchServiceDeskOptions });

  const save = useMutation({
    mutationFn: () =>
      createServiceRequest({
        applicantName,
        mobile,
        type,
        details,
        villageId: villageId || undefined,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['m-service-requests'] });
      Alert.alert('Logged', `Request ${r.refNo} created. Track it from the queue.`);
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not save the request'),
  });

  const canSave = applicantName.trim().length >= 2 && mobile.trim().length >= 6 && details.trim().length >= 3;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="New Request" subtitle="Log a citizen service request" onBack={() => router.back()} />

        <SectionTitle>Request type</SectionTitle>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {SERVICE_REQUEST_TYPES.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} color={colors.navy} />
          ))}
        </View>

        <Field label="Applicant name *" value={applicantName} onChangeText={setApplicantName} icon="person" autoCapitalize="words" />
        <Field label="Mobile *" value={mobile} onChangeText={setMobile} icon="call" keyboardType="phone-pad" />

        <SectionTitle>Village</SectionTitle>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {(options?.villages ?? []).slice(0, 40).map((v) => (
            <Chip
              key={v.id}
              label={v.name}
              active={villageId === v.id}
              onPress={() => setVillageId(villageId === v.id ? '' : v.id)}
              color={colors.teal}
            />
          ))}
        </View>

        <Field label="Details *" value={details} onChangeText={setDetails} multiline autoCapitalize="sentences" placeholder="What does the applicant need?" />

        <PrimaryButton
          label={save.isPending ? 'Saving…' : 'Create request'}
          icon="save"
          loading={save.isPending}
          onPress={() => (canSave ? save.mutate() : Alert.alert('Missing info', 'Name, mobile and details are required'))}
        />
        <Text className="mb-2 mt-2 text-xs text-muted">
          Forward to a department from the web dashboard to start the SLA clock.
        </Text>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
