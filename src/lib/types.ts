// User Settings
export interface UserSettings {
  id: number;
  height_inches: number;
  current_weight: number;
  target_weight: number;
  current_phase: 'bulk' | 'cut' | 'maintain';
  wake_time: string;
  workout_time: string;
  workout_time_weekend: string;
  program_start_date: string;
  phase_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseConfig {
  id: string;
  name: string;
  order: number;
  targets: {
    start_weight: number;
    goal_weight_min: number;
    goal_weight_max: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    weekly_rate: number;
  };
  duration: {
    min_weeks: number;
    max_weeks: number;
  };
  transition: {
    trigger: 'weight_reached' | 'duration_reached';
    next_phase: string;
  };
  description: string;
}

// Exercise Maxes
export interface ExerciseMax {
  id: number;
  exercise_name: string;
  one_rep_max: number | null;
  last_working_weight: number | null;
  last_reps_achieved: number | null;
  last_rpe: number | null;
  last_session_date: string | null;
  updated_at: string;
}

// Workout Sessions
export interface WorkoutSession {
  id: number;
  date: string;
  workout_type: string;
  program_day: number;
  started_at: string;
  completed_at: string | null;
  total_duration_minutes: number | null;
  notes: string | null;
}

// Workout Sets
export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_name: string;
  set_number: number;
  target_reps: number;
  actual_reps: number | null;
  target_weight: number;
  actual_weight: number | null;
  rpe: number | null;
  rest_duration_seconds: number | null;
  completed_at: string | null;
}

// Daily Nutrition
export interface DailyNutrition {
  id: number;
  date: string;
  target_calories: number;
  actual_calories: number;
  target_protein: number;
  actual_protein: number;
  target_carbs: number;
  actual_carbs: number;
  target_fats: number;
  actual_fats: number;
  compliance_percentage: number;
}

// Meals
export interface Meal {
  id: number;
  nutrition_id: number;
  meal_number: number;
  meal_name: string;
  scheduled_time: string;
  logged_at: string | null;
  was_eaten: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes: string | null;
}

// Daily Check-ins
export interface DailyCheckin {
  id: number;
  date: string;
  morning_weight: number | null;
  waist_measurement: number | null;
  chest_measurement: number | null;
  shoulder_measurement: number | null;
  arm_measurement: number | null;
  thigh_measurement: number | null;
  notes: string | null;
  created_at: string;
}

// Body Measurements for tracking
export interface BodyMeasurements {
  waist: number | null;
  chest: number | null;
  shoulders: number | null;
  arms: number | null;
  thighs: number | null;
}

// Strength Standards
export interface StrengthStandard {
  exercise: string;
  beginner: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

// PR Record
export interface PRRecord {
  exercise_name: string;
  weight: number;
  reps: number;
  one_rep_max: number;
  date: string;
  is_new_pr: boolean;
}

// Progress Photos
export interface ProgressPhoto {
  id: number;
  checkin_id: number;
  angle: 'front' | 'side' | 'back';
  file_path: string;
  thumbnail_path: string;
  created_at: string;
}

// JSON Data Types
export interface WorkoutProgram {
  program: {
    name: string;
    days_per_cycle: number;
    description: string;
  };
  schedule: WorkoutDay[];
}

export interface WorkoutDay {
  day: number;
  name: string;
  focus: string;
  muscles: string[];
  estimated_duration_minutes: number;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  type: 'compound' | 'isolation';
  progression: 'heavy' | 'moderate' | 'light';
  muscle_group: string;
  form_cues: string[];
}

export interface MealPlan {
  meta: {
    version: string;
    created: string;
    phase: string;
    daily_targets: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
    };
  };
  food_database: Record<string, FoodItem>;
  schedules: {
    weekday: MealSchedule;
    weekend: MealSchedule;
  };
}

export interface FoodItem {
  name: string;
  serving_size_g: number;
  serving_unit?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface MealSchedule {
  name: string;
  days: string[];
  notes: string;
  meals: MealTemplate[];
  daily_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface MealTemplate {
  meal_number: number;
  name: string;
  time: string;
  foods: {
    food_id: string;
    quantity: number;
    display: string;
  }[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

// Keep Phase for backwards compatibility
export interface Phase {
  name: string;
  daily_targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: MealTemplate[];
}

// API Response Types
export interface DashboardData {
  settings: UserSettings;
  todayCheckin: DailyCheckin | null;
  todayWorkout: WorkoutDay | null;
  todayNutrition: DailyNutrition | null;
  programDay: number;
  isRestDay: boolean;
  recentWeights: { date: string; weight: number }[];
  strengthProgress: { exercise: string; startWeight: number; currentWeight: number; change: number }[];
}

export interface ActiveWorkoutState {
  session: WorkoutSession;
  workout: WorkoutDay;
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: WorkoutSet[];
  isResting: boolean;
  restTimeRemaining: number;
}
