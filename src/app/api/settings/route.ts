import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings, updateUserSettings } from '@/lib/db/queries';
import { getPhaseTargetWeight, getPhaseProgress, getCurrentPhaseConfig } from '@/lib/phases';
import { calculateWeightTrend } from '@/lib/calculations';
import { getRecentWeights } from '@/lib/db/queries';

export async function GET() {
  try {
    const settings = getUserSettings();

    // Get phase-based target weight
    const phaseTargetWeight = getPhaseTargetWeight(settings.current_phase);
    const phaseConfig = getCurrentPhaseConfig(settings.current_phase);

    // Get weight data for phase progress
    const recentWeights = getRecentWeights(30);
    const weightTrend = calculateWeightTrend(recentWeights);
    const currentWeight = weightTrend.sevenDayAvg || settings.current_weight;

    // Get phase progress
    const phaseProgress = getPhaseProgress(settings, settings.current_weight, currentWeight);

    return NextResponse.json({
      ...settings,
      target_weight: phaseTargetWeight,
      phaseConfig,
      phaseProgress,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    updateUserSettings(body);
    const settings = getUserSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
