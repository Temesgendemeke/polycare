import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Reminder } from '../types';
import { NotificationService } from '../services/notificationService';
import { remindersApi, getAuthToken } from '../lib/api';
import { SAMPLE_PRESCRIBED_DOSES } from '../constants/sampleMedications';

export const isToday = (iso?: string): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
};

interface ReminderState {
  reminders: Reminder[];
  // True once per-slot reminders have been auto-created for doctor-prescribed meds.
  prescribedSeeded: boolean;

  addReminder: (reminder: Reminder, medicationName?: string) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>, medicationName?: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string, medicationName?: string) => Promise<void>;
  markAsTaken: (id: string) => void;
  toggleTaken: (id: string) => Promise<void>;
  deleteRemindersForMedication: (medicationId: string) => Promise<void>;
  updateRemindersForMedication: (
    medicationId: string,
    updates: { title?: string; dosage?: string; instructions?: string }
  ) => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => void;
  getRemindersForDay: (day: number) => Reminder[];
  getActiveReminders: () => Reminder[];
  ensurePrescribedReminders: (
    items?: { medicationId: string; title: string; time: string; dosage?: string; instructions?: string }[]
  ) => Promise<void>;
  fetchReminders: () => Promise<void>;
  syncNotificationSchedules: () => Promise<void>;
}

const isSampleReminder = (id: string, medicationId?: string) =>
  id.startsWith('rx-sample-') || (medicationId ? medicationId.startsWith('sample-') : false);

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],
      prescribedSeeded: false,

      addReminder: async (reminder, medicationName) => {
        let notificationIds: string[] = [];
        if (reminder.enabled) {
          notificationIds = await NotificationService.scheduleReminder(reminder, medicationName);
        }

        const newReminder = { ...reminder, notificationIds };
        set((state) => ({ reminders: [...state.reminders, newReminder] }));

        if (!isSampleReminder(newReminder.id, newReminder.medicationId)) {
          try {
            if (getAuthToken()) {
              const res = await remindersApi.create(newReminder);
              const serverId = res?._id || res?.id;
              if (serverId && serverId !== newReminder.id) {
                set((state) => ({
                  reminders: state.reminders.map((r) =>
                    r.id === newReminder.id ? { ...r, id: serverId } : r
                  ),
                }));
              }
            }
          } catch (e) {
            console.warn('Failed to sync reminder with backend:', e);
          }
        }
      },

      updateReminder: async (id, updates, medicationName) => {
        const current = get().reminders.find((r) => r.id === id);
        if (!current) return;

        let notificationIds = current.notificationIds;

        const merged: Reminder = { ...current, ...updates };

        // If timing, days, or enabled status changed, reschedule notifications
        if (
          updates.time !== undefined ||
          updates.days !== undefined ||
          updates.enabled !== undefined
        ) {
          if (current.notificationIds && current.notificationIds.length > 0) {
            await NotificationService.cancelReminder(current.notificationIds);
          }

          if (merged.enabled) {
            notificationIds = await NotificationService.scheduleReminder(merged, medicationName);
          } else {
            notificationIds = [];
          }
        }

        const updatedReminder = { ...merged, notificationIds };

        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? updatedReminder : r)),
        }));

        if (!isSampleReminder(id, current.medicationId)) {
          try {
            if (getAuthToken()) {
              await remindersApi.update(id, updates);
            }
          } catch (e) {
            console.warn('Failed to sync reminder update with backend:', e);
          }
        }
      },

      deleteReminder: async (id) => {
        const reminder = get().reminders.find((r) => r.id === id);
        if (reminder?.notificationIds) {
          await NotificationService.cancelReminder(reminder.notificationIds);
        }

        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));

        if (!isSampleReminder(id, reminder?.medicationId)) {
          try {
            if (getAuthToken()) {
              await remindersApi.delete(id);
            }
          } catch (e) {
            console.warn('Failed to sync reminder deletion with backend:', e);
          }
        }
      },

      toggleReminder: async (id, medicationName) => {
        const reminder = get().reminders.find((r) => r.id === id);
        if (!reminder) return;
        await get().updateReminder(id, { enabled: !reminder.enabled }, medicationName);
      },

      markAsTaken: (id) => {
        get().updateReminder(id, { lastTaken: new Date().toISOString() });
      },

      toggleTaken: async (id) => {
        const reminder = get().reminders.find((r) => r.id === id);
        if (!reminder) return;
        const takenToday = isToday(reminder.lastTaken);
        await get().updateReminder(
          id,
          { lastTaken: takenToday ? undefined : new Date().toISOString() },
          reminder.title
        );
      },

      deleteRemindersForMedication: async (medicationId) => {
        const toDelete = get().reminders.filter((r) => r.medicationId === medicationId);
        for (const reminder of toDelete) {
          if (reminder.notificationIds && reminder.notificationIds.length > 0) {
            await NotificationService.cancelReminder(reminder.notificationIds);
          }
          if (!isSampleReminder(reminder.id, reminder.medicationId) && getAuthToken()) {
            try {
              await remindersApi.delete(reminder.id);
            } catch {}
          }
        }
        set((state) => ({
          reminders: state.reminders.filter((r) => r.medicationId !== medicationId),
        }));
      },

      updateRemindersForMedication: async (medicationId, updates) => {
        const matches = get().reminders.filter((r) => r.medicationId === medicationId);
        for (const r of matches) {
          await get().updateReminder(r.id, updates, updates.title || r.title);
        }
      },

      snoozeReminder: (id, minutes) => {
        const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
        get().updateReminder(id, { snoozedUntil });
      },

      getRemindersForDay: (day) => {
        return get().reminders.filter(
          (r) => r.enabled && (r.days.length === 0 || r.days.includes(day))
        );
      },

      getActiveReminders: () => {
        return get().reminders.filter((r) => r.enabled);
      },

      ensurePrescribedReminders: async (items) => {
        const dosesToSeed = items && items.length > 0 ? items : SAMPLE_PRESCRIBED_DOSES;
        for (const item of dosesToSeed) {
          const exists = get().reminders.some(
            (r) => r.medicationId === item.medicationId && r.time === item.time
          );
          if (exists) continue;
          try {
            await get().addReminder(
              {
                id: `rx-${item.medicationId}-${item.time.replace(':', '')}`,
                medicationId: item.medicationId,
                title: item.title,
                time: item.time,
                days: [0, 1, 2, 3, 4, 5, 6],
                enabled: true,
                dosage: item.dosage,
                instructions: item.instructions,
              },
              item.title
            );
          } catch {}
        }
        set({ prescribedSeeded: true });
      },

      fetchReminders: async () => {
        if (!getAuthToken()) return;
        try {
          const data = await remindersApi.getAll();
          const mapped: Reminder[] = data.map((item: any) => ({
            id: item.customId || item._id || item.id,
            medicationId: item.medicationId,
            title: item.title,
            time: item.time,
            days: item.days || [],
            enabled: item.enabled !== false,
            lastTaken: item.lastTaken,
            snoozedUntil: item.snoozedUntil,
            dosage: item.dosage,
            instructions: item.instructions,
            notificationIds: item.notificationIds || [],
          }));
          const sampleReminders = get().reminders.filter((r) =>
            isSampleReminder(r.id, r.medicationId)
          );
          const combined = [
            ...mapped,
            ...sampleReminders.filter((s) => !mapped.some((m) => m.id === s.id)),
          ];
          set({ reminders: combined });
          // Ensure enabled reminders are scheduled on this device
          await get().syncNotificationSchedules();
        } catch (e) {
          console.warn('Error fetching reminders:', e);
        }
      },

      syncNotificationSchedules: async () => {
        const active = get().reminders.filter((r) => r.enabled);
        for (const reminder of active) {
          // If not currently scheduled or to refresh schedules
          if (!reminder.notificationIds || reminder.notificationIds.length === 0) {
            const ids = await NotificationService.scheduleReminder(reminder);
            if (ids.length > 0) {
              set((state) => ({
                reminders: state.reminders.map((r) =>
                  r.id === reminder.id ? { ...r, notificationIds: ids } : r
                ),
              }));
            }
          }
        }
      },
    }),
    {
      name: 'reminder-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
export type { Reminder };
