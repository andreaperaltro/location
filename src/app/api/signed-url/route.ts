import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSignedUrl } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path, expiresIn } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 });
    }

    // Default expiration to 1 hour if not provided
    const expiration = expiresIn || 3600;

    // Get signed URL
    const signedUrl = await getSignedUrl(path, expiration);

    return NextResponse.json({ 
      signedUrl,
      expiresIn: expiration
    });

  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }
}
