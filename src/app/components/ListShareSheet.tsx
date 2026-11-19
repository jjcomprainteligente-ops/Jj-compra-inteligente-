import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Check, Download, Share2 } from 'lucide-react-native';
import { ListSharingError, prepareListShare } from '../../domain/listSharing';
import type { ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { translateIngredientName } from '../../i18n/recipes';
import { canShareListText, createListShareDelivery, ListShareDeliveryError } from '../listShareDelivery';
import { Button, Notice, Sheet, c, ui } from './ui';

interface Props {
  /** The caller owns a detached snapshot, rather than a live mutable list. */
  list: ShoppingList;
  onClose(): void;
  onBusyChange?(busy: boolean): void;
}

export function ListShareSheet({ list, onClose, onBusyChange }: Props) {
  const { t, formatNumber, formatQuantity, unitLabel } = useI18n();
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [operation, setOperation] = useState<'share' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'shared' | 'cancelled' | 'downloadStarted' | null>(null);
  const [canShare] = useState(canShareListText);
  const delivery = useRef<ReturnType<typeof createListShareDelivery> | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const busyCallback = useRef(onBusyChange);
  const busy = operation !== null;

  useEffect(() => { busyCallback.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    const controller = createListShareDelivery();
    delivery.current = controller;
    return () => {
      mounted.current = false;
      controller.dispose();
      if (delivery.current === controller) delivery.current = null;
      busyCallback.current?.(false);
    };
  }, []);

  const preview = useMemo(() => {
    try {
      return { value: prepareListShare(list, includeCompleted, {
        t, formatQuantity, unitLabel, translateName: name => translateIngredientName(name, t),
      }), error: null };
    } catch (failure) {
      return { value: null, error: failure instanceof ListSharingError ? failure.key : 'listSharing.error.invalid' };
    }
  }, [list, includeCompleted, t, formatQuantity, unitLabel]);

  const close = () => { if (!locked.current) onClose(); };
  const deliver = async (kind: 'share' | 'download') => {
    if (locked.current || !preview.value || !delivery.current || !mounted.current) return;
    locked.current = true;
    setOperation(kind);
    setResult(null);
    setError(null);
    busyCallback.current?.(true);
    // The immutable string is exactly the text currently displayed for review.
    const reviewedText = preview.value.text;
    try {
      // No asynchronous preparation precedes Web Share's user-gesture call.
      const outcome = kind === 'share'
        ? await delivery.current.share(reviewedText)
        : delivery.current.download(reviewedText);
      if (mounted.current) setResult(outcome === 'download-started' ? 'downloadStarted' : outcome);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof ListShareDeliveryError || failure instanceof ListSharingError
        ? failure.key : 'listSharing.error.failed');
    } finally {
      locked.current = false;
      if (mounted.current) {
        setOperation(null);
        busyCallback.current?.(false);
      }
    }
  };

  return <Sheet visible title={t('listSharing.title')} subtitle={t('listSharing.subtitle')}
    testID="list-share-sheet" busy={busy} onClose={close}
    footer={<View style={styles.actions}>
      <Button label={t('listSharing.shareAction')} icon={Share2} testID="list-share-send"
        disabled={!preview.value || !canShare || busy} busy={operation === 'share'} onPress={() => { void deliver('share'); }} />
      {Platform.OS === 'web' && <Button secondary label={t('listSharing.downloadAction')} icon={Download}
        testID="list-share-download" disabled={!preview.value || busy} busy={operation === 'download'} onPress={() => { void deliver('download'); }} />}
      <Button secondary label={t('listSharing.closeAction')} icon={ArrowLeft} testID="list-share-close" disabled={busy} onPress={close} />
    </View>}>
    <Notice title={t('listSharing.privacyTitle')} text={t('listSharing.privacyBody')} />
    <Text style={[ui.note, styles.paragraph]}>{t('listSharing.noSync')}</Text>
    <Pressable testID="list-share-include-completed" accessibilityRole="checkbox"
      accessibilityLabel={t('listSharing.includeCompleted')} accessibilityState={{ checked: includeCompleted, disabled: busy }}
      aria-checked={includeCompleted} disabled={busy} style={styles.option} onPress={() => {
        if (locked.current) return;
        setIncludeCompleted(previous => !previous); setError(null); setResult(null);
      }}>
      <View style={[styles.checkbox, includeCompleted && styles.checked]}>{includeCompleted && <Check color={c.surface} size={18} />}</View>
      <Text style={[ui.body, styles.optionText]}>{t('listSharing.includeCompleted')}</Text>
    </Pressable>
    {preview.value && <>
      <Text accessibilityRole="header" style={[ui.strong, styles.paragraph]}>{t('listSharing.reviewTitle')}</Text>
      <Text style={[ui.note, styles.paragraph]}>{t('listSharing.selectionCount', { count: formatNumber(preview.value.itemCount) })}</Text>
      <View style={styles.preview}><Text selectable testID="list-share-preview" style={ui.body}>{preview.value.text}</Text></View>
    </>}
    {preview.error === 'listSharing.error.empty' && <Notice title={t('listSharing.emptyTitle')} text={t('listSharing.emptyBody')} />}
    {preview.error && preview.error !== 'listSharing.error.empty' && <View testID="list-share-error"><Notice kind="error" title={t('listSharing.errorTitle')} text={t(preview.error)} /></View>}
    {error && <View testID="list-share-error"><Notice kind="error" title={t('listSharing.errorTitle')} text={t(error)} /></View>}
    {!canShare && Platform.OS === 'web' && <View style={styles.paragraph}><Notice title={t('listSharing.unavailableTitle')} text={t('listSharing.unavailableBody')} /></View>}
    {result && <View testID="list-share-result" style={styles.paragraph}>
      <Notice title={t('listSharing.feedbackTitle')} text={t('listSharing.' + result)} />
    </View>}
  </Sheet>;
}

const styles = StyleSheet.create({
  actions: { gap: 9 }, paragraph: { marginBottom: 16 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  optionText: { flex: 1, minWidth: 0 }, checkbox: { width: 25, height: 25, borderWidth: 1, borderColor: c.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary }, preview: { padding: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.background, borderRadius: 13, marginBottom: 18 },
});
