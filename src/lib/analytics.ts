import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsEvent {
  proposalId: string;
  event: 'view' | 'download' | 'share';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Create analytics record
    await prisma.proposalAnalytics.create({
      data: {
        proposalId: event.proposalId,
        event: event.event,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        referrer: event.referrer,
      },
    });

    // Update proposal counters
    const updateField = event.event === 'view' ? 'viewCount' : 'downloadCount';
    await prisma.proposal.update({
      where: { id: event.proposalId },
      data: {
        [updateField]: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    // Don't throw error to avoid breaking user experience
  }
}

export async function getProposalAnalytics(proposalId: string) {
  try {
    const [analytics, proposal] = await Promise.all([
      prisma.proposalAnalytics.findMany({
        where: { proposalId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to last 100 events
      }),
      prisma.proposal.findUnique({
        where: { id: proposalId },
        select: {
          viewCount: true,
          downloadCount: true,
        },
      }),
    ]);

    // Group analytics by date
    const analyticsByDate = analytics.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { views: 0, downloads: 0, shares: 0 };
      }
      acc[date][`${event.event}s` as keyof typeof acc[typeof date]]++;
      return acc;
    }, {} as Record<string, { views: number; downloads: number; shares: number }>);

    // Get unique visitors (based on IP, anonymized)
    const uniqueVisitors = new Set(
      analytics
        .filter(event => event.event === 'view')
        .map(event => event.ipAddress)
        .filter(Boolean)
    ).size;

    return {
      totalViews: proposal?.viewCount || 0,
      totalDownloads: proposal?.downloadCount || 0,
      uniqueVisitors,
      recentActivity: analytics.slice(0, 10),
      analyticsByDate,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      totalViews: 0,
      totalDownloads: 0,
      uniqueVisitors: 0,
      recentActivity: [],
      analyticsByDate: {},
    };
  }
}

export function anonymizeIP(ip: string): string {
  // Simple IP anonymization - remove last octet for IPv4
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  // For IPv6, just return first 4 groups
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  return ip;
}

export function getClientInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || undefined;
  const referrer = request.headers.get('referer') || undefined;
  
  // Get IP address (considering various proxy headers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIP || realIP || (forwarded ? forwarded.split(',')[0].trim() : null);
  
  return {
    userAgent,
    referrer,
    ipAddress: ip ? anonymizeIP(ip) : undefined,
  };
}
