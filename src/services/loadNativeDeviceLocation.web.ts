import type { NativeLocationAdapter } from './deviceLocation';

/** Metro selects this file for web, excluding the native location module. */
export async function loadNativeDeviceLocation(): Promise<NativeLocationAdapter> {
  throw new Error('unavailable');
}
