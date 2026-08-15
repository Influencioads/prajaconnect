import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { D2D_ISSUE_CATEGORIES, D2D_ISSUE_CATEGORY_LABELS, type D2DIssueCategory } from '@praja/types';
import { Screen, ScreenHeader, Card, PrimaryButton, Chip } from '../../components/ui';
import { loadDraft, saveDraft } from '../../lib/d2d-draft';

export default function D2DIssues() {
  const router = useRouter();
  const [issues, setIssues] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadDraft().then((d) => d && setIssues(d.issues));
  }, []);

  const toggle = async (issue: string) => {
    const next = issues.includes(issue) ? issues.filter((i) => i !== issue) : [...issues, issue];
    setIssues(next);
    const d = await loadDraft();
    if (d) await saveDraft({ ...d, issues: next });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Citizen Issues" subtitle="Select grievances faced" onBack={() => router.back()} />

        <View className="flex-row flex-wrap gap-2">
          {D2D_ISSUE_CATEGORIES.map((issue: D2DIssueCategory) => (
            <Chip
              key={issue}
              label={D2D_ISSUE_CATEGORY_LABELS[issue]}
              active={issues.includes(issue)}
              onPress={() => toggle(issue)}
            />
          ))}
        </View>

        <Card className="mt-4">
          <Text className="text-sm text-muted">
            Selected: {issues.length ? issues.map((i) => D2D_ISSUE_CATEGORY_LABELS[i as keyof typeof D2D_ISSUE_CATEGORY_LABELS]).join(', ') : 'None'}
          </Text>
          <Text className="mt-2 text-xs text-faint">Grievance can be created from survey on sync.</Text>
        </Card>

        <View className="mt-6">
          <PrimaryButton label="Review & Submit" icon="checkmark-circle" onPress={() => router.push('/d2d/submit')} />
        </View>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
