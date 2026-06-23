import * as React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { loadDraft, saveDraft } from '../../lib/d2d-draft';

export default function D2DHousehold() {
  const router = useRouter();
  const [houseNumber, setHouseNumber] = React.useState('');
  const [headName, setHeadName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [ward, setWard] = React.useState('');

  React.useEffect(() => {
    loadDraft().then((d) => {
      if (!d) return;
      setHouseNumber(d.houseNumber ?? '');
      setHeadName(d.headName ?? '');
      setMobile(d.mobile ?? '');
      setWhatsapp(d.whatsapp ?? '');
      setAddress(d.address ?? '');
      setWard(d.ward ?? '');
    });
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const d = await loadDraft();
      if (d) {
        d.latitude = loc.coords.latitude;
        d.longitude = loc.coords.longitude;
        await saveDraft(d);
      }
    }).catch(() => undefined);
  }, []);

  const next = async () => {
    const d = await loadDraft();
    if (!d) return;
    await saveDraft({
      ...d,
      houseNumber,
      headName,
      mobile,
      whatsapp,
      address,
      ward,
    });
    router.push('/d2d/family');
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Household Details" subtitle="Capture head of family and contact" onBack={() => router.back()} />
        <Card className="gap-4">
          <Field label="House Number" value={houseNumber} onChangeText={setHouseNumber} />
          <Field label="Head of Family" value={headName} onChangeText={setHeadName} />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
          <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          <Field label="Address" value={address} onChangeText={setAddress} multiline />
          <Field label="Ward" value={ward} onChangeText={setWard} />
          <PrimaryButton label="Add Family Members" onPress={next} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
