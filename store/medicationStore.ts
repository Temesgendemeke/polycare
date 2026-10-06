import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Medication, DrugInteraction, DoseSchedule, AdherenceRecord } from '../types';
import { SAMPLE_MEDICATIONS, SampleMedication, todayKey, doseSlotsForFrequency } from '../constants/sampleMedications';
import { medicationsApi } from '../lib/api';
import { getAuthToken } from '../lib/api';

interface MedicationState {  medications: Medication[];
  // Doctor-prescribed list (hardcoded demo data). Users mark each dose as
  // taken; adherence = takenDoses / scheduledDoses * 100, shown live.
  prescribedMeds: SampleMedication[];
  // Today's taken dose-slot indices per prescribed med, reset each day.
  doseSlotsToday: Record<string, number[]>;
  doseSlotDay: string;
  // Past days' daily adherence % (oldest -> newest, max 6). Today's live
  // value is always appended by the UI for the weekly chart.
  adherenceHistory: number[];
  interactions: DrugInteraction[];
  doseSchedules: DoseSchedule[];
  adherenceRecords: AdherenceRecord[];
  isLoading: boolean;

  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  setMedications: (medications: Medication[]) => void;
  addInteraction: (interaction: DrugInteraction) => void;
  clearInteractions: () => void;
  addDoseSchedule: (schedule: DoseSchedule) => void;
  updateDoseSchedule: (id: string, updates: Partial<DoseSchedule>) => void;
  addAdherenceRecord: (record: AdherenceRecord) => void;
  getAdherenceRate: (medicationId: string, days: number) => number;
  togglePrescribedSlot: (id: string, slotIndex: number) => void;
  markPrescribedSlotTaken: (id: string, slotIndex: number) => void;
  slotTakenToday: (id: string, slotIndex: number) => boolean;
  resetPrescribedMeds: () => void;
  fetchMedications: () => Promise<void>;
  syncToServer: () => Promise<void>;
}

const rolloverSlots = (state: MedicationState, today: string) => {
  if (state.doseSlotDay === today) {
    return { slots: state.doseSlotsToday, history: state.adherenceHistory, rolled: false };
  }
  const allSlotsCount = state.prescribedMeds.reduce(
    (sum, m) => sum + (doseSlotsForFrequency(m.frequency).length || 1),
    0
  );
  const takenCount = Object.values(state.doseSlotsToday).reduce(
    (sum, arr) => sum + ((arr as number[])?.length || 0),
    0
  );
  const rate = allSlotsCount > 0 ? Math.round((takenCount / allSlotsCount) * 100) : 100;
  const history = [...(state.adherenceHistory || []).slice(-5), rate];
  return { slots: {} as Record<string, number[]>, history, rolled: true };
};

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      prescribedMeds: SAMPLE_MEDICATIONS.map((m) => ({ ...m })),
      doseSlotsToday: {},
      doseSlotDay: todayKey(),
      adherenceHistory: [85, 90, 100, 70, 80, 95],
      interactions: [],
      doseSchedules: [],
      adherenceRecords: [],
      isLoading: false,

      addMedication: async (medication) => {
        set((state) => ({ medications: [...state.medications, medication] }));
        try {
          if (getAuthToken()) {
            await medicationsApi.create(medication);
          }
        } catch {}
      },

      updateMedication: (id, updates) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, ...updates } : med
          ),
        }));
        medicationsApi.update(id, updates).catch(() => {});
      },

      deleteMedication: async (id) => {
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
        }));
        try {
          if (getAuthToken()) {
            await medicationsApi.delete(id);
          }
        } catch {}
      },

      setMedications: (medications) => set({ medications }),

      addInteraction: (interaction) =>
        set((state) => ({ interactions: [...state.interactions, interaction] })),

      clearInteractions: () => set({ interactions: [] }),

      addDoseSchedule: (schedule) =>
        set((state) => ({ doseSchedules: [...state.doseSchedules, schedule] })),

      updateDoseSchedule: (id, updates) =>
        set((state) => ({
          doseSchedules: state.doseSchedules.map((schedule) =>
            schedule.medicationId === id ? { ...schedule, ...updates } : schedule
          ),
        })),

      addAdherenceRecord: (record) =>
        set((state) => ({ adherenceRecords: [...state.adherenceRecords, record] })),

      getAdherenceRate: (medicationId, days) => {
        const records = get().adherenceRecords
          .filter((r) => r.medicationId === medicationId)
          .slice(-days);

        if (records.length === 0) return 0;
        const totalTaken = records.reduce((sum, r) => sum + r.takenDoses, 0);
        const totalScheduled = records.reduce((sum, r) => sum + r.scheduledDoses, 0);
        return totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0;
      },

      togglePrescribedSlot: (id, slotIndex) => {
        const day = todayKey();
        set((state) => {
          const rolled = rolloverSlots(state, day);
          const current = rolled.slots[id] ?? [];
          const isTaken = current.includes(slotIndex);
          const next = isTaken
            ? current.filter((s: number) => s !== slotIndex)
            : [...current, slotIndex];
          return {
            doseSlotDay: day,
            doseSlotsToday: { ...rolled.slots, [id]: next },
            adherenceHistory: rolled.history,
            prescribedMeds: state.prescribedMeds.map((med) =>
              med.id === id
                ? {
                    ...med,
                    takenDoses: isTaken
                      ? Math.max(med.takenDoses - 1, 0)
                      : Math.min(med.takenDoses + 1, med.scheduledDoses),
                  }
                : med
            ),
          };
        });
      },

      markPrescribedSlotTaken: (id, slotIndex) => {
        const day = todayKey();
        const state = get();
        const rolled = rolloverSlots(state, day);
        if ((rolled.slots[id] ?? []).includes(slotIndex)) {
          if (rolled.rolled) {
            set({
              doseSlotDay: day,
              doseSlotsToday: rolled.slots,
              adherenceHistory: rolled.history,
            });
          }
          return;
        }
        set({
          doseSlotDay: day,
          doseSlotsToday: { ...rolled.slots, [id]: [...(rolled.slots[id] ?? []), slotIndex] },
          adherenceHistory: rolled.history,
          prescribedMeds: state.prescribedMeds.map((med) =>
            med.id === id
              ? { ...med, takenDoses: Math.min(med.takenDoses + 1, med.scheduledDoses) }
              : med
          ),
        });
      },

      slotTakenToday: (id, slotIndex) => {
        const state = get();
        if (state.doseSlotDay !== todayKey()) return false;
        return (state.doseSlotsToday[id] ?? []).includes(slotIndex);
      },

      resetPrescribedMeds: () => {
        set({ prescribedMeds: SAMPLE_MEDICATIONS.map((m) => ({ ...m })) });
      },

      fetchMedications: async () => {
        if (!getAuthToken()) return;
        set({ isLoading: true });
        try {
          const data = await medicationsApi.getAll();
          const mapped: Medication[] = data.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            genericName: item.genericName,
            dosage: item.dosage,
            unit: item.unit,
            frequency: item.frequency,
            instructions: item.instructions || '',
            startDate: item.startDate,
            endDate: item.endDate,
            status: item.status || 'active',
            prescribedBy: item.prescribedBy,
            notes: item.notes,
            refillDate: item.refillDate,
            currentStock: item.currentStock,
          }));
          set({ medications: mapped, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      syncToServer: async () => {
        if (!getAuthToken()) return;
        const { medications } = get();
        for (const med of medications) {
          try {
            await medicationsApi.create(med);
          } catch {}
        }
      },
    }),
    {
      name: 'medication-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        medications: state.medications,
        prescribedMeds: state.prescribedMeds,
        doseSlotsToday: state.doseSlotsToday,
        doseSlotDay: state.doseSlotDay,
        interactions: state.interactions,
        doseSchedules: state.doseSchedules,
        adherenceRecords: state.adherenceRecords,
      }),
    }
  )
);
