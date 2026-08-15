import * as React from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
          <Text className="mb-2 text-sm font-semibold text-ink">Permission Request</Text>
          {(permissions?.data ?? []).map((p) => {
            const selected = permissionId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPermissionId(p.id)}
                className="mb-2 flex-row items-center rounded-2xl border px-4 py-3 active:opacity-80"
                style={{
                  borderColor: selected ? colors.gold : colors.border,
                  backgroundColor: selected ? colors.goldSoft : colors.white,
                }}
              >
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-ink">{p.title}</Text>
                  <Text className="text-xs text-faint">{p.type} · {p.status}</Text>
                </View>
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
          label={uploading ? 'Uploading…' : 'Upload & Link'}
          onPress={uri && permissionId ? upload : undefined}
          loading={uploading}
          icon="cloud-upload"
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
