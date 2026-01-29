'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { WorkoutDay, WorkoutSession } from '@/lib/types';

interface ScheduleDay {
  date: string;
  dayName: string;
  isToday: boolean;
  workout: WorkoutDay | null;
}

interface WorkoutData {
  todayWorkout: WorkoutDay | null;
  programDay: number;
  existingSession: WorkoutSession | null;
  weekSchedule: ScheduleDay[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load workout:', err);
        setLoading(false);
      });
  }, []);

  const startWorkout = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const result = await res.json();
      if (result.session) {
        router.push(`/workout/active?session=${result.session.id}`);
      }
    } catch (err) {
      console.error('Failed to start workout:', err);
      setStarting(false);
    }
  };

  const resumeWorkout = () => {
    if (data?.existingSession) {
      router.push(`/workout/active?session=${data.existingSession.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const { todayWorkout, programDay, existingSession, weekSchedule } = data || {};

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleExpanded = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  // Week Schedule Component
  const WeekScheduleSection = () => (
    <div className="space-y-3 mt-6">
      <h2 className="text-lg font-semibold">This Week</h2>
      <div className="space-y-2">
        {weekSchedule?.filter(day => !day.isToday).map((day) => {
          const isRest = !day.workout || day.workout.name === 'Rest';
          const isExpanded = expandedDay === day.date;

          return (
            <Card
              key={day.date}
              className={`cursor-pointer transition-all ${isExpanded ? 'border-primary-600/30' : ''}`}
              onClick={() => !isRest && toggleExpanded(day.date)}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      <p className="text-xs text-zinc-500">{day.dayName}</p>
                      <p className="text-sm font-medium">{formatDate(day.date)}</p>
                    </div>
                    <div>
                      <p className={`font-medium ${isRest ? 'text-zinc-500' : ''}`}>
                        {isRest ? 'Rest Day' : day.workout?.name}
                      </p>
                      {!isRest && (
                        <p className="text-xs text-zinc-400">
                          {day.workout?.exercises.length} exercises • ~{day.workout?.estimated_duration_minutes}min
                        </p>
                      )}
                    </div>
                  </div>
                  {!isRest && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                {/* Expanded Exercise List */}
                <AnimatePresence>
                  {isExpanded && day.workout && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {day.workout.muscles.map(muscle => (
                            <span
                              key={muscle}
                              className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                        {day.workout.exercises.map((exercise, idx) => (
                          <div key={exercise.name} className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 flex items-center justify-center bg-zinc-800 rounded text-xs">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-zinc-300">{exercise.name}</span>
                            <span className="text-zinc-500 text-xs">
                              {exercise.sets}×{exercise.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Rest day
  if (!todayWorkout || todayWorkout.name === 'Rest') {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Rest Day</h1>
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">
              <svg className="w-16 h-16 mx-auto text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Time to Recover</h2>
            <p className="text-zinc-400 max-w-xs mx-auto">
              Rest is when your muscles grow. Light walking or stretching is encouraged.
            </p>
          </CardContent>
        </Card>
        <WeekScheduleSection />
      </div>
    );
  }

  // Has completed session for today
  if (existingSession && existingSession.completed_at) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Workout Complete</h1>
        <Card className="border-green-600/30">
          <CardContent className="text-center py-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Great Work!</h2>
            <p className="text-zinc-400 mb-1">{existingSession.workout_type}</p>
            <p className="text-sm text-green-400">Completed today</p>
          </CardContent>
        </Card>
        <Button variant="ghost" onClick={() => router.push('/progress')} className="w-full">
          View Progress
        </Button>
        <WeekScheduleSection />
      </div>
    );
  }

  // Has incomplete session
  if (existingSession && !existingSession.completed_at) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Resume Workout</h1>
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>{existingSession.workout_type}</CardTitle>
            <span className="text-sm text-yellow-400">In Progress</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400">
              You have an incomplete workout session.
            </p>
            <Button onClick={resumeWorkout} className="w-full">
              Resume Workout
            </Button>
            <Button variant="ghost" onClick={startWorkout} className="w-full">
              Start Fresh
            </Button>
          </CardContent>
        </Card>
        <WeekScheduleSection />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's Workout</h1>
        <span className="text-sm text-zinc-400">Day {programDay}/7</span>
      </div>

      {/* Workout Info */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle>{todayWorkout.name}</CardTitle>
          <span className="text-sm text-primary-400">{todayWorkout.focus}</span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {todayWorkout.muscles.map(muscle => (
              <span
                key={muscle}
                className="px-3 py-1 bg-zinc-800 rounded-full text-sm"
              >
                {muscle}
              </span>
            ))}
          </div>
          <p className="text-sm text-zinc-400">
            ~{todayWorkout.estimated_duration_minutes} minutes • {todayWorkout.exercises.length} exercises
          </p>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Exercises</h2>
        {todayWorkout.exercises.map((exercise, index) => (
          <Card key={exercise.name} className="p-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-lg text-sm font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="font-medium">{exercise.name}</h3>
                <p className="text-sm text-zinc-400">
                  {exercise.sets} sets × {exercise.reps} reps
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {exercise.rest_seconds}s rest
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Start Button */}
      <Button
        onClick={startWorkout}
        loading={starting}
        className="w-full"
        size="lg"
      >
        Start Workout
      </Button>

      {/* Week Schedule */}
      <WeekScheduleSection />
    </div>
  );
}
