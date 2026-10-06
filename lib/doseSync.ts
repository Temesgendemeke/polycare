import { useMedicationStore } from '../store/medicationStore';
import { useReminderStore } from '../store/reminderStore';
import { doseSlotsForFrequency } from '../constants/sampleMedications';
import { Reminder } from '../types';

const isToday = (iso?: string): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
};

// Called after a dose slot is toggled on the Medications screen.
// Mirrors the slot state onto its linked reminder (matched by prescribed
// medication id + slot time) so both screens stay in sync.
export const syncSlotToReminder = async (medId: string, slotIndex: number): Promise<void> => {
  const medState = useMedicationStore.getState();
  const med = medState.prescribedMeds.find((m) => m.id === medId);
  if (!med) return;
  const time = doseSlotsForFrequency(med.frequency)[slotIndex];
  if (!time) return;

  const taken = medState.slotTakenToday(medId, slotIndex);
  const remState = useReminderStore.getState();
  const reminder = remState.reminders.find(
    (r) => r.medicationId === medId && r.time === time
  );
  if (!reminder) return;

  if (taken && !isToday(reminder.lastTaken)) {
    await remState.updateReminder(
      reminder.id,
      { lastTaken: new Date().toISOString() },
      reminder.title
    );
  } else if (!taken && isToday(reminder.lastTaken)) {
    await remState.updateReminder(
      reminder.id,
      { lastTaken: undefined },
      reminder.title
    );
  }
};

// Called after a reminder is marked taken on the Reminders screen.
// If the reminder belongs to a doctor-prescribed dose slot, marks that
// slot taken too (one-way: unmarking happens from the Medications screen).
export const syncReminderToSlot = (reminder: Reminder): void => {
  const medState = useMedicationStore.getState();
  const med = medState.prescribedMeds.find((m) => m.id === reminder.medicationId);
  if (!med) return;
  const slotIndex = doseSlotsForFrequency(med.frequency).indexOf(reminder.time);
  if (slotIndex < 0 || medState.slotTakenToday(med.id, slotIndex)) return;
  medState.markPrescribedSlotTaken(med.id, slotIndex);
};
