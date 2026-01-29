import { NextResponse } from 'next/server';
import { getUserSettings, getRecentWeights, getCheckinByDate, getAllExerciseMaxes, getWorkoutStreak, getWorkoutSessionByDate, transitionPhase, getOrCreateDailyNutrition, getMealsByNutritionId } from '@/lib/db/queries';
import { getCurrentProgramDay, getTodayWorkout, isRestDay, calculateWeightTrend, getDailyTargets, getMealTimes, getCurrentWorkoutTime, isWeekend } from '@/lib/calculations';
import { checkPhaseTransition, getPhaseProgress, getPhaseTargetWeight } from '@/lib/phases';
import { getToday } from '@/lib/utils';

export async function GET() {
  try {
    let settings = getUserSettings();
    const today = getToday();

    // Get weight data first for phase checks
    const recentWeights = getRecentWeights(30);
    const weightTrend = calculateWeightTrend(recentWeights);
    const currentWeight = weightTrend.sevenDayAvg || settings.current_weight;

    // Check for phase transition
    const transitionCheck = checkPhaseTransition(settings, settings.current_weight, currentWeight);
    if (transitionCheck.shouldTransition && transitionCheck.nextPhase && transitionCheck.nextPhase !== 'complete') {
      // Perform the transition
      transitionPhase(transitionCheck.nextPhase as 'bulk' | 'cut' | 'maintain');
      // Reload settings after transition
      settings = getUserSettings();
    }

    // Get phase progress
    const phaseProgress = getPhaseProgress(settings, settings.current_weight, currentWeight);

    // Get program info
    const programDay = getCurrentProgramDay(settings.program_start_date);
    const todayWorkout = getTodayWorkout(settings.program_start_date);
    const restDay = isRestDay(settings.program_start_date);

    // Get today's check-in
    const todayCheckin = getCheckinByDate(today);

    // Get nutrition targets with workout-adjusted meal times
    const dailyTargets = getDailyTargets(settings.current_phase);
    const todayWorkoutTime = getCurrentWorkoutTime(
      settings.workout_time,
      settings.workout_time_weekend || '09:00'
    );
    const isWeekendDay = isWeekend();
    const mealTimes = getMealTimes(settings.wake_time, settings.current_phase, todayWorkoutTime, isWeekendDay);

    // Get actual nutrition data for today
    const nutrition = getOrCreateDailyNutrition(today, dailyTargets);
    const meals = getMealsByNutritionId(nutrition.id);

    // Map meals with template data for display
    const mealsWithStatus = mealTimes.map((template) => {
      const dbMeal = meals.find(m => m.meal_number === template.meal_number);
      return {
        meal_number: template.meal_number,
        name: template.name,
        scheduled_time: template.scheduled_time,
        calories: template.macros.calories,
        protein: template.macros.protein,
        logged_at: dbMeal?.logged_at || null,
        was_eaten: dbMeal?.was_eaten || false,
      };
    }).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

    // Get exercise maxes for strength progress
    const exerciseMaxes = getAllExerciseMaxes();

    // Get workout streak
    const streak = getWorkoutStreak();

    // Check if today's workout is complete
    const todaySession = getWorkoutSessionByDate(today);
    const todayWorkoutComplete = todaySession?.completed_at ? true : false;

    // Calculate days since start
    const startDate = new Date(settings.program_start_date);
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get phase target weight
    const phaseTargetWeight = getPhaseTargetWeight(settings.current_phase);

    return NextResponse.json({
      settings: { ...settings, target_weight: phaseTargetWeight },
      programDay,
      daysSinceStart,
      isRestDay: restDay,
      todayWorkout,
      todayWorkoutComplete,
      todayCheckin,
      recentWeights,
      weightTrend,
      dailyTargets,
      mealTimes,
      mealsWithStatus,
      nutrition: {
        actual_calories: nutrition.actual_calories || 0,
        actual_protein: nutrition.actual_protein || 0,
        actual_carbs: nutrition.actual_carbs || 0,
        actual_fats: nutrition.actual_fats || 0,
      },
      exerciseMaxes,
      streak,
      todayWorkoutTime: todayWorkoutTime,
      isWeekend: isWeekendDay,
      phaseProgress,
      phaseTransition: transitionCheck.shouldTransition ? transitionCheck : null,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
