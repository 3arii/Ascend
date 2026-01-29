'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { formatWeight } from '@/lib/utils';

interface CheckinData {
  checkin: {
    id: number;
    morning_weight: number | null;
  } | null;
  photos: Array<{
    id: number;
    angle: string;
    thumbnail_path: string;
  }>;
  recentWeights: Array<{ date: string; weight: number }>;
  trend: {
    weeklyChange: number;
    trend: 'up' | 'down' | 'stable';
    sevenDayAvg: number;
  };
  todayAngle: 'front' | 'side' | 'back';
  settings: {
    current_weight: number;
  };
}

export default function CheckinPage() {
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState({
    waist: 0,
    chest: 0,
    shoulders: 0,
    arms: 0,
    thighs: 0,
  });
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  const fetchData = () => {
    fetch('/api/checkins')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setWeight(data.checkin?.morning_weight || data.settings?.current_weight || 184);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load checkin:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveWeight = async () => {
    setSaving(true);
    try {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_weight',
          weight,
        }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to save weight:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('angle', data.todayAngle);

      await fetch('/api/checkins', {
        method: 'POST',
        body: formData,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setUploading(false);
    }
  };

  const saveMeasurements = async () => {
    setSavingMeasurements(true);
    try {
      const toSave: Record<string, number> = {};
      if (measurements.waist > 0) toSave.waist = measurements.waist;
      if (measurements.chest > 0) toSave.chest = measurements.chest;
      if (measurements.shoulders > 0) toSave.shoulders = measurements.shoulders;
      if (measurements.arms > 0) toSave.arms = measurements.arms;
      if (measurements.thighs > 0) toSave.thighs = measurements.thighs;

      if (Object.keys(toSave).length > 0) {
        await fetch('/api/measurements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        });
      }
      setShowMeasurements(false);
    } catch (err) {
      console.error('Failed to save measurements:', err);
    } finally {
      setSavingMeasurements(false);
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
        Failed to load check-in data
      </div>
    );
  }

  const { checkin, photos, recentWeights, trend, todayAngle } = data;
  const hasLoggedWeight = checkin !== null && checkin?.morning_weight !== null && checkin?.morning_weight !== undefined;
  const hasTodayPhoto = photos.some(p => p.angle === todayAngle);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Daily Check-in</h1>

      {/* Weight Section */}
      <Card variant={hasLoggedWeight ? 'default' : 'highlight'}>
        <CardHeader>
          <CardTitle>Morning Weight</CardTitle>
          {hasLoggedWeight && (
            <span className="text-sm text-green-400">Logged</span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {hasLoggedWeight && checkin?.morning_weight ? (
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{formatWeight(checkin.morning_weight)}</p>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div>
                  <p className="text-zinc-400">7-day avg</p>
                  <p className="font-medium">{trend.sevenDayAvg} lbs</p>
                </div>
                <div>
                  <p className="text-zinc-400">Weekly</p>
                  <p className={`font-medium ${trend.trend === 'down' ? 'text-green-400' : trend.trend === 'up' ? 'text-yellow-400' : ''}`}>
                    {trend.weeklyChange > 0 ? '+' : ''}{trend.weeklyChange} lbs
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 text-center">
                Weigh yourself first thing in the morning
              </p>
              <NumberInput
                value={weight}
                onChange={setWeight}
                min={100}
                max={400}
                step={0.1}
                unit="lbs"
                size="lg"
              />
              <Button
                onClick={saveWeight}
                loading={saving}
                className="w-full"
              >
                Save Weight
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Weights */}
      {recentWeights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Weights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWeights.slice(0, 7).map((entry, i) => (
                <div key={entry.date} className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className={i === 0 ? 'font-medium' : ''}>
                    {entry.weight} lbs
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Section */}
      <Card variant={hasTodayPhoto ? 'default' : 'highlight'}>
        <CardHeader>
          <CardTitle>Progress Photo</CardTitle>
          <span className="text-sm text-zinc-400 capitalize">
            Today: {todayAngle} view
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTodayPhoto ? (
            <div className="text-center py-4">
              <svg className="w-16 h-16 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-zinc-400">Photo captured!</p>
            </div>
          ) : (
            <>
              <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-xl">
                <svg className="w-12 h-12 mx-auto text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-zinc-400 capitalize">{todayAngle} view</p>
              </div>

              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] bg-primary-600 hover:bg-primary-500 text-white px-4 py-3 w-full">
                  {uploading ? (
                    <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  Take Photo
                </span>
              </label>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Photos */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 6).map(photo => (
                <div
                  key={photo.id}
                  className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative"
                >
                  <img
                    src={photo.thumbnail_path}
                    alt={photo.angle}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-xs bg-black/50 px-1 rounded capitalize">
                    {photo.angle}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Measurements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Body Measurements</CardTitle>
          <span className="text-sm text-zinc-400">Weekly recommended</span>
        </CardHeader>
        <CardContent>
          {!showMeasurements ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowMeasurements(true)}
            >
              Log Measurements
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Take measurements first thing in the morning. All fields are optional.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Waist (inches)</label>
                  <NumberInput
                    value={measurements.waist}
                    onChange={(v) => setMeasurements(m => ({ ...m, waist: v }))}
                    min={0}
                    max={100}
                    step={0.25}
                    unit='"'
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Chest (inches)</label>
                  <NumberInput
                    value={measurements.chest}
                    onChange={(v) => setMeasurements(m => ({ ...m, chest: v }))}
                    min={0}
                    max={100}
                    step={0.25}
                    unit='"'
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Shoulders (inches)</label>
                  <NumberInput
                    value={measurements.shoulders}
                    onChange={(v) => setMeasurements(m => ({ ...m, shoulders: v }))}
                    min={0}
                    max={100}
                    step={0.25}
                    unit='"'
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Arms (inches)</label>
                  <NumberInput
                    value={measurements.arms}
                    onChange={(v) => setMeasurements(m => ({ ...m, arms: v }))}
                    min={0}
                    max={100}
                    step={0.25}
                    unit='"'
                    size="sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Thighs (inches)</label>
                  <NumberInput
                    value={measurements.thighs}
                    onChange={(v) => setMeasurements(m => ({ ...m, thighs: v }))}
                    min={0}
                    max={100}
                    step={0.25}
                    unit='"'
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowMeasurements(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveMeasurements}
                  loading={savingMeasurements}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
