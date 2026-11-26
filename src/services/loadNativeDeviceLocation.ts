import type { NativeLocationAdapter } from './deviceLocation';

/** The native module is loaded only after the explicit location button. */
export async function loadNativeDeviceLocation(): Promise<NativeLocationAdapter> {
  const location = await import('expo-location');
  return {
    requestForegroundPermission: async () => (await location.requestForegroundPermissionsAsync()).granted,
    getHighAccuracyPosition: () => location.getCurrentPositionAsync({
      accuracy: location.Accuracy.High, mayShowUserSettingsDialog: false,
    }),
  };
}
