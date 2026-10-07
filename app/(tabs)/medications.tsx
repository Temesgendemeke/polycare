import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMedicationStore, useReminderStore } from '../../store';
import { isToday } from '../../store/reminderStore';
import { useTranslation } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';
import { Medication } from '../../types';
import AddMedicationModal from '../../components/AddMedicationModal';
import { DDIService } from '../../services/ddiService';
import InteractionCard from '../../components/InteractionCard';

export interface DailyDoseItem {
  id: string;
  name: string;
  type: string;
  time: string;
  withFood: boolean;
  taken: boolean;
}

const formatDoseTime = (timeStr: string): string => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const BASE_WEEKLY_HISTORY = [85, 90, 100, 70, 80, 95]; // Past 6 days from index.html

export default function MedicationsScreen() {
  const { t } = useTranslation();
  const { medications, prescribedMeds, deleteMedication } = useMedicationStore();
  const {
    reminders,
    toggleTaken,
    ensurePrescribedReminders,
    deleteRemindersForMedication,
  } = useReminderStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editMed, setEditMed] = useState<Medication | undefined>(undefined);
  const [showInteractions, setShowInteractions] = useState(false);

  // Auto-seed prescribed reminders on mount
  useEffect(() => {
    ensurePrescribedReminders();
  }, []);

  // Today's day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const todayDayIndex = new Date().getDay();

  // Map medications for fast lookup of dosage, food instructions, etc.
  const allMedsMap = useMemo(() => {
    const map = new Map<string, { name: string; dosage?: string; withFood?: boolean }>();
    for (const m of [...(prescribedMeds || []), ...(medications || [])]) {
      map.set(m.id, {
        name: m.name,
        dosage: `${m.dosage} ${m.unit}`,
        withFood: (m as any).withFood || m.instructions?.toLowerCase().includes('food') || false,
      });
    }
    return map;
  }, [medications, prescribedMeds]);

  // Dynamically compute today's doses from reminders scheduled for today
  const dailyDoses: DailyDoseItem[] = useMemo(() => {
    const activeToday = reminders.filter(
      (r) => r.enabled && (r.days.length === 0 || r.days.includes(todayDayIndex))
    );

    return activeToday
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((r) => {
        const med = allMedsMap.get(r.medicationId);
        const name = r.title || med?.name || 'Medication';
        const type = r.dosage || med?.dosage || 'Scheduled Dose';
        const withFood = med?.withFood || r.instructions?.toLowerCase().includes('food') || false;
        const taken = isToday(r.lastTaken);

        return {
          id: r.id,
          name,
          type,
          time: formatDoseTime(r.time),
          withFood,
          taken,
        };
      });
  }, [reminders, todayDayIndex, allMedsMap]);

  const toggleDose = async (id: string) => {
    await toggleTaken(id);
  };

  // Calculations for Today's Adherence Rate
  const totalDoses = dailyDoses.length;
  const takenDoses = dailyDoses.filter((d) => d.taken).length;
  const todayAdherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  // 7-day weekly history array, where 7th bar is today's real-time adherence rate
  const weeklyHistory = [...BASE_WEEKLY_HISTORY, todayAdherencePct];

  const activeMedications = medications.filter((m) => m.status === 'active');
  const interactions = showInteractions && activeMedications.length >= 2
    ? DDIService.checkDDI(activeMedications).interactions
    : [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert(t('medications.deleteTitle'), t('medications.removeConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          deleteMedication(id);
          await deleteRemindersForMedication(id);
        },
      },
    ]);
  };

  const handleEdit = (med: Medication) => {
    setEditMed(med);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('medications.title')}</Text>
            <Text style={styles.subtitle}>{t('medications.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setEditMed(undefined); setModalVisible(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        {/* Top 2 Cards: Today's Adherence & Weekly History (from index.html) */}
        <View style={styles.adherenceGrid}>
          {/* Card 1: Today's Adherence */}
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceCardLabel}>{t('medications.todayAdherence')}</Text>
            <View style={styles.adherenceNumberRow}>
              <Text style={styles.adherenceBigNum}>{todayAdherencePct}%</Text>
              <Text style={styles.adherenceSubLabel}>{t('medications.taken')}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${todayAdherencePct}%` }]} />
            </View>
            <Text style={styles.adherenceStatsText}>
              {takenDoses} of {totalDoses} doses completed
            </Text>
          </View>

          {/* Card 2: Weekly History */}
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceCardLabel}>{t('medications.weeklyHistory')}</Text>
            <View style={styles.barsContainer}>
              {weeklyHistory.map((val, idx) => {
                const isToday = idx === 6;
                const barHeight = Math.max(6, Math.round((val / 100) * 52));
                return (
                  <View key={idx} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: barHeight },
                          isToday && styles.barFillToday,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                      {WEEK_DAYS[idx]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 1: Daily Dose Checklist (from index.html) */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t('medications.dailyChecklist')}</Text>
            <Text style={styles.sectionSubtitle}>{t('medications.checklistSubtitle')}</Text>
          </View>
          <View style={styles.doseCountBadge}>
            <Text style={styles.doseCountText}>{takenDoses}/{totalDoses}</Text>
          </View>
        </View>

        <View style={styles.checklistList}>
          {dailyDoses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={Colors.primary} />
              <Text style={styles.emptyCardTitle}>No Doses Scheduled Today</Text>
              <Text style={styles.emptyCardSub}>
                All prescribed doses and active medication reminders for today will appear here.
              </Text>
            </View>
          ) : (
            dailyDoses.map((dose) => (
              <TouchableOpacity
                key={dose.id}
                style={[styles.checklistItem, dose.taken && styles.checklistItemDone]}
                onPress={() => toggleDose(dose.id)}
                activeOpacity={0.7}
              >
                {/* Checkmark Circle Button */}
                <View style={[styles.checkCircle, dose.taken && styles.checkCircleDone]}>
                  {dose.taken && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </View>

                {/* Info Column */}
                <View style={styles.doseInfo}>
                  <Text style={[styles.doseName, dose.taken && styles.doseNameDone]}>
                    {dose.name}
                  </Text>
                  <Text style={styles.doseMeta}>
                    {dose.type} {dose.withFood ? `• ${t('medications.takeWithFood')}` : ''}
                  </Text>
                </View>

                {/* Time & Badge */}
                <View style={styles.doseRight}>
                  <Text style={styles.doseTime}>{dose.time}</Text>
                  <View style={[styles.statusBadge, dose.taken ? styles.badgeTaken : styles.badgePending]}>
                    <Text style={[styles.statusBadgeText, dose.taken ? styles.badgeTakenText : styles.badgePendingText]}>
                      {dose.taken ? t('medications.takenStatus') : t('medications.pendingStatus')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )))}
        </View>

        {/* Section 2: All Prescriptions & Inventory */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t('medications.allPrescriptions')}</Text>
            <Text style={styles.sectionSubtitle}>Active patient prescriptions & stock</Text>
          </View>
          {activeMedications.length >= 2 && (
            <TouchableOpacity
              style={styles.ddiBtn}
              onPress={() => setShowInteractions(!showInteractions)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="pulse-outline"
                size={14}
                color={interactions.length > 0 ? Colors.error : Colors.secondary}
              />
              <Text style={[styles.ddiBtnText, { color: interactions.length > 0 ? Colors.error : Colors.secondary }]}>
                {interactions.length > 0 ? `Alerts (${interactions.length})` : 'DDI Safe'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* DDI Interactions Banner if opened */}
        {showInteractions && interactions.length > 0 && (
          <View style={styles.interactionsContainer}>
            <Text style={styles.interactionsTitle}>{t('medications.foundTitle')}</Text>
            {interactions.map((interaction, idx) => (
              <InteractionCard
                key={idx}
                interaction={{
                  medications: `${interaction.medication1Id} + ${interaction.medication2Id}`,
                  severity: interaction.severity,
                  description: interaction.description,
                  recommendation: interaction.recommendation,
                }}
              />
            ))}
          </View>
        )}

        {/* Active Prescriptions List */}
        {activeMedications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={36} color={Colors.textLight} />
            <Text style={styles.emptyCardTitle}>No additional custom medications</Text>
            <Text style={styles.emptyCardSub}>
              Tap the (+) button above to add new prescriptions with automated dosage alarms.
            </Text>
          </View>
        ) : (
          activeMedications.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleEdit(item)}
              style={styles.prescriptionCard}
            >
              <View style={styles.prescriptionTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prescriptionName}>{item.name}</Text>
                  {!!item.genericName && (
                    <Text style={styles.prescriptionGeneric}>{item.genericName}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.prescriptionMetaRow}>
                <View style={styles.chip}>
                  <Ionicons name="flask-outline" size={12} color={Colors.primary} />
                  <Text style={styles.chipText}>{item.dosage} {item.unit}</Text>
                </View>
                <View style={[styles.chip, styles.chipBlue]}>
                  <Ionicons name="time-outline" size={12} color={Colors.primary} />
                  <Text style={styles.chipText}>{item.frequency.replace(/_/g, ' ')}</Text>
                </View>
                {item.currentStock !== undefined && (
                  <View style={[styles.chip, item.currentStock <= 3 ? styles.chipWarning : null]}>
                    <Ionicons name="cube-outline" size={12} color={item.currentStock <= 3 ? Colors.warning : Colors.textSecondary} />
                    <Text style={styles.chipText}>{item.currentStock} left</Text>
                  </View>
                )}
              </View>

              {!!item.instructions && (
                <View style={styles.instructionsRow}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.instructionsText}>{item.instructions}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Medication Modal */}
      <AddMedicationModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditMed(undefined); }}
        editMedication={editMed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  /* Top Adherence Grid (2 cards like index.html) */
  adherenceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  adherenceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  adherenceCardLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  adherenceNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  adherenceBigNum: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D9E75',
  },
  adherenceSubLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: '#1D9E75',
  },
  adherenceStatsText: {
    fontSize: 10,
    color: Colors.textLight,
  },
  /* Weekly History Bars */
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 4,
    marginTop: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 52,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '78%',
    backgroundColor: '#9FE1CB',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barFillToday: {
    backgroundColor: '#1D9E75',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 4,
  },
  barLabelToday: {
    fontWeight: '700',
    color: '#1D9E75',
  },
  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  doseCountBadge: {
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  doseCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D9E75',
  },
  /* Daily Checklist Cards */
  checklistList: {
    gap: 8,
  },
  checklistItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.sm,
  },
  checklistItemDone: {
    backgroundColor: '#FAFCFA',
    borderColor: '#D4EBE2',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  doseInfo: {
    flex: 1,
  },
  doseName: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  doseNameDone: {
    color: Colors.text,
  },
  doseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  doseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  doseTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTaken: {
    backgroundColor: '#E1F5EE',
  },
  badgeTakenText: {
    color: '#1D9E75',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingText: {
    color: '#D97706',
  },
  /* Prescriptions section */
  ddiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ddiBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  interactionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.errorLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  interactionsTitle: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  emptyCardTitle: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
  },
  emptyCardSub: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  prescriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: 8,
    ...Shadows.sm,
  },
  prescriptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  prescriptionName: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  prescriptionGeneric: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  prescriptionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  chipBlue: {
    backgroundColor: Colors.infoLight,
  },
  chipWarning: {
    backgroundColor: Colors.warningLight,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
