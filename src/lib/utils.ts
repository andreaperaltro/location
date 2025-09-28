import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

export function formatGPS(gps: { lat: number; lng: number }): string {
  const latDir = gps.lat >= 0 ? 'N' : 'S'
  const lngDir = gps.lng >= 0 ? 'E' : 'W'
  
  return `${Math.abs(gps.lat).toFixed(6)}° ${latDir}, ${Math.abs(gps.lng).toFixed(6)}° ${lngDir}`
}

export function generateGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}
