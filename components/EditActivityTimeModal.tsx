import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { formatTime, parseTimeTo24 } from '../lib/utils/formatDate';

interface Props {
  visible: boolean;
  onClose: () => void;
  activityName: string;
  currentTime?: string; // "HH:MM" (24h)
  onSave: (time24: string) => void;
}

const PRESETS = [
  { label: 'Morning', timeStr: '8:00', ampm: 'AM' as const },
  { label: 'Noon', timeStr: '12:00', ampm: 'PM' as const },
  { label: 'Evening', timeStr: '6:00', ampm: 'PM' as const },
  { label: 'Bedtime', timeStr: '9:00', ampm: 'PM' as const },
];

export default function EditActivityTimeModal({ visible, onClose, activityName, currentTime, onSave }: Props) {
  const [timeStr, setTimeStr] = useState('8:00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      const display = formatTime(currentTime || '08:00');
      const [t, p] = display.split(' ');
      setTimeStr(t);
      setAmpm(p === 'PM' ? 'PM' : 'AM');
      setError('');
    }
  }, [visible, currentTime]);

  const handleSave = () => {
    const time24 =
      parseTimeTo24(`${timeStr.trim()} ${ampm}`) ?? parseTimeTo24(timeStr);
    if (!time24) {
      setError('Enter a valid time, e.g. 8:00 AM');
      return;
    }
    onSave(time24);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.title}>Activity Reminder Time</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {activityName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.inputLabel}>Remind me at</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={timeStr}
                onChangeText={(v) => {
                  setTimeStr(v);
                  setError('');
                }}
                placeholder="8:00"
                keyboardType="numbers-and-punctuation"
                placeholderTextColor={Colors.textLight}
              />
              <View style={styles.ampmToggle}>
                {(['AM', 'PM'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.ampmChip, ampm === period && styles.ampmChipActive]}
                    onPress={() => setAmpm(period)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.ampmChipText, ampm === period && styles.ampmChipTextActive]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick presets */}
            <View style={styles.presetRow}>
              {PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetChip}
                  onPress={() => {
                    setTimeStr(preset.timeStr);
                    setAmpm(preset.ampm);
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetText}>
                    {preset.timeStr} {preset.ampm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="notifications-outline" size={14} color={Colors.primary} />
              <Text style={styles.noteText}>
                You'll get a notification at this time every day. It also appears on the
                Reminders screen where you can edit it further.
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Reminder Time</Text>
            </TouchableOpacity>
          </View>
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 120,
    textAlign: 'center',
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
  },
  ampmToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  ampmChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ampmChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ampmChipText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  ampmChipTextActive: {
    color: Colors.textOnPrimary,
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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  noteText: {
    flex: 1,
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  saveBtn: {
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
  saveBtnText: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
