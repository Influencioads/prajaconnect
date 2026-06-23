import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { FamilyMemberDraft, loadDraft, saveDraft } from '../../lib/d2d-draft';

export default function D2DFamily() {
  const router = useRouter();
  const [members, setMembers] = React.useState<FamilyMemberDraft[]>([]);
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [voterId, setVoterId] = React.useState('');
  const [mobile, setMobile] = React.useState('');

  React.useEffect(() => {
    loadDraft().then((d) => d && setMembers(d.members));
  }, []);

  const addMember = async () => {
    if (!name.trim()) return;
    const next = [...members, { name, age, voterId, mobile }];
    setMembers(next);
    const d = await loadDraft();
    if (d) await saveDraft({ ...d, members: next });
    setName('');
    setAge('');
    setVoterId('');
    setMobile('');
  };

  const continueNext = async () => {
    router.push('/d2d/questions');
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Family Members" subtitle="Map voters in the household" onBack={() => router.back()} />

        {members.map((m, i) => (
          <Card key={i} className="mb-2">
            <Text className="font-semibold text-navy">{m.name}</Text>
            <Text className="text-xs text-gray-500">Age {m.age} · Voter {m.voterId ?? '—'}</Text>
          </Card>
        ))}

        <Card className="mt-2 gap-3">
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
          <Field label="Voter ID" value={voterId} onChangeText={setVoterId} />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
          <Pressable onPress={addMember} className="h-11 items-center justify-center rounded-xl border border-navy">
            <Text className="font-semibold text-navy">+ Add Member</Text>
          </Pressable>
        </Card>

        <View className="mt-4">
          <PrimaryButton label="Continue to Questions" onPress={continueNext} />
        </View>
      </ScrollView>
    </Screen>
  );
}
