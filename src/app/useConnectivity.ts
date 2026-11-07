import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** The browser flag describes connectivity hints, never reachability of a service. */
export function useConnectivity(): { online: boolean | null } {
  const readOnline = (): boolean | null => Platform.OS === 'web' && typeof navigator !== 'undefined'
    && typeof navigator.onLine === 'boolean' ? navigator.onLine : null;
  const [online, setOnline] = useState<boolean | null>(readOnline);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const update = () => setOnline(readOnline());
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return { online };
}
