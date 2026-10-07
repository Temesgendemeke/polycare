// Exercise service - business logic for exercise recommendations

import { Exercise, NCDType } from '../types';

export interface ExerciseRecommendation {
  condition: NCDType;
  recommended: Exercise[];
  avoided: string[];
  tips: string[];
}

export class ExerciseService {
  /**
   * Get exercise recommendations based on health conditions
   */
  static getRecommendations(conditions: NCDType[]): ExerciseRecommendation[] {
    const recommendations: ExerciseRecommendation[] = [];
    
    const exerciseDatabase = this.getExerciseDatabase();
    
    conditions.forEach((condition) => {
      const recommended = exerciseDatabase.filter((ex) =>
        ex.suitableConditions.includes(condition)
      );
      
      const avoided = this.getAvoidedExercises(condition);
      const tips = this.getExerciseTips(condition);
      
      recommendations.push({
        condition,
        recommended,
        avoided,
        tips,
      });
    });
    
    return recommendations;
  }

  /**
   * Get exercise database
   */
  static getExerciseDatabase(): Exercise[] {
    return [
      {
        id: 'walking',
        name: 'Walking',
        category: 'cardio',
        intensity: 'moderate',
        duration: 30,
        caloriesBurned: 130,
        description: 'Brisk walking at a comfortable pace to maintain cardiovascular fitness',
        instructions: [
          'Start with 5-10 minutes',
          'Gradually increase to 30 minutes',
          'Maintain comfortable pace',
          'Wear supportive shoes',
        ],
        todos: [
          'Pre-walk vitals check & hydrate with 1 cup of water',
          '5-minute warm-up: slow shoulder rolls & ankle rotations',
          '20-minute brisk walk at steady conversational pace',
          'Mid-point posture check: relax shoulders and breathe evenly',
          '5-minute cool-down walk followed by gentle calf stretches',
          'Post-exercise resting pulse & blood pressure check',
        ],
        suitableConditions: ['hypertension', 'diabetes', 'heart_failure', 'copd'],
        precautions: ['Stop if you feel dizzy or short of breath'],
      },
      {
        id: 'swimming',
        name: 'Swimming',
        category: 'cardio',
        intensity: 'moderate',
        duration: 30,
        caloriesBurned: 180,
        description: 'Low-impact full-body exercise gentle on joints and heart',
        instructions: [
          'Start with 15-20 minutes',
          'Use proper breathing technique',
          'Stay within comfort zone',
        ],
        todos: [
          'Pre-swim hydration & gentle joint mobilization on pool deck',
          '5-minute warm-up: gentle flutter kicks & water walking',
          '15-minute steady lap swimming or gentle water aerobics',
          'Rhythmic breathing synchronization across strokes',
          '5-minute floating cool-down & gentle wall stretches',
          'Hydration & monitor energy levels post-swim',
        ],
        suitableConditions: ['hypertension', 'diabetes', 'heart_failure', 'copd'],
        precautions: ['Avoid if you have open wounds', 'Supervision recommended for heart patients'],
      },
      {
        id: 'cycling',
        name: 'Cycling',
        category: 'cardio',
        intensity: 'moderate',
        duration: 30,
        caloriesBurned: 160,
        description: 'Stationary or outdoor cycling to strengthen legs and lower blood pressure',
        instructions: [
          'Adjust seat height properly',
          'Start with low resistance',
          'Gradually increase duration',
        ],
        todos: [
          'Set stationary bike seat height to hip level',
          '5-minute low-resistance pedal warm-up',
          '15-minute steady moderate cadence (50-60 RPM)',
          'Keep grip loose on handlebars & upright posture',
          '5-minute zero-resistance cool-down cycle',
          'Post-ride quad & hamstring stretches',
        ],
        suitableConditions: ['hypertension', 'diabetes'],
        precautions: ['Avoid if you have balance issues', 'Heart patients should avoid high resistance'],
      },
      {
        id: 'strength-training',
        name: 'Light Strength Training',
        category: 'strength',
        intensity: 'low',
        duration: 20,
        caloriesBurned: 110,
        description: 'Resistance exercises with light weights or bands for muscle tone and insulin sensitivity',
        instructions: [
          'Start with no weights or very light weights',
          'Focus on proper form',
          'Breathe regularly',
          'Rest between sets',
        ],
        todos: [
          'Light upper-body warm-up (arm circles, torso twists)',
          'Set 1: Seated resistance band rows (10 reps, slow release)',
          '60-second rest break & hydration sip',
          'Set 2: Chair sit-to-stands or wall push-ups (8-10 reps)',
          'Set 3: Seated bicep curls with light resistance (10 reps)',
          'Cool-down breathing & gentle chest/arm stretches',
        ],
        suitableConditions: ['diabetes', 'hypertension'],
        precautions: ['Avoid holding breath', 'Heart patients should consult doctor first'],
      },
      {
        id: 'yoga',
        name: 'Gentle Yoga',
        category: 'flexibility',
        intensity: 'low',
        duration: 30,
        caloriesBurned: 90,
        description: 'Stretching and breathing exercises to reduce stress and arterial stiffness',
        instructions: [
          'Start with basic poses',
          'Focus on breathing',
          'Move slowly',
          'Listen to your body',
        ],
        todos: [
          'Set yoga mat, comfortable clothes & centering breath',
          '3-minute Cat-Cow gentle spine mobilization',
          'Gentle Warrior I & mountain pose balance practice',
          'Seated side body reaches & gentle spinal twists',
          '5-minute resting Savasana with conscious relaxation',
          'Notice calm respiration & lowered tension',
        ],
        suitableConditions: ['hypertension', 'diabetes', 'copd'],
        precautions: ['Avoid inverted poses with hypertension', 'Stop if you feel dizzy'],
      },
      {
        id: 'breathing-exercises',
        name: 'Breathing Exercises',
        category: 'flexibility',
        intensity: 'low',
        duration: 10,
        caloriesBurned: 35,
        description: 'Controlled breathing techniques to calm sympathetic nervous system and improve lung capacity',
        instructions: [
          'Sit comfortably',
          'Breathe in slowly through nose',
          'Breathe out slowly through mouth',
          'Repeat for 5-10 minutes',
        ],
        todos: [
          'Find an upright, supported chair with relaxed shoulders',
          '5 cycles of Pursed-Lip Breathing (inhale 2s, exhale 4s)',
          'Diaphragmatic belly expansion check with hands on abdomen',
          '3 minutes of rhythmic paced respiratory calm',
          'Take note of reduced shortness of breath & heart rate',
        ],
        suitableConditions: ['copd', 'asthma', 'hypertension', 'heart_failure'],
        precautions: ['Stop if you feel lightheaded'],
      },
    ];
  }

  /**
   * Get exercise by ID
   */
  static getExerciseById(id: string): Exercise | undefined {
    return this.getExerciseDatabase().find((ex) => ex.id === id);
  }

  /**
   * Get exercises to avoid for specific conditions
   */
  private static getAvoidedExercises(condition: NCDType): string[] {
    const avoidedExercises: Record<NCDType, string[]> = {
      hypertension: ['Heavy weightlifting', 'High-intensity interval training', 'Isometric exercises'],
      diabetes: ['High-impact activities with foot problems', 'Exercises that cause hypoglycemia risk'],
      heart_failure: ['High-intensity exercises', 'Exercises with arms above head', 'Heavy lifting'],
      copd: ['High-intensity activities', 'Exercises in cold air', 'Swimming in chlorinated pools'],
      asthma: ['Cold weather exercises', 'High-intensity activities', 'Exercises in polluted areas'],
      other: [],
    };
    
    return avoidedExercises[condition] || [];
  }

  /**
   * Get exercise tips for specific conditions
   */
  private static getExerciseTips(condition: NCDType): string[] {
    const tips: Record<NCDType, string[]> = {
      hypertension: [
        'Exercise regularly for at least 30 minutes most days',
        'Monitor blood pressure before and after exercise',
        'Avoid sudden intense efforts',
        'Stay hydrated',
      ],
      diabetes: [
        'Check blood sugar before and after exercise',
        'Carry fast-acting glucose',
        'Exercise at the same time each day',
        'Wear proper footwear to protect feet',
      ],
      heart_failure: [
        'Start slowly and gradually increase intensity',
        'Exercise during cooler parts of the day',
        'Stop if you experience chest pain or shortness of breath',
        'Keep emergency medications nearby',
      ],
      copd: [
        'Use pursed-lip breathing during exercise',
        'Exercise during times when breathing is better',
        'Use bronchodilators before exercise if prescribed',
        'Stay in well-ventilated areas',
      ],
      asthma: [
        'Use inhaler before exercise if prescribed',
        'Warm up slowly before exercise',
        'Avoid exercise in cold or dry air',
        'Cover mouth with scarf in cold weather',
      ],
      other: [
        'Consult your healthcare provider before starting',
        'Start slowly and progress gradually',
        'Listen to your body',
        'Stay consistent',
      ],
    };
    
    return tips[condition] || [];
  }

  /**
   * Create a personalized exercise plan
   */
  static createExercisePlan(conditions: NCDType[], availableDays: number[]): Exercise[] {
    const recommendations = this.getRecommendations(conditions);
    
    // Combine all recommended exercises
    const allExercises = recommendations.flatMap((rec) => rec.recommended);
    
    // Remove duplicates
    const uniqueExercises = Array.from(
      new Map(allExercises.map((ex) => [ex.id, ex])).values()
    );
    
    // Sort by intensity (start with lower intensity)
    const intensityOrder = { low: 1, moderate: 2, high: 3 };
    uniqueExercises.sort((a, b) => intensityOrder[a.intensity] - intensityOrder[b.intensity]);
    
    return uniqueExercises;
  }
}
