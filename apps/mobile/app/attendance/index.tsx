import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  fetchAttendanceDashboard,
  fetchMyActiveSession,
  checkIn,
  checkOut,
  submitRoutePoints,
  resolveCadreId,
} from '../../lib/attendance';
import { useAuth } from '../../lib/auth';
import { Screen, Card, ScreenHeader, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function AttendanceMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = React.useState('');
  const [cadreId, setCadreId] = React.useState<string | null>(null);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

  React.useEffect(() => {
    resolveCadreId(user?.mobile).then(setCadreId).catch(() => undefined);
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        /* GPS optional */
      }
    }).catch(() => undefined);
  }, [user?.mobile]);

  const { data: dash } = useQuery({ queryKey: ['m-att-dash'], queryFn: fetchAttendanceDashboard });
  const { data: activeSession } = useQuery({
    queryKey: ['m-att-active', cadreId],
    queryFn: () => fetchMyActiveSession(cadreId!),
    enabled: !!cadreId,
  });

  const doCheckIn = useMutation({
    mutationFn: async () => {
      if (!cadreId) throw new Error('Cadre profile not found');
      let lat = coords?.latitude;
      let lon = coords?.longitude;
      if (lat == null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
          setCoords({ latitude: lat, longitude: lon! });
        }
      }
      return checkIn({ cadreId, latitude: lat, longitude: lon });
    },
    onSuccess: (data) => {
      setMessage(data.geoVerified ? 'Checked in — location verified' : 'Checked in — location not in geo zone');
      qc.invalidateQueries({ queryKey: ['m-att-active'] });
      qc.invalidateQueries({ queryKey: ['m-att-dash'] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const doCheckOut = useMutation({
    mutationFn: async () => {
      if (!activeSession?.id) throw new Error('No active session');
      let lat = coords?.latitude;
      let lon = coords?.longitude;
      if (lat == null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }
      return checkOut(activeSession.id, { latitude: lat, longitude: lon });
    },
    onSuccess: () => {
      setMessage('Checked out successfully');
      qc.invalidateQueries({ queryKey: ['m-att-active'] });
      qc.invalidateQueries({ queryKey: ['m-att-dash'] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const trackRoute = useMutation({
    mutationFn: async () => {
      if (!cadreId || !coords) return;
      return submitRoutePoints(cadreId, [coords]);
    },
  });

  React.useEffect(() => {
    if (!activeSession || !cadreId) return;
    const interval = setInterval(() => {
      Location.getCurrentPositionAsync({}).then((loc) => {
        const point = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCoords(point);
        submitRoutePoints(cadreId, [point]).catch(() => undefined);
      }).catch(() => undefined);
    }, 120000);
    return () => clearInterval(interval);
  }, [activeSession, cadreId]);

  return (
    <Screen>
      <ScreenHeader title="GPS Attendance" subtitle="Check-in, route tracking, and field reports" onBack={() => router.back()} />
      <View className="mt-4 flex-row flex-wrap gap-2">
        <Card className="w-[47%]">
          <Text className="text-xs text-slate-500">Today</Text>
          <Text className="text-xl font-bold text-navy">{dash?.todayCheckIns ?? 0}</Text>
        </Card>
        <Card className="w-[47%]">
          <Text className="text-xs text-slate-500">Active</Text>
          <Text className="text-xl font-bold text-navy">{dash?.activeSessions ?? 0}</Text>
        </Card>
      </View>
      {coords && (
        <Text className="mt-2 text-xs text-slate-500">
          GPS: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </Text>
      )}
      {activeSession ? (
        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold">Active session</Text>
            <Badge label={activeSession.geoVerified ? 'Verified' : 'Unverified'} color={colors.navy} />
          </View>
          <Text className="mt-1 text-sm text-slate-500">
            Since {new Date(activeSession.checkInAt).toLocaleTimeString()}
          </Text>
          <Pressable
            onPress={() => doCheckOut.mutate()}
            className="mt-3 rounded-xl bg-navy px-4 py-3"
          >
            <Text className="text-center font-semibold text-white">Check Out</Text>
          </Pressable>
        </Card>
      ) : (
        <Pressable
          onPress={() => doCheckIn.mutate()}
          className="mt-4 rounded-xl bg-gold px-4 py-3"
        >
          <Text className="text-center font-semibold" style={{ color: colors.navy }}>
            {doCheckIn.isPending ? 'Checking in…' : 'Check In'}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={() => router.push('/attendance/corrections')} className="mt-3 rounded-xl border px-4 py-3">
        <Text className="text-center font-medium" style={{ color: colors.navy }}>Request Correction</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/attendance/field-report')} className="mt-2 rounded-xl border px-4 py-3">
        <Text className="text-center font-medium" style={{ color: colors.navy }}>Submit Field Report</Text>
      </Pressable>
      {message ? <Text className="mt-3 text-green-600">{message}</Text> : null}
      {trackRoute.isPending ? <Text className="mt-1 text-xs text-slate-400">Syncing route…</Text> : null}
    </Screen>
  );
}
