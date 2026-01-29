import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSettings,
  getStrengthProgress,
  getVolumeHistory,
  getNutritionCompliance,
  getComparisonPhotos,
  getRecentMeasurements,
  getFirstMeasurements,
  getRecentWeights,
} from '@/lib/db/queries';
import {
  calculateWeightTrend,
  calculateGoalDate,
  getStrengthStandardsForWeight,
  getStrengthLevel,
  getCurrentWeekNumber,
  isDeloadWeek,
  STRENGTH_STANDARDS,
} from '@/lib/calculations';
import { getPhaseProgress, getPhaseTargetWeight } from '@/lib/phases';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const settings = getUserSettings();

    if (type === 'strength') {
      const strengthProgress = getStrengthProgress();

      // Add strength levels and standards
      const strengthWithStandards = strengthProgress.map(exercise => {
        const standards = getStrengthStandardsForWeight(exercise.exercise_name, settings.current_weight);
        const level = getStrengthLevel(
          exercise.exercise_name,
          exercise.one_rep_max || 0,
          settings.current_weight
        );

        return {
          ...exercise,
          standards,
          level,
        };
      });

      return NextResponse.json({
        progress: strengthWithStandards,
        bodyweight: settings.current_weight,
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'volume') {
      const volumeHistory = getVolumeHistory(60);

      // Calculate weekly totals
      const weeklyVolume: Record<string, number> = {};
      volumeHistory.forEach(session => {
        const weekStart = getWeekStart(session.date);
        weeklyVolume[weekStart] = (weeklyVolume[weekStart] || 0) + session.total_volume;
      });

      return NextResponse.json({
        sessions: volumeHistory,
        weeklyTotals: Object.entries(weeklyVolume).map(([week, volume]) => ({
          week,
          volume,
        })).sort((a, b) => b.week.localeCompare(a.week)),
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'nutrition') {
      const compliance = getNutritionCompliance(30);

      // Calculate streak of compliance >= 80%
      let streak = 0;
      for (const day of compliance) {
        if (day.compliance_percentage >= 80) {
          streak++;
        } else {
          break;
        }
      }

      // Calculate average compliance
      const avgCompliance = compliance.length > 0
        ? compliance.reduce((sum, d) => sum + d.compliance_percentage, 0) / compliance.length
        : 0;

      return NextResponse.json({
        history: compliance,
        streak,
        avgCompliance: Math.round(avgCompliance),
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'photos') {
      const frontPhotos = getComparisonPhotos('front');
      const sidePhotos = getComparisonPhotos('side');
      const backPhotos = getComparisonPhotos('back');

      return NextResponse.json({
        front: frontPhotos,
        side: sidePhotos,
        back: backPhotos,
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'measurements') {
      const recent = getRecentMeasurements(30);
      const first = getFirstMeasurements();

      return NextResponse.json({
        history: recent,
        first,
        latest: recent[0] || null,
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'goal') {
      const weights = getRecentWeights(30);
      const trend = calculateWeightTrend(weights);

      // Estimate weekly rate (negative for weight loss)
      const weeklyRate = trend.weeklyChange;
      const phaseTargetWeight = getPhaseTargetWeight(settings.current_phase);
      const goalDate = calculateGoalDate(
        settings.current_weight,
        phaseTargetWeight,
        weeklyRate
      );

      // Get phase progress
      const phaseProgress = getPhaseProgress(
        settings,
        settings.current_weight,
        trend.sevenDayAvg || settings.current_weight
      );

      return NextResponse.json({
        currentWeight: settings.current_weight,
        targetWeight: phaseTargetWeight,
        weeklyRate,
        goalDate: goalDate?.date.toISOString().split('T')[0] || null,
        weeksRemaining: goalDate?.weeksRemaining || null,
        phase: settings.current_phase,
        phaseProgress: phaseProgress?.weightProgress || 0,
        phaseMessage: phaseProgress?.message || '',
        weeksInPhase: phaseProgress?.weeksInPhase || 0,
        onTrack: phaseProgress?.onTrack ?? true,
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Default: return summary
    const weekNumber = getCurrentWeekNumber(settings.program_start_date);
    const isDeload = isDeloadWeek(settings.program_start_date);
    const weights = getRecentWeights(14);
    const trend = calculateWeightTrend(weights);
    const strengthProgress = getStrengthProgress();

    return NextResponse.json({
      weekNumber,
      isDeload,
      weightTrend: trend,
      strengthProgress: strengthProgress.slice(0, 5),
      settings,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
  }
}

// Helper to get Monday of the week
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date.toISOString().split('T')[0];
}
