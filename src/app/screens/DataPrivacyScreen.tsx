import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Download, ShieldCheck, Trash2 } from 'lucide-react-native';
import {
  PrivacyError, type PreparedDeletion, type PrivacyInventoryEntry, type PrivacyScope,
} from '../../domain/dataPrivacy';
import { useI18n } from '../../i18n/LanguageProvider';
import { deletePrepared, loadPrivacyInventory, prepareDeletion, readLocalBackup } from '../../storage/dataPrivacy';
import { BackupDeliveryError, createBackupDelivery, type BackupDeliveryResult } from '../backupDelivery';
import { Button, Card, Field, Notice, Pill, Section, Sheet, Title, c, ui } from '../components/ui';

export interface DataPrivacyScreenProps {
  busy: boolean;
  onBusyChange(busy: boolean): void;
  onDeleted(scope: PrivacyScope): Promise<void>;
  onBack(): void;
}

interface DeleteSession { prepared: PreparedDeletion; step: 'review' | 'confirm' }
interface DeletedFeedback { scope: PrivacyScope; count: number }
type Operation = 'reload' | 'export-all' | `export-${PrivacyScope}` | `prepare-${PrivacyScope}` | `delete-${PrivacyScope}`;

/** Explicit, local data controls. Merely opening this screen only reads counts. */
export function DataPrivacyScreen({ busy: parentBusy, onBusyChange, onDeleted }: DataPrivacyScreenProps) {
  const { t, formatNumber, translateError } = useI18n();
  const [inventory, setInventory] = useState<PrivacyInventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [errorContext, setErrorContext] = useState<'export' | 'delete' | 'inventory'>('export');
  const [operation, setOperation] = useState<Operation | null>(null);
  const [exported, setExported] = useState<BackupDeliveryResult | null>(null);
  const [deleted, setDeleted] = useState<DeletedFeedback | null>(null);
  const [session, setSession] = useState<DeleteSession | null>(null);
  const [word, setWord] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [modalError, setModalError] = useState<unknown>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const operationLock = useRef(false);
  const mounted = useRef(false);
  const inventoryGeneration = useRef(0);
  const delivery = useRef<ReturnType<typeof createBackupDelivery> | null>(null);
  const busyCallback = useRef(onBusyChange);
  busyCallback.current = onBusyChange;
  const busy = parentBusy || operation !== null;

  const errorText = (failure: unknown) => {
    if (failure instanceof PrivacyError || failure instanceof BackupDeliveryError) return t(failure.key);
    if (typeof failure === 'string' && failure.startsWith('privacy.')) return t(failure);
    return translateError(failure);
  };
  const scopeName = (scope: PrivacyScope) => t(`privacy.scope.${scope}`);

  const refreshInventory = useCallback(async () => {
    const generation = ++inventoryGeneration.current;
    if (mounted.current) { setLoading(true); setInventoryError(null); }
    try {
      const loaded = await loadPrivacyInventory();
      if (mounted.current && generation === inventoryGeneration.current) setInventory(loaded);
    } catch (failure) {
      if (mounted.current && generation === inventoryGeneration.current) setInventoryError(failure);
    } finally {
      if (mounted.current && generation === inventoryGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // A fresh owner per effect setup also supports Strict Mode's setup/cleanup
    // replay; a disposed delivery object is never reused by the next setup.
    const ownedDelivery = createBackupDelivery();
    delivery.current = ownedDelivery;
    void refreshInventory();
    return () => {
      mounted.current = false;
      inventoryGeneration.current++;
      ownedDelivery.dispose();
      if (delivery.current === ownedDelivery) delivery.current = null;
      busyCallback.current(false);
    };
  }, [refreshInventory]);

  const run = async (kind: Operation, action: () => Promise<void>) => {
    if (parentBusy || operationLock.current || !mounted.current) return;
    operationLock.current = true;
    setOperation(kind);
    busyCallback.current(true);
    try { await action(); }
    finally {
      operationLock.current = false;
      if (mounted.current) {
        setOperation(null);
        busyCallback.current(false);
      }
    }
  };

  const exportData = (scope?: PrivacyScope) => {
    void run(scope ? `export-${scope}` : 'export-all', async () => {
      setError(null); setErrorContext('export'); setExported(null);
      try {
        const backup = await readLocalBackup(scope);
        if (!mounted.current || !delivery.current) return;
        const result = await delivery.current.deliver(backup, t('privacy.exportFeedbackTitle'));
        if (mounted.current) setExported(result);
      } catch (failure) { if (mounted.current) setError(failure); }
    });
  };

  const reviewDeletion = (scope: PrivacyScope, reopening = false) => {
    void run(`prepare-${scope}`, async () => {
      if (reopening) setModalError(null);
      else { setError(null); setErrorContext('delete'); setDeleted(null); }
      try {
        const prepared = await prepareDeletion(scope);
        if (!mounted.current) return;
        setSession({ prepared, step: 'review' });
        setWord(''); setAcknowledged(false); setReviewRequired(false); setModalError(null);
      } catch (failure) {
        if (!mounted.current) return;
        if (reopening) { setModalError(failure); setReviewRequired(true); }
        else setError(failure);
      }
    });
  };

  const close = () => {
    if (busy || operationLock.current) return;
    setSession(null); setWord(''); setAcknowledged(false); setModalError(null); setReviewRequired(false);
  };

  const confirmWord = t('privacy.confirmWord');
  const confirmed = acknowledged && word === confirmWord;
  const confirmDeletion = () => {
    if (!session || session.step !== 'confirm' || !confirmed || reviewRequired) return;
    const reviewed = session.prepared;
    void run(`delete-${reviewed.scope}`, async () => {
      setModalError(null); setError(null); setErrorContext('delete'); setDeleted(null);
      let committed = false;
      try {
        const result = await deletePrepared(reviewed, { confirmed: true });
        committed = true;
        if (mounted.current) {
          setSession(null); setWord(''); setAcknowledged(false); setReviewRequired(false);
          setDeleted(result);
        }
        try { await onDeleted(result.scope); }
        catch {
          if (mounted.current) { setErrorContext('inventory'); setError('privacy.reloadAfterDelete'); }
        }
        await refreshInventory();
      } catch (failure) {
        if (!mounted.current) return;
        if (committed) setError(failure);
        else {
          // An uncertain write is not described as "nothing was deleted".
          // Keep the draft and require an explicit new review before retrying.
          setModalError(failure); setReviewRequired(true);
        }
      }
    });
  };

  const countLabel = (entry: PrivacyInventoryEntry) => !entry.valid || entry.count === null ? t('privacy.unreadable')
    : entry.count === 0 ? t('privacy.empty')
      : t(entry.count === 1 ? 'privacy.entryCount.one' : 'privacy.entryCount.other', { count: formatNumber(entry.count) });

  return <View style={ui.page} testID="privacy-screen">
    <Title kicker="" title={t('privacy.title')} subtitle={t('privacy.subtitle')} />
    <Pill label={t('privacy.localOnly')} />
    <Card style={styles.exportCard}>
      <View style={styles.heading}><ShieldCheck color={c.primary} size={22} /><Text accessibilityRole="header" style={[ui.strong, styles.flex]}>{t('privacy.exportTitle')}</Text></View>
      <Text style={[ui.note, styles.paragraph]}>{t('privacy.exportHelp')}</Text>
      <Text style={[ui.note, styles.paragraph]}>{t('privacy.privateFileNotice')}</Text>
      {Platform.OS !== 'web' && <Text style={[ui.note, styles.paragraph]}>{t('privacy.nativeHelp')}</Text>}
      <Button label={t('privacy.exportAll')} icon={Download} accent testID="privacy-export-all"
        disabled={busy} busy={operation === 'export-all'} onPress={() => exportData()} />
    </Card>

    {exported && <View testID="privacy-export-result"><Notice title={t('privacy.exportFeedbackTitle')}
      kind={exported === 'cancelled' ? 'info' : 'success'}
      text={t(exported === 'download-started' ? 'privacy.downloadStarted' : exported === 'shared' ? 'privacy.shared' : 'privacy.exportCancelled')} /></View>}
    {!!error && <Notice kind="error" title={t(errorContext === 'export' ? 'privacy.exportFailureTitle' : errorContext === 'delete' ? 'privacy.deleteErrorTitle' : 'privacy.inventoryError')} text={errorText(error)} />}
    {deleted && <View testID="privacy-delete-result"><Notice kind="success" title={t('privacy.deleteSuccessTitle')}
      text={t('privacy.deleteSuccess', { scope: scopeName(deleted.scope), count: formatNumber(deleted.count) })} /></View>}

    <Section title={t('privacy.scopesTitle')} />
    <Text style={[ui.note, { marginBottom: 16 }]}>{t('privacy.retained')}</Text>
    {loading && <View style={styles.loading} accessibilityRole="status"><ActivityIndicator color={c.primary} /><Text style={[ui.note, styles.flex]}>{t('privacy.loading')}</Text></View>}
    {!!inventoryError && <Notice kind="error" title={t('privacy.inventoryError')} text={errorText(inventoryError)} />}
    {!loading && inventory.map(entry => <Card key={entry.scope} style={styles.scopeCard}>
      <Text accessibilityRole="header" style={ui.strong}>{scopeName(entry.scope)}</Text>
      <Text testID={`privacy-scope-count-${entry.scope}`} style={[ui.note, styles.paragraph]}>{countLabel(entry)}</Text>
      {!entry.valid && <Text style={[ui.note, styles.paragraph]}>{t('privacy.notDeletable')}</Text>}
      <View style={styles.actions}>
        <View style={styles.action}><Button secondary icon={Download} label={t('privacy.exportScope', { scope: scopeName(entry.scope) })}
          testID={`privacy-export-${entry.scope}`} disabled={busy} busy={operation === `export-${entry.scope}`} onPress={() => exportData(entry.scope)} /></View>
        <View style={styles.action}><Button danger icon={Trash2} label={t('privacy.deleteScope', { scope: scopeName(entry.scope) })}
          testID={`privacy-delete-${entry.scope}`} disabled={busy || !entry.valid || entry.count === 0 || entry.count === null}
          busy={operation === `prepare-${entry.scope}`} onPress={() => reviewDeletion(entry.scope)} /></View>
      </View>
    </Card>)}
    <Button secondary label={t('privacy.reload')} testID="privacy-reload" disabled={busy || loading}
      onPress={() => { void run('reload', refreshInventory); }} />

    <Sheet visible={!!session} busy={busy} testID="privacy-delete-dialog" onClose={close}
      title={t(session?.step === 'confirm' ? 'privacy.confirmTitle' : 'privacy.reviewTitle')}
      footer={session ? <>
        {reviewRequired ? <Button secondary label={t('privacy.reviewAgain')} testID="privacy-delete-review-again" disabled={busy}
          onPress={() => reviewDeletion(session.prepared.scope, true)} /> : session.step === 'review'
          ? <Button label={t('privacy.reviewNext')} testID="privacy-delete-review-next" disabled={busy} onPress={() => {
            if (!busy && !operationLock.current) setSession({ ...session, step: 'confirm' });
          }} />
          : <Button danger icon={Trash2} label={t('privacy.confirmDelete')} testID="privacy-delete-confirm" busy={operation === `delete-${session.prepared.scope}`}
            disabled={busy || !confirmed} onPress={confirmDeletion} />}
        <Button secondary label={t('privacy.cancel')} testID="privacy-delete-cancel" disabled={busy} onPress={close} />
      </> : undefined}>
      {session && <>
        {!!modalError && <Notice kind="error" title={t('privacy.deleteErrorTitle')} text={errorText(modalError)} />}
        <Text style={ui.body}>{t('privacy.reviewBody', { scope: scopeName(session.prepared.scope) })}</Text>
        <Text style={[ui.strong, styles.paragraph]}>{t('privacy.reviewCount', { count: formatNumber(session.prepared.count) })}</Text>
        <View style={{ marginTop: 16 }}><Notice kind="warning" title={t('privacy.deleteTitle')} text={t('privacy.reviewInstructions')} /></View>
        {session.step === 'confirm' && <>
          <Field label={t('privacy.wordLabel', { word: confirmWord })} hint={t('privacy.wordHint')}
            testID="privacy-delete-word" value={word} maxLength={32} autoCapitalize="characters" autoCorrect={false}
            editable={!busy && !reviewRequired} onChangeText={setWord} />
          <Pressable testID="privacy-delete-ack" accessibilityRole="checkbox" accessibilityLabel={t('privacy.acknowledge')}
            accessibilityState={{ checked: acknowledged, disabled: busy || reviewRequired }} aria-checked={acknowledged}
            disabled={busy || reviewRequired} onPress={() => setAcknowledged(previous => !previous)} style={styles.acknowledgement}>
            <View style={[styles.checkbox, acknowledged && styles.checkboxSelected]}>{acknowledged && <Check size={18} color={c.surface} />}</View>
            <Text style={[ui.body, styles.flex]}>{t('privacy.acknowledge')}</Text>
          </Pressable>
          {!reviewRequired && <Button secondary label={t('privacy.backToReview')} testID="privacy-delete-back" disabled={busy}
            onPress={() => { if (!busy && !operationLock.current) setSession({ ...session, step: 'review' }); }} />}
        </>}
      </>}
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  exportCard: { marginTop: 18, marginBottom: 16, backgroundColor: c.soft, gap: 6 },
  heading: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  paragraph: { marginTop: 8, marginBottom: 10 },
  scopeCard: { marginBottom: 14 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  actions: { gap: 10 },
  action: { minWidth: 0, width: '100%' },
  acknowledgement: { minHeight: 54, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, marginBottom: 16 },
  checkbox: { width: 28, height: 28, borderWidth: 1.5, borderColor: c.muted, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: c.primary, backgroundColor: c.primary },
});
