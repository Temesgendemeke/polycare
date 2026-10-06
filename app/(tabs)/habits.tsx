import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/design';
import { ExerciseService } from '../../services/exerciseService';
import { DietService } from '../../services/dietService';

type NCDType = 'hypertension' | 'diabetes' | 'heart_failure' | 'copd' | 'asthma' | 'other';

type Habit = {
  id: string;
  name: string;
  description: string;
  streak: number;
  doneToday: boolean;
};

type Goal = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
};

const userConditions: NCDType[] = ['hypertension', 'diabetes'];

export default function HabitsScreen() {
  const { t } = useTranslation();
  const initialHabits: Habit[] = [
    { id: 'h1', name: t('habits.morningWalk'), description: t('habits.walkDesc'), streak: 6, doneToday: false },
    { id: 'h2', name: t('habits.lowSalt'), description: t('habits.lowSaltDesc'), streak: 4, doneToday: true },
  ];

  const initialGoals: Goal[] = [
    { id: 'g1', title: t('habits.weeklyExercise'), current: 95, target: 150, unit: 'min' },
    { id: 'g2', title: t('habits.waterIntake'), current: 1.5, target: 2.5, unit: 'L' },
  ];

  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [showExercises, setShowExercises] = useState(false);
  const [showDiet, setShowDiet] = useState(false);

  const exerciseRecs = useMemo(() => ExerciseService.getRecommendations(userConditions), []);
  const dietRecs = useMemo(() => DietService.getRecommendations(userConditions), []);

  const markDone = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id && !habit.doneToday
          ? { ...habit, doneToday: true, streak: habit.streak + 1 }
          : habit
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{t('habits.title')}</Text>
          <Text style={styles.subtitle}>{t('habits.subtitle')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('habits.dailyHabits')}</Text>
        <View style={styles.sectionList}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
                <View style={styles.streakRow}>
                  <Ionicons name="flame" size={14} color={Colors.accentDark} />
                  <Text style={styles.streakText}>{habit.streak} {t('habits.dayStreak')}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.doneButton, habit.doneToday && styles.doneButtonCompleted]}
                onPress={() => markDone(habit.id)}
                disabled={habit.doneToday}
              >
                <Ionicons name={habit.doneToday ? 'checkmark-circle' : 'checkmark'} size={20} color={Colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('habits.longGoals')}</Text>
        <View style={styles.sectionList}>
          {initialGoals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.goalMetaRow}>
                  <Text style={styles.goalMeta}>{goal.current} {goal.unit}</Text>
                  <Text style={styles.goalMeta}>{goal.target} {goal.unit}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.expandableHeader} onPress={() => setShowExercises(!showExercises)}>
          <Ionicons name="fitness-outline" size={18} color={Colors.primary} />
          <Text style={styles.expandableTitle}>{t('habits.exerciseRecs')}</Text>
          <Ionicons name={showExercises ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showExercises && exerciseRecs.map((rec, i) => (
          <View key={i} style={styles.recSection}>
            <Text style={styles.recCondition}>{rec.condition.replace('_', ' ').toUpperCase()}</Text>
            <View style={styles.recChips}>
              {rec.recommended.map((ex) => (
                <View key={ex.id} style={styles.recChip}>
                  <Ionicons name="walk" size={13} color={Colors.primary} />
                  <Text style={styles.recChipText}>{ex.name} ({ex.duration}min)</Text>
                </View>
              ))}
            </View>
            <View style={styles.avoidSection}>
              <Text style={styles.avoidTitle}>{t('habits.avoid')}</Text>
              {rec.avoided.map((item, j) => (
                <Text key={j} style={styles.avoidText}>- {item}</Text>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.expandableHeader} onPress={() => setShowDiet(!showDiet)}>
          <Ionicons name="nutrition-outline" size={18} color={Colors.primary} />
          <Text style={styles.expandableTitle}>{t('habits.dietRecs')}</Text>
          <Ionicons name={showDiet ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showDiet && dietRecs.map((rec, i) => (
          <View key={i} style={styles.recSection}>
            <Text style={styles.recCondition}>{rec.condition.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.recSubtitle}>{t('habits.recFoods')}</Text>
            {rec.recommendedFoods.map((food, j) => (
              <Text key={j} style={styles.recListItem}>+ {food}</Text>
            ))}
            <Text style={[styles.recSubtitle, { marginTop: 8 }]}>{t('habits.avoidFoods')}</Text>
            {rec.avoidedFoods.map((food, j) => (
              <Text key={j} style={[styles.recListItem, { color: Colors.error }]}>- {food}</Text>
            ))}
            <Text style={[styles.recSubtitle, { marginTop: 8 }]}>{t('habits.tips')}</Text>
            {rec.tips.map((tip, j) => (
              <View key={j} style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={13} color={Colors.accentDark} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md, paddingBottom: 110 },
  headerCard: {
    marginTop: Spacing.sm, marginBottom: Spacing.md, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, ...Shadows.sm,
  },
  title: { ...Typography.fontSize.xl, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: 4 },
  subtitle: { ...Typography.fontSize.sm, color: Colors.textSecondary },
  sectionTitle: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  sectionList: { marginBottom: Spacing.lg, gap: 8 },
  habitCard: { borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadows.sm },
  habitInfo: { flex: 1, marginRight: Spacing.sm },
  habitName: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text, marginBottom: 3 },
  habitDescription: { ...Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { ...Typography.fontSize.xs, ...Typography.fontWeight.medium, color: Colors.accentDark },
  doneButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  doneButtonCompleted: { backgroundColor: Colors.success },
  goalCard: { borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  goalTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text },
  goalPercent: { ...Typography.fontSize.sm, ...Typography.fontWeight.bold, color: Colors.primary },
  progressTrack: { height: 10, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceVariant, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', borderRadius: BorderRadius.full, backgroundColor: Colors.secondary },
  goalMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalMeta: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  expandableHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.md, marginTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  expandableTitle: { flex: 1, ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text },
  recSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  recCondition: { ...Typography.fontSize.xs, ...Typography.fontWeight.bold, color: Colors.primary, marginBottom: Spacing.sm, letterSpacing: 1 },
  recChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  recChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.infoLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  recChipText: { ...Typography.fontSize.xs, color: Colors.primary },
  avoidSection: { marginTop: Spacing.xs },
  avoidTitle: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.error, marginBottom: 4 },
  avoidText: { ...Typography.fontSize.xs, color: Colors.error, marginBottom: 2 },
  recSubtitle: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.textSecondary, marginBottom: 4 },
  recListItem: { ...Typography.fontSize.sm, color: Colors.text, marginLeft: Spacing.sm, marginBottom: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 4 },
  tipText: { flex: 1, ...Typography.fontSize.xs, color: Colors.accentDark, lineHeight: 18 },
});
