'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WorkoutSummary {
  workout_type: string;
  total_sets: number;
  total_volume: number;
  duration_minutes: number;
  date: string;
}

export default function WorkoutCompletePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workouts?latest=true')
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          const volume = data.sets?.reduce((sum: number, set: { actual_weight: number; actual_reps: number }) => {
            return sum + (set.actual_weight || 0) * (set.actual_reps || 0);
          }, 0) || 0;

          const startTime = new Date(data.session.started_at);
          const endTime = data.session.completed_at ? new Date(data.session.completed_at) : new Date();
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.round(durationMs / 60000);

          setSummary({
            workout_type: data.session.workout_type,
            total_sets: data.sets?.length || 0,
            total_volume: Math.round(volume),
            duration_minutes: durationMinutes,
            date: data.session.date,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load workout summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6"
      >
        <svg className="w-24 h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold mb-2"
      >
        Workout Complete!
      </motion.h1>

      {summary && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 mb-8"
        >
          {summary.workout_type}
        </motion.p>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 w-full max-w-sm mb-8"
        >
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold">{summary.total_sets}</p>
              <p className="text-xs text-zinc-400">Sets</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold">{summary.total_volume.toLocaleString()}</p>
              <p className="text-xs text-zinc-400">Volume</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold">{summary.duration_minutes}</p>
              <p className="text-xs text-zinc-400">Minutes</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={() => router.push('/')}
          className="w-full"
          size="lg"
        >
          Done
        </Button>
        <Button
          onClick={() => router.push('/progress')}
          variant="ghost"
          className="w-full"
        >
          View Progress
        </Button>
      </motion.div>
    </div>
  );
}
