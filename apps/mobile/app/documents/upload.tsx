import * as React from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchFolderTree, uploadDocumentFile } from '../../lib/documents';
import { apiError } from '../../lib/api';
import { uploadAssetError } from '../../lib/validate';
import { Screen, ScreenHeader, PrimaryButton, Card } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function DocumentsUpload() {
  const router = useRouter();
  const [uri, setUri] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState('document.jpg');
  const [folderId, setFolderId] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const { data: folders } = useQuery({ queryKey: ['m-documents-folders-select'], queryFn: fetchFolderTree });

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const err = uploadAssetError({
        uri: asset.uri,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      if (err) {
        Alert.alert('Can’t use this file', err);
        return;
      }
      setUri(asset.uri);
      setFileName(asset.fileName ?? 'document.jpg');
    }
  };

  const upload = async () => {
    if (!uri || !folderId) {
      Alert.alert('Missing info', 'Select a folder and a file.');
      return;
    }
    setUploading(true);
    try {
      await uploadDocumentFile(uri, folderId, fileName, 'image/jpeg', tags || undefined);
      Alert.alert('Uploaded', 'Document saved to library.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Upload failed', apiError(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Upload Document" subtitle="Add file to a folder" onBack={() => router.back()} />

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-ink">Folder</Text>
          {(folders ?? []).map((f) => {
            const selected = folderId === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFolderId(f.id)}
                className="mb-2 flex-row items-center rounded-2xl border px-4 py-3 active:opacity-80"
                style={{
                  borderColor: selected ? colors.gold : colors.border,
                  backgroundColor: selected ? colors.goldSoft : colors.white,
                }}
              >
                <Ionicons name={selected ? 'folder-open' : 'folder'} size={18} color={selected ? colors.goldDark : colors.navy} />
                <Text className="ml-2 flex-1 font-semibold text-ink">{f.name}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.goldDark} /> : null}
              </Pressable>
            );
          })}
        </Card>

        <Card className="mb-4">
          <PrimaryButton label="Choose photo or document" onPress={pickPhoto} variant="outline" icon="image" />
          {uri ? (
            fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <Image source={{ uri }} className="mt-4 h-48 w-full rounded-xl" resizeMode="cover" />
            ) : (
              <Text className="mt-4 text-center text-sm text-muted">{fileName}</Text>
            )
          ) : (
            <View className="mt-4 items-center">
              <Ionicons name="image-outline" size={22} color={colors.faint} />
              <Text className="mt-1 text-sm text-faint">No file selected</Text>
            </View>
          )}
        </Card>

        <PrimaryButton
          label={uploading ? 'Uploading…' : 'Upload'}
          onPress={uri && folderId ? upload : undefined}
          loading={uploading}
          icon="cloud-upload"
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
