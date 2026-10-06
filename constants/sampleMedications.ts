import { Medication } from '../types/medication';

// Hardcoded demo medication list. Each entry carries the doses scheduled
// vs. actually taken so adherence can be derived with:
//   adherenceRate = takenDoses / scheduledDoses * 100
export interface SampleMedication extends Medication {
  scheduledDoses: number;
  takenDoses: number;
  withFood?: boolean;
}

export const SAMPLE_MEDICATIONS: SampleMedication[] = [
  {
    id: 'sample-metformin',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosage: 500,
    unit: 'mg',
    frequency: 'twice_daily',
    instructions: 'Take with food',
    startDate: '2024-01-10',
    status: 'active',
    prescribedBy: 'Dr. Alemu',
    scheduledDoses: 60,
    takenDoses: 55,
    withFood: true,
  },
  {
    id: 'sample-lisinopril',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: 10,
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take in the morning',
    startDate: '2024-01-10',
    status: 'active',
    prescribedBy: 'Dr. Alemu',
    scheduledDoses: 30,
    takenDoses: 28,
  },
  {
    id: 'sample-atorvastatin',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    dosage: 20,
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take in the evening',
    startDate: '2024-02-01',
    status: 'active',
    prescribedBy: 'Dr. Selam',
    scheduledDoses: 30,
    takenDoses: 24,
  },
  {
    id: 'sample-amlodipine',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    dosage: 5,
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take at the same time daily',
    startDate: '2024-03-15',
    status: 'active',
    prescribedBy: 'Dr. Selam',
    scheduledDoses: 30,
    takenDoses: 30,
  },
  {
    id: 'sample-aspirin',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    dosage: 81,
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take with water',
    startDate: '2024-03-15',
    status: 'active',
    prescribedBy: 'Dr. Alemu',
    scheduledDoses: 30,
    takenDoses: 21,
  },
];

// Default dose times per frequency. Daily frequencies render one
// checkmark per slot (e.g. twice_daily -> 08:00 + 20:00).
export const DOSE_TIMES: Record<string, string[]> = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_times_daily: ['08:00', '14:00', '20:00'],
  four_times_daily: ['08:00', '12:00', '18:00', '22:00'],
  every_8_hours: ['06:00', '14:00', '22:00'],
  every_12_hours: ['08:00', '20:00'],
  every_24_hours: ['08:00'],
};

export const doseSlotsForFrequency = (frequency: string): string[] =>
  DOSE_TIMES[frequency] ?? [];

export const isDailyFrequency = (frequency: string): boolean =>
  frequency in DOSE_TIMES;

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// adherence = takenDoses / scheduledDoses * 100 (0 when nothing scheduled)
export const calcAdherenceRate = (takenDoses: number, scheduledDoses: number): number => {
  if (!scheduledDoses || scheduledDoses <= 0) return 0;
  return Math.round((takenDoses / scheduledDoses) * 100);
};

// Overall adherence across a list = total taken / total scheduled * 100
export const calcOverallAdherence = (meds: Pick<SampleMedication, 'takenDoses' | 'scheduledDoses'>[]): number => {
  const scheduled = meds.reduce((sum, m) => sum + m.scheduledDoses, 0);
  const taken = meds.reduce((sum, m) => sum + m.takenDoses, 0);
  return calcAdherenceRate(taken, scheduled);
};
