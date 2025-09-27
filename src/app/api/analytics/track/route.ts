import { NextRequest, NextResponse } from 'next/server';
import { trackAnalyticsEvent, getClientInfo } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, event } = body;

    if (!proposalId || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: proposalId, event' },
        { status: 400 }
      );
    }

    if (!['view', 'download', 'share'].includes(event)) {
      return NextResponse.json(
        { error: 'Invalid event type. Must be: view, download, or share' },
        { status: 400 }
      );
    }

    const clientInfo = getClientInfo(request);

    await trackAnalyticsEvent({
      proposalId,
      event,
      ...clientInfo,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
