import db from './index';
import type {
  UserSettings,
  ExerciseMax,
  WorkoutSession,
  WorkoutSet,
  DailyNutrition,
  Meal,
  DailyCheckin,
  ProgressPhoto
} from '../types';

// User Settings
export const getUserSettings = (): UserSettings => {
  return db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as UserSettings;
};

export const updateUserSettings = (settings: Partial<UserSettings>): void => {
  const current = getUserSettings();
  const updated = { ...current, ...settings, updated_at: new Date().toISOString() };

  db.prepare(`
    UPDATE user_settings SET
      height_inches = ?,
      current_weight = ?,
      target_weight = ?,
      current_phase = ?,
      wake_time = ?,
      workout_time = ?,
      workout_time_weekend = ?,
      program_start_date = ?,
      phase_start_date = ?,
      updated_at = ?
    WHERE id = 1
  `).run(
    updated.height_inches,
    updated.current_weight,
    updated.target_weight,
    updated.current_phase,
    updated.wake_time,
    updated.workout_time,
    updated.workout_time_weekend || '09:00',
    updated.program_start_date,
    updated.phase_start_date || updated.program_start_date,
    updated.updated_at
  );
};

export const transitionPhase = (newPhase: 'bulk' | 'cut' | 'maintain'): void => {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE user_settings SET
      current_phase = ?,
      phase_start_date = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(newPhase, today);
};

// Exercise Maxes
export const getExerciseMax = (exerciseName: string): ExerciseMax | undefined => {
  return db.prepare('SELECT * FROM exercise_maxes WHERE exercise_name = ?').get(exerciseName) as ExerciseMax | undefined;
};

export const getAllExerciseMaxes = (): ExerciseMax[] => {
  return db.prepare('SELECT * FROM exercise_maxes ORDER BY exercise_name').all() as ExerciseMax[];
};

export const upsertExerciseMax = (
  exerciseName: string,
  data: {
    one_rep_max?: number;
    last_working_weight?: number;
    last_reps_achieved?: number;
    last_rpe?: number | null;
    last_session_date?: string;
  }
): void => {
  const existing = getExerciseMax(exerciseName);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE exercise_maxes SET
        one_rep_max = COALESCE(?, one_rep_max),
        last_working_weight = COALESCE(?, last_working_weight),
        last_reps_achieved = COALESCE(?, last_reps_achieved),
        last_rpe = ?,
        last_session_date = COALESCE(?, last_session_date),
        updated_at = ?
      WHERE exercise_name = ?
    `).run(
      data.one_rep_max ?? null,
      data.last_working_weight ?? null,
      data.last_reps_achieved ?? null,
      data.last_rpe ?? null,
      data.last_session_date ?? null,
      now,
      exerciseName
    );
  } else {
    db.prepare(`
      INSERT INTO exercise_maxes (exercise_name, one_rep_max, last_working_weight, last_reps_achieved, last_rpe, last_session_date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      exerciseName,
      data.one_rep_max ?? null,
      data.last_working_weight ?? null,
      data.last_reps_achieved ?? null,
      data.last_rpe ?? null,
      data.last_session_date ?? null,
      now
    );
  }
};

// Workout Sessions
export const createWorkoutSession = (data: {
  date: string;
  workout_type: string;
  program_day: number;
}): number => {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO workout_sessions (date, workout_type, program_day, started_at)
    VALUES (?, ?, ?, ?)
  `).run(data.date, data.workout_type, data.program_day, now);
  return result.lastInsertRowid as number;
};

export const getWorkoutSession = (id: number): WorkoutSession | undefined => {
  return db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(id) as WorkoutSession | undefined;
};

export const getWorkoutSessionByDate = (date: string): WorkoutSession | undefined => {
  return db.prepare('SELECT * FROM workout_sessions WHERE date = ? ORDER BY id DESC LIMIT 1').get(date) as WorkoutSession | undefined;
};

export const completeWorkoutSession = (id: number, notes?: string): void => {
  const session = getWorkoutSession(id);
  if (!session) return;

  const now = new Date().toISOString();
  const startTime = new Date(session.started_at).getTime();
  const duration = Math.round((Date.now() - startTime) / 60000);

  db.prepare(`
    UPDATE workout_sessions SET
      completed_at = ?,
      total_duration_minutes = ?,
      notes = ?
    WHERE id = ?
  `).run(now, duration, notes ?? null, id);
};

export const getRecentWorkoutSessions = (limit: number = 30): WorkoutSession[] => {
  return db.prepare(`
    SELECT * FROM workout_sessions
    WHERE completed_at IS NOT NULL
    ORDER BY date DESC
    LIMIT ?
  `).all(limit) as WorkoutSession[];
};

// Workout Sets
export const createWorkoutSet = (data: {
  session_id: number;
  exercise_name: string;
  set_number: number;
  target_reps: number;
  target_weight: number;
}): number => {
  const result = db.prepare(`
    INSERT INTO workout_sets (session_id, exercise_name, set_number, target_reps, target_weight)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.session_id, data.exercise_name, data.set_number, data.target_reps, data.target_weight);
  return result.lastInsertRowid as number;
};

export const completeWorkoutSet = (id: number, data: {
  actual_reps: number;
  actual_weight: number;
  rpe?: number;
  rest_duration_seconds?: number;
}): void => {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE workout_sets SET
      actual_reps = ?,
      actual_weight = ?,
      rpe = ?,
      rest_duration_seconds = ?,
      completed_at = ?
    WHERE id = ?
  `).run(data.actual_reps, data.actual_weight, data.rpe ?? null, data.rest_duration_seconds ?? null, now, id);
};

export const getSessionSets = (sessionId: number): WorkoutSet[] => {
  return db.prepare('SELECT * FROM workout_sets WHERE session_id = ? ORDER BY id').all(sessionId) as WorkoutSet[];
};

export const getExerciseHistory = (exerciseName: string, limit: number = 10): WorkoutSet[] => {
  return db.prepare(`
    SELECT ws.* FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    WHERE ws.exercise_name = ? AND ws.completed_at IS NOT NULL
    ORDER BY s.date DESC, ws.set_number
    LIMIT ?
  `).all(exerciseName, limit) as WorkoutSet[];
};

// Daily Nutrition
export const getOrCreateDailyNutrition = (date: string, targets: {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): DailyNutrition => {
  let nutrition = db.prepare('SELECT * FROM daily_nutrition WHERE date = ?').get(date) as DailyNutrition | undefined;

  if (!nutrition) {
    db.prepare(`
      INSERT INTO daily_nutrition (date, target_calories, target_protein, target_carbs, target_fats)
      VALUES (?, ?, ?, ?, ?)
    `).run(date, targets.calories, targets.protein, targets.carbs, targets.fats);
    nutrition = db.prepare('SELECT * FROM daily_nutrition WHERE date = ?').get(date) as DailyNutrition;
  }

  return nutrition;
};

export const updateNutritionActuals = (id: number): void => {
  // Recalculate actuals from meals
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN was_eaten = 1 THEN calories ELSE 0 END), 0) as calories,
      COALESCE(SUM(CASE WHEN was_eaten = 1 THEN protein ELSE 0 END), 0) as protein,
      COALESCE(SUM(CASE WHEN was_eaten = 1 THEN carbs ELSE 0 END), 0) as carbs,
      COALESCE(SUM(CASE WHEN was_eaten = 1 THEN fats ELSE 0 END), 0) as fats,
      COUNT(*) as total_meals,
      SUM(CASE WHEN was_eaten = 1 THEN 1 ELSE 0 END) as eaten_meals
    FROM meals WHERE nutrition_id = ?
  `).get(id) as { calories: number; protein: number; carbs: number; fats: number; total_meals: number; eaten_meals: number };

  const compliance = totals.total_meals > 0 ? (totals.eaten_meals / totals.total_meals) * 100 : 0;

  db.prepare(`
    UPDATE daily_nutrition SET
      actual_calories = ?,
      actual_protein = ?,
      actual_carbs = ?,
      actual_fats = ?,
      compliance_percentage = ?
    WHERE id = ?
  `).run(totals.calories, totals.protein, totals.carbs, totals.fats, compliance, id);
};

// Meals
export const createMeal = (data: {
  nutrition_id: number;
  meal_number: number;
  meal_name: string;
  scheduled_time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): number => {
  const result = db.prepare(`
    INSERT INTO meals (nutrition_id, meal_number, meal_name, scheduled_time, calories, protein, carbs, fats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.nutrition_id, data.meal_number, data.meal_name, data.scheduled_time,
    data.calories, data.protein, data.carbs, data.fats
  );
  return result.lastInsertRowid as number;
};

export const getMealsByNutritionId = (nutritionId: number): Meal[] => {
  return db.prepare('SELECT * FROM meals WHERE nutrition_id = ? ORDER BY meal_number').all(nutritionId) as Meal[];
};

export const logMeal = (id: number, wasEaten: boolean, notes?: string): void => {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE meals SET was_eaten = ?, logged_at = ?, notes = ? WHERE id = ?
  `).run(wasEaten ? 1 : 0, now, notes ?? null, id);

  // Get nutrition_id and update actuals
  const meal = db.prepare('SELECT nutrition_id FROM meals WHERE id = ?').get(id) as { nutrition_id: number };
  if (meal) {
    updateNutritionActuals(meal.nutrition_id);
  }
};

// Daily Check-ins
export const getOrCreateDailyCheckin = (date: string): DailyCheckin => {
  let checkin = db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(date) as DailyCheckin | undefined;

  if (!checkin) {
    db.prepare('INSERT INTO daily_checkins (date) VALUES (?)').run(date);
    checkin = db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(date) as DailyCheckin;
  }

  return checkin;
};

export const logWeight = (date: string, weight: number, notes?: string): void => {
  const checkin = getOrCreateDailyCheckin(date);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE daily_checkins SET morning_weight = ?, notes = ? WHERE id = ?
  `).run(weight, notes ?? null, checkin.id);

  // Also update user current weight in settings
  db.prepare(`
    UPDATE user_settings SET current_weight = ?, updated_at = ? WHERE id = 1
  `).run(weight, now);
};

// Log body measurements
export const logBodyMeasurements = (date: string, measurements: {
  waist?: number;
  chest?: number;
  shoulders?: number;
  arms?: number;
  thighs?: number;
}): void => {
  const checkin = getOrCreateDailyCheckin(date);
  db.prepare(`
    UPDATE daily_checkins SET
      waist_measurement = COALESCE(?, waist_measurement),
      chest_measurement = COALESCE(?, chest_measurement),
      shoulder_measurement = COALESCE(?, shoulder_measurement),
      arm_measurement = COALESCE(?, arm_measurement),
      thigh_measurement = COALESCE(?, thigh_measurement)
    WHERE id = ?
  `).run(
    measurements.waist ?? null,
    measurements.chest ?? null,
    measurements.shoulders ?? null,
    measurements.arms ?? null,
    measurements.thighs ?? null,
    checkin.id
  );
};

// Get recent body measurements
export const getRecentMeasurements = (limit: number = 30): {
  date: string;
  waist: number | null;
  chest: number | null;
  shoulders: number | null;
  arms: number | null;
  thighs: number | null;
}[] => {
  return db.prepare(`
    SELECT
      date,
      waist_measurement as waist,
      chest_measurement as chest,
      shoulder_measurement as shoulders,
      arm_measurement as arms,
      thigh_measurement as thighs
    FROM daily_checkins
    WHERE waist_measurement IS NOT NULL
       OR chest_measurement IS NOT NULL
       OR shoulder_measurement IS NOT NULL
       OR arm_measurement IS NOT NULL
       OR thigh_measurement IS NOT NULL
    ORDER BY date DESC
    LIMIT ?
  `).all(limit) as {
    date: string;
    waist: number | null;
    chest: number | null;
    shoulders: number | null;
    arms: number | null;
    thighs: number | null;
  }[];
};

// Get first measurement for comparison
export const getFirstMeasurements = (): {
  date: string;
  waist: number | null;
  chest: number | null;
  shoulders: number | null;
  arms: number | null;
  thighs: number | null;
} | undefined => {
  return db.prepare(`
    SELECT
      date,
      waist_measurement as waist,
      chest_measurement as chest,
      shoulder_measurement as shoulders,
      arm_measurement as arms,
      thigh_measurement as thighs
    FROM daily_checkins
    WHERE waist_measurement IS NOT NULL
       OR chest_measurement IS NOT NULL
    ORDER BY date ASC
    LIMIT 1
  `).get() as {
    date: string;
    waist: number | null;
    chest: number | null;
    shoulders: number | null;
    arms: number | null;
    thighs: number | null;
  } | undefined;
};

export const getRecentWeights = (limit: number = 30): { date: string; weight: number }[] => {
  return db.prepare(`
    SELECT date, morning_weight as weight FROM daily_checkins
    WHERE morning_weight IS NOT NULL
    ORDER BY date DESC
    LIMIT ?
  `).all(limit) as { date: string; weight: number }[];
};

export const getCheckinByDate = (date: string): DailyCheckin | undefined => {
  return db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(date) as DailyCheckin | undefined;
};

// Progress Photos
export const createProgressPhoto = (data: {
  checkin_id: number;
  angle: 'front' | 'side' | 'back';
  file_path: string;
  thumbnail_path: string;
}): number => {
  const result = db.prepare(`
    INSERT INTO progress_photos (checkin_id, angle, file_path, thumbnail_path)
    VALUES (?, ?, ?, ?)
  `).run(data.checkin_id, data.angle, data.file_path, data.thumbnail_path);
  return result.lastInsertRowid as number;
};

export const getPhotosByCheckinId = (checkinId: number): ProgressPhoto[] => {
  return db.prepare('SELECT * FROM progress_photos WHERE checkin_id = ?').all(checkinId) as ProgressPhoto[];
};

export const getRecentPhotos = (limit: number = 12): (ProgressPhoto & { date: string })[] => {
  return db.prepare(`
    SELECT p.*, c.date FROM progress_photos p
    JOIN daily_checkins c ON p.checkin_id = c.id
    ORDER BY c.date DESC, p.created_at DESC
    LIMIT ?
  `).all(limit) as (ProgressPhoto & { date: string })[];
};

// Get strength progress (first recorded weight vs current for each exercise)
export const getStrengthProgress = (): {
  exercise_name: string;
  first_weight: number;
  first_date: string;
  current_weight: number;
  current_date: string;
  change_lbs: number;
  change_percent: number;
  one_rep_max: number | null;
}[] => {
  return db.prepare(`
    SELECT
      e.exercise_name,
      e.last_working_weight as current_weight,
      e.one_rep_max,
      e.last_session_date as current_date,
      COALESCE(
        (SELECT ws.actual_weight FROM workout_sets ws
         JOIN workout_sessions s ON ws.session_id = s.id
         WHERE ws.exercise_name = e.exercise_name AND ws.actual_weight IS NOT NULL
         ORDER BY s.date ASC LIMIT 1),
        e.last_working_weight
      ) as first_weight,
      COALESCE(
        (SELECT s.date FROM workout_sets ws
         JOIN workout_sessions s ON ws.session_id = s.id
         WHERE ws.exercise_name = e.exercise_name AND ws.actual_weight IS NOT NULL
         ORDER BY s.date ASC LIMIT 1),
        e.last_session_date
      ) as first_date
    FROM exercise_maxes e
    WHERE e.last_working_weight IS NOT NULL
    ORDER BY e.exercise_name
  `).all().map((row: unknown) => {
    const r = row as { exercise_name: string; first_weight: number; first_date: string; current_weight: number; current_date: string; one_rep_max: number | null };
    const change = r.current_weight - r.first_weight;
    const changePercent = r.first_weight > 0 ? (change / r.first_weight) * 100 : 0;
    return {
      ...r,
      change_lbs: change,
      change_percent: Math.round(changePercent * 10) / 10,
    };
  });
};

// Get volume history for trend tracking
export const getVolumeHistory = (days: number = 30): {
  date: string;
  workout_type: string;
  total_volume: number;
  total_sets: number;
}[] => {
  return db.prepare(`
    SELECT
      s.date,
      s.workout_type,
      COALESCE(SUM(ws.actual_weight * ws.actual_reps), 0) as total_volume,
      COUNT(CASE WHEN ws.completed_at IS NOT NULL THEN 1 END) as total_sets
    FROM workout_sessions s
    LEFT JOIN workout_sets ws ON s.id = ws.session_id
    WHERE s.completed_at IS NOT NULL
      AND s.date >= date('now', '-' || ? || ' days')
    GROUP BY s.id
    ORDER BY s.date DESC
  `).all(days) as {
    date: string;
    workout_type: string;
    total_volume: number;
    total_sets: number;
  }[];
};

// Get nutrition compliance history
export const getNutritionCompliance = (days: number = 30): {
  date: string;
  target_calories: number;
  actual_calories: number;
  target_protein: number;
  actual_protein: number;
  compliance_percentage: number;
}[] => {
  return db.prepare(`
    SELECT
      date,
      target_calories,
      actual_calories,
      target_protein,
      actual_protein,
      compliance_percentage
    FROM daily_nutrition
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `).all(days) as {
    date: string;
    target_calories: number;
    actual_calories: number;
    target_protein: number;
    actual_protein: number;
    compliance_percentage: number;
  }[];
};

// Get first and latest photos for comparison
export const getComparisonPhotos = (angle: 'front' | 'side' | 'back'): {
  first: { file_path: string; date: string } | null;
  latest: { file_path: string; date: string } | null;
} => {
  const first = db.prepare(`
    SELECT p.file_path, c.date
    FROM progress_photos p
    JOIN daily_checkins c ON p.checkin_id = c.id
    WHERE p.angle = ?
    ORDER BY c.date ASC
    LIMIT 1
  `).get(angle) as { file_path: string; date: string } | undefined;

  const latest = db.prepare(`
    SELECT p.file_path, c.date
    FROM progress_photos p
    JOIN daily_checkins c ON p.checkin_id = c.id
    WHERE p.angle = ?
    ORDER BY c.date DESC
    LIMIT 1
  `).get(angle) as { file_path: string; date: string } | undefined;

  return {
    first: first || null,
    latest: latest || null,
  };
};

// Get average RPE for an exercise from recent sessions
export const getExerciseAverageRPE = (exerciseName: string, sessions: number = 3): number | null => {
  const result = db.prepare(`
    SELECT AVG(ws.rpe) as avg_rpe
    FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    WHERE ws.exercise_name = ?
      AND ws.rpe IS NOT NULL
      AND s.completed_at IS NOT NULL
    ORDER BY s.date DESC
    LIMIT ?
  `).get(exerciseName, sessions * 4) as { avg_rpe: number | null } | undefined;

  return result?.avg_rpe ? Math.round(result.avg_rpe * 10) / 10 : null;
};

// Streak calculation
export const getWorkoutStreak = (): { currentStreak: number; longestStreak: number; totalWorkouts: number; thisWeek: boolean[] } => {
  // Get all completed workout dates
  const workouts = db.prepare(`
    SELECT DISTINCT date FROM workout_sessions
    WHERE completed_at IS NOT NULL
    ORDER BY date DESC
  `).all() as { date: string }[];

  const totalWorkouts = workouts.length;

  if (totalWorkouts === 0) {
    return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisWeek: [false, false, false, false, false, false, false] };
  }

  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = new Set(workouts.map(w => w.date));

  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check if today or yesterday has a workout (to continue streak)
  const todayStr = checkDate.toISOString().split('T')[0];
  const yesterdayDate = new Date(checkDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Start counting from today if there's a workout, otherwise from yesterday
  if (workoutDates.has(todayStr)) {
    checkDate = new Date(today);
  } else if (workoutDates.has(yesterdayStr)) {
    checkDate = yesterdayDate;
  } else {
    // Streak is broken
    currentStreak = 0;
  }

  if (workoutDates.has(checkDate.toISOString().split('T')[0])) {
    while (workoutDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  // Sort dates ascending for longest streak calculation
  const sortedDates = Array.from(workoutDates).sort();

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);

    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate this week's workouts (Mon-Sun)
  const thisWeek: boolean[] = [];
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to Monday start
  startOfWeek.setDate(startOfWeek.getDate() - diff);

  for (let i = 0; i < 7; i++) {
    const weekDay = new Date(startOfWeek);
    weekDay.setDate(weekDay.getDate() + i);
    const weekDayStr = weekDay.toISOString().split('T')[0];
    thisWeek.push(workoutDates.has(weekDayStr));
  }

  return { currentStreak, longestStreak, totalWorkouts, thisWeek };
};
