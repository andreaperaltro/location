import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      address,
      lat,
      lng,
      timezone,
      notes,
      tags,
      projectId,
      photos,
    } = body;

    // Validate required fields
    if (!title || !address || !projectId) {
      return NextResponse.json(
        { error: 'Title, address, and project are required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Create location
    const location = await prisma.location.create({
      data: {
        title,
        address,
        lat: lat || 0,
        lng: lng || 0,
        timezone: timezone || 'UTC',
        notes: notes || '',
        tags: tags || [],
        projectId,
        userId: session.user.id,
      },
    });

    // Update photos with location ID if provided
    if (photos && photos.length > 0) {
      // First verify photos belong to user through their locations
      const userPhotos = await prisma.photo.findMany({
        where: {
          id: { in: photos },
          location: {
            userId: session.user.id,
          },
        },
      });

      // Update only the photos that belong to the user
      if (userPhotos.length > 0) {
        await prisma.photo.updateMany({
          where: {
            id: { in: userPhotos.map(p => p.id) },
          },
          data: {
            locationId: location.id,
          },
        });
      }
    }

    return NextResponse.json({
      ...location,
      lat: Number(location.lat),
      lng: Number(location.lng),
    });

  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Build where clause
    const where: { userId: string; projectId?: string } = {
      userId: session.user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Fetch locations
    const locations = await prisma.location.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        photos: {
          select: {
            id: true,
            thumbUrl: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1, // Just get the first photo for preview
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(locations.map(location => ({
      ...location,
      lat: Number(location.lat),
      lng: Number(location.lng),
    })));

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
