import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

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
        photos: item.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          thumbUrl: photo.thumbUrl,
          takenAt: photo.takenAt.toISOString(),
          lat: photo.lat ? Number(photo.lat) : undefined,
          lng: photo.lng ? Number(photo.lng) : undefined,
          order: photo.order,
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
