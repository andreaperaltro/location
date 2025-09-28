export interface GeocodingResult {
  address: string
  success: boolean
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
  try {
    // Use Google Maps Geocoding API (requires API key in production)
    // For now, we'll use a free alternative: OpenStreetMap Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    )
    
    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }
    
    const data = await response.json()
    
    if (data && data.display_name) {
      // Format the address nicely
      const address = formatAddress(data)
      return { address, success: true }
    }
    
    return { address: '', success: false }
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return { address: '', success: false }
  }
}

function formatAddress(data: any): string {
  const components = data.address || {}
  
  // Build a readable address
  const parts = []
  
  // House number and street
  if (components.house_number && components.road) {
    parts.push(`${components.house_number} ${components.road}`)
  } else if (components.road) {
    parts.push(components.road)
  }
  
  // City or town
  if (components.city) {
    parts.push(components.city)
  } else if (components.town) {
    parts.push(components.town)
  } else if (components.village) {
    parts.push(components.village)
  }
  
  // State/County
  if (components.state) {
    parts.push(components.state)
  } else if (components.county) {
    parts.push(components.county)
  }
  
  // Country
  if (components.country) {
    parts.push(components.country)
  }
  
  return parts.join(', ') || data.display_name || 'Unknown Location'
}

export function generateFallbackTitle(index: number): string {
  return `Photo ${index + 1}`
}
