import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateDailyNutrition,
  getMealsByNutritionId,
  createMeal,
  logMeal,
} from '@/lib/db/queries';
import { getUserSettings } from '@/lib/db/queries';
import { getDailyTargets, getMealTimes, getCurrentWorkoutTime } from '@/lib/calculations';
import { getToday } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getToday();

    const settings = getUserSettings();
    const targets = getDailyTargets(settings.current_phase);

    // Get workout time for the requested date
    // Parse date as local time (not UTC) to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const requestedDate = new Date(year, month - 1, day);
    const dayOfWeek = requestedDate.getDay();
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
    const workoutTime = isWeekendDay
      ? (settings.workout_time_weekend || '09:00')
      : settings.workout_time;

    const mealTemplates = getMealTimes(settings.wake_time, settings.current_phase, workoutTime, isWeekendDay);

    // Get or create nutrition record
    const nutrition = getOrCreateDailyNutrition(date, targets);

    // Get existing meals
    let meals = getMealsByNutritionId(nutrition.id);

    // If no meals exist for today, create them from templates
    if (meals.length === 0) {
      for (const template of mealTemplates) {
        createMeal({
          nutrition_id: nutrition.id,
          meal_number: template.meal_number,
          meal_name: template.name,
          scheduled_time: template.scheduled_time,
          calories: template.macros.calories,
          protein: template.macros.protein,
          carbs: template.macros.carbs,
          fats: template.macros.fats,
        });
      }
      meals = getMealsByNutritionId(nutrition.id);
    }

    // Use templates directly - they have the correct names, times, and foods
    // calculated based on workout time. Database meals are just for tracking completion.
    const mealsWithFoods = mealTemplates.map((template, index) => {
      const dbMeal = meals.find(m => m.meal_number === template.meal_number);
      return {
        id: dbMeal?.id || index + 1,
        meal_number: template.meal_number,
        meal_name: template.name,
        scheduled_time: template.scheduled_time,
        calories: template.macros.calories,
        protein: template.macros.protein,
        carbs: template.macros.carbs,
        fats: template.macros.fats,
        logged_at: (dbMeal?.logged_at && dbMeal.logged_at !== '') ? dbMeal.logged_at : null,
        was_eaten: (dbMeal?.logged_at && dbMeal.logged_at !== '') ? dbMeal.was_eaten : null,
        notes: dbMeal?.notes || null,
        foods: template.foods,
      };
    });

    // Sort meals by scheduled_time so they appear in chronological order
    const sortedMeals = mealsWithFoods.sort((a, b) => {
      return a.scheduled_time.localeCompare(b.scheduled_time);
    });

    return NextResponse.json({
      nutrition,
      meals: sortedMeals,
      targets,
      phase: settings.current_phase,
      workoutTime,
      isWeekend: isWeekendDay,
    });
  } catch (error) {
    console.error('Error fetching nutrition:', error);
    return NextResponse.json({ error: 'Failed to fetch nutrition' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, meal_id, was_eaten, notes } = body;

    if (action === 'log_meal') {
      if (!meal_id) {
        return NextResponse.json({ error: 'Meal ID required' }, { status: 400 });
      }

      logMeal(meal_id, was_eaten, notes);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error logging meal:', error);
    return NextResponse.json({ error: 'Failed to log meal' }, { status: 500 });
  }
}
