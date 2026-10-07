import React, { useState, useMemo, useEffect } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';
import { useTranslation } from '../../hooks';
import { useUserStore } from '../../store';
import { ExerciseService } from '../../services/exerciseService';
import { DietService } from '../../services/dietService';
import { Exercise, NCDType } from '../../types';
import ExerciseSessionModal from '../../components/ExerciseSessionModal';
import AddHabitModal from '../../components/AddHabitModal';

export interface DailyActivityItem {
  id: string;
  name: string;
  category: 'exercise' | 'habit' | 'diet';
  type: string;
  duration?: number;
  time?: string;
  streak: number;
  completed: boolean;
  exerciseId?: string;
}

interface GoalItem {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  step: number;
}

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const BASE_WEEKLY_HISTORY = [75, 85, 100, 60, 90, 80]; // Past 6 days history

export default function HabitsScreen() {
  const { t } = useTranslation();
  const { user } = useUserStore();

  const userConditions: NCDType[] = useMemo(() => {
    if (user?.conditions && user.conditions.length > 0) {
      return user.conditions as NCDType[];
    }
    return ['hypertension', 'diabetes'];
  }, [user]);

  // Initial Daily Activities
  const initialActivities: DailyActivityItem[] = useMemo(
    () => [
      {
        id: 'act-walking',
        name: 'Brisk Walking Routine',
        category: 'exercise',
        type: 'Cardiovascular Conditioning',
        duration: 30,
        time: '8:00 AM',
        streak: 6,
        completed: false,
        exerciseId: 'walking',
      },
      {
        id: 'act-vitals',
        name: 'Morning Blood Pressure Check',
        category: 'habit',
        type: 'Vitals Monitoring',
        time: '8:30 AM',
        streak: 12,
        completed: true,
      },
      {
        id: 'act-lowsalt',
        name: 'Low-Sodium Dietary Meal',
        category: 'diet',
        type: 'Heart-Healthy Nutrition',
        time: '12:30 PM',
        streak: 4,
        completed: false,
      },
      {
        id: 'act-breathing',
        name: 'Controlled Pursed-Lip Breathing',
        category: 'exercise',
        type: 'Respiratory & Stress Relief',
        duration: 10,
        time: '6:00 PM',
        streak: 7,
        completed: false,
        exerciseId: 'breathing-exercises',
      },
    ],
    []
  );

  const [activities, setActivities] = useState<DailyActivityItem[]>(initialActivities);
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: 'g1', title: 'Weekly Cardio Exercise', current: 105, target: 150, unit: 'min', step: 15 },
    { id: 'g2', title: 'Daily Water Hydration', current: 1.75, target: 2.5, unit: 'L', step: 0.25 },
  ]);

  // Tab filter: 'all' | 'exercise' | 'habit' | 'diet'
  const [activeTab, setActiveTab] = useState<'all' | 'exercise' | 'habit' | 'diet'>('all');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<string>('all');

  // Modals state
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [dietExpanded, setDietExpanded] = useState(true);

  // Clinical Exercise Database & Recommendations
  const allExercises = useMemo(() => ExerciseService.getExerciseDatabase(), []);
  const exerciseRecs = useMemo(() => ExerciseService.getRecommendations(userConditions), [userConditions]);
  const dietRecs = useMemo(() => DietService.getRecommendations(userConditions), [userConditions]);

  // Today Adherence Calculations
  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.completed).length;
  const todayAdherencePct =
    totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 100;

  // 7-day Weekly History (last bar is today's real-time completion)
  const weeklyHistory = [...BASE_WEEKLY_HISTORY, todayAdherencePct];

  // Toggle activity completion
  const toggleActivity = (id: string) => {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            streak: nextCompleted ? item.streak + 1 : Math.max(0, item.streak - 1),
          };
        }
        return item;
      })
    );
  };

  // Launch Exercise Session Modal
  const startExerciseSession = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSessionModalVisible(true);
  };

  // Finish Exercise Session (called by ExerciseSessionModal)
  const handleCompleteSession = (
    exerciseId: string,
    todosCompleted: string[],
    durationSpent: number
  ) => {
    setSessionModalVisible(false);

    // Mark corresponding activity as completed in Today's list
    setActivities((prev) =>
      prev.map((item) => {
        if (item.exerciseId === exerciseId || item.id === `act-${exerciseId}`) {
          return { ...item, completed: true, streak: item.streak + 1 };
        }
        return item;
      })
    );

    // Increment weekly cardio minutes goal
    setGoals((prev) =>
      prev.map((g) => (g.id === 'g1' ? { ...g, current: g.current + durationSpent } : g))
    );

    Alert.alert(
      'Workout Completed! 🎉',
      `Great job! You completed ${todosCompleted.length} exercise checkpoints and logged ${durationSpent} minutes of heart-healthy activity.`
    );
  };

  // Add custom habit or activity
  const handleAddCustomActivity = (data: {
    name: string;
    description: string;
    category: 'exercise' | 'habit' | 'diet';
    duration?: number;
  }) => {
    const newItem: DailyActivityItem = {
      id: `custom-${Date.now()}`,
      name: data.name,
      category: data.category,
      type: data.description,
      duration: data.duration,
      time: 'Flexible',
      streak: 1,
      completed: false,
    };
    setActivities((prev) => [newItem, ...prev]);
  };

  // Quick increment for goals
  const incrementGoal = (goalId: string, step: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, current: Math.min(g.target * 1.5, Math.round((g.current + step) * 100) / 100) } : g
      )
    );
  };

  // Filter activities based on tab
  const filteredActivities = activities.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  // Filter exercise catalog
  const filteredExercises = allExercises.filter((ex) => {
    if (exerciseCategoryFilter === 'all') return true;
    return ex.category === exerciseCategoryFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header (Matching medications.tsx layout) */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Health & Activity</Text>
            <Text style={styles.subtitle}>Daily clinical routines, exercise therapy & habit tracking</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        {/* Top 2 Cards: Today's Adherence & Weekly History (Matching medications.tsx) */}
        <View style={styles.adherenceGrid}>
          {/* Card 1: Today's Adherence */}
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceCardLabel}>Today's Activity</Text>
            <View style={styles.adherenceNumberRow}>
              <Text style={styles.adherenceBigNum}>{todayAdherencePct}%</Text>
              <Text style={styles.adherenceSubLabel}>
                {todayAdherencePct === 100 ? 'Goal Met' : 'Active'}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${todayAdherencePct}%` },
                  todayAdherencePct === 100 && styles.progressFillDone,
                ]}
              />
            </View>
            <Text style={styles.adherenceStatsText}>
              {completedActivities} of {totalActivities} activities completed
            </Text>
          </View>

          {/* Card 2: Weekly History */}
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceCardLabel}>Weekly Activity</Text>
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

        {/* Filter / Category Segment Tabs */}
        <View style={styles.tabsRow}>
          {(['all', 'exercise', 'habit', 'diet'] as const).map((tabKey) => {
            const isSelected = activeTab === tabKey;
            const label =
              tabKey === 'all'
                ? `All (${activities.length})`
                : tabKey === 'exercise'
                ? 'Exercises'
                : tabKey === 'habit'
                ? 'Habits'
                : 'Diet';

            return (
              <TouchableOpacity
                key={tabKey}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tabKey)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 1: Daily Health & Exercise Checklist (Matching medications.tsx) */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Daily Activity Checklist</Text>
            <Text style={styles.sectionSubtitle}>Tap checkmark to toggle, or launch guided exercise</Text>
          </View>
          <View style={styles.doseCountBadge}>
            <Text style={styles.doseCountText}>
              {completedActivities}/{totalActivities}
            </Text>
          </View>
        </View>

        <View style={styles.checklistList}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={Colors.primary} />
              <Text style={styles.emptyCardTitle}>No Activities in this Filter</Text>
              <Text style={styles.emptyCardSub}>
                Tap the (+) button above to add custom activities or switch back to All.
              </Text>
            </View>
          ) : (
            filteredActivities.map((item) => {
              const matchingExercise = item.exerciseId
                ? ExerciseService.getExerciseById(item.exerciseId)
                : null;

              return (
                <View
                  key={item.id}
                  style={[styles.checklistItem, item.completed && styles.checklistItemDone]}
                >
                  <View style={styles.checklistItemContent}>
                    {/* Checkmark Circle Button */}
                    <TouchableOpacity
                      style={[styles.checkCircle, item.completed && styles.checkCircleDone]}
                      onPress={() => toggleActivity(item.id)}
                      activeOpacity={0.7}
                    >
                      {item.completed && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {/* Info Column */}
                    <View style={styles.doseInfo}>
                      <View style={styles.activityTitleRow}>
                        <Text style={[styles.doseName, item.completed && styles.doseNameDone]}>
                          {item.name}
                        </Text>
                        <View style={styles.streakBadge}>
                          <Ionicons name="flame" size={12} color={Colors.accentDark} />
                          <Text style={styles.streakBadgeText}>{item.streak}d</Text>
                        </View>
                      </View>
                      <Text style={styles.doseMeta}>
                        {item.type} {item.duration ? `• ${item.duration} min` : ''}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.doseRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          item.completed ? styles.badgeTaken : styles.badgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.completed ? styles.badgeTakenText : styles.badgePendingText,
                          ]}
                        >
                          {item.completed ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Guided Exercise CTA Button (If item is an exercise) */}
                  {/* {matchingExercise && (
                    <View style={styles.exerciseActionRow}>
                      <TouchableOpacity
                        style={styles.launchExerciseBtn}
                        onPress={() => startExerciseSession(matchingExercise)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                        <Text style={styles.launchExerciseBtnText}>
                          {item.completed ? 'Review Checklist & Routine' : 'Start Routine • Step-by-Step To-Dos'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )} */}
                </View>
              );
            })
          )}
        </View>

        {/* Section 2: Clinical Exercise Programs & Library */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Prescribed Exercise Routines</Text>
            <Text style={styles.sectionSubtitle}>NCD-safe programs with step-by-step to-do routines</Text>
          </View>
        </View>

        {/* Category Pills for Exercise Catalog */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
          {[
            { id: 'all', label: 'All Routines' },
            { id: 'cardio', label: 'Cardio' },
            { id: 'strength', label: 'Strength' },
            { id: 'flexibility', label: 'Flexibility & Breathing' },
          ].map((cat) => {
            const isCatSelected = exerciseCategoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catFilterPill, isCatSelected && styles.catFilterPillSelected]}
                onPress={() => setExerciseCategoryFilter(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.catFilterPillText, isCatSelected && styles.catFilterPillTextSelected]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercise Cards */}
        <View style={styles.exerciseCatalogList}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              activeOpacity={0.85}
              onPress={() => startExerciseSession(exercise)}
            >
              <View style={styles.exerciseTopRow}>
                <View style={styles.exerciseIconCircle}>
                  <Ionicons
                    name={
                      exercise.category === 'cardio'
                        ? 'walk'
                        : exercise.category === 'strength'
                        ? 'barbell'
                        : 'fitness'
                    }
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                  <Text style={styles.exerciseCardDescription} numberOfLines={2}>
                    {exercise.description}
                  </Text>
                </View>
              </View>

              {/* Badges Row */}
              <View style={styles.exerciseMetaRow}>
                <View style={styles.exerciseChip}>
                  <Ionicons name="time-outline" size={12} color={Colors.primary} />
                  <Text style={styles.exerciseChipText}>{exercise.duration} mins</Text>
                </View>
                <View style={[styles.exerciseChip, styles.exerciseChipOrange]}>
                  <Ionicons name="speedometer-outline" size={12} color={Colors.accentDark} />
                  <Text style={[styles.exerciseChipText, { color: Colors.accentDark }]}>
                    {exercise.intensity}
                  </Text>
                </View>
                <View style={[styles.exerciseChip, styles.exerciseChipGreen]}>
                  <Ionicons name="checkbox-outline" size={12} color={Colors.secondaryDark} />
                  <Text style={[styles.exerciseChipText, { color: Colors.secondaryDark }]}>
                    {exercise.todos?.length || 6} Steps To-Do
                  </Text>
                </View>
                {exercise.caloriesBurned ? (
                  <View style={[styles.exerciseChip, styles.exerciseChipRed]}>
                    <Ionicons name="flame-outline" size={12} color={Colors.error} />
                    <Text style={[styles.exerciseChipText, { color: Colors.error }]}>
                      ~{exercise.caloriesBurned} kcal
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Suitable Conditions Chips */}
              <View style={styles.conditionsTagsRow}>
                <Text style={styles.conditionsTagsLabel}>Safe for:</Text>
                {exercise.suitableConditions.map((cond, cIdx) => (
                  <View key={cIdx} style={styles.conditionTagPill}>
                    <Text style={styles.conditionTagText}>{cond.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>

              {/* Start Workout Button */}
              <TouchableOpacity
                style={styles.cardStartBtn}
                onPress={() => startExerciseSession(exercise)}
                activeOpacity={0.8}
              >
                <Ionicons name="play-circle" size={16} color={Colors.primary} />
                <Text style={styles.cardStartBtnText}>Start Routine & Open To-Do List</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 3: Safe Diet & Nutrition Guidelines */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Diet & Nutrition Guidance</Text>
            <Text style={styles.sectionSubtitle}>Personalized food choices tailored to your health</Text>
          </View>
          <TouchableOpacity
            style={styles.expandHeaderBtn}
            onPress={() => setDietExpanded(!dietExpanded)}
          >
            <Ionicons name={dietExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {dietExpanded &&
          dietRecs.map((rec, i) => (
            <View key={i} style={styles.dietRecCard}>
              <View style={styles.dietConditionHeader}>
                <Ionicons name="nutrition" size={16} color={Colors.primary} />
                <Text style={styles.dietConditionTitle}>
                  {rec.condition.replace('_', ' ').toUpperCase()} NUTRITION
                </Text>
              </View>

              {/* Recommended Foods */}
              <Text style={styles.foodGroupTitle}>Recommended Foods</Text>
              <View style={styles.foodPillsRow}>
                {rec.recommendedFoods.map((food, j) => (
                  <View key={j} style={styles.foodPillGreen}>
                    <Ionicons name="checkmark" size={12} color={Colors.secondaryDark} />
                    <Text style={styles.foodPillGreenText}>{food}</Text>
                  </View>
                ))}
              </View>

              {/* Avoid Foods */}
              <Text style={[styles.foodGroupTitle, { marginTop: 10, color: Colors.error }]}>Foods to Avoid</Text>
              <View style={styles.foodPillsRow}>
                {rec.avoidedFoods.map((food, j) => (
                  <View key={j} style={styles.foodPillRed}>
                    <Ionicons name="close" size={12} color={Colors.error} />
                    <Text style={styles.foodPillRedText}>{food}</Text>
                  </View>
                ))}
              </View>

              {/* Tips */}
              <View style={styles.dietTipsBox}>
                <Text style={styles.dietTipsTitle}>Clinical Tips:</Text>
                {rec.tips.map((tip, j) => (
                  <View key={j} style={styles.tipItemRow}>
                    <Ionicons name="bulb-outline" size={13} color={Colors.accentDark} />
                    <Text style={styles.tipItemText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

        {/* Section 4: Long-Term Health Goals */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Long-Term Goals</Text>
            <Text style={styles.sectionSubtitle}>Consistency builds lasting cardiovascular health</Text>
          </View>
        </View>

        <View style={styles.goalsList}>
          {goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeaderRow}>
                  <View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalSubtitle}>
                      {goal.current} / {goal.target} {goal.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.goalAddBtn}
                    onPress={() => incrementGoal(goal.id, goal.step)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={14} color={Colors.primary} />
                    <Text style={styles.goalAddBtnText}>+{goal.step}{goal.unit}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.goalPercentRow}>
                  <Text style={styles.goalPercentText}>{Math.round(progress)}% of weekly goal</Text>
                  <Text style={styles.goalTargetText}>Target: {goal.target} {goal.unit}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Guided Exercise Session Modal (with To-Do List & Online YouTube Video Scraping) */}
      <ExerciseSessionModal
        visible={sessionModalVisible}
        exercise={selectedExercise}
        userCondition={userConditions[0]}
        onClose={() => setSessionModalVisible(false)}
        onComplete={handleCompleteSession}
      />

      {/* Add Custom Activity Modal */}
      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCustomActivity}
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
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  adherenceGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  adherenceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  adherenceCardLabel: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  adherenceNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  adherenceBigNum: {
    ...Typography.fontSize.xxl,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  adherenceSubLabel: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.medium,
    color: Colors.secondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressFillDone: {
    backgroundColor: Colors.secondary,
  },
  adherenceStatsText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    paddingTop: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 8,
    height: 52,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
  barFillToday: {
    backgroundColor: Colors.secondary,
  },
  barLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textLight,
    marginTop: 4,
  },
  barLabelToday: {
    color: Colors.secondaryDark,
    ...Typography.fontWeight.bold,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  doseCountBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  doseCountText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  checklistList: {
    gap: 8,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginTop: 8,
  },
  emptyCardSub: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  checklistItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  checklistItemDone: {
    backgroundColor: '#F8FCF8',
    borderColor: '#C3E5CB',
  },
  checklistItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: Colors.surface,
  },
  checkCircleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  doseInfo: {
    flex: 1,
    marginRight: 8,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doseName: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
  },
  doseNameDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  streakBadgeText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.accentDark,
  },
  doseMeta: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  doseRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeTaken: {
    backgroundColor: '#D1F2D9',
  },
  badgePending: {
    backgroundColor: Colors.surfaceVariant,
  },
  statusBadgeText: {
    ...Typography.fontSize.xs,
    fontWeight: '700',
  },
  badgeTakenText: {
    color: Colors.success,
  },
  badgePendingText: {
    color: Colors.textSecondary,
  },
  exerciseActionRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  launchExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  launchExerciseBtnText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  categoryPillsRow: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  catFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catFilterPillSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catFilterPillText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  catFilterPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  exerciseCatalogList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCardName: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  exerciseCardDescription: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  exerciseChipOrange: {
    backgroundColor: Colors.accentSoft,
  },
  exerciseChipRed: {
    backgroundColor: '#FDE8E8',
  },
  exerciseChipGreen: {
    backgroundColor: Colors.successLight,
  },
  exerciseChipText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  conditionsTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  conditionsTagsLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textLight,
    marginRight: 4,
  },
  conditionTagPill: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  conditionTagText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  cardStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cardStartBtnText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
    flex: 1,
    marginLeft: 6,
  },
  expandHeaderBtn: {
    padding: 6,
  },
  dietRecCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  dietConditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dietConditionTitle: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  foodGroupTitle: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.secondaryDark,
    marginBottom: 4,
  },
  foodPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  foodPillGreenText: {
    ...Typography.fontSize.xs,
    color: Colors.secondaryDark,
  },
  foodPillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  foodPillRedText: {
    ...Typography.fontSize.xs,
    color: Colors.error,
  },
  dietTipsBox: {
    marginTop: 10,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
  },
  dietTipsTitle: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 3,
  },
  tipItemText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  goalsList: {
    gap: 8,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
  },
  goalSubtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  goalAddBtnText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  goalPercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalPercentText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  goalTargetText: {
    ...Typography.fontSize.xs,
    color: Colors.textLight,
  },
});
