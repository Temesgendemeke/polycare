import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMedicationStore, useUserStore, useReminderStore } from '../../store';
import { isToday, isActivityReminder } from '../../store/reminderStore';
import { useTranslation } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { medications, prescribedMeds } = useMedicationStore();
  const { reminders } = useReminderStore();

  const safeMedications = Array.isArray(medications) ? medications : [];
  const activeUserMeds = safeMedications.filter((m) => m?.status === 'active');
  const allDisplayMeds = [...activeUserMeds, ...(prescribedMeds || [])];
  const totalActiveMeds = allDisplayMeds.length;

  const todayDay = new Date().getDay();
  const todaysReminders = reminders.filter(
    (r) =>
      r.enabled &&
      !isActivityReminder(r.id) &&
      (r.days.length === 0 || r.days.includes(todayDay))
  );
  const totalDoses = todaysReminders.length;
  const takenDoses = todaysReminders.filter((r) => isToday(r.lastTaken)).length;
  const todayAdherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  const vitals = [
    {
      id: 'bp',
      label: t('dashboard.bloodPressure'),
      value: '124/82',
      unit: 'mmHg',
      icon: 'heart',
      color: Colors.error,
      status: t('dashboard.normal'),
    },
    {
      id: 'sugar',
      label: t('dashboard.bloodSugar'),
      value: '98',
      unit: 'mg/dL',
      icon: 'water',
      color: Colors.info,
      status: t('dashboard.normal'),
    },
    {
      id: 'weight',
      label: t('dashboard.weight'),
      value: '78.5',
      unit: 'kg',
      icon: 'barbell',
      color: Colors.accent,
      status: t('dashboard.targetWeight'),
    },
    {
      id: 'spo2',
      label: t('dashboard.spo2'),
      value: '98',
      unit: '%',
      icon: 'fitness',
      color: Colors.secondary,
      status: t('dashboard.optimal'),
    },
  ];

  const featureCards = [
    {
      id: 'exercise',
      title: t('dashboard.exerciseDiet'),
      subtitle: t('dashboard.exerciseDietSub'),
      icon: 'walk',
      color: Colors.secondary,
      onPress: () => router.push('/(tabs)/habits'),
    },
    {
      id: 'consult',
      title: t('dashboard.pharmacist'),
      subtitle: t('dashboard.pharmacistSub'),
      icon: 'chatbubble-ellipses',
      color: '#7C5FE6',
      onPress: () => router.push('/(tabs)/consultation'),
    },
    {
      id: 'drug-locator',
      title: t('dashboard.locator'),
      subtitle: t('dashboard.locatorSub'),
      icon: 'location',
      color: Colors.info,
      onPress: () => router.push('/drug-locator'),
    },
    {
      id: 'education',
      title: t('dashboard.education'),
      subtitle: t('dashboard.educationSub'),
      icon: 'school',
      color: Colors.accent,
      onPress: () => router.push('/education'),
    },
    {
      id: 'reminders',
      title: t('dashboard.reminders'),
      subtitle: t('dashboard.remindersSub'),
      icon: 'alarm',
      color: Colors.primary,
      onPress: () => router.push('/(tabs)/reminders'),
    },
    {
      id: 'history',
      title: t('dashboard.history'),
      subtitle: t('dashboard.historySub'),
      icon: 'clipboard',
      color: '#0D9488',
      onPress: () => router.push('/history'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandPill}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.brandPillText}>POLY CARE HEALTH</Text>
            </View>

            {/* Health Score Badge */}
            <View style={styles.healthScoreBadge}>
              <Text style={styles.healthScoreLabel}>{t('dashboard.healthScore')}</Text>
              <View style={styles.healthScoreValueRow}>
                <Text style={styles.healthScoreNum}>82</Text>
                <Text style={styles.healthScoreTotal}> / 100</Text>
              </View>
            </View>
          </View>

          <Text style={styles.welcomeText}>
            {t('dashboard.goodMorning')}, {user?.name ? user.name.split(' ')[0] : 'Alex'} 👋
          </Text>
          <Text style={styles.subtitleText}>
            {t('dashboard.subtitle')}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalActiveMeds}</Text>
              <Text style={styles.statLabel}>{t('dashboard.activeMeds')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDoses}</Text>
              <Text style={styles.statLabel}>{t('dashboard.dailyDoses')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayAdherencePct}%</Text>
              <Text style={styles.statLabel}>{t('dashboard.adherenceGoal')}</Text>
            </View>
          </View>
        </View>

        {/* Vitals Grid from index.html */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleCol}>
            <Text style={styles.sectionTitle}>{t('dashboard.recordedVitals')}</Text>
            <Text style={styles.sectionHint}>{t('dashboard.latestCheck')}</Text>
          </View>
        </View>

        <View style={styles.vitalsGrid}>
          {vitals.map((v) => (
            <View key={v.id} style={styles.vitalCard}>
              <View style={[styles.vitalIconWrap, { backgroundColor: v.color + '15' }]}>
                <Ionicons name={v.icon as any} size={18} color={v.color} />
              </View>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValue}>{v.value}</Text>
                <Text style={styles.vitalUnit}>{v.unit}</Text>
              </View>
              <Text style={styles.vitalLabel}>{v.label}</Text>
              <Text style={[styles.vitalStatus, { color: v.color }]}>{v.status}</Text>
            </View>
          ))}
        </View>

        {/* Health Features Grid from index.html */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleCol}>
            <Text style={styles.sectionTitle}>{t('dashboard.features')}</Text>
            <Text style={styles.sectionHint}>{t('dashboard.personalizedCare')}</Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {featureCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.actionCard}
              onPress={card.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.actionTop}>
                <View style={[styles.actionIconWrap, { backgroundColor: card.color }]}>
                  <Ionicons name={card.icon as any} size={18} color={Colors.textOnPrimary} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
              </View>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionSubtitle}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Focus Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.todaysFocus')}</Text>
        </View>

        <View style={styles.focusCard}>
          <View style={styles.focusRow}>
            <View style={[styles.focusIconWrap, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="alarm" size={18} color={Colors.accentDark} />
            </View>
            <View style={styles.focusTextWrap}>
              <Text style={styles.focusTitle}>{t('dashboard.todaysFocus')}</Text>
              <Text style={styles.focusSubtitle}>
                {totalDoses === 0
                  ? t('dashboard.focusHint')
                  : takenDoses === totalDoses
                  ? `All ${totalDoses} doses completed today!`
                  : `${takenDoses} of ${totalDoses} doses taken today (${totalDoses - takenDoses} remaining)`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.focusButton}
            onPress={() => router.push('/(tabs)/reminders')}
          >
            <Text style={styles.focusButtonText}>{t('dashboard.openReminders')}</Text>
          </TouchableOpacity>
        </View>

        {/* Current Medications */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { flex: 1, marginRight: Spacing.sm }]}>
            {t('dashboard.currentMeds')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/medications')}>
            <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {allDisplayMeds.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={26} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>{t('dashboard.noMeds')}</Text>
            <Text style={styles.emptySubtext}>
              {t('dashboard.noMedsHint')}
            </Text>
          </View>
        ) : (
          allDisplayMeds.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.medicationCard}>
              <View style={styles.medicationBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.medicationBadgeText}>{t('common.active')}</Text>
              </View>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDetails}>
                {medication.dosage ?? '-'} {medication.unit ?? ''} • {medication.frequency ?? '-'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DCE8FD',
  },
  brandPillText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  healthScoreBadge: {
    backgroundColor: '#255CB9',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#4A80D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreLabel: {
    fontSize: 9,
    color: '#DCE8FD',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  healthScoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  healthScoreNum: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: '#FFF',
    lineHeight: 18,
  },
  healthScoreTotal: {
    fontSize: 11,
    color: '#DCE8FD',
    fontWeight: '500',
  },
  welcomeText: {
    ...Typography.fontSize.xxl,
    ...Typography.fontWeight.bold,
    color: Colors.textOnPrimary,
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    ...Typography.fontSize.md,
    color: '#DCE8FD',
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#255CB9',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.textOnPrimary,
  },
  statLabel: {
    ...Typography.fontSize.xs,
    color: '#D7E4FB',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#4E7FCE',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  sectionTitleCol: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionHint: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 10,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  vitalValue: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  vitalUnit: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  vitalLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vitalStatus: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  actionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  focusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  focusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  focusTextWrap: {
    flex: 1,
  },
  focusTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
  },
  focusSubtitle: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  focusButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  focusButtonText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  viewAllText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  emptyTitle: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  medicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  medicationBadgeText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.success,
  },
  medicationName: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  medicationDetails: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
