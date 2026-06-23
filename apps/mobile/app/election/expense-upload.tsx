import * as React from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadElectionFile } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Card } from '../../components/ui';

export default function ExpenseUpload() {
  const router = useRouter();
  const [uri, setUri] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [url, setUrl] = React.useState('');

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      setUrl('');
    }
  };

  const upload = async () => {
    if (!uri) return;
    setUploading(true);
    try {
      const res = await uploadElectionFile(uri);
      setUrl(res.url);
      Alert.alert('Uploaded', 'Receipt URL copied — use it when adding an expense.');
    } catch (e) {
      Alert.alert('Upload failed', apiError(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Upload Receipt" subtitle="Attach expense receipt photo" onBack={() => router.back()} />

        <Card className="mb-4">
          <PrimaryButton label="Choose photo" onPress={pick} />
          {uri ? (
            <Image source={{ uri }} className="mt-4 h-48 w-full rounded-xl" resizeMode="cover" />
          ) : (
            <Text className="mt-4 text-center text-sm text-gray-500">No photo selected</Text>
          )}
        </Card>

        <View className="mb-4">
          <PrimaryButton label={uploading ? 'Uploading…' : 'Upload to server'} onPress={uri ? upload : undefined} loading={uploading} />
        </View>

        {url ? (
          <Field label="Receipt URL" value={url} onChangeText={setUrl} multiline />
        ) : null}

        <Text className="mb-10 text-center text-xs text-gray-400">
          Copy the URL above into the Add Expense form, or upload before saving.
        </Text>
      </ScrollView>
    </Screen>
  );
}
