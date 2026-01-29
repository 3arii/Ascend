import { format, differenceInDays, addMinutes, parse } from 'date-fns';
import type { Exercise, ExerciseMax, WorkoutDay, WorkoutProgram, MealPlan, Phase } from '../types';

// Load workout data
import workoutData from '../../../data/workouts.json';
import mealData from '../../../data/meals.json';

export const workouts = workoutData as WorkoutProgram;
export const meals = mealData as MealPlan;

/**
 * Calculate current program day (1-7)
 */
export function getCurrentProgramDay(programStartDate: string): number {
  // Parse as local date components to avoid UTC timezone issues
  const [year, month, day] = programStartDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceStart = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return (daysSinceStart % 7) + 1;
}

/**
 * Get today's workout based on program day
 */
export function getTodayWorkout(programStartDate: string): WorkoutDay | null {
  const day = getCurrentProgramDay(programStartDate);
  const workout = workouts.schedule.find(w => w.day === day);
  return workout || null;
}

/**
 * Check if today is a rest day
 */
export function isRestDay(programStartDate: string): boolean {
  const day = getCurrentProgramDay(programStartDate);
  return day === 7;
}

/**
 * Get the week's workout schedule starting from today
 */
export function getWeekSchedule(programStartDate: string): {
  date: string;
  dayName: string;
  isToday: boolean;
  workout: WorkoutDay | null;
}[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentProgramDay = getCurrentProgramDay(programStartDate);

  const schedule = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Calculate the program day for this date
    const programDay = ((currentProgramDay - 1 + i) % 7) + 1;
    const workout = workouts.schedule.find(w => w.day === programDay) || null;

    schedule.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      isToday: i === 0,
      workout,
    });
  }

  return schedule;
}

/**
 * Calculate 1RM using Brzycki formula
 * 1RM = weight × (36 / (37 - reps))
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || reps > 36) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

/**
 * Calculate working weight from 1RM based on rep range
 */
export function calculateWorkingWeight(oneRepMax: number, progression: 'heavy' | 'moderate' | 'light'): number {
  const percentages = {
    heavy: 0.825, // 80-85% for 5-6 reps
    moderate: 0.725, // 70-75% for 8-10 reps
    light: 0.625, // 60-65% for 12-15 reps
  };

  const weight = oneRepMax * percentages[progression];
  // Round to nearest 5 lbs
  return Math.round(weight / 5) * 5;
}

/**
 * Get recommended weight for an exercise based on history
 */
export function getRecommendedWeight(
  exerciseMax: ExerciseMax | undefined,
  exercise: Exercise
): { weight: number; needsInput: boolean } {
  if (!exerciseMax || !exerciseMax.last_working_weight) {
    return { weight: 0, needsInput: true };
  }

  // Parse rep range
  const repRange = exercise.reps.split('-').map(r => parseInt(r.replace(/\D/g, '')));
  const targetReps = repRange[repRange.length - 1]; // Use top of range
  const lastReps = exerciseMax.last_reps_achieved || targetReps;
  const lastWeight = exerciseMax.last_working_weight;

  // Progressive overload logic
  if (exercise.progression === 'heavy') {
    // For heavy days: increase by 5 lbs if hit top of rep range
    if (lastReps >= targetReps) {
      return { weight: lastWeight + 5, needsInput: false };
    }
    return { weight: lastWeight, needsInput: false };
  } else if (exercise.progression === 'moderate') {
    // For moderate: increase by 5 lbs if hit top of range on all sets
    if (lastReps >= targetReps) {
      return { weight: lastWeight + 5, needsInput: false };
    }
    return { weight: lastWeight, needsInput: false };
  } else {
    // For light/isolation: smaller increments
    if (lastReps >= targetReps) {
      return { weight: lastWeight + 2.5, needsInput: false };
    }
    return { weight: lastWeight, needsInput: false };
  }
}

/**
 * Parse rep range string to get min and max reps
 */
export function parseRepRange(reps: string): { min: number; max: number } {
  const cleaned = reps.replace(/[^\d-]/g, '');
  const parts = cleaned.split('-');

  if (parts.length === 2) {
    return { min: parseInt(parts[0]), max: parseInt(parts[1]) };
  }

  const single = parseInt(parts[0]);
  return { min: single, max: single };
}

/**
 * Get rest time in seconds based on exercise type
 */
export function getRestTime(exercise: Exercise): number {
  return exercise.rest_seconds;
}

/**
 * Check if today is a weekend (Saturday or Sunday)
 */
export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get the current workout time based on day of week
 */
export function getCurrentWorkoutTime(weekdayTime: string, weekendTime: string): string {
  return isWeekend() ? weekendTime : weekdayTime;
}

/**
 * Get meal times based on workout time setting
 * Uses foods from schedules but calculates times dynamically based on workout time
 */
export function getMealTimes(
  wakeTime: string,
  _phase: 'bulk' | 'cut' | 'maintain',
  workoutTime?: string,
  isWeekendDay?: boolean
): {
  meal_number: number;
  name: string;
  scheduled_time: string;
  macros: { calories: number; protein: number; carbs: number; fats: number };
  foods: { display: string }[];
}[] {
  // Use the appropriate schedule for foods and meal structure
  const schedule = isWeekendDay ? meals.schedules.weekend : meals.schedules.weekday;

  // If no workout time, use the times from JSON directly
  if (!workoutTime) {
    return schedule.meals.map(meal => ({
      meal_number: meal.meal_number,
      name: meal.name,
      scheduled_time: meal.time,
      macros: meal.macros,
      foods: meal.foods.map(f => ({ display: f.display })),
    }));
  }

  // Parse times
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
  const [workoutHour, workoutMinute] = workoutTime.split(':').map(Number);

  // Calculate minutes from midnight for easier math
  const wakeMinutes = wakeHour * 60 + wakeMinute;
  const workoutMinutes = workoutHour * 60 + workoutMinute;

  // Calculate key time points (in minutes from midnight)
  const preWorkoutMinutes = workoutMinutes - 75; // 75 min before workout (time to digest)
  const postWorkoutMinutes = workoutMinutes + 90; // 90 min after workout starts (30 min after 1hr workout)

  // Check if there's time for separate breakfast before pre-workout
  // Need at least 60 min gap between wake and pre-workout for separate meals
  const hasTimeForBreakfast = (preWorkoutMinutes - wakeMinutes) >= 60;

  // Helper to convert minutes to HH:MM
  const formatMinutes = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Calculate meal times based on workout schedule
  let mealTimes: number[];

  if (hasTimeForBreakfast) {
    // Weekend-style: Breakfast, Pre-Workout, Post-Workout, then evenly spaced
    const breakfastMinutes = wakeMinutes + 30;
    const lunchMinutes = postWorkoutMinutes + 180; // 3 hrs after post-workout
    const snackMinutes = lunchMinutes + 180; // 3 hrs after lunch
    const dinnerMinutes = snackMinutes + 180; // 3 hrs after snack
    mealTimes = [breakfastMinutes, preWorkoutMinutes, postWorkoutMinutes, lunchMinutes, snackMinutes, dinnerMinutes];
  } else {
    // Weekday-style: Pre-Workout Breakfast, Post-Workout, then evenly spaced
    const preWorkoutBreakfastMinutes = Math.max(wakeMinutes + 15, preWorkoutMinutes);
    const lunchMinutes = postWorkoutMinutes + 180;
    const snackMinutes = lunchMinutes + 180;
    const dinnerMinutes = snackMinutes + 180;
    const beforeBedMinutes = dinnerMinutes + 150; // 2.5 hrs after dinner
    mealTimes = [preWorkoutBreakfastMinutes, postWorkoutMinutes, lunchMinutes, snackMinutes, dinnerMinutes, beforeBedMinutes];
  }

  return schedule.meals.map((meal, index) => ({
    meal_number: meal.meal_number,
    name: meal.name,
    scheduled_time: formatMinutes(mealTimes[index]),
    macros: meal.macros,
    foods: meal.foods.map(f => ({ display: f.display })),
  }));
}

/**
 * Get daily targets from meal data
 */
export function getDailyTargetsFromSchedule(isWeekendDay: boolean): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  const schedule = isWeekendDay ? meals.schedules.weekend : meals.schedules.weekday;
  return schedule.daily_totals;
}

/**
 * Get daily targets based on current phase
 */
export function getDailyTargets(phase: 'bulk' | 'cut' | 'maintain'): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  // Import phase targets
  const phaseTargets: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {
    bulk: { calories: 2900, protein: 185, carbs: 350, fats: 80 },
    maintain: { calories: 2600, protein: 180, carbs: 310, fats: 70 },
    cut: { calories: 2300, protein: 200, carbs: 200, fats: 65 },
  };

  return phaseTargets[phase] || phaseTargets.bulk;
}

/**
 * Get photo angle for today (rotates: front, side, back)
 */
export function getTodayPhotoAngle(programStartDate: string): 'front' | 'side' | 'back' {
  const angles: ('front' | 'side' | 'back')[] = ['front', 'side', 'back'];
  const start = new Date(programStartDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, start);
  return angles[daysSinceStart % 3];
}

/**
 * Calculate weight trend (weekly change)
 */
export function calculateWeightTrend(weights: { date: string; weight: number }[]): {
  weeklyChange: number;
  trend: 'up' | 'down' | 'stable';
  sevenDayAvg: number;
} {
  if (weights.length < 2) {
    return { weeklyChange: 0, trend: 'stable', sevenDayAvg: weights[0]?.weight || 0 };
  }

  // Get 7-day average
  const recentWeights = weights.slice(0, 7);
  const sevenDayAvg = recentWeights.reduce((sum, w) => sum + w.weight, 0) / recentWeights.length;

  // Compare to previous 7-day average
  const previousWeights = weights.slice(7, 14);
  if (previousWeights.length === 0) {
    return { weeklyChange: 0, trend: 'stable', sevenDayAvg };
  }

  const previousAvg = previousWeights.reduce((sum, w) => sum + w.weight, 0) / previousWeights.length;
  const weeklyChange = sevenDayAvg - previousAvg;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (weeklyChange > 0.3) trend = 'up';
  else if (weeklyChange < -0.3) trend = 'down';

  return {
    weeklyChange: Math.round(weeklyChange * 10) / 10,
    trend,
    sevenDayAvg: Math.round(sevenDayAvg * 10) / 10,
  };
}

/**
 * Calculate total workout volume (sets × reps × weight)
 */
export function calculateWorkoutVolume(sets: { actual_reps: number | null; actual_weight: number | null }[]): number {
  return sets.reduce((total, set) => {
    if (set.actual_reps && set.actual_weight) {
      return total + (set.actual_reps * set.actual_weight);
    }
    return total;
  }, 0);
}

/**
 * Format time for display (seconds to MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get all unique exercises from the program
 */
export function getAllExercises(): string[] {
  const exercises = new Set<string>();
  workouts.schedule.forEach(day => {
    day.exercises.forEach(ex => exercises.add(ex.name));
  });
  return Array.from(exercises).sort();
}

/**
 * Calculate if it's a deload week
 * Deload every 4 weeks (40% volume reduction)
 */
export function isDeloadWeek(programStartDate: string): boolean {
  const start = new Date(programStartDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, start);
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  return weekNumber % 4 === 0;
}

/**
 * Get deload adjustment factor (1.0 for normal, 0.6 for deload)
 */
export function getDeloadFactor(programStartDate: string): number {
  return isDeloadWeek(programStartDate) ? 0.6 : 1.0;
}

/**
 * Get current week number of program
 */
export function getCurrentWeekNumber(programStartDate: string): number {
  const start = new Date(programStartDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, start);
  return Math.floor(daysSinceStart / 7) + 1;
}

/**
 * Calculate estimated goal date based on weight loss/gain rate
 * @param currentWeight Current weight in lbs
 * @param targetWeight Target weight in lbs
 * @param weeklyRate Weekly weight change rate (typically -1 to -2 lbs for cut, +0.5 for bulk)
 */
export function calculateGoalDate(
  currentWeight: number,
  targetWeight: number,
  weeklyRate: number
): { date: Date; weeksRemaining: number } | null {
  if (weeklyRate === 0) return null;

  const weightToChange = targetWeight - currentWeight;

  // If already at or past goal
  if ((weeklyRate > 0 && weightToChange <= 0) || (weeklyRate < 0 && weightToChange >= 0)) {
    return { date: new Date(), weeksRemaining: 0 };
  }

  const weeksRemaining = Math.abs(weightToChange / weeklyRate);
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + Math.ceil(weeksRemaining * 7));

  return { date: goalDate, weeksRemaining: Math.ceil(weeksRemaining) };
}

/**
 * Strength standards as multiplier of bodyweight
 * Based on symmetric strength standards
 */
export const STRENGTH_STANDARDS: Record<string, { beginner: number; intermediate: number; advanced: number; elite: number }> = {
  'Barbell Bench Press': { beginner: 0.5, intermediate: 1.0, advanced: 1.25, elite: 1.75 },
  'Barbell Squat': { beginner: 0.75, intermediate: 1.25, advanced: 1.5, elite: 2.25 },
  'Deadlift': { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.75 },
  'Overhead Press': { beginner: 0.35, intermediate: 0.65, advanced: 0.85, elite: 1.15 },
  'Barbell Row': { beginner: 0.5, intermediate: 0.85, advanced: 1.1, elite: 1.5 },
  'Pull-ups': { beginner: 0, intermediate: 10, advanced: 20, elite: 30 }, // In reps, not weight
};

/**
 * Get strength level for an exercise based on bodyweight
 */
export function getStrengthLevel(
  exerciseName: string,
  currentOneRepMax: number,
  bodyweight: number
): 'untested' | 'beginner' | 'intermediate' | 'advanced' | 'elite' {
  const standards = STRENGTH_STANDARDS[exerciseName];
  if (!standards || currentOneRepMax === 0) return 'untested';

  // Special case for pull-ups (measured in reps)
  if (exerciseName === 'Pull-ups') {
    if (currentOneRepMax >= standards.elite) return 'elite';
    if (currentOneRepMax >= standards.advanced) return 'advanced';
    if (currentOneRepMax >= standards.intermediate) return 'intermediate';
    return 'beginner';
  }

  const ratio = currentOneRepMax / bodyweight;

  if (ratio >= standards.elite) return 'elite';
  if (ratio >= standards.advanced) return 'advanced';
  if (ratio >= standards.intermediate) return 'intermediate';
  return 'beginner';
}

/**
 * Get strength standards for display (actual weights based on bodyweight)
 */
export function getStrengthStandardsForWeight(
  exerciseName: string,
  bodyweight: number
): { beginner: number; intermediate: number; advanced: number; elite: number } | null {
  const standards = STRENGTH_STANDARDS[exerciseName];
  if (!standards) return null;

  // Special case for pull-ups
  if (exerciseName === 'Pull-ups') {
    return standards;
  }

  return {
    beginner: Math.round(bodyweight * standards.beginner),
    intermediate: Math.round(bodyweight * standards.intermediate),
    advanced: Math.round(bodyweight * standards.advanced),
    elite: Math.round(bodyweight * standards.elite),
  };
}

/**
 * Get progressive overload recommendation with detailed suggestion
 */
export function getProgressiveOverloadSuggestion(
  exerciseMax: ExerciseMax | undefined,
  exercise: Exercise,
  isDeload: boolean
): {
  recommendedWeight: number;
  recommendation: string;
  shouldIncrease: boolean;
  increaseAmount: number;
} {
  const defaultWeight = 45; // Starting weight if no history

  if (!exerciseMax || exerciseMax.last_working_weight == null) {
    return {
      recommendedWeight: defaultWeight,
      recommendation: 'Start with a comfortable weight to assess your strength',
      shouldIncrease: false,
      increaseAmount: 0,
    };
  }

  const lastWeight = exerciseMax.last_working_weight;
  const lastReps = exerciseMax.last_reps_achieved || 0;
  const lastRpe = exerciseMax.last_rpe || 0;
  const repRange = parseRepRange(exercise.reps);

  // During deload, reduce weight by 40%
  if (isDeload) {
    const deloadWeight = Math.round((lastWeight * 0.6) / 5) * 5;
    return {
      recommendedWeight: deloadWeight,
      recommendation: 'Deload week - reduce intensity for recovery',
      shouldIncrease: false,
      increaseAmount: 0,
    };
  }

  // If last RPE was max effort (10), don't recommend increasing regardless of reps
  if (lastRpe >= 10) {
    return {
      recommendedWeight: lastWeight,
      recommendation: `Last set was max effort. Stay at ${lastWeight} lbs until it feels easier.`,
      shouldIncrease: false,
      increaseAmount: 0,
    };
  }

  // If last RPE was very high (9), be cautious about increasing
  if (lastRpe >= 9 && lastReps < repRange.max) {
    return {
      recommendedWeight: lastWeight,
      recommendation: `High effort last time. Stay at ${lastWeight} lbs and aim for ${repRange.max} reps.`,
      shouldIncrease: false,
      increaseAmount: 0,
    };
  }

  // Progressive overload logic based on progression type
  let increaseAmount = 0;
  let shouldIncrease = false;
  let recommendation = '';

  if (lastReps >= repRange.max) {
    // Hit top of rep range - time to increase (unless RPE was too high)
    if (lastRpe <= 8) {
      shouldIncrease = true;
      if (exercise.progression === 'heavy') {
        increaseAmount = 5;
        recommendation = `Great work! You hit ${lastReps} reps. Increase by 5 lbs.`;
      } else if (exercise.progression === 'moderate') {
        increaseAmount = 5;
        recommendation = `Solid progress! Increase by 5 lbs to keep progressing.`;
      } else {
        increaseAmount = 2.5;
        recommendation = `Good job on the isolation work! Small increase of 2.5 lbs.`;
      }
    } else {
      // RPE was 9, hit top of range but it was hard
      recommendation = `Hit ${lastReps} reps but RPE was high. Try ${lastWeight} lbs again for a cleaner set.`;
    }
  } else if (lastReps >= repRange.min) {
    // Within rep range - stay at same weight
    recommendation = `Stay at ${lastWeight} lbs and aim for ${repRange.max} reps.`;
  } else {
    // Below minimum reps - consider staying or reducing
    recommendation = `Focus on form. Stay at ${lastWeight} lbs until you hit ${repRange.min}+ reps.`;
  }

  const recommendedWeight = shouldIncrease ? lastWeight + increaseAmount : lastWeight;

  return {
    recommendedWeight: Math.round(recommendedWeight / 2.5) * 2.5,
    recommendation,
    shouldIncrease,
    increaseAmount,
  };
}

/**
 * Check if a set is a PR (Personal Record)
 */
export function checkForPR(
  exerciseName: string,
  weight: number,
  reps: number,
  currentMax: ExerciseMax | undefined
): { isPR: boolean; prType: 'weight' | 'volume' | 'estimated_1rm' | null; newValue: number } {
  const estimated1RM = calculate1RM(weight, reps);
  const volume = weight * reps;

  if (!currentMax || !currentMax.one_rep_max) {
    return { isPR: true, prType: 'estimated_1rm', newValue: estimated1RM };
  }

  // Check for 1RM PR
  if (estimated1RM > currentMax.one_rep_max) {
    return { isPR: true, prType: 'estimated_1rm', newValue: estimated1RM };
  }

  // Check for weight PR at same or more reps
  if (currentMax.last_working_weight && weight > currentMax.last_working_weight) {
    return { isPR: true, prType: 'weight', newValue: weight };
  }

  return { isPR: false, prType: null, newValue: 0 };
}

/**
 * Calculate RPE-based recommendations
 * RPE 6-7: Too light, increase weight
 * RPE 8-9: Perfect intensity
 * RPE 10: Too heavy, maintain or reduce
 */
export function getRPERecommendation(averageRPE: number): string {
  if (averageRPE < 6) return 'Weight too light - increase by 10-15 lbs';
  if (averageRPE < 7) return 'Weight slightly light - increase by 5 lbs next session';
  if (averageRPE <= 8.5) return 'Perfect intensity - maintain this weight';
  if (averageRPE <= 9) return 'Good challenge - stay at this weight';
  return 'Very challenging - consider staying at or reducing weight';
}

/**
 * Calculate nutrition compliance percentage
 */
export function calculateNutritionCompliance(
  actual: { calories: number; protein: number },
  target: { calories: number; protein: number }
): number {
  if (target.calories === 0) return 0;

  // Weight: 50% calories, 50% protein
  const calorieCompliance = Math.min(100, (actual.calories / target.calories) * 100);
  const proteinCompliance = Math.min(100, (actual.protein / target.protein) * 100);

  return Math.round((calorieCompliance + proteinCompliance) / 2);
}

/**
 * Get training intensity zone based on weight relative to 1RM
 */
export function getIntensityZone(weight: number, oneRepMax: number): {
  percentage: number;
  zone: 'recovery' | 'endurance' | 'hypertrophy' | 'strength' | 'power';
  description: string;
} {
  if (oneRepMax === 0) {
    return { percentage: 0, zone: 'recovery', description: 'No data' };
  }

  const percentage = (weight / oneRepMax) * 100;

  if (percentage < 50) {
    return { percentage, zone: 'recovery', description: 'Recovery/Warm-up' };
  }
  if (percentage < 65) {
    return { percentage, zone: 'endurance', description: 'Muscular Endurance' };
  }
  if (percentage < 80) {
    return { percentage, zone: 'hypertrophy', description: 'Hypertrophy' };
  }
  if (percentage < 90) {
    return { percentage, zone: 'strength', description: 'Strength' };
  }
  return { percentage, zone: 'power', description: 'Power/Max Strength' };
}
