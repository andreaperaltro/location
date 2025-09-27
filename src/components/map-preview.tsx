'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, MapPin, Loader2 } from 'lucide-react';

interface MapPreviewProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

export default function MapPreview({
  lat,
  lng,
  title,
  address,
  className = '',
  size = 'medium',
  showTitle = true,
}: MapPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size configurations
  const sizeConfig = {
    small: { width: 200, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 600, height: 400 },
  };

  const { width, height } = sizeConfig[size];

  // Map provider configuration
  const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'google';
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Generate static map URL based on provider
  const getStaticMapUrl = () => {
    if (mapProvider === 'mapbox' && mapboxToken) {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-l+000(${lng},${lat})/${lng},${lat},14/${width}x${height}@2x?access_token=${mapboxToken}`;
    } else if (mapProvider === 'google' && googleMapsApiKey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${googleMapsApiKey}`;
    } else {
      // Fallback to OpenStreetMap-based service
      return `https://tile.openstreetmap.org/15/${Math.floor((lng + 180) / 360 * Math.pow(2, 15))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 15))}.png`;
    }
  };

  // Generate "Open in Maps" URL
  const getMapsUrl = () => {
    // Try to detect if user is on mobile
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use device's default maps app
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        return `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`;
      } else {
        return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(title || 'Location')})`;
      }
    } else {
      // Desktop - use Google Maps web
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (title || address) && (
        <div className="space-y-1">
          {title && (
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {title}
            </h3>
          )}
          {address && (
            <p className="text-sm text-muted-foreground">{address}</p>
          )}
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-muted text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Map preview unavailable</p>
            <p className="text-xs text-muted-foreground">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        ) : (
          <Image
            src={getStaticMapUrl()}
            alt={`Map showing ${title || 'location'} at ${lat}, ${lng}`}
            width={width}
            height={height}
            className={`object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw`}
          />
        )}

        {/* Overlay with coordinates */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      </div>

      {/* Open in Maps button */}
      <a
        href={getMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium w-full justify-center"
      >
        <ExternalLink className="h-4 w-4" />
        Open in Maps
      </a>

      {/* Provider info */}
      <div className="text-xs text-muted-foreground text-center">
        {mapProvider === 'google' && googleMapsApiKey && 'Powered by Google Maps'}
        {mapProvider === 'mapbox' && mapboxToken && 'Powered by Mapbox'}
        {!googleMapsApiKey && !mapboxToken && 'Using OpenStreetMap'}
      </div>
    </div>
  );
}

// Export utility functions for external use
export function generateMapsUrl(lat: number, lng: number, title?: string): string {
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`;
    } else {
      return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(title || 'Location')})`;
    }
  } else {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
}

export function generateStaticMapUrl(
  lat: number,
  lng: number,
  width: number = 400,
  height: number = 300,
  zoom: number = 15
): string {
  const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'google';
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (mapProvider === 'mapbox' && mapboxToken) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-l+000(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`;
  } else if (mapProvider === 'google' && googleMapsApiKey) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${googleMapsApiKey}`;
  } else {
    // Fallback to a simple coordinate display
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="Arial,sans-serif" font-size="14">${lat.toFixed(6)}, ${lng.toFixed(6)}</text></svg>`;
  }
}
