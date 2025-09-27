import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch published proposal with all related data
    const proposal = await prisma.proposal.findFirst({
      where: {
        slug: slug,
        status: 'PUBLISHED', // Only allow access to published proposals
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        items: {
          include: {
            location: true,
            photos: {
              include: {
                photo: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Transform the data for the frontend
    const proposalData = {
      id: proposal.id,
      title: proposal.title,
      introMd: proposal.introMd,
      outroMd: proposal.outroMd,
      status: proposal.status,
      slug: proposal.slug,
      createdAt: proposal.createdAt.toISOString(),
      project: {
        title: proposal.project.title,
        client: proposal.project.client ? {
          name: proposal.project.client.name,
        } : null,
      },
      items: proposal.items.map(item => ({
        id: item.id,
        order: item.order,
        location: {
          id: item.location.id,
          title: item.location.title,
          address: item.location.address,
          lat: Number(item.location.lat),
          lng: Number(item.location.lng),
          timezone: item.location.timezone,
          notes: item.location.notes,
          tags: item.location.tags,
        },
        photos: item.photos.map(itemPhoto => ({
          id: itemPhoto.photo.id,
          url: itemPhoto.photo.url,
          thumbUrl: itemPhoto.photo.thumbUrl,
          takenAt: itemPhoto.photo.takenAt.toISOString(),
          lat: itemPhoto.photo.lat ? Number(itemPhoto.photo.lat) : undefined,
          lng: itemPhoto.photo.lng ? Number(itemPhoto.photo.lng) : undefined,
          order: itemPhoto.order,
        })),
      })),
    };

    return NextResponse.json(proposalData);
  } catch (error) {
    console.error('Error fetching public proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
