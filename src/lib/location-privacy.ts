/**
 * Location privacy utilities for hiding exact GPS coordinates in public views
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface PublicLocationData {
  lat: number;
  lng: number;
  address: string;
  cityOnly: boolean;
}

/**
 * Obscure GPS coordinates by rounding to city-level precision
 * This reduces precision from ~1m to ~1km
 */
export function obscureCoordinates(coords: LocationCoordinates): LocationCoordinates {
  return {
    lat: Math.round(coords.lat * 100) / 100, // ~1km precision
    lng: Math.round(coords.lng * 100) / 100, // ~1km precision
  };
}

/**
 * Extract city from full address
 */
export function extractCityFromAddress(address: string): string {
  // Common address patterns to extract city
  const patterns = [
    // "123 Main St, City, State 12345" or "123 Main St, City, State"
    /,\s*([^,]+),\s*[A-Z]{2}(?:\s+\d{5})?$/,
    // "City, State 12345" or "City, State"
    /^([^,]+),\s*[A-Z]{2}(?:\s+\d{5})?$/,
    // "123 Main St, City" (international format)
    /,\s*([^,]+)$/,
    // Fallback: take the last part before common suffixes
    /,\s*([^,]+?)(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct|Circle|Cir|Square|Sq|Terrace|Ter|Trail|Trl|Parkway|Pkwy|Highway|Hwy|Freeway|Fwy))?$/i,
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: return the full address
  return address;
}

/**
 * Create public-safe location data
 */
export function createPublicLocationData(
  location: {
    lat: number;
    lng: number;
    address: string;
    isPrivate: boolean;
  }
): PublicLocationData {
  if (!location.isPrivate) {
    // Location is public, return exact coordinates
    return {
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      cityOnly: false,
    };
  }

  // Location is private, obscure coordinates and show city only
  const obscuredCoords = obscureCoordinates({ lat: location.lat, lng: location.lng });
  const cityOnly = extractCityFromAddress(location.address);

  return {
    lat: obscuredCoords.lat,
    lng: obscuredCoords.lng,
    address: cityOnly,
    cityOnly: true,
  };
}

/**
 * Generate a privacy-safe map URL
 */
export function getPrivacySafeMapUrl(
  location: {
    lat: number;
    lng: number;
    address: string;
    isPrivate: boolean;
  },
  provider: 'google' | 'mapbox' | 'osm' = 'google'
): string {
  const publicData = createPublicLocationData(location);
  
  switch (provider) {
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${publicData.lat},${publicData.lng}`;
    case 'mapbox':
      return `https://www.mapbox.com/maps/place/${publicData.lat},${publicData.lng}`;
    case 'osm':
      return `https://www.openstreetmap.org/?mlat=${publicData.lat}&mlon=${publicData.lng}#map=14/${publicData.lat}/${publicData.lng}`;
    default:
      return `https://www.google.com/maps/search/?api=1&query=${publicData.lat},${publicData.lng}`;
  }
}

/**
 * Get privacy-safe static map image URL
 */
export function getPrivacySafeMapImageUrl(
  location: {
    lat: number;
    lng: number;
    address: string;
    isPrivate: boolean;
  },
  options: {
    width?: number;
    height?: number;
    zoom?: number;
    provider?: 'google' | 'mapbox' | 'osm';
    apiKey?: string;
  } = {}
): string {
  const {
    width = 600,
    height = 300,
    zoom = 14,
    provider = 'google',
    apiKey,
  } = options;

  const publicData = createPublicLocationData(location);

  switch (provider) {
    case 'google':
      if (!apiKey) {
        throw new Error('Google Maps API key required');
      }
      return `https://maps.googleapis.com/maps/api/staticmap?center=${publicData.lat},${publicData.lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${publicData.lat},${publicData.lng}&key=${apiKey}`;
    
    case 'mapbox':
      if (!apiKey) {
        throw new Error('Mapbox API key required');
      }
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${publicData.lng},${publicData.lat},${zoom},0,0/${width}x${height}?access_token=${apiKey}`;
    
    case 'osm':
      return `https://static.openstreetmap.org/staticmap.php?center=${publicData.lat},${publicData.lng}&zoom=${zoom}&size=${width}x${height}&markers=${publicData.lat},${publicData.lng},red-pushpin`;
    
    default:
      throw new Error(`Unsupported map provider: ${provider}`);
  }
}

/**
 * Format coordinates for display with privacy consideration
 */
export function formatCoordinatesForDisplay(
  lat: number,
  lng: number,
  isPrivate: boolean,
  precision: number = isPrivate ? 2 : 6
): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Check if location should show privacy warning
 */
export function shouldShowPrivacyWarning(isPrivate: boolean): boolean {
  return isPrivate;
}
