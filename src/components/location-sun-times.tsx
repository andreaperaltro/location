'use client';

import { useState, useEffect } from 'react';
import { Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { getSunTimes, isGoldenHour, getNextGoldenHour } from '@/lib/sun';
import MapPreview from './map-preview';

interface LocationSunTimesProps {
  lat: number;
  lng: number;
  timezone?: string;
  title?: string;
  address?: string;
}

export default function LocationSunTimes({
  lat,
  lng,
  timezone = 'UTC',
  title,
  address,
}: LocationSunTimesProps) {
  const [sunTimes, setSunTimes] = useState<any>(null);
  const [goldenHourStatus, setGoldenHourStatus] = useState<any>(null);
  const [nextGoldenHour, setNextGoldenHour] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Calculate sun times for selected date
    const times = getSunTimes(lat, lng, selectedDate, timezone);
    setSunTimes(times);

    // Check current golden hour status
    const goldenStatus = isGoldenHour(lat, lng, new Date(), timezone);
    setGoldenHourStatus(goldenStatus);

    // Get next golden hour
    const nextGolden = getNextGoldenHour(lat, lng, new Date(), timezone);
    setNextGoldenHour(nextGolden);
  }, [lat, lng, timezone, selectedDate]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!sunTimes) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Preview */}
      <MapPreview
        lat={lat}
        lng={lng}
        title={title}
        address={address}
        size="medium"
      />

      {/* Date Selector */}
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium text-foreground">
          Select Date
        </label>
        <input
          id="date"
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Golden Hour Status */}
      {goldenHourStatus && (
        <div className={`p-4 rounded-lg border ${
          goldenHourStatus.isGolden 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-5 w-5" />
            <span className="font-medium">
              {goldenHourStatus.isGolden ? 'Golden Hour Active!' : 'Golden Hour Inactive'}
            </span>
          </div>
          {goldenHourStatus.isGolden && (
            <p className="text-sm">
              {goldenHourStatus.type} golden hour - {goldenHourStatus.remainingMinutes} minutes remaining
            </p>
          )}
          {!goldenHourStatus.isGolden && nextGoldenHour && (
            <p className="text-sm">
              Next golden hour: {formatTime(nextGoldenHour.time.toTimeString().slice(0, 5))} ({nextGoldenHour.type})
            </p>
          )}
        </div>
      )}

      {/* Sun Times Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Sunrise className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Sunrise</p>
              <p className="text-lg font-semibold text-orange-900">
                {formatTime(sunTimes.sunrise)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Sun className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Golden Start</p>
              <p className="text-lg font-semibold text-yellow-900">
                {formatTime(sunTimes.goldenStart)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Sunset className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-800">Sunset</p>
              <p className="text-lg font-semibold text-purple-900">
                {formatTime(sunTimes.sunset)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Golden End</p>
              <p className="text-lg font-semibold text-amber-900">
                {formatTime(sunTimes.goldenEnd)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
        <p>Timezone: {timezone}</p>
        <p>Date: {selectedDate.toLocaleDateString()}</p>
      </div>
    </div>
  );
}
