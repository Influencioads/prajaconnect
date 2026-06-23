const FALLBACK_API_URL = 'http://localhost:4000/api';

// EXPO_PUBLIC_API_URL must point at the dev PC, not the device.
//   • Android emulator: http://10.0.2.2:4000/api   (10.0.2.2 == host loopback, stable)
//   • Physical phone:   http://<your-PC-LAN-IP>:4000/api  (e.g. http://192.168.1.18:4000/api)
// 'localhost' resolves to the device itself, so it only works for web.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_URL;

if (__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    `[config] EXPO_PUBLIC_API_URL is not set — falling back to ${FALLBACK_API_URL}. ` +
      'API calls from a device/emulator will fail. Set it in apps/mobile/.env.',
  );
}
