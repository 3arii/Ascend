'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { isTimeAfter, formatTimeUntil, getMinutesUntil } from '@/lib/utils';

interface Meal {
  id: number;
  meal_number: number;
  meal_name: string;
  scheduled_time: string;
  logged_at: string | null;
  was_eaten: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foods: { display: string }[];
}

interface NutritionData {
  nutrition: {
    id: number;
    actual_calories: number;
    actual_protein: number;
    actual_carbs: number;
    actual_fats: number;
  };
  meals: Meal[];
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  phase: string;
}

export default function NutritionPage() {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingMeal, setLoggingMeal] = useState<number | null>(null);

  const fetchData = () => {
    fetch('/api/nutrition')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load nutrition:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logMeal = async (mealId: number, wasEaten: boolean) => {
    setLoggingMeal(mealId);
    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_meal',
          meal_id: mealId,
          was_eaten: wasEaten,
        }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setLoggingMeal(null);
    }
  };

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
        Failed to load nutrition data
      </div>
    );
  }

  const { nutrition, meals, targets, phase } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm capitalize">
          {phase}
        </span>
      </div>

      {/* Daily Summary */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
          <span className="text-sm text-zinc-400">
            {nutrition.actual_calories} / {targets.calories} cal
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={nutrition.actual_calories}
            max={targets.calories}
            color="primary"
            size="lg"
          />

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Protein</span>
                <span>{nutrition.actual_protein}g</span>
              </div>
              <ProgressBar
                value={nutrition.actual_protein}
                max={targets.protein}
                color="green"
                size="sm"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Carbs</span>
                <span>{nutrition.actual_carbs}g</span>
              </div>
              <ProgressBar
                value={nutrition.actual_carbs}
                max={targets.carbs}
                color="yellow"
                size="sm"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Fats</span>
                <span>{nutrition.actual_fats}g</span>
              </div>
              <ProgressBar
                value={nutrition.actual_fats}
                max={targets.fats}
                color="red"
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Meal Plan</h2>

        {meals.map(meal => {
          const isPast = isTimeAfter(meal.scheduled_time);
          const isLogged = meal.logged_at !== null && meal.logged_at !== '';
          const isAvailable = isPast && !isLogged;
          const minutesUntil = getMinutesUntil(meal.scheduled_time);

          return (
            <Card
              key={meal.id}
              className={`transition-all ${
                isLogged
                  ? meal.was_eaten
                    ? 'border-green-600/30 opacity-75'
                    : 'border-zinc-700/30 opacity-50'
                  : isAvailable
                  ? 'border-primary-600/30'
                  : ''
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {isLogged && meal.was_eaten && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isLogged && !meal.was_eaten && (
                        <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <h3 className="font-medium">{meal.meal_name}</h3>
                    </div>
                    <p className="text-sm text-zinc-400">@ {meal.scheduled_time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{meal.calories} cal</p>
                    <p className="text-xs text-zinc-400">
                      P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g
                    </p>
                  </div>
                </div>

                {/* Foods list */}
                <div className="mb-3 pl-2 border-l-2 border-zinc-800">
                  {meal.foods.map((food, i) => (
                    <p key={i} className="text-sm text-zinc-400">
                      {food.display}
                    </p>
                  ))}
                </div>

                {/* Action buttons */}
                {!isLogged && (
                  <div className="flex gap-2">
                    {isAvailable ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => logMeal(meal.id, true)}
                          loading={loggingMeal === meal.id}
                          className="flex-1"
                        >
                          Mark as Eaten
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => logMeal(meal.id, false)}
                          disabled={loggingMeal === meal.id}
                        >
                          Skip
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        Available {formatTimeUntil(minutesUntil)}
                      </p>
                    )}
                  </div>
                )}

                {isLogged && (
                  <p className="text-xs text-zinc-500">
                    {meal.was_eaten ? 'Logged' : 'Skipped'} at{' '}
                    {new Date(meal.logged_at!).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
