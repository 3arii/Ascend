import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateDailyCheckin,
  logWeight,
  getRecentWeights,
  getCheckinByDate,
  createProgressPhoto,
  getPhotosByCheckinId,
  getRecentPhotos,
} from '@/lib/db/queries';
import { getUserSettings } from '@/lib/db/queries';
import { getTodayPhotoAngle, calculateWeightTrend } from '@/lib/calculations';
import { getToday } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getToday();
    const type = searchParams.get('type');

    if (type === 'photos') {
      const photos = getRecentPhotos(12);
      return NextResponse.json({ photos }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (type === 'weights') {
      const weights = getRecentWeights(90);
      const trend = calculateWeightTrend(weights);
      return NextResponse.json({ weights, trend }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const settings = getUserSettings();
    const checkin = getCheckinByDate(date);
    const recentWeights = getRecentWeights(14);
    const trend = calculateWeightTrend(recentWeights);
    const todayAngle = getTodayPhotoAngle(settings.program_start_date);

    let photos: ReturnType<typeof getPhotosByCheckinId> = [];
    if (checkin) {
      photos = getPhotosByCheckinId(checkin.id);
    }

    return NextResponse.json({
      checkin,
      photos,
      recentWeights,
      trend,
      todayAngle,
      settings,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching checkin:', error);
    return NextResponse.json({ error: 'Failed to fetch checkin' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle photo upload
      const formData = await request.formData();
      const file = formData.get('photo') as File;
      const angle = formData.get('angle') as string;
      const date = formData.get('date') as string || getToday();

      if (!file || !angle) {
        return NextResponse.json({ error: 'Photo and angle required' }, { status: 400 });
      }

      // Create checkin if needed
      const checkin = getOrCreateDailyCheckin(date);

      // Save the file
      const photoDir = path.join(process.cwd(), 'public', 'photos');
      if (!fs.existsSync(photoDir)) {
        fs.mkdirSync(photoDir, { recursive: true });
      }

      const fileName = `${date}_${angle}.jpg`;
      const filePath = path.join(photoDir, fileName);
      const thumbnailName = `${date}_${angle}_thumb.jpg`;
      const thumbnailPath = path.join(photoDir, thumbnailName);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      // For now, use same file as thumbnail (Sharp processing can be added later)
      fs.writeFileSync(thumbnailPath, buffer);

      // Save to database
      createProgressPhoto({
        checkin_id: checkin.id,
        angle: angle as 'front' | 'side' | 'back',
        file_path: `/photos/${fileName}`,
        thumbnail_path: `/photos/${thumbnailName}`,
      });

      return NextResponse.json({ success: true });
    }

    // Handle JSON body (weight logging)
    const body = await request.json();
    const { action, weight, notes, date } = body;

    if (action === 'log_weight') {
      if (!weight) {
        return NextResponse.json({ error: 'Weight required' }, { status: 400 });
      }

      logWeight(date || getToday(), weight, notes);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing checkin:', error);
    return NextResponse.json({ error: 'Failed to process checkin' }, { status: 500 });
  }
}
