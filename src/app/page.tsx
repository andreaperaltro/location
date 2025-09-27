'use client';

import { useState } from 'react';
import { Upload, MapPin, Sun, Calendar, Camera } from 'lucide-react';

interface PhotoData {
  url: string;
  takenAt?: string;
  lat?: number;
  lng?: number;
  address?: string;
  sunTimes?: {
    sunrise: string;
    sunset: string;
    goldenStart: string;
    goldenEnd: string;
  };
}

export default function SimplePhotoUpload() {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setPhotoData(null);

    try {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      // For now, let's just show the image and simulate some data
      // In a real implementation, you'd upload to Supabase and process EXIF
      setPhotoData({
        url: previewUrl,
        takenAt: new Date().toISOString(),
        lat: 37.7749, // San Francisco coordinates as example
        lng: -122.4194,
        address: "San Francisco, CA, USA",
        sunTimes: {
          sunrise: "6:45 AM",
          sunset: "7:30 PM",
          goldenStart: "6:15 AM",
          goldenEnd: "7:00 PM"
        }
      });
    } catch (err) {
      setError('Failed to process photo');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Location Analyzer</h1>
          <p className="text-gray-600">Upload a photo to see its EXIF data, location, and sun times</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-700">Click to upload a photo</span>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, WebP</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing photo...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Photo Data Display */}
        {photoData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Photo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo
              </h2>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photoData.url}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Data */}
            <div className="space-y-6">
              {/* EXIF Data */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Photo Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Taken:</span>
                    <p className="text-gray-600">
                      {photoData.takenAt ? new Date(photoData.takenAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Address:</span>
                    <p className="text-gray-600">{photoData.address || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Coordinates:</span>
                    <p className="text-gray-600">
                      {photoData.lat && photoData.lng 
                        ? `${photoData.lat.toFixed(6)}, ${photoData.lng.toFixed(6)}`
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Sun Times */}
              {photoData.sunTimes && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Sun Times
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Sunrise</p>
                      <p className="text-lg font-bold text-orange-600">{photoData.sunTimes.sunrise}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Sunset</p>
                      <p className="text-lg font-bold text-red-600">{photoData.sunTimes.sunset}</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Golden Hour Start</p>
                      <p className="text-lg font-bold text-yellow-600">{photoData.sunTimes.goldenStart}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Golden Hour End</p>
                      <p className="text-lg font-bold text-orange-600">{photoData.sunTimes.goldenEnd}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}