'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Location Manager</h1>
          
          {session && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Welcome, {session.user?.name || session.user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {session ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Welcome to Location Manager
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your comprehensive location management PWA for tracking and organizing locations, 
                managing photo shoots, and creating professional proposals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  📍 Locations
                </h3>
                <p className="text-muted-foreground text-sm">
                  Manage your shooting locations with GPS coordinates, notes, and tags.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  📸 Photos
                </h3>
                <p className="text-muted-foreground text-sm">
                  Upload and organize photos with EXIF data and automatic thumbnails.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  📋 Proposals
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create professional proposals with selected photos and shareable links.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  🌅 Sun Times
                </h3>
                <p className="text-muted-foreground text-sm">
                  Track golden hour and sunrise/sunset times for perfect lighting.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  👥 Clients
                </h3>
                <p className="text-muted-foreground text-sm">
                  Manage client information and project relationships.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  📱 PWA Ready
                </h3>
                <p className="text-muted-foreground text-sm">
                  Install as a native app on your device for offline access.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-800 rounded-md border border-green-200">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium">
                  Authentication & Storage configured successfully!
                </span>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/locations/test-location-1')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Test Photo Upload
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Please sign in to continue
            </h2>
            <p className="text-muted-foreground mb-8">
              You need to be authenticated to access the Location Manager.
            </p>
            <button
              onClick={() => router.push('/signin')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
