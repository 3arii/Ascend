import { NextRequest, NextResponse } from 'next/server';
import { logBodyMeasurements, getRecentMeasurements, getFirstMeasurements } from '@/lib/db/queries';
import { getToday } from '@/lib/utils';

export async function GET() {
  try {
    const recent = getRecentMeasurements(30) || [];
    const first = getFirstMeasurements() || null;

    // Calculate changes
    const latest = recent[0] || null;
    let changes = null;

    if (first && latest) {
      changes = {
        waist: first.waist && latest.waist ? latest.waist - first.waist : null,
        chest: first.chest && latest.chest ? latest.chest - first.chest : null,
        shoulders: first.shoulders && latest.shoulders ? latest.shoulders - first.shoulders : null,
        arms: first.arms && latest.arms ? latest.arms - first.arms : null,
        thighs: first.thighs && latest.thighs ? latest.thighs - first.thighs : null,
      };
    }

    return NextResponse.json({
      history: recent,
      first,
      latest,
      changes,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json({
      history: [],
      first: null,
      latest: null,
      changes: null
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { waist, chest, shoulders, arms, thighs, date } = body;

    logBodyMeasurements(date || getToday(), {
      waist: waist || undefined,
      chest: chest || undefined,
      shoulders: shoulders || undefined,
      arms: arms || undefined,
      thighs: thighs || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging measurements:', error);
    return NextResponse.json({ error: 'Failed to log measurements' }, { status: 500 });
  }
}
