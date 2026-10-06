import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/design';
import { useMedicationStore, useReminderStore } from '../../store';

type TaskStatus = 'pending' | 'completed';
type Task = {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
};

function generateTasks(
  medications: ReturnType<typeof useMedicationStore.getState>['medications'],
  reminders: ReturnType<typeof useReminderStore.getState>['reminders'],
  t: (key: string, params?: Record<string, string | number>) => string
): Task[] {
  const tasks: Task[] = [];

  for (const med of medications) {
    if (med.currentStock !== undefined && med.currentStock <= 3) {
      tasks.push({
        id: `stock-${med.id}`,
        title: t('tasks.refillLeft', { name: med.name, stock: med.currentStock }),
        category: t('tasks.catMedication'),
        priority: med.currentStock <= 1 ? 'high' : 'medium',
        status: 'pending',
      });
    }
    if (med.refillDate && new Date(med.refillDate) <= new Date(Date.now() + 7 * 86400000)) {
      tasks.push({
        id: `refill-${med.id}`,
        title: t('tasks.refillDue', { name: med.name, date: med.refillDate ? new Date(med.refillDate).toLocaleDateString() : '' }),
        category: t('tasks.catMedication'),
        priority: 'medium',
        status: 'pending',
      });
    }
  }

  for (const reminder of reminders) {
    if (reminder.enabled) {
      const today = new Date().getDay();
      if (reminder.days.length === 0 || reminder.days.includes(today)) {
        tasks.push({
          id: `reminder-${reminder.id}`,
          title: t('tasks.takeAt', { name: reminder.title || t('tasks.medicationFallback'), time: reminder.time }),
          category: t('tasks.catHealth'),
          priority: 'high',
          status: 'pending',
        });
      }
    }
  }

  return tasks;
}

export default function TasksScreen() {
  const { t } = useTranslation();
  const { medications } = useMedicationStore();
  const { reminders } = useReminderStore();
  const [tasks, setTasks] = useState<Task[]>(() => generateTasks(medications, reminders, t));
  const [filter, setFilter] = useState<TaskStatus>('pending');
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === filter && task.title.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [tasks, filter, search]
  );

  const completeTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: 'completed' } : task)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const refreshTasks = () => {
    setTasks(generateTasks(medications, reminders, t));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('tasks.title')}</Text>
            <Text style={styles.subtitle}>{t('tasks.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshTasks}>
            <Ionicons name="refresh" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('tasks.searchPh')}
          placeholderTextColor={Colors.textLight}
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>{t('common.pending')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>{t('common.completed')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={30} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>{t('tasks.noTasks')}</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskMain}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.taskMeta}>{task.category}</Text>
                  <Text style={[styles.taskMeta, task.priority === 'high' && styles.priorityHigh]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                {task.status === 'pending' && (
                  <TouchableOpacity style={styles.iconButton} onPress={() => completeTask(task.id)}>
                    <Ionicons name="checkmark" size={16} color={Colors.success} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.iconButton} onPress={() => removeTask(task.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  headerCard: {
    marginTop: Spacing.sm, marginBottom: Spacing.md, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, ...Shadows.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...Typography.fontSize.xl, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: 4 },
  subtitle: { ...Typography.fontSize.sm, color: Colors.textSecondary },
  refreshButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.infoLight, alignItems: 'center', justifyContent: 'center' },
  controls: { marginBottom: Spacing.md },
  searchInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.fontSize.md, color: Colors.text, marginBottom: Spacing.sm,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterButton: { flex: 1, backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm, alignItems: 'center' },
  filterButtonActive: { backgroundColor: Colors.primary },
  filterText: { ...Typography.fontSize.sm, ...Typography.fontWeight.semibold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.textOnPrimary },
  list: { paddingBottom: 110, gap: 8 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', gap: 8 },
  emptyTitle: { ...Typography.fontSize.md, color: Colors.textSecondary },
  taskCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskMain: { flex: 1, marginRight: Spacing.sm },
  taskTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 8 },
  taskMeta: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  priorityHigh: { color: Colors.error },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
});
