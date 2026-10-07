// Exercise-related type definitions

export type ExerciseIntensity = 'low' | 'moderate' | 'high';

export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'balance';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  intensity: ExerciseIntensity;
  duration: number; // in minutes
  description: string;
  instructions: string[];
  suitableConditions: string[];
  precautions: string[];
  imageUrl?: string;
  caloriesBurned?: number;
  todos?: string[];
}

export interface ExercisePlan {
  id: string;
  userId: string;
  name: string;
  exercises: ExercisePlanItem[];
  startDate: string;
  endDate?: string;
  frequency: number; // times per week
  notes?: string;
}

export interface ExercisePlanItem {
  exerciseId: string;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  completed: boolean;
  completedAt?: string;
}

