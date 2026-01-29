import { NextRequest, NextResponse } from 'next/server';
import { getExerciseMax, upsertExerciseMax, getAllExerciseMaxes } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseName = searchParams.get('exercise');

    if (exerciseName) {
      const max = getExerciseMax(exerciseName);
      return NextResponse.json(max || { exercise_name: exerciseName, needsInput: true });
    }

    const allMaxes = getAllExerciseMaxes();
    return NextResponse.json(allMaxes);
  } catch (error) {
    console.error('Error fetching exercise max:', error);
    return NextResponse.json({ error: 'Failed to fetch exercise max' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise_name, one_rep_max, last_working_weight, last_reps_achieved } = body;

    if (!exercise_name) {
      return NextResponse.json({ error: 'Exercise name required' }, { status: 400 });
    }

    upsertExerciseMax(exercise_name, {
      one_rep_max,
      last_working_weight,
      last_reps_achieved,
      last_session_date: new Date().toISOString().split('T')[0],
    });

    const updated = getExerciseMax(exercise_name);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating exercise max:', error);
    return NextResponse.json({ error: 'Failed to update exercise max' }, { status: 500 });
  }
}
