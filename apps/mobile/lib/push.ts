import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Registers this device's Expo push token with the API. Best-effort:
 * failures (permission denied, web, no project id) never block login.
 */
export async function registerPushToken() {
  if (Platform.OS === 'web') return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await api.post('/notifications/device-token', { token, platform: Platform.OS });
  } catch {
    // Push registration is optional; ignore failures.
  }
}
