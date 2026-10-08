// Medication-related type definitions

export type MedicationStatus = 'active' | 'discontinued' | 'completed';

export type DoseUnit = 'mg' | 'g' | 'mcg' | 'ml' | 'units' | 'tablet' | 'capsule';

export type Frequency = 
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'every_24_hours'
  | 'as_needed'
  | 'weekly'
  | 'monthly';

export type InteractionSeverity = 'contraindicated' | 'major' | 'moderate' | 'minor';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: number;
  unit: DoseUnit;
  frequency: Frequency;
  instructions: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  prescribedBy?: string;
  notes?: string;
  refillDate?: string;
  currentStock?: number;
  imageUrl?: string | any;
}

export interface DrugInteraction {
  id: string;
  medication1Id: string;
  medication2Id: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
  references?: string[];
}

export interface DoseSchedule {
  medicationId: string;
  time: string;
  taken: boolean;
  skipped: boolean;
  notes?: string;
}

export interface AdherenceRecord {
  date: string;
  medicationId: string;
  scheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number;
}
