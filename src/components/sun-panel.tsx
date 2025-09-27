'use client';

import { useState, useEffect } from 'react';
import { Sun, Sunrise, Sunset, Clock, MapPin, Calendar } from 'lucide-react';
import { getSunTimes, getSunTimesForDateRange } from '@/lib/sun';

interface SunPanelProps {
  lat: number;
  lng: number;
  timezone: string;
  title?: string;
  className?: string;
}

interface SunTimeData {
  date: string;
  sunrise: string;
  sunset: string;
  goldenHourStart: string;
  goldenHourEnd: string;
  isToday: boolean;
}

export default function SunPanel({ lat, lng, timezone, title, className = '' }: SunPanelProps) {
  const [sunTimes, setSunTimes] = useState<SunTimeData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateSunTimes();
  }, [lat, lng, timezone, selectedDate]);

  const calculateSunTimes = async () => {
    try {
      setLoading(true);
      
      // Calculate sun times for the next 7 days starting from selected date
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }

      const sunTimesData = getSunTimesForDateRange(lat, lng, dates[0], dates[6], timezone);
      
      const formattedSunTimes = sunTimesData.map((sunTime, index) => ({
        date: sunTime.formatted.date,
        sunrise: sunTime.formatted.sunrise,
        sunset: sunTime.formatted.sunset,
        goldenHourStart: sunTime.formatted.goldenHourStart,
        goldenHourEnd: sunTime.formatted.goldenHourEnd,
        isToday: index === 0,
      }));

      setSunTimes(formattedSunTimes);
    } catch (error) {
      console.error('Error calculating sun times:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(event.target.value));
  };

  const getGoldenHourStatus = (sunTime: SunTimeData) => {
    const now = new Date();
    const today = sunTime.isToday;
    
    if (!today) return null;

    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    const goldenStart = sunTime.goldenHourStart.replace(/[^\d:]/g, '');
    const goldenEnd = sunTime.goldenHourEnd.replace(/[^\d:]/g, '');

    if (currentTime >= goldenStart && currentTime <= goldenEnd) {
      return { status: 'active', message: 'Golden hour is happening now!' };
    } else if (currentTime < goldenStart) {
      return { status: 'upcoming', message: `Golden hour starts at ${sunTime.goldenHourStart}` };
    } else {
      return { status: 'ended', message: `Golden hour ended at ${sunTime.goldenHourEnd}` };
    }
  };

  if (loading) {
    return (
      <div className={`p-6 border border-border rounded-lg bg-card ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sun className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Sun Times</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 border border-border rounded-lg bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Sun Times</h3>
          {title && (
            <span className="text-sm text-muted-foreground">for {title}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={formatDateInput(selectedDate)}
            onChange={handleDateChange}
            className="text-sm border border-input rounded px-2 py-1 bg-background"
          />
        </div>
      </div>

      {/* Golden Hour Status */}
      {sunTimes.length > 0 && sunTimes[0] && (
        (() => {
          const goldenStatus = getGoldenHourStatus(sunTimes[0]);
          if (goldenStatus) {
            return (
              <div className={`p-3 rounded-lg mb-4 ${
                goldenStatus.status === 'active' 
                  ? 'bg-yellow-100 border border-yellow-200' 
                  : goldenStatus.status === 'upcoming'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-gray-100 border border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    goldenStatus.status === 'active' 
                      ? 'bg-yellow-500 animate-pulse' 
                      : goldenStatus.status === 'upcoming'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    goldenStatus.status === 'active' 
                      ? 'text-yellow-800' 
                      : goldenStatus.status === 'upcoming'
                      ? 'text-blue-800'
                      : 'text-gray-800'
                  }`}>
                    {goldenStatus.message}
                  </span>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}

      {/* Sun Times Table */}
      <div className="space-y-3">
        {sunTimes.map((sunTime, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              sunTime.isToday 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-background'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-medium ${sunTime.isToday ? 'text-primary' : 'text-foreground'}`}>
                {sunTime.date}
                {sunTime.isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Today</span>}
              </h4>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Sunrise */}
              <div className="flex items-center gap-2">
                <Sunrise className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Sunrise</p>
                  <p className="font-medium text-sm">{sunTime.sunrise}</p>
                </div>
              </div>

              {/* Sunset */}
              <div className="flex items-center gap-2">
                <Sunset className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Sunset</p>
                  <p className="font-medium text-sm">{sunTime.sunset}</p>
                </div>
              </div>

              {/* Golden Hour Start */}
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Golden Start</p>
                  <p className="font-medium text-sm">{sunTime.goldenHourStart}</p>
                </div>
              </div>

              {/* Golden Hour End */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Golden End</p>
                  <p className="font-medium text-sm">{sunTime.goldenHourEnd}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        <p>Sun times calculated using coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
        <p>Timezone: {timezone}</p>
      </div>
    </div>
  );
}
