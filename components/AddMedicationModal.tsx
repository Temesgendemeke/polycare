import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMedicationStore, useReminderStore } from '../store';
import { useTranslation } from '../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { Medication, DoseUnit, Frequency } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  editMedication?: Medication;
}

const UNITS: DoseUnit[] = ['mg', 'g', 'mcg', 'ml', 'units', 'tablet', 'capsule'];
const FREQUENCIES: Frequency[] = [
  'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
  'every_8_hours', 'every_12_hours', 'every_24_hours', 'as_needed', 'weekly', 'monthly',
];

export default function AddMedicationModal({ visible, onClose, editMedication }: Props) {
  const { t } = useTranslation();
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const addReminder = useReminderStore((s) => s.addReminder);

  const [name, setName] = useState(editMedication?.name || '');
  const [genericName, setGenericName] = useState(editMedication?.genericName || '');
  const [dosage, setDosage] = useState(editMedication?.dosage?.toString() || '');
  const [unit, setUnit] = useState<DoseUnit>(editMedication?.unit || 'mg');
  const [frequency, setFrequency] = useState<Frequency>(editMedication?.frequency || 'once_daily');
  const [instructions, setInstructions] = useState(editMedication?.instructions || '');
  const [startDate, setStartDate] = useState(editMedication?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(editMedication?.endDate || '');
  const [notes, setNotes] = useState(editMedication?.notes || '');
  const [currentStock, setCurrentStock] = useState(editMedication?.currentStock?.toString() || '');

  const reset = () => {
    setName(''); setGenericName(''); setDosage(''); setUnit('mg');
    setFrequency('once_daily'); setInstructions(''); setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(''); setNotes(''); setCurrentStock('');
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert(t('common.required'), t('medModal.nameRequired')); return; }
    if (!dosage || isNaN(Number(dosage))) { Alert.alert(t('common.required'), t('medModal.dosageRequired')); return; }

    const med: Medication = {
      id: editMedication?.id || Date.now().toString(),
      name: name.trim(),
      genericName: genericName.trim() || undefined,
      dosage: Number(dosage),
      unit,
      frequency,
      instructions,
      startDate,
      endDate: endDate || undefined,
      status: 'active',
      notes: notes.trim() || undefined,
      currentStock: currentStock ? Number(currentStock) : undefined,
    };

    if (editMedication) {
      updateMedication(med.id, med);
    } else {
      addMedication(med);

      // Automatically generate active reminders based on medication frequency
      const defaultTimesForFreq: Record<string, string[]> = {
        once_daily: ['08:00'],
        twice_daily: ['08:00', '20:00'],
        three_times_daily: ['08:00', '14:00', '20:00'],
        four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
        every_8_hours: ['08:00', '16:00', '00:00'],
        every_12_hours: ['08:00', '20:00'],
        every_24_hours: ['08:00'],
        weekly: ['09:00'],
      };

      const scheduledTimes = defaultTimesForFreq[frequency] || ['08:00'];
      scheduledTimes.forEach((time, index) => {
        addReminder(
          {
            id: `${med.id}-rem-${index}-${Date.now()}`,
            medicationId: med.id,
            title: med.name,
            time,
            days: frequency === 'weekly' ? [1] : [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
            dosage: `${med.dosage} ${med.unit}`,
            instructions: med.instructions,
          },
          med.name
        );
      });
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editMedication ? t('medModal.editTitle') : t('medModal.addTitle')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('medications.medicationName')} *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('medModal.medNamePh')} placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>{t('medications.genericName')}</Text>
          <TextInput style={styles.input} value={genericName} onChangeText={setGenericName} placeholder={t('medModal.genericPh')} placeholderTextColor={Colors.textLight} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('medications.dosage')} *</Text>
              <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="500" keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity key={u} style={[styles.pill, unit === u && styles.pillActive]} onPress={() => setUnit(u)}>
                    <Text style={[styles.pillText, unit === u && styles.pillTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>{t('medications.frequency')}</Text>
          <View style={styles.pickerRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity key={f} style={[styles.freqPill, frequency === f && styles.pillActive]} onPress={() => setFrequency(f)}>
                <Text style={[styles.pillText, frequency === f && styles.pillTextActive]}>
                  {f.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('medications.instructions')}</Text>
          <TextInput style={[styles.input, styles.textArea]} value={instructions} onChangeText={setInstructions} placeholder={t('medModal.instructionsPh')} multiline numberOfLines={3} placeholderTextColor={Colors.textLight} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('medications.startDate')}</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder={t('medModal.startDatePh')} placeholderTextColor={Colors.textLight} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('medModal.endDateOptional')}</Text>
              <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder={t('medModal.startDatePh')} placeholderTextColor={Colors.textLight} />
            </View>
          </View>

          <Text style={styles.label}>{t('medModal.stock')}</Text>
          <TextInput style={styles.input} value={currentStock} onChangeText={setCurrentStock} placeholder={t('medModal.stockPh')} keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>{t('medications.notes')}</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder={t('medModal.notesPh')} multiline numberOfLines={2} placeholderTextColor={Colors.textLight} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold, color: Colors.text },
  saveText: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.primary },
  form: { padding: Spacing.md, paddingBottom: 120 },
  label: { ...Typography.fontSize.sm, ...Typography.fontWeight.medium, color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.fontSize.md, color: Colors.text,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  pillTextActive: { color: Colors.textOnPrimary, ...Typography.fontWeight.medium },
  freqPill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
});
