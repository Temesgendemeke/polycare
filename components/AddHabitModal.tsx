import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (newHabit: {
    name: string;
    description: string;
    category: 'exercise' | 'habit' | 'diet';
    duration?: number;
  }) => void;
}

export default function AddHabitModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'exercise' | 'habit' | 'diet'>('exercise');
  const [duration, setDuration] = useState('20');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please provide a habit or activity name');
      return;
    }
    setError('');
    onAdd({
      name: name.trim(),
      description: description.trim() || 'Daily wellness routine',
      category,
      duration: parseInt(duration, 10) || 20,
    });
    setName('');
    setDescription('');
    setDuration('20');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New Health Activity</Text>
              <Text style={styles.subtitle}>Add a daily habit or exercise checkpoint</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Category Switcher */}
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {(['exercise', 'habit', 'diet'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      cat === 'exercise'
                        ? 'fitness'
                        : cat === 'habit'
                        ? 'checkmark-circle'
                        : 'nutrition'
                    }
                    size={16}
                    color={category === cat ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name input */}
            <Text style={styles.inputLabel}>Activity Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Evening Brisk Walk, Blood Sugar Log"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />

            {/* Duration (if exercise) */}
            {category === 'exercise' && (
              <>
                <Text style={styles.inputLabel}>Target Duration (Minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
              </>
            )}

            {/* Description */}
            <Text style={styles.inputLabel}>Goal / Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 20 minutes brisk pace around neighborhood..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Add To Daily Checklist</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  errorText: {
    ...Typography.fontSize.xs,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Typography.fontSize.sm,
    color: Colors.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  submitBtnText: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
