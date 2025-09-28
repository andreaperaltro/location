import * as SunCalc from 'suncalc'

export interface SunData {
  sunrise: Date
  sunset: Date
  solarNoon: Date
  sunPosition: {
    azimuth: number
    altitude: number
  }
  dayLength: number // in minutes
  isDaytime: boolean
}

export function calculateSunData(latitude: number, longitude: number, date: Date): SunData {
  // Get sun times for the specific date and location
  const sunTimes = SunCalc.getTimes(date, latitude, longitude)
  
  // Get sun position at the photo time
  const sunPosition = SunCalc.getPosition(date, latitude, longitude)
  
  // Calculate day length in minutes
  const dayLength = (sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / (1000 * 60)
  
  // Determine if it's daytime (between sunrise and sunset)
  const isDaytime = date >= sunTimes.sunrise && date <= sunTimes.sunset
  
  return {
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    solarNoon: sunTimes.solarNoon,
    sunPosition: {
      azimuth: sunPosition.azimuth * (180 / Math.PI), // Convert to degrees
      altitude: sunPosition.altitude * (180 / Math.PI) // Convert to degrees
    },
    dayLength: Math.round(dayLength),
    isDaytime
  }
}

export function formatSunTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

export function formatSunPosition(azimuth: number, altitude: number): string {
  const azimuthDir = getAzimuthDirection(azimuth)
  const altitudeDesc = altitude > 0 ? 'above horizon' : 'below horizon'
  
  return `${Math.round(altitude)}° ${altitudeDesc}, ${azimuthDir} (${Math.round(azimuth)}°)`
}

function getAzimuthDirection(azimuth: number): string {
  // Normalize azimuth to 0-360
  const normalized = ((azimuth % 360) + 360) % 360
  
  if (normalized >= 337.5 || normalized < 22.5) return 'North'
  if (normalized >= 22.5 && normalized < 67.5) return 'Northeast'
  if (normalized >= 67.5 && normalized < 112.5) return 'East'
  if (normalized >= 112.5 && normalized < 157.5) return 'Southeast'
  if (normalized >= 157.5 && normalized < 202.5) return 'South'
  if (normalized >= 202.5 && normalized < 247.5) return 'Southwest'
  if (normalized >= 247.5 && normalized < 292.5) return 'West'
  if (normalized >= 292.5 && normalized < 337.5) return 'Northwest'
  
  return 'Unknown'
}
