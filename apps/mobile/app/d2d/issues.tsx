import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { D2D_ISSUE_CATEGORIES, D2D_ISSUE_CATEGORY_LABELS, type D2DIssueCategory } from '@praja/types';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
import { loadDraft, saveDraft } from '../../lib/d2d-draft';
import { colors } from '../../lib/theme';

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
          {D2D_ISSUE_CATEGORIES.map((issue: D2DIssueCategory) => {
            const selected = issues.includes(issue);
            return (
              <Pressable
                key={issue}
                onPress={() => toggle(issue)}
                className="rounded-full px-4 py-3"
                style={{ backgroundColor: selected ? colors.gold : '#fff', borderWidth: 1, borderColor: colors.navy }}
              >
                <Text className="font-semibold text-navy">{D2D_ISSUE_CATEGORY_LABELS[issue]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Card className="mt-4">
          <Text className="text-sm text-gray-600">
            Selected: {issues.length ? issues.map((i) => D2D_ISSUE_CATEGORY_LABELS[i as keyof typeof D2D_ISSUE_CATEGORY_LABELS]).join(', ') : 'None'}
          </Text>
          <Text className="mt-2 text-xs text-gray-500">Grievance can be created from survey on sync.</Text>
        </Card>

        <View className="mt-6">
          <PrimaryButton label="Review & Submit" onPress={() => router.push('/d2d/submit')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
