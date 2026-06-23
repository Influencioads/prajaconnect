import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchDocumentFiles, fetchFolderTree } from '../../lib/documents';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
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

        <Text className="mb-2 text-sm font-semibold text-navy">Folders</Text>
        {(tree ?? []).map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFolderId(f.id)}
            className="mb-2 rounded-xl border px-4 py-3 active:opacity-80"
            style={{ borderColor: folderId === f.id ? colors.gold : '#e5e7eb', backgroundColor: folderId === f.id ? '#fef9c3' : '#fff' }}
          >
            <Text className="font-semibold text-navy">{f.name}</Text>
            <Text className="text-xs text-gray-500">{f._count?.files ?? 0} files · {f.category?.name ?? 'Uncategorized'}</Text>
          </Pressable>
        ))}

        {folderId && (
          <Card className="mt-4">
            <Text className="mb-2 font-semibold text-navy">Files</Text>
            {(files?.data ?? []).map((file) => (
              <Text key={file.id} className="mb-2 text-sm text-gray-700">{file.name}</Text>
            ))}
            {(files?.data ?? []).length === 0 && <Text className="text-sm text-gray-500">No files in this folder</Text>}
          </Card>
        )}

        <PrimaryButton label="Upload document" onPress={() => router.push('/documents/upload')} />
      </ScrollView>
    </Screen>
  );
}
