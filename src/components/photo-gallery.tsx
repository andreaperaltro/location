'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, MapPin, Calendar, Camera } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  takenAt: Date;
  lat?: number;
  lng?: number;
  exifJson?: any;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDeletePhoto: (photoId: string) => void;
  isDeleting?: boolean;
}

export default function PhotoGallery({ photos, onDeletePhoto, isDeleting }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatGPS = (lat?: number, lng?: number) => {
    if (!lat || !lng) return null;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No photos uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Use the upload area above to add your first photo
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image
              src={photo.thumbUrl || photo.url}
              alt="Location photo"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeletePhoto(photo.id);
              }}
              disabled={isDeleting}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
            </button>

            {/* GPS Indicator */}
            {photo.lat && photo.lng && (
              <div className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <MapPin className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="bg-background rounded-lg overflow-hidden">
              <div className="relative aspect-video max-h-[70vh]">
                <Image
                  src={selectedPhoto.url}
                  alt="Location photo"
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedPhoto.takenAt)}
                  </div>
                  {selectedPhoto.lat && selectedPhoto.lng && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {formatGPS(selectedPhoto.lat, selectedPhoto.lng)}
                    </div>
                  )}
                </div>

                {selectedPhoto.exifJson && (
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Camera:</strong> {selectedPhoto.exifJson.Make} {selectedPhoto.exifJson.Model}</p>
                    {selectedPhoto.exifJson.FNumber && (
                      <p><strong>Aperture:</strong> f/{selectedPhoto.exifJson.FNumber}</p>
                    )}
                    {selectedPhoto.exifJson.ExposureTime && (
                      <p><strong>Shutter:</strong> 1/{Math.round(1/selectedPhoto.exifJson.ExposureTime)}s</p>
                    )}
                    {selectedPhoto.exifJson.ISO && (
                      <p><strong>ISO:</strong> {selectedPhoto.exifJson.ISO}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Import X icon
import { X } from 'lucide-react';
