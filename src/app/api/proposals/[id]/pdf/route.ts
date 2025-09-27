import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { generateProposalPdf } from '@/lib/pdf';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalId = (await params).id;

    // Fetch proposal with user verification
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
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get base URL from request
    const baseUrl = process.env.NEXTAUTH_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Generate PDF
    const pdfResult = await generateProposalPdf(
      proposal.slug,
      proposal.id,
      baseUrl,
      {
        format: 'A4',
        orientation: 'portrait',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
        printBackground: true,
        scale: 1,
      }
    );

    if (pdfResult.error) {
      return NextResponse.json(
        { error: pdfResult.error },
        { status: 500 }
      );
    }

    // Update proposal with PDF URL (optional - you might want to store this)
    // await prisma.proposal.update({
    //   where: { id: proposalId },
    //   data: { pdfUrl: pdfResult.url },
    // });

    return NextResponse.json({
      url: pdfResult.url,
      proposalId: proposal.id,
      slug: proposal.slug,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('PDF API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if PDF exists or get existing PDF URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalId = (await params).id;

    // Check if proposal exists and user has access
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        userId: session.user.id,
      },
      select: {
        id: true,
        slug: true,
        // pdfUrl: true, // If you store PDF URLs in the database
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // For now, we'll always generate a new PDF
    // In a real implementation, you might want to check if a PDF already exists
    // and return the existing URL, or generate a new one only when needed

    return NextResponse.json({
      proposalId: proposal.id,
      slug: proposal.slug,
      message: 'Use POST to generate PDF',
    });

  } catch (error) {
    console.error('PDF GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
