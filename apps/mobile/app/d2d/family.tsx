import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader, Card, PrimaryButton, Field, ListRow } from '../../components/ui';
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
          <ListRow key={i} avatar title={m.name} subtitle={`Age ${m.age} · Voter ${m.voterId ?? '—'}`} />
        ))}

        <Card className="mt-2 gap-3">
          <Field label="Name" value={name} onChangeText={setName} icon="person" />
          <Field label="Age" value={age} onChangeText={setAge} keyboardType="numeric" icon="calendar" />
          <Field label="Voter ID" value={voterId} onChangeText={setVoterId} icon="id-card" />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" icon="call" />
          <PrimaryButton label="Add Member" icon="person-add" variant="outline" onPress={addMember} />
        </Card>

        <View className="mt-4">
          <PrimaryButton label="Continue to Questions" onPress={continueNext} />
        </View>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
