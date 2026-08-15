import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchDocumentFiles, fetchFolderTree } from '../../lib/documents';
import { Screen, ScreenHeader, Card, PrimaryButton, SectionTitle, ListRow, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function DocumentsIndex() {
  const router = useRouter();
  const [folderId, setFolderId] = React.useState<string | null>(null);

  const { data: tree } = useQuery({ queryKey: ['m-documents-tree'], queryFn: fetchFolderTree });
  const { data: files } = useQuery({
    queryKey: ['m-documents-files', folderId],
    queryFn: () => fetchDocumentFiles({ folderId: folderId ?? undefined }),
    enabled: !!folderId,
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Documents" subtitle="Browse campaign files" onBack={() => router.back()} />

        <SectionTitle>Folders</SectionTitle>
        {(tree ?? []).map((f) => {
          const selected = folderId === f.id;
          return (
            <ListRow
              key={f.id}
              title={f.name}
              subtitle={`${f._count?.files ?? 0} files · ${f.category?.name ?? 'Uncategorized'}`}
              icon={selected ? 'folder-open' : 'folder'}
              tint={selected ? colors.goldDark : colors.navy}
              right={selected ? <Ionicons name="checkmark-circle" size={18} color={colors.goldDark} /> : null}
              onPress={() => setFolderId(f.id)}
            />
          );
        })}

        {folderId && (
          <Card className="mt-2">
            <Text className="mb-2 font-semibold text-ink">Files</Text>
            {(files?.data ?? []).map((file) => (
              <View key={file.id} className="mb-2 flex-row items-center">
                <Ionicons name="document-text-outline" size={16} color={colors.info} />
                <Text className="ml-2 flex-1 text-sm text-muted" numberOfLines={1}>{file.name}</Text>
              </View>
            ))}
            {(files?.data ?? []).length === 0 && (
              <EmptyState title="No files" subtitle="This folder is empty." icon="document-text" />
            )}
          </Card>
        )}

        <PrimaryButton
          label="Upload document"
          icon="cloud-upload"
          onPress={() => router.push('/documents/upload')}
          className="mt-4"
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
