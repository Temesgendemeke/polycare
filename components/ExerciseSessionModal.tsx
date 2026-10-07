import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { Exercise } from '../types/exercise';

interface Props {
  visible: boolean;
  exercise: Exercise | null;
  userCondition?: string;
  onClose: () => void;
  onComplete: (exerciseId: string, todosCompleted: string[], durationMinutes: number) => void;
}

export default function ExerciseSessionModal({
  visible,
  exercise,
  onClose,
  onComplete,
}: Props) {
  if (!exercise) return null;

  // Checklist state
  const initialTodos = exercise.todos && exercise.todos.length > 0
    ? exercise.todos
    : [
        'Pre-session vitals & comfortable attire',
        '5-minute warm-up & gentle joint mobility',
        `Main exercise session: ${exercise.duration} mins at ${exercise.intensity} intensity`,
        'Mid-point hydration & fatigue check',
        '5-minute cool-down & gentle stretches',
        'Post-exercise recovery vitals check',
      ];

  const [todos, setTodos] = useState<string[]>(initialTodos);
  const [completedTodos, setCompletedTodos] = useState<Set<number>>(new Set());
  const [newTodoText, setNewTodoText] = useState('');
  const [showAddTodo, setShowAddTodo] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Reset when modal opens
  useEffect(() => {
    if (visible && exercise) {
      const defaultTasks = exercise.todos && exercise.todos.length > 0 ? exercise.todos : initialTodos;
      setTodos(defaultTasks);
      setCompletedTodos(new Set());
      setElapsedSeconds(0);
      setIsTimerRunning(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, exercise]);

  // Timer ticker
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTodo = (index: number) => {
    setCompletedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddTodo = () => {
    const trimmed = newTodoText.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, trimmed]);
    setNewTodoText('');
    setShowAddTodo(false);
  };

  const markAllTodos = () => {
    const allSet = new Set<number>();
    todos.forEach((_, idx) => allSet.add(idx));
    setCompletedTodos(allSet);
  };

  const handleFinish = () => {
    const doneList = todos.filter((_, idx) => completedTodos.has(idx));
    const durationSpent = Math.max(1, Math.round(elapsedSeconds / 60));
    onComplete(exercise.id, doneList, durationSpent);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completionRatio = todos.length > 0 ? completedTodos.size / todos.length : 0;
  const completionPct = Math.round(completionRatio * 100);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>{exercise.name}</Text>
            <Text style={styles.topBarSub}>Step-by-Step Exercise Session</Text>
          </View>
          <TouchableOpacity onPress={markAllTodos} style={styles.quickAllBtn} activeOpacity={0.7}>
            <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
            <Text style={styles.quickAllText}>All Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Exercise Overview Card */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewTopRow}>
              <View style={styles.overviewIconCircle}>
                <Ionicons
                  name={
                    exercise.category === 'cardio'
                      ? 'walk'
                      : exercise.category === 'strength'
                      ? 'barbell'
                      : 'fitness'
                  }
                  size={26}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.overviewTitle}>{exercise.name}</Text>
                <Text style={styles.overviewDescription}>{exercise.description}</Text>
              </View>
            </View>

            {/* Badges Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="fitness-outline" size={13} color={Colors.primary} />
                <Text style={styles.metaBadgeText}>{exercise.category.toUpperCase()}</Text>
              </View>
              <View style={[styles.metaBadge, styles.metaBadgeOrange]}>
                <Ionicons name="speedometer-outline" size={13} color={Colors.accentDark} />
                <Text style={[styles.metaBadgeText, { color: Colors.accentDark }]}>
                  {exercise.intensity.toUpperCase()} INTENSITY
                </Text>
              </View>
              <View style={[styles.metaBadge, styles.metaBadgeGreen]}>
                <Ionicons name="time-outline" size={13} color={Colors.secondaryDark} />
                <Text style={[styles.metaBadgeText, { color: Colors.secondaryDark }]}>
                  {exercise.duration} MIN TARGET
                </Text>
              </View>
              {exercise.caloriesBurned ? (
                <View style={[styles.metaBadge, styles.metaBadgeRed]}>
                  <Ionicons name="flame-outline" size={13} color={Colors.error} />
                  <Text style={[styles.metaBadgeText, { color: Colors.error }]}>
                    ~{exercise.caloriesBurned} KCAL
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Active Workout Timer Card */}
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <View>
                <Text style={styles.timerLabel}>Session Timer</Text>
                <Text style={styles.timerSubLabel}>
                  {isTimerRunning ? 'Active Workout Running' : 'Timer Paused / Ready'}
                </Text>
              </View>
              <Text style={styles.timerBigDigits}>
                {formatTimer(elapsedSeconds)}
                <Text style={styles.timerTotalDigits}> / {formatTimer(exercise.duration * 60)}</Text>
              </Text>
            </View>
            <View style={styles.timerControlsRow}>
              <TouchableOpacity
                style={[styles.timerControlBtn, isTimerRunning ? styles.btnPause : styles.btnPlay]}
                onPress={() => setIsTimerRunning(!isTimerRunning)}
                activeOpacity={0.85}
              >
                <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                <Text style={styles.timerBtnText}>{isTimerRunning ? 'Pause' : 'Start Timer'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timerResetBtn}
                onPress={() => {
                  setIsTimerRunning(false);
                  setElapsedSeconds(0);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
                <Text style={styles.timerResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TO-DO CHECKLIST SECTION */}
          <View style={styles.todoSection}>
            <View style={styles.todoHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Exercise Checklist & To-Dos</Text>
                <Text style={styles.sectionSubtitle}>
                  Check off each step as you complete your routine
                </Text>
              </View>
              <View style={styles.todoCountBadge}>
                <Text style={styles.todoCountText}>
                  {completedTodos.size}/{todos.length}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
            </View>
            <Text style={styles.progressSummaryText}>
              {completionPct}% finished • {todos.length - completedTodos.size} remaining
            </Text>

            {/* Checklist Items */}
            <View style={styles.todoListContainer}>
              {todos.map((todoItem, idx) => {
                const isDone = completedTodos.has(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.todoItemRow, isDone && styles.todoItemRowDone]}
                    onPress={() => toggleTodo(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.todoCheckCircle, isDone && styles.todoCheckCircleDone]}>
                      {isDone && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                    <View style={styles.todoTextContainer}>
                      <Text style={[styles.todoItemText, isDone && styles.todoItemTextDone]}>
                        {todoItem}
                      </Text>
                      <Text style={styles.todoStepLabel}>Step {idx + 1}</Text>
                    </View>
                    <View style={[styles.stepStatusBadge, isDone ? styles.badgeDone : styles.badgePending]}>
                      <Text style={[styles.stepStatusText, isDone ? styles.badgeDoneText : styles.badgePendingText]}>
                        {isDone ? 'Completed' : 'To Do'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add Custom To-Do Step */}
            {showAddTodo ? (
              <View style={styles.addTodoBox}>
                <TextInput
                  style={styles.addTodoInput}
                  placeholder="e.g. 10 deep breaths at the finish line..."
                  placeholderTextColor={Colors.textLight}
                  value={newTodoText}
                  onChangeText={setNewTodoText}
                  autoFocus
                />
                <View style={styles.addTodoActionsRow}>
                  <TouchableOpacity
                    style={styles.addTodoCancelBtn}
                    onPress={() => { setShowAddTodo(false); setNewTodoText(''); }}
                  >
                    <Text style={styles.addTodoCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addTodoConfirmBtn} onPress={handleAddTodo}>
                    <Text style={styles.addTodoConfirmText}>Add Checkpoint</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addStepButton}
                onPress={() => setShowAddTodo(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.addStepButtonText}>Add Custom Step / Checkpoint</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Clinical Safety & Precautions Alert */}
          {exercise.precautions && exercise.precautions.length > 0 && (
            <View style={styles.safetyBox}>
              <View style={styles.safetyTitleRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.warning} />
                <Text style={styles.safetyTitle}>Safety & Precautions</Text>
              </View>
              {exercise.precautions.map((precaution, pIdx) => (
                <View key={pIdx} style={styles.precautionItemRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.warning} />
                  <Text style={styles.precautionText}>{precaution}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Completion Button */}
          <TouchableOpacity
            style={[styles.finishBtn, completionPct === 100 && styles.finishBtnAllDone]}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.finishBtnText}>
              {completionPct === 100 ? 'Complete Routine & Log Progress' : `Log Exercise (${completedTodos.size}/${todos.length} Done)`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  topBarTitle: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  topBarSub: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  quickAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.infoLight,
  },
  quickAllText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  overviewIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTitle: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  overviewDescription: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  metaBadgeOrange: {
    backgroundColor: Colors.accentSoft,
  },
  metaBadgeGreen: {
    backgroundColor: Colors.successLight,
  },
  metaBadgeRed: {
    backgroundColor: Colors.errorLight,
  },
  metaBadgeText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  timerLabel: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
  },
  timerSubLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  timerBigDigits: {
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  timerTotalDigits: {
    ...Typography.fontSize.sm,
    color: Colors.textLight,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerControlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  btnPlay: {
    backgroundColor: Colors.primary,
  },
  btnPause: {
    backgroundColor: Colors.accent,
  },
  timerBtnText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  timerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerResetText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  todoSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  todoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 2,
  },
  todoCountBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  todoCountText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  progressSummaryText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  todoListContainer: {
    gap: 8,
  },
  todoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todoItemRowDone: {
    backgroundColor: Colors.successLight,
    borderColor: '#BEE7C8',
  },
  todoCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: Colors.surface,
  },
  todoCheckCircleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  todoTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  todoItemText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.medium,
    color: Colors.text,
  },
  todoItemTextDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  todoStepLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  stepStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepStatusText: {
    ...Typography.fontSize.xs,
  },
  badgeDone: {
    backgroundColor: '#D1F2D9',
  },
  badgeDoneText: {
    ...Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: Colors.surfaceVariant,
  },
  badgePendingText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
  },
  addStepButtonText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  addTodoBox: {
    marginTop: 8,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addTodoInput: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.fontSize.sm,
    color: Colors.text,
    marginBottom: 8,
  },
  addTodoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  addTodoCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTodoCancelText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  addTodoConfirmBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  addTodoConfirmText: {
    ...Typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  safetyBox: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FCE0BD',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  safetyTitle: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  precautionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  precautionText: {
    ...Typography.fontSize.xs,
    color: Colors.text,
    flex: 1,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  finishBtnAllDone: {
    backgroundColor: Colors.secondary,
  },
  finishBtnText: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
