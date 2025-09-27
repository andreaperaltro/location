'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Camera, Calendar, X, Download, ExternalLink } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  thumbUrl?: string;
  takenAt: string;
  exifJson?: any;
  lat?: number;
  lng?: number;
  order: number;
}

interface PhotoGridProps {
  photos: Photo[];
  onDeletePhoto?: (photoId: string) => void;
  isDeleting?: boolean;
  showMetadata?: boolean;
  maxColumns?: number;
  className?: string;
}

export default function PhotoGrid({ 
  photos, 
  onDeletePhoto, 
  isDeleting = false,
  showMetadata = true,
  maxColumns = 4,
  className = '' 
}: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handlePhotoClick = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  if (photos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No photos yet</h3>
        <p className="text-sm text-muted-foreground">Upload some photos to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(maxColumns, 6)} gap-4 ${className}`}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick(photo, index)}
          >
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <Image
                src={photo.thumbUrl || photo.url}
                alt={`Photo ${index + 1}`}
                width={400}
                height={400}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                unoptimized
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  {showMetadata && (
                    <>
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      {photo.lat && photo.lng && (
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </>
                  )}
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Delete button */}
            {onDeletePhoto && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                disabled={isDeleting}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Photo number */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                {selectedIndex > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    ←
                  </button>
                )}
                {selectedIndex < photos.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    →
                  </button>
                )}
              </>
            )}

            {/* Photo */}
            <div className="relative">
              <Image
                src={selectedPhoto.url}
                alt={`Photo ${selectedIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                unoptimized
              />

              {/* Photo info */}
              {showMetadata && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedPhoto.takenAt)}</span>
                    </div>
                    
                    {selectedPhoto.lat && selectedPhoto.lng && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span>Photo {selectedIndex + 1} of {photos.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Download button */}
            <button
              onClick={() => handleDownload(selectedPhoto)}
              className="absolute top-4 right-16 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
