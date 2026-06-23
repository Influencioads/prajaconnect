import * as React from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
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
          <Text className="mb-2 text-sm font-medium text-gray-700">Folder</Text>
          {(folders ?? []).map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFolderId(f.id)}
              className="mb-2 rounded-xl border px-4 py-3 active:opacity-80"
              style={{ borderColor: folderId === f.id ? colors.gold : '#e5e7eb', backgroundColor: folderId === f.id ? '#fef9c3' : '#fff' }}
            >
              <Text className="font-semibold text-navy">{f.name}</Text>
            </Pressable>
          ))}
        </Card>

        <Card className="mb-4">
          <PrimaryButton label="Choose photo or document" onPress={pickPhoto} />
          {uri ? (
            fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <Image source={{ uri }} className="mt-4 h-48 w-full rounded-xl" resizeMode="cover" />
            ) : (
              <Text className="mt-4 text-center text-sm text-gray-600">{fileName}</Text>
            )
          ) : (
            <Text className="mt-4 text-center text-sm text-gray-500">No file selected</Text>
          )}
        </Card>

        <PrimaryButton label={uploading ? 'Uploading…' : 'Upload'} onPress={uri && folderId ? upload : undefined} loading={uploading} />
      </ScrollView>
    </Screen>
  );
}
