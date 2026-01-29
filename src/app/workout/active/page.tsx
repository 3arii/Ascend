'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { Timer } from '@/components/ui/Timer';
import { Modal } from '@/components/ui/Modal';
import { useTimer } from '@/lib/hooks/useTimer';
import {
  parseRepRange,
  formatTime,
  calculateWorkoutVolume,
  calculate1RM,
  getProgressiveOverloadSuggestion,
  checkForPR,
  isDeloadWeek,
  getIntensityZone,
} from '@/lib/calculations';
import type { WorkoutDay, WorkoutSession, Exercise, ExerciseMax } from '@/lib/types';

interface ActiveWorkoutState {
  session: WorkoutSession;
  workout: WorkoutDay;
  exerciseIndex: number;
  setIndex: number;
  completedSets: Array<{
    exercise_name: string;
    set_number: number;
    actual_reps: number;
    actual_weight: number;
  }>;
}

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [state, setState] = useState<ActiveWorkoutState | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseMaxes, setExerciseMaxes] = useState<Record<string, ExerciseMax>>({});

  // Current input values
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);

  // UI states
  const [isResting, setIsResting] = useState(false);
  const [showMaxPrompt, setShowMaxPrompt] = useState(false);
  const [maxPromptExercise, setMaxPromptExercise] = useState<string>('');
  const [initialWeight, setInitialWeight] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [pendingMaxPrompt, setPendingMaxPrompt] = useState<string | null>(null);
  const [rpe, setRpe] = useState<number>(8);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prDetails, setPrDetails] = useState<{ exercise: string; type: string; value: number } | null>(null);
  const [programStartDate, setProgramStartDate] = useState<string>('');
  const [isDeload, setIsDeload] = useState(false);

  // Timer
  const currentExercise = state?.workout.exercises[state.exerciseIndex];
  const restTime = currentExercise?.rest_seconds || 120;

  const handleRestComplete = useCallback(() => {
    setIsResting(false);
    // Check if there's a pending max prompt to show after rest
    if (pendingMaxPrompt) {
      setMaxPromptExercise(pendingMaxPrompt);
      setShowMaxPrompt(true);
      setPendingMaxPrompt(null);
    }
  }, [pendingMaxPrompt]);

  const timer = useTimer({
    initialTime: restTime,
    onComplete: handleRestComplete,
  });

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      router.push('/workout');
      return;
    }

    Promise.all([
      fetch(`/api/workouts?session_id=${sessionId}`).then(r => r.json()),
      fetch('/api/exercise-max').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ])
      .then(([workoutData, maxesData, dashboardData]) => {
        // Get program start date for deload calculation
        if (dashboardData.settings?.program_start_date) {
          setProgramStartDate(dashboardData.settings.program_start_date);
          setIsDeload(isDeloadWeek(dashboardData.settings.program_start_date));
        }
        if (!workoutData.session) {
          router.push('/workout');
          return;
        }

        // Convert maxes array to object
        const maxesMap: Record<string, ExerciseMax> = {};
        if (Array.isArray(maxesData)) {
          maxesData.forEach((m: ExerciseMax) => {
            maxesMap[m.exercise_name] = m;
          });
        }
        setExerciseMaxes(maxesMap);

        // Reconstruct state from completed sets
        const completedSets = workoutData.sets.filter((s: { completed_at: string | null }) => s.completed_at);
        let exerciseIndex = 0;
        let setIndex = 0;

        if (completedSets.length > 0) {
          // Find current position
          const workout = getTodayWorkout(workoutData);
          if (workout) {
            for (let i = 0; i < workout.exercises.length; i++) {
              const exercise = workout.exercises[i];
              const setsForExercise = completedSets.filter(
                (s: { exercise_name: string }) => s.exercise_name === exercise.name
              );
              if (setsForExercise.length < exercise.sets) {
                exerciseIndex = i;
                setIndex = setsForExercise.length;
                break;
              }
              if (i === workout.exercises.length - 1) {
                // All done
                exerciseIndex = workout.exercises.length;
              }
            }
          }
        }

        setState({
          session: workoutData.session,
          workout: getTodayWorkout(workoutData),
          exerciseIndex,
          setIndex,
          completedSets: completedSets.map((s: { exercise_name: string; set_number: number; actual_reps: number; actual_weight: number }) => ({
            exercise_name: s.exercise_name,
            set_number: s.set_number,
            actual_reps: s.actual_reps,
            actual_weight: s.actual_weight,
          })),
        });

        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load workout:', err);
        router.push('/workout');
      });
  }, [sessionId, router]);

  // Track which exercise we've initialized weights for
  const [initializedExercise, setInitializedExercise] = useState<string | null>(null);

  // Set initial weight/reps when exercise changes (not on every re-render)
  useEffect(() => {
    if (!state || !currentExercise) return;

    // Only initialize weight/reps when switching to a NEW exercise
    if (initializedExercise === currentExercise.name) return;

    const exerciseMax = exerciseMaxes[currentExercise.name];
    const repRange = parseRepRange(currentExercise.reps);

    // Check if we need to prompt for max - but only if not resting
    // (if resting, the prompt will be shown after rest via pendingMaxPrompt)
    // Use == null to allow 0 for bodyweight exercises
    if (exerciseMax?.last_working_weight == null) {
      if (!isResting && !pendingMaxPrompt) {
        setMaxPromptExercise(currentExercise.name);
        setShowMaxPrompt(true);
      }
      setReps(repRange.max);
      setInitializedExercise(currentExercise.name);
      return;
    }

    // Set recommended weight and target reps
    setWeight(exerciseMax.last_working_weight);
    setReps(repRange.max);
    setInitializedExercise(currentExercise.name);
  }, [state?.exerciseIndex, currentExercise, exerciseMaxes, isResting, pendingMaxPrompt, initializedExercise]);

  const getTodayWorkout = (data: { session: WorkoutSession }): WorkoutDay => {
    // This gets workout from the local JSON based on session workout_type
    const workouts = require('../../../../data/workouts.json');
    return workouts.schedule.find(
      (w: WorkoutDay) => w.name === data.session.workout_type
    );
  };

  const handleSetMax = async () => {
    if (initialWeight < 0) return; // Allow 0 for bodyweight exercises

    try {
      await fetch('/api/exercise-max', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_name: maxPromptExercise,
          last_working_weight: initialWeight,
        }),
      });

      setExerciseMaxes(prev => ({
        ...prev,
        [maxPromptExercise]: {
          ...prev[maxPromptExercise],
          exercise_name: maxPromptExercise,
          last_working_weight: initialWeight,
        } as ExerciseMax,
      }));

      setWeight(initialWeight);
      setShowMaxPrompt(false);
      setInitialWeight(0);
    } catch (err) {
      console.error('Failed to save exercise max:', err);
    }
  };

  const completeSet = async () => {
    if (!state || !currentExercise) return;

    try {
      // Create and complete the set
      const createRes = await fetch('/api/workouts/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          session_id: state.session.id,
          exercise_name: currentExercise.name,
          set_number: state.setIndex + 1,
          target_reps: parseRepRange(currentExercise.reps).max,
          target_weight: weight,
        }),
      });
      const { set_id } = await createRes.json();

      await fetch('/api/workouts/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          set_id,
          actual_reps: reps,
          actual_weight: weight,
          rpe: rpe,
          exercise_name: currentExercise.name,
        }),
      });

      // Check for PR - compare against current exerciseMaxes state
      const currentMax = exerciseMaxes[currentExercise.name];
      const prCheck = checkForPR(
        currentExercise.name,
        weight,
        reps,
        currentMax
      );

      // Calculate new 1RM for state update
      const new1RM = calculate1RM(weight, reps);

      // Update local exerciseMaxes state so subsequent sets use updated values
      setExerciseMaxes(prev => ({
        ...prev,
        [currentExercise.name]: {
          ...prev[currentExercise.name],
          exercise_name: currentExercise.name,
          one_rep_max: Math.max(new1RM, prev[currentExercise.name]?.one_rep_max || 0),
          last_working_weight: weight,
          last_reps_achieved: reps,
          last_rpe: rpe,
          last_session_date: new Date().toISOString().split('T')[0],
        } as ExerciseMax,
      }));

      // Show PR celebration if it's a new PR
      if (prCheck.isPR) {
        setPrDetails({
          exercise: currentExercise.name,
          type: prCheck.prType === 'estimated_1rm' ? 'Estimated 1RM' : 'Weight',
          value: prCheck.newValue,
        });
        setShowPRCelebration(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowPRCelebration(false), 3000);
      }

      // Update state
      const newCompletedSets = [
        ...state.completedSets,
        {
          exercise_name: currentExercise.name,
          set_number: state.setIndex + 1,
          actual_reps: reps,
          actual_weight: weight,
        },
      ];

      // Check if exercise is done
      if (state.setIndex + 1 >= currentExercise.sets) {
        // Move to next exercise
        if (state.exerciseIndex + 1 >= state.workout.exercises.length) {
          // Workout complete!
          setShowComplete(true);
          return;
        }

        const nextExercise = state.workout.exercises[state.exerciseIndex + 1];
        const nextExerciseMax = exerciseMaxes[nextExercise.name];
        const needsMaxPrompt = nextExerciseMax?.last_working_weight == null;

        // Set pending max prompt if needed - will show after rest
        if (needsMaxPrompt) {
          setPendingMaxPrompt(nextExercise.name);
        }

        setState({
          ...state,
          exerciseIndex: state.exerciseIndex + 1,
          setIndex: 0,
          completedSets: newCompletedSets,
        });

        // Always start rest timer when moving to next exercise
        timer.reset(restTime, true);
        setIsResting(true);
      } else {
        // Next set of same exercise
        setState({
          ...state,
          setIndex: state.setIndex + 1,
          completedSets: newCompletedSets,
        });

        // Start rest timer
        timer.reset(restTime, true);
        setIsResting(true);
      }
    } catch (err) {
      console.error('Failed to complete set:', err);
    }
  };

  const skipRest = () => {
    timer.reset(0);
    setIsResting(false);
    // Check if there's a pending max prompt to show after rest
    if (pendingMaxPrompt) {
      setMaxPromptExercise(pendingMaxPrompt);
      setShowMaxPrompt(true);
      setPendingMaxPrompt(null);
    }
  };

  const finishWorkout = async () => {
    if (!state) return;

    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          session_id: state.session.id,
        }),
      });
      router.push('/workout/complete');
    } catch (err) {
      console.error('Failed to complete workout:', err);
      router.push('/');
    }
  };

  const exitWorkout = () => {
    if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
      router.push('/');
    }
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const { workout, exerciseIndex, setIndex, completedSets } = state;
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const progress = (completedSets.length / totalSets) * 100;

  // Workout complete screen
  if (showComplete) {
    const volume = calculateWorkoutVolume(
      completedSets.map(s => ({ actual_reps: s.actual_reps, actual_weight: s.actual_weight }))
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          <svg className="w-24 h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-zinc-400 mb-8">{workout.name}</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold">{completedSets.length}</p>
              <p className="text-xs text-zinc-400">Sets</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold">{Math.round(volume).toLocaleString()}</p>
              <p className="text-xs text-zinc-400">Volume (lbs)</p>
            </CardContent>
          </Card>
        </div>

        <Button onClick={finishWorkout} className="w-full max-w-xs" size="lg">
          Finish
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      {/* PR Celebration Overlay */}
      <AnimatePresence>
        {showPRCelebration && prDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setShowPRCelebration(false)}
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">NEW PR!</h2>
              <p className="text-xl text-white mb-1">{prDetails.exercise}</p>
              <p className="text-2xl font-bold text-white">
                {prDetails.type}: {prDetails.value} lbs
              </p>
              <p className="text-zinc-400 mt-4">Tap to continue</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max Weight Prompt Modal - only show when NOT resting */}
      <Modal
        isOpen={showMaxPrompt && !isResting}
        onClose={() => {}}
        title={`Set Starting Weight`}
      >
        <div className="space-y-4">
          <p className="text-zinc-400">
            What weight do you typically use for <strong>{maxPromptExercise}</strong>?
          </p>
          <NumberInput
            value={initialWeight}
            onChange={setInitialWeight}
            min={0}
            max={1000}
            step={5}
            unit="lbs"
            size="lg"
          />
          <Button
            onClick={handleSetMax}
            disabled={initialWeight < 0}
            className="w-full"
          >
            Set Weight
          </Button>
        </div>
      </Modal>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a] z-40 flex flex-col items-center justify-center p-4"
          >
            <h2 className="text-xl font-semibold mb-2">Rest Time</h2>
            <p className="text-zinc-400 mb-2 text-center">
              {currentExercise?.name}
            </p>
            <p className="text-zinc-500 mb-8">
              Set {setIndex + 1} of {currentExercise?.sets}
            </p>
            <Timer
              time={timer.time}
              totalTime={restTime}
              isRunning={timer.isRunning}
              onSkip={skipRest}
              onAddTime={(s) => timer.addTime(s)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={exitWorkout} className="p-2 -ml-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-semibold">{workout.name}</h1>
          <p className="text-sm text-zinc-400">
            Exercise {exerciseIndex + 1}/{workout.exercises.length}
          </p>
        </div>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Deload Week Banner */}
      {isDeload && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">💤</span>
            <div>
              <p className="text-sm font-medium text-blue-400">Deload Week</p>
              <p className="text-xs text-blue-300/70">Reduced intensity for recovery</p>
            </div>
          </div>
        </div>
      )}

      {currentExercise && (
        <div className="space-y-6">
          {/* Exercise Name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{currentExercise.name}</h2>
            <p className="text-zinc-400">
              Set {setIndex + 1} of {currentExercise.sets} • Target: {currentExercise.reps} reps
            </p>
            {/* Show estimated 1RM if available */}
            {exerciseMaxes[currentExercise.name]?.one_rep_max && (
              <p className="text-xs text-primary-400 mt-1">
                Est. 1RM: {exerciseMaxes[currentExercise.name].one_rep_max} lbs
              </p>
            )}
          </div>

          {/* Progressive Overload Suggestion */}
          {(() => {
            const suggestion = getProgressiveOverloadSuggestion(
              exerciseMaxes[currentExercise.name],
              currentExercise,
              isDeload
            );
            if (suggestion.recommendation && exerciseMaxes[currentExercise.name]?.last_working_weight) {
              return (
                <div className={`p-3 rounded-lg ${
                  suggestion.shouldIncrease
                    ? 'bg-green-600/20 border border-green-500/30'
                    : isDeload
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'bg-zinc-800/50 border border-zinc-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {suggestion.shouldIncrease ? '📈' : isDeload ? '💤' : '💪'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${
                        suggestion.shouldIncrease ? 'text-green-400' : 'text-zinc-300'
                      }`}>
                        {suggestion.shouldIncrease ? 'Weight Increase Recommended' : 'Training Note'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{suggestion.recommendation}</p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Form Cues */}
          <Card className="bg-zinc-900/50">
            <CardContent className="py-3">
              <p className="text-xs text-zinc-500 mb-2">Form Cues</p>
              <ul className="space-y-1">
                {currentExercise.form_cues.map((cue, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5">•</span>
                    {cue}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weight Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 text-center">Weight</label>
            <NumberInput
              value={weight}
              onChange={setWeight}
              min={0}
              max={1000}
              step={5}
              unit="lbs"
              size="lg"
            />
          </div>

          {/* Reps Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 text-center">Reps Completed</label>
            <NumberInput
              value={reps}
              onChange={setReps}
              min={0}
              max={100}
              step={1}
              size="lg"
            />
          </div>

          {/* RPE Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">RPE (Rate of Perceived Exertion)</label>
              <span className={`text-sm font-medium ${
                rpe <= 6 ? 'text-green-400' :
                rpe <= 8 ? 'text-yellow-400' :
                rpe <= 9 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {rpe}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Easy</span>
              <span>Moderate</span>
              <span>Hard</span>
              <span>Max</span>
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">
              {rpe <= 6 ? 'Could do 4+ more reps' :
               rpe === 7 ? 'Could do 3 more reps' :
               rpe === 8 ? 'Could do 2 more reps' :
               rpe === 9 ? 'Could do 1 more rep' :
               'Maximum effort'}
            </p>
          </div>

          {/* Intensity Zone Display */}
          {exerciseMaxes[currentExercise.name]?.one_rep_max && weight > 0 && (
            <div className="text-center py-2 px-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-400">
                Training at {Math.round((weight / exerciseMaxes[currentExercise.name].one_rep_max!) * 100)}% of 1RM
                <span className="text-zinc-500"> • </span>
                {getIntensityZone(weight, exerciseMaxes[currentExercise.name].one_rep_max!).description}
              </p>
            </div>
          )}

          {/* Complete Set Button */}
          <Button
            onClick={completeSet}
            className="w-full"
            size="lg"
            disabled={weight < 0 || reps <= 0}
          >
            Complete Set
          </Button>

          {/* Completed Sets for this Exercise */}
          {completedSets.filter(s => s.exercise_name === currentExercise.name).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Completed Sets</p>
              <div className="flex gap-2 flex-wrap">
                {completedSets
                  .filter(s => s.exercise_name === currentExercise.name)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm"
                    >
                      {s.actual_weight}×{s.actual_reps}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    }>
      <ActiveWorkoutContent />
    </Suspense>
  );
}
