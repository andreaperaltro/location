import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProposalAnalytics } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalId = params.proposalId;

    // Verify proposal ownership
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
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

    // Get analytics data
    const analytics = await getProposalAnalytics(proposalId);

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
