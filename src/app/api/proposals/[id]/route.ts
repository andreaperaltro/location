import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: proposalId } = await params;

    // Fetch proposal with all related data
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        userId: session.user.id,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        items: {
          include: {
            location: {
              include: {
                photos: {
                  orderBy: {
                    order: 'asc',
                  },
                },
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

    return NextResponse.json(proposal);

  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalId = (await params).id;
    const body = await request.json();

    // Verify proposal ownership
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        userId: session.user.id,
      },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found or access denied' },
        { status: 404 }
      );
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        title: body.title,
        introMd: body.introMd,
        outroMd: body.outroMd,
        status: body.status,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        items: {
          include: {
            location: {
              include: {
                photos: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedProposal);

  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalId = (await params).id;

    // Verify proposal ownership
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        userId: session.user.id,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found or access denied' },
        { status: 404 }
      );
    }

    // Delete proposal (cascade will handle related records)
    await prisma.proposal.delete({
      where: { id: proposalId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
