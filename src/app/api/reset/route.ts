import { NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Delete all data from tables (in correct order due to foreign keys)
    db.exec(`
      DELETE FROM progress_photos;
      DELETE FROM daily_checkins;
      DELETE FROM meals;
      DELETE FROM daily_nutrition;
      DELETE FROM workout_sets;
      DELETE FROM workout_sessions;
      DELETE FROM exercise_maxes;
    `);

    // Reset user settings to defaults
    const today = new Date().toISOString().split('T')[0];
    db.exec(`
      UPDATE user_settings SET
        height_inches = 72,
        current_weight = 184,
        target_weight = 178,
        current_phase = 'bulk',
        wake_time = '06:00',
        workout_time = '16:00',
        program_start_date = '${today}',
        updated_at = datetime('now')
      WHERE id = 1;
    `);

    // Delete all progress photos from filesystem
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    if (fs.existsSync(photosDir)) {
      const files = fs.readdirSync(photosDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(photosDir, file));
        }
      }
    }

    return NextResponse.json({ success: true, message: 'All data has been reset' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  }
}
