import { NextRequest, NextResponse } from 'next/server';
import { createWorkoutSet, completeWorkoutSet, getSessionSets } from '@/lib/db/queries';
import { upsertExerciseMax } from '@/lib/db/queries';
import { calculate1RM } from '@/lib/calculations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { session_id, exercise_name, set_number, target_reps, target_weight } = body;

      const setId = createWorkoutSet({
        session_id,
        exercise_name,
        set_number,
        target_reps,
        target_weight,
      });

      return NextResponse.json({ set_id: setId });
    }

    if (action === 'complete') {
      const { set_id, actual_reps, actual_weight, rpe, rest_duration_seconds, exercise_name } = body;

      completeWorkoutSet(set_id, {
        actual_reps,
        actual_weight,
        rpe,
        rest_duration_seconds,
      });

      // Update exercise max
      if (exercise_name && actual_reps && actual_weight) {
        const estimated1RM = calculate1RM(actual_weight, actual_reps);
        upsertExerciseMax(exercise_name, {
          one_rep_max: estimated1RM,
          last_working_weight: actual_weight,
          last_reps_achieved: actual_reps,
          last_rpe: rpe || null,
          last_session_date: new Date().toISOString().split('T')[0],
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling set action:', error);
    return NextResponse.json({ error: 'Failed to process set action' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const sets = getSessionSets(parseInt(sessionId));
    return NextResponse.json(sets);
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}
