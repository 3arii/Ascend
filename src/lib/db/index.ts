import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ascend.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize schema
const initSchema = () => {
  db.exec(`
    -- User Settings (single row)
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      height_inches INTEGER NOT NULL DEFAULT 72,
      current_weight REAL NOT NULL DEFAULT 184,
      target_weight REAL NOT NULL DEFAULT 178,
      current_phase TEXT NOT NULL DEFAULT 'bulk' CHECK (current_phase IN ('bulk', 'cut', 'maintain')),
      wake_time TEXT NOT NULL DEFAULT '06:00',
      workout_time TEXT NOT NULL DEFAULT '07:00',
      workout_time_weekend TEXT NOT NULL DEFAULT '09:00',
      program_start_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Exercise Maxes
    CREATE TABLE IF NOT EXISTS exercise_maxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_name TEXT UNIQUE NOT NULL,
      one_rep_max REAL,
      last_working_weight REAL,
      last_reps_achieved INTEGER,
      last_session_date TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Workout Sessions
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      workout_type TEXT NOT NULL,
      program_day INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      total_duration_minutes INTEGER,
      notes TEXT
    );

    -- Workout Sets
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      target_reps INTEGER NOT NULL,
      actual_reps INTEGER,
      target_weight REAL NOT NULL,
      actual_weight REAL,
      rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
      rest_duration_seconds INTEGER,
      completed_at TEXT,
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
    );

    -- Daily Nutrition
    CREATE TABLE IF NOT EXISTS daily_nutrition (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      target_calories INTEGER NOT NULL,
      actual_calories INTEGER NOT NULL DEFAULT 0,
      target_protein INTEGER NOT NULL,
      actual_protein INTEGER NOT NULL DEFAULT 0,
      target_carbs INTEGER NOT NULL,
      actual_carbs INTEGER NOT NULL DEFAULT 0,
      target_fats INTEGER NOT NULL,
      actual_fats INTEGER NOT NULL DEFAULT 0,
      compliance_percentage REAL NOT NULL DEFAULT 0
    );

    -- Meals
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nutrition_id INTEGER NOT NULL,
      meal_number INTEGER NOT NULL,
      meal_name TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      logged_at TEXT,
      was_eaten INTEGER NOT NULL DEFAULT 0,
      calories INTEGER NOT NULL,
      protein INTEGER NOT NULL,
      carbs INTEGER NOT NULL,
      fats INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (nutrition_id) REFERENCES daily_nutrition(id)
    );

    -- Daily Check-ins
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      morning_weight REAL,
      waist_measurement REAL,
      chest_measurement REAL,
      shoulder_measurement REAL,
      arm_measurement REAL,
      thigh_measurement REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Progress Photos
    CREATE TABLE IF NOT EXISTS progress_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkin_id INTEGER NOT NULL,
      angle TEXT NOT NULL CHECK (angle IN ('front', 'side', 'back')),
      file_path TEXT NOT NULL,
      thumbnail_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (checkin_id) REFERENCES daily_checkins(id)
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_daily_nutrition_date ON daily_nutrition(date);
    CREATE INDEX IF NOT EXISTS idx_meals_nutrition ON meals(nutrition_id);
    CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
    CREATE INDEX IF NOT EXISTS idx_progress_photos_checkin ON progress_photos(checkin_id);
  `);

  // Initialize default user settings if not exists
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT OR IGNORE INTO user_settings (id, program_start_date) VALUES (1, ?)
  `).run(today);
};

// Run initialization
initSchema();

// Migration: Add new columns if they don't exist
const migrateSchema = () => {
  try {
    // Check daily_checkins columns
    const checkinColumns = db.prepare("PRAGMA table_info(daily_checkins)").all() as { name: string }[];
    const checkinColumnNames = checkinColumns.map(c => c.name);

    if (!checkinColumnNames.includes('chest_measurement')) {
      db.exec('ALTER TABLE daily_checkins ADD COLUMN chest_measurement REAL');
    }
    if (!checkinColumnNames.includes('shoulder_measurement')) {
      db.exec('ALTER TABLE daily_checkins ADD COLUMN shoulder_measurement REAL');
    }
    if (!checkinColumnNames.includes('arm_measurement')) {
      db.exec('ALTER TABLE daily_checkins ADD COLUMN arm_measurement REAL');
    }
    if (!checkinColumnNames.includes('thigh_measurement')) {
      db.exec('ALTER TABLE daily_checkins ADD COLUMN thigh_measurement REAL');
    }

    // Check user_settings columns
    const settingsColumns = db.prepare("PRAGMA table_info(user_settings)").all() as { name: string }[];
    const settingsColumnNames = settingsColumns.map(c => c.name);

    if (!settingsColumnNames.includes('workout_time_weekend')) {
      db.exec("ALTER TABLE user_settings ADD COLUMN workout_time_weekend TEXT NOT NULL DEFAULT '09:00'");
    }

    if (!settingsColumnNames.includes('phase_start_date')) {
      db.exec("ALTER TABLE user_settings ADD COLUMN phase_start_date TEXT");
      // Set phase_start_date to program_start_date for existing users
      db.exec("UPDATE user_settings SET phase_start_date = program_start_date WHERE phase_start_date IS NULL");
    }

    // Update default workout_time to 07:00 for weekdays
    db.exec("UPDATE user_settings SET workout_time = '07:00' WHERE workout_time = '16:00'");

    // Check exercise_maxes columns for last_rpe
    const exerciseMaxColumns = db.prepare("PRAGMA table_info(exercise_maxes)").all() as { name: string }[];
    const exerciseMaxColumnNames = exerciseMaxColumns.map(c => c.name);

    if (!exerciseMaxColumnNames.includes('last_rpe')) {
      db.exec('ALTER TABLE exercise_maxes ADD COLUMN last_rpe INTEGER');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

migrateSchema();

export default db;
