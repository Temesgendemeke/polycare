import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, useNotifications } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';
import { useReminderStore, useMedicationStore } from '../../store';
import { isToday } from '../../store/reminderStore';
import { syncReminderToSlot } from '../../lib/doseSync';
import { Reminder } from '../../types';

export const formatTime12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${period}`;
};

export const splitTo12Hour = (time24?: string): { displayTime: string; period: 'AM' | 'PM' } => {
  if (!time24) return { displayTime: '8:00', period: 'AM' };
  const parts = time24.split(':');
  if (parts.length < 2) return { displayTime: time24, period: 'AM' };
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return { displayTime: `${hours}:${minutes}`, period };
};

export const parseTo24Hour = (timeInput: string, ampm: 'AM' | 'PM' = 'AM'): string | null => {
  const trimmed = timeInput.trim().toUpperCase();
  const matchWithPeriod = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (matchWithPeriod) {
    let hours = parseInt(matchWithPeriod[1], 10);
    const minutes = parseInt(matchWithPeriod[2], 10);
    const period = matchWithPeriod[3].toUpperCase();
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const matchSimple = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (matchSimple) {
    let hours = parseInt(matchSimple[1], 10);
    const minutes = parseInt(matchSimple[2], 10);
    if (minutes < 0 || minutes > 59) return null;

    if (hours >= 1 && hours <= 12) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  const matchHourOnly = trimmed.match(/^(\d{1,2})$/);
  if (matchHourOnly) {
    let hours = parseInt(matchHourOnly[1], 10);
    if (hours >= 1 && hours <= 12) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:00`;
    }
  }

  return null;
};

export default function RemindersScreen() {
  const { t } = useTranslation();
  const DAY_NAMES = [t('reminders.sun'), t('reminders.mon'), t('reminders.tue'), t('reminders.wed'), t('reminders.thu'), t('reminders.fri'), t('reminders.sat')];
  const PRESET_TIMES = [
    { label: t('reminders.morning'), displayTime: '8:00', ampm: 'AM' as const, time24: '08:00' },
    { label: t('reminders.noon'), displayTime: '12:00', ampm: 'PM' as const, time24: '12:00' },
    { label: t('reminders.evening'), displayTime: '6:00', ampm: 'PM' as const, time24: '18:00' },
    { label: t('reminders.bedtime'), displayTime: '9:00', ampm: 'PM' as const, time24: '21:00' },
  ];
  const { medications, prescribedMeds } = useMedicationStore();
  const {
    reminders,
    addReminder,
    updateReminder,
    toggleReminder,
    deleteReminder,
    markAsTaken,
    toggleTaken,
    snoozeReminder,
  } = useReminderStore();

  const { permission, requestPermissions, sendTestNotification } = useNotifications();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form State
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [timeStr, setTimeStr] = useState('8:00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dosage, setDosage] = useState('');

  const allMeds = useMemo(() => {
    const list: { id: string; name: string; dosage?: string; unit?: string }[] = [];
    const seen = new Set<string>();
    for (const m of [...(prescribedMeds || []), ...(medications || [])]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push({
          id: m.id,
          name: m.name,
          dosage: m.dosage ? `${m.dosage} ${m.unit || 'mg'}` : undefined,
        });
      }
    }
    return list;
  }, [medications, prescribedMeds]);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.time.localeCompare(b.time);
      }),
    [reminders]
  );

  const medName = (medicationId: string) =>
    allMeds.find((m) => m.id === medicationId)?.name || medicationId;

  const openAddModal = () => {
    setEditingReminder(null);
    const firstMed = allMeds[0];
    setSelectedMedId(firstMed?.id || '');
    setCustomTitle(firstMed?.name || '');
    setTimeStr('8:00');
    setAmpm('AM');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setDosage(firstMed?.dosage || '');
    setModalVisible(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setSelectedMedId(reminder.medicationId);
    setCustomTitle(reminder.title || '');
    const { displayTime, period } = splitTo12Hour(reminder.time);
    setTimeStr(displayTime);
    setAmpm(period);
    setSelectedDays(reminder.days.length > 0 ? reminder.days : [0, 1, 2, 3, 4, 5, 6]);
    setDosage(reminder.dosage || '');
    setModalVisible(true);
  };

  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) {
        Alert.alert(t('common.notice'), t('reminders.atLeastOneDay'));
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const toggleSelectAllDays = () => {
    if (selectedDays.length === 7) {
      setSelectedDays([1, 2, 3, 4, 5]); // Weekdays default
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  const handleSaveReminder = async () => {
    const formatted24 = parseTo24Hour(timeStr, ampm);
    if (!formatted24) {
      Alert.alert(t('reminders.invalidTime'), t('reminders.invalidTimeMsg'));
      return;
    }

    const title = customTitle.trim() || medName(selectedMedId) || t('reminders.medicationFallback');

    if (editingReminder) {
      await updateReminder(
        editingReminder.id,
        {
          medicationId: selectedMedId,
          title,
          time: formatted24,
          days: selectedDays,
          dosage: dosage.trim() || undefined,
        },
        title
      );
    } else {
      await addReminder(
        {
          id: Date.now().toString(),
          medicationId: selectedMedId || 'custom',
          title,
          time: formatted24,
          days: selectedDays,
          enabled: true,
          dosage: dosage.trim() || undefined,
        },
        title
      );
    }

    setModalVisible(false);
  };

  const handleTestNotification = async () => {
    const res = await sendTestNotification(
      '💊 PolyCare Test Reminder',
      'Your medication reminders are configured and working properly!'
    );
    if (res) {
      Alert.alert(t('common.success'), t('reminders.testScheduled'));
    } else {
      Alert.alert(
        t('reminders.permissionRequired'),
        t('reminders.permissionMsg')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('reminders.title')}</Text>
          <Text style={styles.subtitle}>{t('reminders.subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* Permission alert if not granted */}
      {!permission && (
        <TouchableOpacity style={styles.permBanner} onPress={requestPermissions}>
          <Ionicons name="notifications-outline" size={20} color={Colors.accentDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.permBannerTitle}>{t('reminders.enableNotif')}</Text>
            <Text style={styles.permBannerSub}>{t('reminders.enableHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.accentDark} />
        </TouchableOpacity>
      )}

      {/* Stats and Test action */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{reminders.filter((r) => r.enabled).length}</Text>
          <Text style={styles.statLabel}>{t('common.active')}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{reminders.length}</Text>
          <Text style={styles.statLabel}>{t('common.total')}</Text>
        </View>
        <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
          <Ionicons name="flash-outline" size={16} color={Colors.primary} />
          <Text style={styles.testBtnText}>Test Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Reminders List */}
      {sortedReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>{t('reminders.emptyTitle')}</Text>
          <Text style={styles.emptySubtext}>
            {t('reminders.emptyHint')}
          </Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={openAddModal}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.createFirstBtnText}>{t('reminders.createReminder')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedReminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.reminderCard, !item.enabled && styles.reminderCardDisabled]}>
              <View style={styles.reminderLeft}>
                <TouchableOpacity
                  onPress={() => toggleReminder(item.id, item.title || medName(item.medicationId))}
                  style={styles.iconCircle}
                >
                  <Ionicons
                    name={item.enabled ? 'notifications' : 'notifications-off-outline'}
                    size={20}
                    color={item.enabled ? Colors.primary : Colors.textLight}
                  />
                </TouchableOpacity>

                <View style={styles.reminderInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.reminderTitle, !item.enabled && styles.textMuted]}>
                      {item.title || medName(item.medicationId)}
                    </Text>
                    {item.dosage && <Text style={styles.dosePill}>{item.dosage}</Text>}
                  </View>

                  <View style={styles.timeRow}>
                    <Ionicons name="time" size={14} color={Colors.primary} />
                    <Text style={styles.reminderTimeText}>{item.time}</Text>
                    <Text style={styles.daysText}>
                      • {item.days.length === 7
                        ? t('reminders.everyday')
                        : item.days.length === 0
                        ? t('reminders.everyday')
                        : item.days.sort().map((d) => DAY_NAMES[d]).join(', ')}
                    </Text>
                  </View>

                  {isToday(item.lastTaken) && (
                    <Text style={styles.lastTaken}>
                      ✓ {t('reminders.takenToday')} ({new Date(item.lastTaken!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.reminderActions}>
                {item.enabled && (
                  <TouchableOpacity
                    style={styles.takenButton}
                    onPress={async () => {
                      const wasTaken = isToday(item.lastTaken);
                      await toggleTaken(item.id);
                      syncReminderToSlot(item);
                      if (!wasTaken) {
                        Alert.alert(t('reminders.recorded'), t('reminders.markedTaken', { name: item.title || medName(item.medicationId) }));
                      }
                    }}
                  >
                    <Ionicons
                      name={isToday(item.lastTaken) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={26}
                      color={isToday(item.lastTaken) ? Colors.success : Colors.textLight}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => {
                    Alert.alert(
                      t('reminders.deleteTitle'),
                      t('reminders.deleteMsg', { name: item.title || medName(item.medicationId) }),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => deleteReminder(item.id) },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add / Edit Reminder Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingReminder ? t('reminders.editReminder') : t('reminders.newReminder')}
            </Text>
            <TouchableOpacity onPress={handleSaveReminder}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Medication Selector */}
            <Text style={styles.fieldLabel}>{t('reminders.selectMedication')}</Text>
            {allMeds.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {allMeds.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.medChip, selectedMedId === m.id && styles.medChipSelected]}
                    onPress={() => {
                      setSelectedMedId(m.id);
                      setCustomTitle(m.name);
                      if (m.dosage) setDosage(m.dosage);
                    }}
                  >
                    <Text style={[styles.medChipText, selectedMedId === m.id && styles.medChipTextSelected]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>{t('reminders.reminderName')}</Text>
            <TextInput
              style={styles.input}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder={t('reminders.reminderNamePh')}
              placeholderTextColor={Colors.textLight}
            />

            {/* Time Configuration */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>{t('reminders.reminderTime')}</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={timeStr}
                onChangeText={setTimeStr}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                placeholderTextColor={Colors.textLight}
              />
              <View style={styles.presetRow}>
                {PRESET_TIMES.map((preset) => (
                  <TouchableOpacity
                    key={preset.time24}
                    style={[styles.presetChip, parseTo24Hour(timeStr, ampm) === preset.time24 && styles.presetChipActive]}
                    onPress={() => {
                      setTimeStr(preset.displayTime);
                      setAmpm(preset.ampm);
                    }}
                  >
                    <Text style={[styles.presetText, parseTo24Hour(timeStr, ampm) === preset.time24 && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.daysHeaderRow}>
              <Text style={styles.fieldLabel}>{t('reminders.repeatDays')}</Text>
              <TouchableOpacity onPress={toggleSelectAllDays}>
                <Text style={styles.allDaysLink}>
                  {selectedDays.length === 7 ? t('reminders.deselectAll') : t('reminders.selectAll')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.daysRow}>
              {DAY_NAMES.map((name, index) => {
                const isSelected = selectedDays.includes(index);
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                    onPress={() => handleDayToggle(index)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dosage */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>{t('reminders.dosageOptional')}</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('reminders.dosagePh')}
              placeholderTextColor={Colors.textLight}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  headerCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.sm,
  },
  title: { ...Typography.fontSize.xl, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: 2 },
  subtitle: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permBanner: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  permBannerTitle: { ...Typography.fontSize.sm, ...Typography.fontWeight.semibold, color: Colors.accentDark },
  permBannerSub: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8, marginVertical: Spacing.sm, alignItems: 'center' },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statValue: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  statLabel: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  testBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  testBtnText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.primary },
  list: { paddingBottom: 110 },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  reminderCardDisabled: { opacity: 0.55 },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reminderTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text },
  dosePill: {
    backgroundColor: Colors.infoLight,
    color: Colors.primary,
    ...Typography.fontSize.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  reminderTimeText: { ...Typography.fontSize.sm, ...Typography.fontWeight.bold, color: Colors.text },
  daysText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  lastTaken: { ...Typography.fontSize.xs, color: Colors.success, marginTop: 4 },
  textMuted: { color: Colors.textLight },
  reminderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  takenButton: { padding: 4 },
  actionIcon: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.xl },
  emptyText: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold, color: Colors.text },
  emptySubtext: { ...Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  createFirstBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  createFirstBtnText: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.textOnPrimary },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold, color: Colors.text },
  saveBtnText: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.primary },
  modalBody: { padding: Spacing.md, paddingBottom: 60 },
  fieldLabel: { ...Typography.fontSize.sm, ...Typography.fontWeight.semibold, color: Colors.text, marginBottom: Spacing.xs },
  chipsScroll: { flexDirection: 'row', marginBottom: Spacing.sm },
  medChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  medChipText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  medChipTextSelected: { color: Colors.textOnPrimary, ...Typography.fontWeight.semibold },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.fontSize.md,
    color: Colors.text,
  },
  timeInputRow: { gap: 8 },
  timeInput: { width: 120, textAlign: 'center', ...Typography.fontSize.xl, ...Typography.fontWeight.bold },
  presetRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  presetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: { backgroundColor: Colors.infoLight, borderColor: Colors.primary },
  presetText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  presetTextActive: { color: Colors.primary, ...Typography.fontWeight.semibold },
  daysHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs },
  allDaysLink: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.primary },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCircle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayCircleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { ...Typography.fontSize.xs, color: Colors.textSecondary, ...Typography.fontWeight.semibold },
  dayTextSelected: { color: Colors.textOnPrimary },
});
