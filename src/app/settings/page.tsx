'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { UserSettings, PhaseConfig } from '@/lib/types';

interface PhaseProgress {
  phase: PhaseConfig;
  weeksInPhase: number;
  weightProgress: number;
  expectedWeeksRemaining: number;
  onTrack: boolean;
  message: string;
}

interface SettingsResponse extends UserSettings {
  phaseConfig: PhaseConfig | null;
  phaseProgress: PhaseProgress | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Form state (no targetWeight - it's determined by phase)
  const [currentPhase, setCurrentPhase] = useState<'bulk' | 'cut' | 'maintain'>('bulk');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [workoutTime, setWorkoutTime] = useState('07:00');
  const [workoutTimeWeekend, setWorkoutTimeWeekend] = useState('09:00');
  const [programStartDate, setProgramStartDate] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: SettingsResponse) => {
        setSettings(data);
        setCurrentPhase(data.current_phase);
        setWakeTime(data.wake_time);
        setWorkoutTime(data.workout_time || '07:00');
        setWorkoutTimeWeekend(data.workout_time_weekend || '09:00');
        setProgramStartDate(data.program_start_date || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_phase: currentPhase,
          wake_time: wakeTime,
          workout_time: workoutTime,
          workout_time_weekend: workoutTimeWeekend,
          program_start_date: programStartDate,
        }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (resetConfirmText !== 'RESET') return;

    setResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        // Reload the page to get fresh state
        window.location.href = '/';
      } else {
        alert('Failed to reset data');
      }
    } catch (err) {
      console.error('Failed to reset:', err);
      alert('Failed to reset data');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Current Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-400">Height</p>
              <p className="text-lg font-medium">{settings?.height_inches || 72}" (6'0")</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Current Weight</p>
              <p className="text-lg font-medium">{settings?.current_weight || 184} lbs</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-2">Program Start Date</label>
              <input
                type="date"
                value={programStartDate}
                onChange={e => setProgramStartDate(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-lg"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Day 1 of your workout cycle. Adjust if you need to sync your schedule.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase & Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Phase & Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Phase Display */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Current Phase</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bulk', 'cut', 'maintain'] as const).map(phase => (
                <button
                  key={phase}
                  onClick={() => setCurrentPhase(phase)}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors capitalize ${
                    currentPhase === phase
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Info */}
          {settings?.phaseConfig && (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Phase Target Weight</span>
                <span className="text-lg font-semibold text-primary-400">
                  {settings.target_weight} lbs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Daily Calories</span>
                <span className="font-medium">{settings.phaseConfig.targets.calories} cal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Weekly Rate</span>
                <span className="font-medium">
                  {settings.phaseConfig.targets.weekly_rate > 0 ? '+' : ''}
                  {settings.phaseConfig.targets.weekly_rate} lb/week
                </span>
              </div>
              {settings.phaseProgress && (
                <>
                  <div className="border-t border-zinc-700 pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-400">Progress</span>
                      <span className="text-sm font-medium">
                        {settings.phaseProgress.weightProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, settings.phaseProgress.weightProgress)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {settings.phaseProgress.message}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Weeks in Phase</span>
                    <span>{settings.phaseProgress.weeksInPhase}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Est. Weeks Remaining</span>
                    <span>{settings.phaseProgress.expectedWeeksRemaining}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Status</span>
                    <span className={settings.phaseProgress.onTrack ? 'text-green-400' : 'text-yellow-400'}>
                      {settings.phaseProgress.onTrack ? 'On Track' : 'Adjust Needed'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <p className="text-xs text-zinc-500">
            Target weight is automatically set based on your current phase. The system will suggest phase transitions when you reach your goals.
          </p>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Wake Time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-lg"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Meal times are calculated from your wake time
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Workout Time (Weekdays)</label>
              <input
                type="time"
                value={workoutTime}
                onChange={e => setWorkoutTime(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-lg"
              />
              <p className="text-xs text-zinc-500 mt-1">Mon-Fri</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Workout Time (Weekends)</label>
              <input
                type="time"
                value={workoutTimeWeekend}
                onChange={e => setWorkoutTimeWeekend(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-lg"
              />
              <p className="text-xs text-zinc-500 mt-1">Sat-Sun</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Pre/post-workout meals are timed around your workout schedule
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={saveSettings}
        loading={saving}
        className="w-full"
        size="lg"
      >
        Save Changes
      </Button>

      {/* Danger Zone */}
      <Card className="border-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-4">
            Reset all app data including workouts, nutrition logs, check-ins, photos, and exercise maxes. This cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowResetModal(true)}
            className="w-full"
          >
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetConfirmText('');
        }}
        title="Reset All Data?"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl">
            <p className="text-red-400 font-medium mb-2">Warning: This will delete:</p>
            <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
              <li>All workout sessions and sets</li>
              <li>All nutrition logs</li>
              <li>All weight check-ins</li>
              <li>All progress photos</li>
              <li>All exercise max records</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Type <span className="font-mono text-white">RESET</span> to confirm:
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-lg font-mono"
              placeholder="Type RESET"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowResetModal(false);
                setResetConfirmText('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              loading={resetting}
              disabled={resetConfirmText !== 'RESET'}
              className="flex-1"
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* App Info */}
      <Card className="bg-zinc-950">
        <CardContent className="text-center py-4">
          <p className="text-sm text-zinc-500">Ascend v0.1.0</p>
          <p className="text-xs text-zinc-600 mt-1">Built for Deniz</p>
        </CardContent>
      </Card>
    </div>
  );
}
