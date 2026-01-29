import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkoutSession,
  getWorkoutSession,
  getWorkoutSessionByDate,
  completeWorkoutSession,
  getRecentWorkoutSessions,
  getSessionSets,
} from '@/lib/db/queries';
import { getUserSettings } from '@/lib/db/queries';
import { getCurrentProgramDay, getTodayWorkout, getWeekSchedule } from '@/lib/calculations';
import { getToday } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const date = searchParams.get('date');
    const latest = searchParams.get('latest');

    if (sessionId) {
      const session = getWorkoutSession(parseInt(sessionId));
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      const sets = getSessionSets(session.id);
      return NextResponse.json({ session, sets });
    }

    if (latest === 'true') {
      const recentSessions = getRecentWorkoutSessions(1);
      if (recentSessions.length > 0) {
        const session = recentSessions[0];
        const sets = getSessionSets(session.id);
        return NextResponse.json({ session, sets });
      }
      return NextResponse.json({ session: null, sets: [] });
    }

    if (date) {
      const session = getWorkoutSessionByDate(date);
      if (session) {
        const sets = getSessionSets(session.id);
        return NextResponse.json({ session, sets });
      }
      return NextResponse.json({ session: null, sets: [] });
    }

    // Return today's workout info
    const settings = getUserSettings();
    const todayWorkout = getTodayWorkout(settings.program_start_date);
    const programDay = getCurrentProgramDay(settings.program_start_date);
    const existingSession = getWorkoutSessionByDate(getToday());
    const weekSchedule = getWeekSchedule(settings.program_start_date);

    return NextResponse.json({
      todayWorkout,
      programDay,
      existingSession,
      weekSchedule,
    });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json({ error: 'Failed to fetch workout' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      const settings = getUserSettings();
      const todayWorkout = getTodayWorkout(settings.program_start_date);
      const programDay = getCurrentProgramDay(settings.program_start_date);

      if (!todayWorkout || todayWorkout.name === 'Rest') {
        return NextResponse.json({ error: 'No workout scheduled for today' }, { status: 400 });
      }

      const sessionId = createWorkoutSession({
        date: getToday(),
        workout_type: todayWorkout.name,
        program_day: programDay,
      });

      const session = getWorkoutSession(sessionId);
      return NextResponse.json({ session, workout: todayWorkout });
    }

    if (action === 'complete') {
      const { session_id, notes } = body;
      completeWorkoutSession(session_id, notes);
      const session = getWorkoutSession(session_id);
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling workout action:', error);
    return NextResponse.json({ error: 'Failed to process workout action' }, { status: 500 });
  }
}
