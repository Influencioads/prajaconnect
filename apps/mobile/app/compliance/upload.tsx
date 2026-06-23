import * as React from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import {
  createComplianceDocument,
  fetchPermissionRequests,
  uploadComplianceFile,
} from '../../lib/compliance';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, PrimaryButton, Card } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function ComplianceUpload() {
  const router = useRouter();
  const [uri, setUri] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState('document.jpg');
  const [permissionId, setPermissionId] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const { data: permissions } = useQuery({
    queryKey: ['m-compliance-permissions-select'],
    queryFn: () => fetchPermissionRequests({ page: 1, limit: 50 }),
  });

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
      setUri(result.assets[0].uri);
      setFileName(result.assets[0].fileName ?? 'document.jpg');
    }
  };

  const upload = async () => {
    if (!uri || !permissionId) {
      Alert.alert('Missing info', 'Select a permission request and a file.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadComplianceFile(uri, fileName);
      await createComplianceDocument({
        fileUrl: uploaded.url,
        fileName,
        permissionRequestId: permissionId,
      });
      Alert.alert('Uploaded', 'Document linked to permission request.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Upload failed', apiError(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Upload Document" subtitle="Attach to a permission request" onBack={() => router.back()} />

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-medium text-gray-700">Permission Request</Text>
          {(permissions?.data ?? []).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPermissionId(p.id)}
              className="mb-2 rounded-xl border px-4 py-3 active:opacity-80"
              style={{ borderColor: permissionId === p.id ? colors.gold : '#e5e7eb', backgroundColor: permissionId === p.id ? '#fef9c3' : '#fff' }}
            >
              <Text className="font-semibold text-navy">{p.title}</Text>
              <Text className="text-xs text-gray-500">{p.type} · {p.status}</Text>
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

        <PrimaryButton
          label={uploading ? 'Uploading…' : 'Upload & Link'}
          onPress={uri && permissionId ? upload : undefined}
          loading={uploading}
        />
      </ScrollView>
    </Screen>
  );
}
