'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getGreeting, formatWeight, formatTimeUntil, getMinutesUntil, isTimeAfter } from '@/lib/utils';

interface DashboardData {
  settings: {
    current_weight: number;
    target_weight: number;
    current_phase: string;
    wake_time: string;
    workout_time: string;
    workout_time_weekend: string;
    program_start_date: string;
  };
  programDay: number;
  daysSinceStart: number;
  isRestDay: boolean;
  todayWorkout: {
    name: string;
    focus: string;
    muscles: string[];
    estimated_duration_minutes: number;
  } | null;
  todayWorkoutComplete: boolean;
  todayCheckin: {
    morning_weight: number | null;
  } | null;
  recentWeights: { date: string; weight: number }[];
  weightTrend: {
    weeklyChange: number;
    trend: 'up' | 'down' | 'stable';
    sevenDayAvg: number;
  };
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  mealTimes: {
    meal_number: number;
    name: string;
    scheduled_time: string;
  }[];
  mealsWithStatus: {
    meal_number: number;
    name: string;
    scheduled_time: string;
    calories: number;
    protein: number;
    logged_at: string | null;
    was_eaten: boolean;
  }[];
  nutrition: {
    actual_calories: number;
    actual_protein: number;
    actual_carbs: number;
    actual_fats: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalWorkouts: number;
    thisWeek: boolean[];
  };
  todayWorkoutTime: string;
  isWeekend: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchDashboardData = useCallback(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, []);

  // Fetch on mount and when pathname changes (navigation)
  useEffect(() => {
    fetchDashboardData();
  }, [pathname, fetchDashboardData]);

  // Refetch when window regains focus (user returns from another page/tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-zinc-400 mt-8">
        Failed to load dashboard data
      </div>
    );
  }

  const { settings, programDay, daysSinceStart, isRestDay, todayWorkout, todayWorkoutComplete, todayCheckin, weightTrend, mealTimes, streak, todayWorkoutTime, isWeekend } = data;

  // Find next meal
  // Find next upcoming meal that hasn't been logged
  const nextMeal = data.mealsWithStatus?.find(meal => !isTimeAfter(meal.scheduled_time) && !meal.logged_at);
  const minutesUntilNextMeal = nextMeal ? getMinutesUntil(nextMeal.scheduled_time) : 0;

  // Calculate meals progress
  const totalMeals = data.mealsWithStatus?.length || 0;
  const eatenMeals = data.mealsWithStatus?.filter(m => m.was_eaten).length || 0;

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, Deniz!</h1>
          <p className="text-zinc-400 mt-1">
            Day {daysSinceStart} of your journey
          </p>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm font-medium capitalize">
            {settings.current_phase}
          </span>
        </div>
      </div>

      {/* Streak Card */}
      <Card className={streak.currentStreak > 0 ? 'border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-transparent' : ''}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl ${streak.currentStreak > 0 ? 'animate-pulse' : 'opacity-30'}`}>
                🔥
              </div>
              <div>
                <p className={`text-2xl font-bold ${streak.currentStreak > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
                  {streak.currentStreak}
                </p>
                <p className="text-xs text-zinc-400">day streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">{streak.totalWorkouts} total</p>
              <p className="text-xs text-zinc-500">Best: {streak.longestStreak} days</p>
            </div>
          </div>
          <div className="flex justify-between gap-1">
            {weekDays.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    streak.thisWeek[i]
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {streak.thisWeek[i] ? '✓' : day}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent>
            <p className="text-2xl font-bold">
              {todayCheckin?.morning_weight
                ? formatWeight(todayCheckin.morning_weight).replace(' lbs', '')
                : '--'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Today</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent>
            <p className={`text-2xl font-bold ${weightTrend.trend === 'down' ? 'text-green-400' : weightTrend.trend === 'up' ? 'text-yellow-400' : ''}`}>
              {weightTrend.weeklyChange > 0 ? '+' : ''}{weightTrend.weeklyChange}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Weekly</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.abs(settings.current_weight - settings.target_weight).toFixed(1)}
            </p>
            <p className="text-xs text-zinc-400 mt-1">To Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card variant={isRestDay ? 'default' : todayWorkoutComplete ? 'default' : 'highlight'} className={todayWorkoutComplete ? 'border-green-600/30' : ''}>
        <CardHeader>
          <CardTitle>
            {isRestDay ? 'Rest Day' : `Today: ${todayWorkout?.name}`}
          </CardTitle>
          {todayWorkoutComplete ? (
            <span className="text-sm text-green-400">Complete</span>
          ) : (
            <div className="text-right">
              <span className="text-sm text-zinc-400">Day {programDay}/7</span>
              {!isRestDay && todayWorkoutTime && (
                <p className="text-xs text-primary-400">@ {todayWorkoutTime}</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isRestDay ? (
            <p className="text-zinc-400">
              Recovery day - light activity encouraged
            </p>
          ) : todayWorkoutComplete ? (
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Great work!</p>
                <p className="text-sm text-zinc-400">Workout completed for today</p>
              </div>
            </div>
          ) : todayWorkout ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span>{todayWorkout.focus}</span>
                <span>•</span>
                <span>~{todayWorkout.estimated_duration_minutes} min</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {todayWorkout.muscles.map(muscle => (
                  <span
                    key={muscle}
                    className="px-2 py-1 bg-zinc-800 rounded text-xs"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
              <Link href="/workout">
                <Button className="w-full mt-2">Start Workout</Button>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Nutrition Summary */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle>Nutrition</CardTitle>
          <span className="text-sm text-zinc-400">
            {data.nutrition.actual_calories} / {data.dailyTargets.calories} cal
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main calorie progress */}
          <ProgressBar
            value={data.nutrition.actual_calories}
            max={data.dailyTargets.calories}
            color="primary"
            size="lg"
          />

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Protein</span>
                <span>{data.nutrition.actual_protein}g</span>
              </div>
              <ProgressBar
                value={data.nutrition.actual_protein}
                max={data.dailyTargets.protein}
                color="green"
                size="sm"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Carbs</span>
                <span>{data.nutrition.actual_carbs}g</span>
              </div>
              <ProgressBar
                value={data.nutrition.actual_carbs}
                max={data.dailyTargets.carbs}
                color="yellow"
                size="sm"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Fats</span>
                <span>{data.nutrition.actual_fats}g</span>
              </div>
              <ProgressBar
                value={data.nutrition.actual_fats}
                max={data.dailyTargets.fats}
                color="red"
                size="sm"
              />
            </div>
          </div>

          {/* Meals progress */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Meals</span>
              <span className="text-sm font-medium">{eatenMeals}/{totalMeals}</span>
            </div>
            <div className="flex gap-1">
              {data.mealsWithStatus?.map((meal, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    meal.was_eaten
                      ? 'bg-green-500'
                      : meal.logged_at
                      ? 'bg-zinc-600'
                      : isTimeAfter(meal.scheduled_time)
                      ? 'bg-yellow-500/50'
                      : 'bg-zinc-700'
                  }`}
                  title={meal.name}
                />
              ))}
            </div>
          </div>

          {/* Next meal */}
          {nextMeal && (
            <div className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{nextMeal.name}</p>
                <p className="text-xs text-zinc-400">@ {nextMeal.scheduled_time}</p>
              </div>
              <span className="text-sm text-primary-400">
                {formatTimeUntil(minutesUntilNextMeal)}
              </span>
            </div>
          )}

          <Link href="/nutrition">
            <Button variant="secondary" className="w-full">View Meal Plan</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Check-in Prompt */}
      {!todayCheckin?.morning_weight && (
        <Card className="border-yellow-600/30">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Morning Weigh-in</p>
              <p className="text-sm text-zinc-400">Log your weight</p>
            </div>
            <Link href="/checkin">
              <Button size="sm">Log Now</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Weight Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Trend</CardTitle>
          <span className="text-sm text-zinc-400">7-day avg</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {weightTrend.sevenDayAvg || settings.current_weight}
            </span>
            <span className="text-zinc-400">lbs</span>
            {weightTrend.weeklyChange !== 0 && (
              <span className={`text-sm ${weightTrend.trend === 'down' ? 'text-green-400' : 'text-yellow-400'}`}>
                {weightTrend.weeklyChange > 0 ? '+' : ''}{weightTrend.weeklyChange} this week
              </span>
            )}
          </div>

          <Link href="/progress" className="block mt-4">
            <Button variant="ghost" className="w-full">View Full Progress</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
