'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { formatDate } from '@/lib/utils';

interface ProgressPhoto {
  id: number;
  angle: string;
  file_path: string;
  thumbnail_path: string;
  date: string;
}

interface StrengthProgress {
  exercise_name: string;
  first_weight: number;
  first_date: string;
  current_weight: number;
  current_date: string;
  change_lbs: number;
  change_percent: number;
  one_rep_max: number | null;
  standards: {
    beginner: number;
    intermediate: number;
    advanced: number;
    elite: number;
  } | null;
  level: 'untested' | 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

interface VolumeSession {
  date: string;
  workout_type: string;
  total_volume: number;
  total_sets: number;
}

interface Measurement {
  date: string;
  waist: number | null;
  chest: number | null;
  shoulders: number | null;
  arms: number | null;
  thighs: number | null;
}

interface PhotoComparison {
  first: { file_path: string; date: string } | null;
  latest: { file_path: string; date: string } | null;
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'weight' | 'strength' | 'body' | 'photos' | 'analytics'>('weight');
  const [loading, setLoading] = useState(true);

  // Weight data
  const [weights, setWeights] = useState<{ date: string; weight: number }[]>([]);
  const [weightTrend, setWeightTrend] = useState<{ weeklyChange: number; sevenDayAvg: number }>({ weeklyChange: 0, sevenDayAvg: 0 });

  // Strength data
  const [strengthProgress, setStrengthProgress] = useState<StrengthProgress[]>([]);
  const [bodyweight, setBodyweight] = useState(0);

  // Body measurements
  const [measurements, setMeasurements] = useState<{
    history: Measurement[];
    first: Measurement | null;
    latest: Measurement | null;
    changes: Record<string, number | null> | null;
  }>({ history: [], first: null, latest: null, changes: null });

  // Photos
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [photoComparison, setPhotoComparison] = useState<{
    front: PhotoComparison;
    side: PhotoComparison;
    back: PhotoComparison;
  }>({ front: { first: null, latest: null }, side: { first: null, latest: null }, back: { first: null, latest: null } });
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [comparisonAngle, setComparisonAngle] = useState<'front' | 'side' | 'back'>('front');

  // Analytics
  const [volumeHistory, setVolumeHistory] = useState<VolumeSession[]>([]);
  const [nutritionCompliance, setNutritionCompliance] = useState<{
    history: { date: string; compliance_percentage: number }[];
    streak: number;
    avgCompliance: number;
  }>({ history: [], streak: 0, avgCompliance: 0 });

  // Goal data
  const [goalData, setGoalData] = useState<{
    currentWeight: number;
    targetWeight: number;
    weeklyRate: number;
    goalDate: string | null;
    weeksRemaining: number | null;
    phase: string;
    phaseProgress: number;
    phaseMessage: string;
    weeksInPhase: number;
    onTrack: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [weightsRes, strengthRes, measurementsRes, photosRes, comparisonRes, volumeRes, nutritionRes, goalRes] = await Promise.all([
        fetch('/api/checkins?type=weights').then(r => r.json()),
        fetch('/api/progress?type=strength').then(r => r.json()),
        fetch('/api/measurements').then(r => r.json()),
        fetch('/api/checkins?type=photos').then(r => r.json()),
        fetch('/api/progress?type=photos').then(r => r.json()),
        fetch('/api/progress?type=volume').then(r => r.json()),
        fetch('/api/progress?type=nutrition').then(r => r.json()),
        fetch('/api/progress?type=goal').then(r => r.json()),
      ]);

      setWeights(weightsRes.weights || []);
      setWeightTrend(weightsRes.trend || { weeklyChange: 0, sevenDayAvg: 0 });
      setStrengthProgress(strengthRes.progress || []);
      setBodyweight(strengthRes.bodyweight || 0);
      setMeasurements(measurementsRes);
      setPhotos(photosRes.photos || []);
      setPhotoComparison(comparisonRes);
      setVolumeHistory(volumeRes.sessions || []);
      setNutritionCompliance(nutritionRes);
      setGoalData(goalRes);
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const chartData = weights
    .slice(0, 30)
    .reverse()
    .map(w => ({
      date: formatDate(w.date, 'M/d'),
      weight: w.weight,
    }));

  const volumeChartData = volumeHistory
    .slice(0, 14)
    .reverse()
    .map(v => ({
      date: formatDate(v.date, 'M/d'),
      volume: Math.round(v.total_volume / 1000),
    }));

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'elite': return 'text-purple-400';
      case 'advanced': return 'text-blue-400';
      case 'intermediate': return 'text-green-400';
      case 'beginner': return 'text-yellow-400';
      default: return 'text-zinc-500';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'elite': return 'bg-purple-600/20';
      case 'advanced': return 'bg-blue-600/20';
      case 'intermediate': return 'bg-green-600/20';
      case 'beginner': return 'bg-yellow-600/20';
      default: return 'bg-zinc-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Goal Summary Card */}
      {goalData && (
        <Card className="border-primary-500/30 bg-gradient-to-br from-primary-950/20 to-transparent">
          <CardContent className="py-4 space-y-4">
            {/* Phase Badge & Current Weight */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm font-medium capitalize">
                  {goalData.phase}
                </span>
                <div>
                  <p className="text-2xl font-bold">{goalData.currentWeight} lbs</p>
                  <p className="text-xs text-zinc-400">Current Weight</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary-400">{goalData.targetWeight} lbs</p>
                <p className="text-xs text-zinc-400">Target</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-zinc-400">Phase Progress</span>
                <span className="text-sm font-medium">{goalData.phaseProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2.5">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, goalData.phaseProgress)}%` }}
                />
              </div>
              {goalData.phaseMessage && (
                <p className="text-xs text-zinc-500 mt-2">{goalData.phaseMessage}</p>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
              <div className="text-center">
                <p className="text-lg font-bold">
                  {Math.abs(goalData.currentWeight - goalData.targetWeight).toFixed(1)}
                </p>
                <p className="text-xs text-zinc-400">lbs to go</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{goalData.weeksInPhase}</p>
                <p className="text-xs text-zinc-400">weeks in</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${goalData.onTrack ? 'text-green-400' : 'text-yellow-400'}`}>
                  {goalData.onTrack ? 'On Track' : 'Adjust'}
                </p>
                <p className="text-xs text-zinc-400">status</p>
              </div>
            </div>

            {/* Goal Date Estimate */}
            {goalData.goalDate && goalData.weeksRemaining && goalData.weeksRemaining > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-sm">
                <span className="text-zinc-400">Est. Goal Date</span>
                <span className="font-medium">
                  {formatDate(goalData.goalDate, 'MMM d, yyyy')} ({goalData.weeksRemaining} weeks)
                </span>
              </div>
            )}

            {goalData.weeklyRate !== 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Current Rate</span>
                <span className={goalData.weeklyRate > 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {goalData.weeklyRate > 0 ? '+' : ''}{goalData.weeklyRate.toFixed(1)} lbs/week
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 pb-2 overflow-x-auto">
        {(['weight', 'strength', 'body', 'photos', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Weight Tab */}
      {activeTab === 'weight' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <CardContent className="py-4">
                <p className="text-3xl font-bold">{weights[0]?.weight || '--'}</p>
                <p className="text-xs text-zinc-400 mt-1">Current (lbs)</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-4">
                <p className={`text-3xl font-bold ${
                  weightTrend.weeklyChange < 0 ? 'text-green-400' : weightTrend.weeklyChange > 0 ? 'text-yellow-400' : ''
                }`}>
                  {weightTrend.weeklyChange > 0 ? '+' : ''}{weightTrend.weeklyChange || 0}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Weekly Change</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <span className="text-sm text-zinc-400">Last 30 days</span>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        labelStyle={{ color: '#a1a1aa' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  Log more weights to see your trend
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weights.slice(0, 14).map((entry, i) => (
                  <div key={entry.date} className="flex justify-between text-sm py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-400">{formatDate(entry.date, 'EEE, MMM d')}</span>
                    <span className={i === 0 ? 'font-semibold' : ''}>{entry.weight} lbs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strength Tab */}
      {activeTab === 'strength' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strength Progress</CardTitle>
              <span className="text-sm text-zinc-400">Start vs Current</span>
            </CardHeader>
            <CardContent>
              {strengthProgress.length > 0 ? (
                <div className="space-y-4">
                  {strengthProgress.map(exercise => (
                    <div key={exercise.exercise_name} className="border-b border-zinc-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{exercise.exercise_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBg(exercise.level)} ${getLevelColor(exercise.level)}`}>
                              {exercise.level}
                            </span>
                            {exercise.one_rep_max && (
                              <span className="text-xs text-zinc-500">
                                Est. 1RM: {exercise.one_rep_max} lbs
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${exercise.change_lbs > 0 ? 'text-green-400' : ''}`}>
                            {exercise.change_lbs > 0 ? '+' : ''}{exercise.change_lbs} lbs
                          </p>
                          <p className="text-xs text-zinc-500">
                            {exercise.change_percent > 0 ? '+' : ''}{exercise.change_percent}%
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-zinc-500">Start</p>
                          <p>{exercise.first_weight} lbs</p>
                        </div>
                        <div className="text-center text-zinc-600">→</div>
                        <div className="text-right">
                          <p className="text-zinc-500">Current</p>
                          <p className="font-semibold">{exercise.current_weight} lbs</p>
                        </div>
                      </div>
                      {exercise.standards && (
                        <div className="mt-3">
                          <p className="text-xs text-zinc-500 mb-1">Strength Standards (at {bodyweight} lbs BW)</p>
                          <div className="flex gap-1">
                            {['beginner', 'intermediate', 'advanced', 'elite'].map(lvl => {
                              const weight = exercise.standards![lvl as keyof typeof exercise.standards];
                              const current1RM = exercise.one_rep_max || 0;
                              const isAchieved = current1RM >= weight;
                              return (
                                <div key={lvl} className="flex-1 text-center">
                                  <div className={`text-xs py-1 rounded ${isAchieved ? getLevelBg(lvl) : 'bg-zinc-800'}`}>
                                    <p className={isAchieved ? getLevelColor(lvl) : 'text-zinc-600'}>{weight}</p>
                                  </div>
                                  <p className="text-[10px] text-zinc-600 mt-0.5 capitalize">{lvl}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  Complete workouts to track strength progress
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Body Measurements Tab */}
      {activeTab === 'body' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Body Measurements</CardTitle>
              <span className="text-sm text-zinc-400">Changes since start</span>
            </CardHeader>
            <CardContent>
              {measurements?.latest ? (
                <div className="space-y-4">
                  {[
                    { key: 'waist', label: 'Waist', icon: '📏' },
                    { key: 'chest', label: 'Chest', icon: '💪' },
                    { key: 'shoulders', label: 'Shoulders', icon: '🎯' },
                    { key: 'arms', label: 'Arms', icon: '💪' },
                    { key: 'thighs', label: 'Thighs', icon: '🦵' },
                  ].map(({ key, label, icon }) => {
                    const current = measurements.latest?.[key as keyof Measurement] as number | null;
                    const change = measurements.changes?.[key] as number | null;

                    if (!current) return null;

                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{current}"</p>
                          {change !== null && change !== 0 && (
                            <p className={`text-xs ${change < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <p>No measurements logged yet</p>
                  <p className="text-sm mt-1">Add measurements in the Check-in tab</p>
                </div>
              )}
            </CardContent>
          </Card>

          {measurements?.history?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Measurement History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {measurements?.history?.map(m => (
                    <div key={m.date} className="flex justify-between text-sm py-2 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400">{formatDate(m.date, 'MMM d')}</span>
                      <div className="flex gap-3 text-xs">
                        {m.waist && <span>W: {m.waist}"</span>}
                        {m.chest && <span>C: {m.chest}"</span>}
                        {m.arms && <span>A: {m.arms}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          {/* Comparison View */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Comparison</CardTitle>
              <div className="flex gap-2">
                {(['front', 'side', 'back'] as const).map(angle => (
                  <button
                    key={angle}
                    onClick={() => setComparisonAngle(angle)}
                    className={`px-3 py-1 text-xs rounded-full capitalize ${
                      comparisonAngle === angle
                        ? 'bg-primary-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {photoComparison?.[comparisonAngle]?.first && photoComparison?.[comparisonAngle]?.latest ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400 mb-2 text-center">Day 1</p>
                    <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden">
                      <img
                        src={photoComparison[comparisonAngle].first!.file_path}
                        alt={`${comparisonAngle} - Day 1`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 text-center mt-1">
                      {formatDate(photoComparison[comparisonAngle].first!.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-2 text-center">Today</p>
                    <div className="aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden">
                      <img
                        src={photoComparison[comparisonAngle].latest!.file_path}
                        alt={`${comparisonAngle} - Latest`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 text-center mt-1">
                      {formatDate(photoComparison[comparisonAngle].latest!.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <p>Take more {comparisonAngle} photos to compare</p>
                  <p className="text-sm mt-1">At least 2 photos needed</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                    >
                      <img
                        src={photo.thumbnail_path}
                        alt={`${photo.angle} - ${photo.date}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white capitalize">{photo.angle}</p>
                        <p className="text-xs text-zinc-400">{formatDate(photo.date, 'M/d')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Photo Modal */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-lg w-full">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute -top-12 right-0 text-white p-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={selectedPhoto.file_path}
                  alt={`${selectedPhoto.angle} - ${selectedPhoto.date}`}
                  className="w-full rounded-lg"
                />
                <div className="mt-4 text-center">
                  <p className="text-white capitalize font-medium">{selectedPhoto.angle} View</p>
                  <p className="text-zinc-400">{formatDate(selectedPhoto.date, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Volume Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Training Volume</CardTitle>
              <span className="text-sm text-zinc-400">Last 14 sessions (K lbs)</span>
            </CardHeader>
            <CardContent>
              {volumeChartData.length > 1 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}K lbs`, 'Volume']}
                      />
                      <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  Complete more workouts to see volume trends
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Compliance</CardTitle>
              <span className="text-sm text-zinc-400">Last 30 days</span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                  <p className={`text-2xl font-bold ${
                    nutritionCompliance.avgCompliance >= 80 ? 'text-green-400' :
                    nutritionCompliance.avgCompliance >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {nutritionCompliance.avgCompliance}%
                  </p>
                  <p className="text-xs text-zinc-400">Avg Compliance</p>
                </div>
                <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">{nutritionCompliance.streak}</p>
                  <p className="text-xs text-zinc-400">Day Streak (80%+)</p>
                </div>
              </div>

              {/* Compliance Heatmap */}
              {nutritionCompliance?.history?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Daily Compliance</p>
                  <div className="grid grid-cols-7 gap-1">
                    {nutritionCompliance.history.slice(0, 28).map((day, i) => (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-sm ${
                          day.compliance_percentage >= 90 ? 'bg-green-500' :
                          day.compliance_percentage >= 80 ? 'bg-green-600/70' :
                          day.compliance_percentage >= 60 ? 'bg-yellow-600/70' :
                          day.compliance_percentage > 0 ? 'bg-red-600/70' : 'bg-zinc-800'
                        }`}
                        title={`${formatDate(day.date, 'MMM d')}: ${day.compliance_percentage}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                    <span>0%</span>
                    <span>60%</span>
                    <span>80%</span>
                    <span>90%+</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {volumeHistory.slice(0, 10).map(session => (
                  <div key={session.date} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{session.workout_type}</p>
                      <p className="text-xs text-zinc-500">{formatDate(session.date, 'EEE, MMM d')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{Math.round(session.total_volume).toLocaleString()} lbs</p>
                      <p className="text-xs text-zinc-500">{session.total_sets} sets</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
