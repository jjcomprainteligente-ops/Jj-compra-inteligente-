import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** Complements Modal's own focus trap; never replaces it or steals valid focus. */
export function useSheetFocus<T extends { focus(): void }>(visible: boolean, title: string) {
  const dialogRef = useRef<T>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const visibleRef = useRef(visible);
  const restoreFrame = useRef<number | null>(null);

  useLayoutEffect(() => {
    visibleRef.current = visible;
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
    restoreFrame.current = null;
    if (!visible) {
      // The closed layout cleanup runs before a newly mounted input autofocuses.
      return () => {
        const active = document.activeElement;
        const dialog = dialogRef.current;
        if (!(dialog instanceof HTMLElement && active && dialog.contains(active))) {
          openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
        }
      };
    }
  }, [visible]);

  useEffect(() => {
    // A step change can unmount the focused input. Recover only that lost focus.
    if (visible && Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement === document.body) {
      dialogRef.current?.focus();
    }
  }, [visible, title]);

  const onDismiss = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
    // Wait for Modal's cleanup/animation. Its normal restoration takes precedence.
    restoreFrame.current = requestAnimationFrame(() => {
      restoreFrame.current = null;
      const opener = openerRef.current;
      if (!visibleRef.current && document.activeElement === document.body && opener?.isConnected &&
        !opener.matches(':disabled, [aria-disabled="true"]')) {
        opener.focus({ preventScroll: true });
      }
    });
  }, []);

  useEffect(() => () => {
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
  }, []);

  return { dialogRef, onDismiss };
}
