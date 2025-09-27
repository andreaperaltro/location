import * as SunCalc from 'suncalc';

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  goldenStart: Date;
  goldenEnd: Date;
}

export interface SunTimesResult {
  sunrise: string; // Time string (HH:MM)
  sunset: string;
  goldenStart: string;
  goldenEnd: string;
  sunriseDate: Date;
  sunsetDate: Date;
  goldenStartDate: Date;
  goldenEndDate: Date;
}

/**
 * Calculate sun times for a specific location and date
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param date - Date to calculate for (defaults to today)
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Sun times with formatted time strings and Date objects
 */
export function getSunTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  timezone: string = 'UTC'
): SunTimesResult {
  try {
    // Calculate sun times using SunCalc
    const sunTimes = SunCalc.getTimes(date, lat, lng);

    // Golden hour is typically 1 hour before sunset and 1 hour after sunrise
    // For photography, we often use civil twilight times
    const goldenStart = sunTimes.sunriseEnd || sunTimes.goldenHourEnd || sunTimes.sunrise;
    const goldenEnd = sunTimes.sunsetStart || sunTimes.goldenHour || sunTimes.sunset;

    // Format times for the specified timezone
    const formatTime = (date: Date): string => {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date);
      } catch (error) {
        // Fallback to UTC if timezone is invalid
        console.warn(`Invalid timezone: ${timezone}, falling back to UTC`);
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date);
      }
    };

    return {
      sunrise: formatTime(sunTimes.sunrise),
      sunset: formatTime(sunTimes.sunset),
      goldenStart: formatTime(goldenStart),
      goldenEnd: formatTime(goldenEnd),
      sunriseDate: sunTimes.sunrise,
      sunsetDate: sunTimes.sunset,
      goldenStartDate: goldenStart,
      goldenEndDate: goldenEnd,
    };
  } catch (error) {
    console.error('Error calculating sun times:', error);
    // Return fallback times
    const fallbackDate = new Date(date);
    fallbackDate.setHours(6, 0, 0, 0); // 6:00 AM
    
    return {
      sunrise: '06:00',
      sunset: '18:00',
      goldenStart: '05:30',
      goldenEnd: '19:30',
      sunriseDate: fallbackDate,
      sunsetDate: new Date(fallbackDate.getTime() + 12 * 60 * 60 * 1000),
      goldenStartDate: new Date(fallbackDate.getTime() - 30 * 60 * 1000),
      goldenEndDate: new Date(fallbackDate.getTime() + 13.5 * 60 * 60 * 1000),
    };
  }
}

/**
 * Get sun times for multiple dates
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param dates - Array of dates to calculate for
 * @param timezone - Timezone string
 * @returns Array of sun times for each date
 */
export function getSunTimesForDates(
  lat: number,
  lng: number,
  dates: Date[],
  timezone: string = 'UTC'
): SunTimesResult[] {
  return dates.map(date => getSunTimes(lat, lng, date, timezone));
}

/**
 * Get sun times for a date range
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param startDate - Start date
 * @param endDate - End date
 * @param timezone - Timezone string
 * @returns Array of sun times for each day in the range
 */
export function getSunTimesForDateRange(
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date,
  timezone: string = 'UTC'
): SunTimesResult[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return getSunTimesForDates(lat, lng, dates, timezone);
}

/**
 * Check if current time is within golden hour
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param date - Date to check (defaults to now)
 * @param timezone - Timezone string
 * @returns Object with golden hour status and remaining time
 */
export function isGoldenHour(
  lat: number,
  lng: number,
  date: Date = new Date(),
  timezone: string = 'UTC'
): { isGolden: boolean; type: 'morning' | 'evening' | 'none'; remainingMinutes?: number } {
  const sunTimes = getSunTimes(lat, lng, date, timezone);
  const now = new Date();
  
  // Convert time strings back to dates for comparison
  const [sunriseHour, sunriseMin] = sunTimes.sunrise.split(':').map(Number);
  const [sunsetHour, sunsetMin] = sunTimes.sunset.split(':').map(Number);
  const [goldenStartHour, goldenStartMin] = sunTimes.goldenStart.split(':').map(Number);
  const [goldenEndHour, goldenEndMin] = sunTimes.goldenEnd.split(':').map(Number);
  
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();
  const nowMinutes = nowHour * 60 + nowMin;
  
  const sunriseMinutes = sunriseHour * 60 + sunriseMin;
  const sunsetMinutes = sunsetHour * 60 + sunsetMin;
  const goldenStartMinutes = goldenStartHour * 60 + goldenStartMin;
  const goldenEndMinutes = goldenEndHour * 60 + goldenEndMin;
  
  // Morning golden hour (after golden start, before sunrise end)
  if (nowMinutes >= goldenStartMinutes && nowMinutes <= sunriseMinutes) {
    return {
      isGolden: true,
      type: 'morning',
      remainingMinutes: sunriseMinutes - nowMinutes,
    };
  }
  
  // Evening golden hour (after sunset start, before golden end)
  if (nowMinutes >= sunsetMinutes && nowMinutes <= goldenEndMinutes) {
    return {
      isGolden: true,
      type: 'evening',
      remainingMinutes: goldenEndMinutes - nowMinutes,
    };
  }
  
  return { isGolden: false, type: 'none' };
}

/**
 * Get the next golden hour time
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param date - Date to check from (defaults to now)
 * @param timezone - Timezone string
 * @returns Next golden hour time or null if none today
 */
export function getNextGoldenHour(
  lat: number,
  lng: number,
  date: Date = new Date(),
  timezone: string = 'UTC'
): { time: Date; type: 'morning' | 'evening' } | null {
  const sunTimes = getSunTimes(lat, lng, date, timezone);
  const now = new Date();
  
  // Check if we're past morning golden hour
  if (now < sunTimes.goldenStartDate) {
    return { time: sunTimes.goldenStartDate, type: 'morning' };
  }
  
  // Check if we're past evening golden hour
  if (now < sunTimes.goldenEndDate) {
    return { time: sunTimes.goldenEndDate, type: 'evening' };
  }
  
  // Check tomorrow's morning golden hour
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowSunTimes = getSunTimes(lat, lng, tomorrow, timezone);
  
  return { time: tomorrowSunTimes.goldenStartDate, type: 'morning' };
}
