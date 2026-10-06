import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMedicationStore, useUserStore } from '../../store';
import { useTranslation } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { medications } = useMedicationStore();

  const safeMedications = Array.isArray(medications) ? medications : [];
  const activeMedications = safeMedications.filter((m) => m?.status === 'active');
  const highPriorityCount = safeMedications.filter((m) =>
    String(m?.frequency ?? '').toLowerCase().includes('day')
  ).length;

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

            {/* Health Score Badge from index.html */}
            <View style={styles.healthScoreBadge}>
              <View>
                <Text style={styles.healthScoreLabel}>{t('dashboard.healthScore')}</Text>
                <Text style={styles.healthScoreNum}>82</Text>
              </View>
              <Text style={styles.healthScoreTotal}>/ 100</Text>
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
              <Text style={styles.statValue}>{activeMedications.length}</Text>
              <Text style={styles.statLabel}>{t('dashboard.activeMeds')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{highPriorityCount}</Text>
              <Text style={styles.statLabel}>{t('dashboard.dailyDoses')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>{t('dashboard.adherenceGoal')}</Text>
            </View>
          </View>
        </View>

        {/* Vitals Grid from index.html */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recordedVitals')}</Text>
          <Text style={styles.sectionHint}>{t('dashboard.latestCheck')}</Text>
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
          <Text style={styles.sectionTitle}>{t('dashboard.features')}</Text>
          <Text style={styles.sectionHint}>{t('dashboard.personalizedCare')}</Text>
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
              <Text style={styles.focusTitle}>{t('home.todayReminders')}</Text>
              <Text style={styles.focusSubtitle}>
                Keep your medication timing consistent for better control.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.focusButton}
            onPress={() => router.push('/(tabs)/reminders')}
          >
            <Text style={styles.focusButtonText}>Open Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Current Medications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/medications')}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {activeMedications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={26} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first medication to start reminders and tracking.
            </Text>
          </View>
        ) : (
          activeMedications.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.medicationCard}>
              <View style={styles.medicationBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.medicationBadgeText}>Active</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#255CB9',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#4A80D8',
  },
  healthScoreLabel: {
    fontSize: 9,
    color: '#DCE8FD',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  healthScoreNum: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: '#FFF',
    lineHeight: 18,
  },
  healthScoreTotal: {
    ...Typography.fontSize.xs,
    color: '#DCE8FD',
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
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionHint: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
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
