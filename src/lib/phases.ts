import { differenceInWeeks } from 'date-fns';
import type { PhaseConfig, UserSettings } from './types';

// Load phase configurations
import phaseData from '../../data/phases.json';

export const phases = phaseData.phases as PhaseConfig[];
export const finalTarget = phaseData.final_target;

/**
 * Get the current phase configuration
 */
export function getCurrentPhaseConfig(currentPhase: string): PhaseConfig | undefined {
  return phases.find(p => p.id === currentPhase);
}

/**
 * Get daily nutrition targets for the current phase
 */
export function getPhaseTargets(currentPhase: string): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  const phase = getCurrentPhaseConfig(currentPhase);
  if (!phase) {
    // Default to bulk if phase not found
    return { calories: 2900, protein: 185, carbs: 350, fats: 80 };
  }
  return {
    calories: phase.targets.calories,
    protein: phase.targets.protein,
    carbs: phase.targets.carbs,
    fats: phase.targets.fats,
  };
}

/**
 * Check if phase transition is needed based on current weight and time
 */
export function checkPhaseTransition(
  settings: UserSettings,
  currentWeight: number,
  sevenDayAvgWeight: number
): {
  shouldTransition: boolean;
  nextPhase: string | null;
  reason: string | null;
} {
  const phase = getCurrentPhaseConfig(settings.current_phase);
  if (!phase) {
    return { shouldTransition: false, nextPhase: null, reason: null };
  }

  // Use 7-day average weight for more stable transitions
  const weightToCheck = sevenDayAvgWeight || currentWeight;

  // Check weight-based transition
  if (phase.transition.trigger === 'weight_reached') {
    if (phase.targets.weekly_rate > 0) {
      // Bulking - check if we've reached goal weight
      if (weightToCheck >= phase.targets.goal_weight_min) {
        return {
          shouldTransition: true,
          nextPhase: phase.transition.next_phase,
          reason: `Reached bulk goal weight of ${phase.targets.goal_weight_min} lbs`,
        };
      }
    } else if (phase.targets.weekly_rate < 0) {
      // Cutting - check if we've reached goal weight
      if (weightToCheck <= phase.targets.goal_weight_max) {
        return {
          shouldTransition: true,
          nextPhase: phase.transition.next_phase,
          reason: `Reached cut goal weight of ${phase.targets.goal_weight_max} lbs`,
        };
      }
    }
  }

  // Check duration-based transition
  if (phase.transition.trigger === 'duration_reached') {
    const phaseStart = new Date(settings.phase_start_date);
    const now = new Date();
    const weeksInPhase = differenceInWeeks(now, phaseStart);

    if (weeksInPhase >= phase.duration.min_weeks) {
      return {
        shouldTransition: true,
        nextPhase: phase.transition.next_phase,
        reason: `Completed ${weeksInPhase} weeks of ${phase.name}`,
      };
    }
  }

  // Also check max duration for any phase
  const phaseStart = new Date(settings.phase_start_date);
  const now = new Date();
  const weeksInPhase = differenceInWeeks(now, phaseStart);

  if (weeksInPhase >= phase.duration.max_weeks) {
    return {
      shouldTransition: true,
      nextPhase: phase.transition.next_phase,
      reason: `Reached max duration of ${phase.duration.max_weeks} weeks`,
    };
  }

  return { shouldTransition: false, nextPhase: null, reason: null };
}

/**
 * Get phase progress information
 */
export function getPhaseProgress(
  settings: UserSettings,
  currentWeight: number,
  sevenDayAvgWeight: number
): {
  phase: PhaseConfig;
  weeksInPhase: number;
  weightProgress: number; // percentage to goal
  expectedWeeksRemaining: number;
  onTrack: boolean;
  message: string;
} | null {
  const phase = getCurrentPhaseConfig(settings.current_phase);
  if (!phase) return null;

  const phaseStart = new Date(settings.phase_start_date);
  const now = new Date();
  const weeksInPhase = differenceInWeeks(now, phaseStart);

  const weightToCheck = sevenDayAvgWeight || currentWeight;
  const startWeight = phase.targets.start_weight;
  const goalWeight = phase.targets.weekly_rate > 0
    ? phase.targets.goal_weight_min
    : phase.targets.goal_weight_max;

  // Calculate weight progress (accounting for direction)
  const totalWeightChange = goalWeight - startWeight; // Can be positive (bulk) or negative (cut)
  const currentWeightChange = weightToCheck - startWeight;

  let weightProgress = 0;
  if (totalWeightChange !== 0) {
    // For bulk: positive progress when weight increases toward goal
    // For cut: positive progress when weight decreases toward goal
    const progressRatio = currentWeightChange / totalWeightChange;
    weightProgress = Math.max(0, Math.min(100, progressRatio * 100));
  }

  // Calculate expected weeks remaining
  const remainingWeight = Math.abs(goalWeight - weightToCheck);
  const weeklyRate = Math.abs(phase.targets.weekly_rate);
  const expectedWeeksRemaining = weeklyRate > 0
    ? Math.ceil(remainingWeight / weeklyRate)
    : phase.duration.max_weeks - weeksInPhase;

  // Check if on track
  const expectedWeightChange = weeksInPhase * phase.targets.weekly_rate;
  const expectedWeight = startWeight + expectedWeightChange;
  const difference = Math.abs(weightToCheck - expectedWeight);
  const onTrack = difference <= 2; // Within 2 lbs of expected

  // Generate message
  let message = '';
  if (phase.targets.weekly_rate > 0) {
    // Bulking
    const gained = weightToCheck - startWeight;
    if (gained >= 0) {
      message = `Gained ${gained.toFixed(1)} lbs of ${Math.abs(totalWeightChange).toFixed(0)} lbs goal`;
    } else {
      message = `${Math.abs(gained).toFixed(1)} lbs below start weight`;
    }
  } else if (phase.targets.weekly_rate < 0) {
    // Cutting
    const lost = startWeight - weightToCheck;
    if (lost >= 0) {
      message = `Lost ${lost.toFixed(1)} lbs of ${Math.abs(totalWeightChange).toFixed(0)} lbs goal`;
    } else {
      message = `${Math.abs(lost).toFixed(1)} lbs above start weight`;
    }
  } else {
    // Maintenance
    message = `Week ${weeksInPhase} of ${phase.duration.min_weeks}-${phase.duration.max_weeks} week maintenance`;
  }

  return {
    phase,
    weeksInPhase,
    weightProgress,
    expectedWeeksRemaining,
    onTrack,
    message,
  };
}

/**
 * Get target weight for current phase
 */
export function getPhaseTargetWeight(currentPhase: string): number {
  const phase = getCurrentPhaseConfig(currentPhase);
  if (!phase) return 185;

  // Return the goal weight based on phase direction
  if (phase.targets.weekly_rate > 0) {
    return phase.targets.goal_weight_min; // Bulking - aim for minimum goal
  } else if (phase.targets.weekly_rate < 0) {
    return phase.targets.goal_weight_max; // Cutting - aim for maximum goal
  }
  return phase.targets.goal_weight_min; // Maintenance - maintain current
}
