import * as React from 'react';
import { View, ScrollView, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLetter, draftLetter, LETTER_TYPES } from '../../lib/letters';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function NewLetter() {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = React.useState('department');
  const [addresseeName, setAddresseeName] = React.useState('');
  const [addresseeDesignation, setAddresseeDesignation] = React.useState('');
  const [pointsText, setPointsText] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  const points = pointsText
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const draftMutation = useMutation({
    mutationFn: () =>
      draftLetter({
        type,
        points,
        addresseeName,
        addresseeDesignation: addresseeDesignation || undefined,
      }),
    onSuccess: (d) => {
      setSubject(d.subject);
      setBody(d.body);
      if (!d.aiGenerated) Alert.alert('Template draft', 'AI is not configured; a structured template was used.');
    },
    onError: () => Alert.alert('Error', 'Failed to draft letter'),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createLetter({
        type,
        subject,
        body,
        addresseeName,
        addresseeDesignation: addresseeDesignation || undefined,
      }),
    onSuccess: (letter) => {
      qc.invalidateQueries({ queryKey: ['m-letters'] });
      Alert.alert('Saved', `Letter ${letter.refNo} saved as draft. Finalize it from the web dashboard to generate the PDF.`);
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to save letter'),
  });

  const canDraft = points.length > 0 && addresseeName.trim().length >= 2;
  const canSave = subject.trim().length >= 3 && body.trim().length >= 10 && addresseeName.trim().length >= 2;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="New Letter" subtitle="Draft an official letter with AI" onBack={() => router.back()} />

        <SectionTitle>Type</SectionTitle>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {LETTER_TYPES.map((t) => (
            <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(t.key)} color={colors.navy} />
          ))}
        </View>

        <Field label="Addressee name *" value={addresseeName} onChangeText={setAddresseeName} icon="person" autoCapitalize="words" />
        <Field label="Designation" value={addresseeDesignation} onChangeText={setAddresseeDesignation} icon="briefcase" autoCapitalize="words" />
        <Field
          label="Key points (one per line) *"
          value={pointsText}
          onChangeText={setPointsText}
          multiline
          placeholder={'Road repair pending on main street\nMonsoon making it worse'}
        />
        <PrimaryButton
          label={draftMutation.isPending ? 'Drafting…' : 'Draft with AI'}
          icon="sparkles"
          loading={draftMutation.isPending}
          onPress={() => (canDraft ? draftMutation.mutate() : Alert.alert('Missing info', 'Add addressee and at least one point'))}
        />

        <View className="h-4" />
        <SectionTitle>Preview & edit</SectionTitle>
        <Field label="Subject" value={subject} onChangeText={setSubject} icon="document-text" autoCapitalize="sentences" />
        <Field label="Body" value={body} onChangeText={setBody} multiline autoCapitalize="sentences" />
        <PrimaryButton
          label={saveMutation.isPending ? 'Saving…' : 'Save letter'}
          icon="save"
          loading={saveMutation.isPending}
          onPress={() => (canSave ? saveMutation.mutate() : Alert.alert('Missing info', 'Draft or write a subject and body first'))}
        />
        <Text className="mb-2 mt-2 text-xs text-muted">
          Saved letters appear in the list as drafts; finalize to PDF from the web dashboard.
        </Text>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
