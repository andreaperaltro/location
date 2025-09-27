'use client';

import Link from 'next/link';
import { MapPin, Camera, Calendar, Tag } from 'lucide-react';

interface LocationCardProps {
  location: {
    id: string;
    title: string;
    address: string;
    lat: number;
    lng: number;
    timezone: string;
    notes?: string;
    tags: string[];
    createdAt: string;
    _count: {
      photos: number;
    };
    photos: {
      id: string;
      thumbUrl: string;
    }[];
  };
  showProject?: boolean;
  projectTitle?: string;
  className?: string;
}

export default function LocationCard({ 
  location, 
  showProject = false, 
  projectTitle,
  className = '' 
}: LocationCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const previewPhoto = location.photos[0];

  return (
    <Link
      href={`/locations/${location.id}`}
      className={`block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors group ${className}`}
    >
      <div className="space-y-3">
        {/* Header with title and photo count */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {location.title}
            </h3>
            {showProject && projectTitle && (
              <p className="text-xs text-muted-foreground mt-1">{projectTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <Camera className="h-3 w-3" />
            <span>{location._count.photos}</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">
            {location.address}
          </p>
        </div>

        {/* Preview Photo */}
        {previewPhoto && (
          <div className="aspect-video bg-muted rounded-md overflow-hidden">
            <img
              src={previewPhoto.thumbUrl}
              alt={`Preview of ${location.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Tags */}
        {location.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {location.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {location.tags.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                +{location.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Notes preview */}
        {location.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {location.notes}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(location.createdAt)}</span>
          </div>
          <span>{location.timezone}</span>
        </div>
      </div>
    </Link>
  );
}
