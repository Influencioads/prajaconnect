import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, View } from 'react-native';
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
import { Screen, Card, ScreenHeader, Badge, KpiTile, PrimaryButton } from '../../components/ui';
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
      <View className="flex-row gap-3">
        <KpiTile label="Today's check-ins" value={dash?.todayCheckIns ?? 0} accent={colors.success} icon="finger-print" />
        <KpiTile label="Active sessions" value={dash?.activeSessions ?? 0} accent={colors.info} icon="radio" />
      </View>
      {coords && (
        <Text className="text-xs text-muted">
          GPS: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </Text>
      )}
      {activeSession ? (
        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-ink">Active session</Text>
            <Badge
              label={activeSession.geoVerified ? 'Verified' : 'Unverified'}
              color={activeSession.geoVerified ? colors.success : colors.warning}
              dot
            />
          </View>
          <Text className="mt-1 text-sm text-muted">
            Since {new Date(activeSession.checkInAt).toLocaleTimeString()}
          </Text>
          <PrimaryButton
            className="mt-3"
            label="Check Out"
            icon="log-out"
            loading={doCheckOut.isPending}
            onPress={() => doCheckOut.mutate()}
          />
        </Card>
      ) : (
        <PrimaryButton
          className="mt-4"
          label="Check In"
          icon="finger-print"
          variant="gold"
          loading={doCheckIn.isPending}
          onPress={() => doCheckIn.mutate()}
        />
      )}
      <PrimaryButton
        className="mt-3"
        label="Request Correction"
        icon="create"
        variant="outline"
        onPress={() => router.push('/attendance/corrections')}
      />
      <PrimaryButton
        className="mt-2"
        label="Submit Field Report"
        icon="document-text"
        variant="outline"
        onPress={() => router.push('/attendance/field-report')}
      />
      {message ? <Text className="mt-3 font-medium" style={{ color: colors.success }}>{message}</Text> : null}
      {trackRoute.isPending ? <Text className="mt-1 text-xs text-faint">Syncing route…</Text> : null}
    </Screen>
  );
}
