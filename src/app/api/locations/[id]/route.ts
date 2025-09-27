import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: locationId } = await params;

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: session.user.id,
      },
      include: {
        photos: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Transform the data for the frontend
    const locationData = {
      id: location.id,
      title: location.title,
      address: location.address,
      lat: Number(location.lat),
      lng: Number(location.lng),
      timezone: location.timezone,
      notes: location.notes,
      tags: location.tags,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
      photos: location.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        thumbUrl: photo.thumbUrl,
        takenAt: photo.takenAt.toISOString(),
        lat: photo.lat ? Number(photo.lat) : undefined,
        lng: photo.lng ? Number(photo.lng) : undefined,
        exifJson: photo.exifJson,
        order: photo.order,
      })),
    };

    return NextResponse.json(locationData);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
