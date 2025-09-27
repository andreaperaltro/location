'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MapPin, Calendar, Tag, Camera, Plus } from 'lucide-react';
import PhotoUpload from '@/components/photo-upload';
import PhotoGallery from '@/components/photo-gallery';
import { deletePhoto } from '@/lib/actions/photo';

interface Location {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  timezone: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
}

interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  takenAt: string;
  lat?: number;
  lng?: number;
  exifJson?: any;
  order: number;
}

export default function LocationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const locationId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }

    fetchLocation();
  }, [session, status, locationId]);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/locations/${locationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Location not found');
        }
        throw new Error('Failed to fetch location');
      }

      const data = await response.json();
      setLocation(data);
    } catch (error) {
      console.error('Error fetching location:', error);
      setError(error instanceof Error ? error.message : 'Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (result: { success: boolean; photo?: any; error?: string }) => {
    if (result.success && result.photo && location) {
      // Add the new photo to the location's photos array
      setLocation({
        ...location,
        photos: [...location.photos, result.photo],
      });
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setIsDeleting(true);
      const result = await deletePhoto(photoId);
      
      if (result.success && location) {
        // Remove the photo from the location's photos array
        setLocation({
          ...location,
          photos: location.photos.filter(photo => photo.id !== photoId),
        });
      } else {
        setError(result.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError('Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Location not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{location.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{location.address}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>{location.photos.length}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Location Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{location.address}</p>
              <p className="text-sm text-muted-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Added {formatDate(location.createdAt)}
            </p>
          </div>

          {location.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {location.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {location.notes && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{location.notes}</p>
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos
          </h2>
          <PhotoUpload
            locationId={locationId}
            onUploadComplete={handlePhotoUpload}
            currentPhotoCount={location.photos.length}
            maxPhotos={50}
          />
        </div>

        {/* Photo Gallery */}
        {location.photos.length > 0 && (
          <div className="space-y-4">
            <PhotoGallery
              photos={location.photos}
              onDeletePhoto={handleDeletePhoto}
              isDeleting={isDeleting}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-destructive hover:text-destructive/80 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
