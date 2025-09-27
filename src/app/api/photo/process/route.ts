import { NextRequest, NextResponse } from 'next/server';
import { processPhotoUpload } from '@/lib/actions/photo';

export async function POST(request: NextRequest) {
  try {
    const { originalUrl, locationId, order } = await request.json();

    if (!originalUrl || !locationId) {
      return NextResponse.json(
        { error: 'Missing required fields: originalUrl, locationId' },
        { status: 400 }
      );
    }

    const result = await processPhotoUpload(originalUrl, locationId, order);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Photo processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
