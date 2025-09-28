'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EXIFData } from '@/lib/exif'
import { formatDate, formatGPS, generateGoogleMapsLink } from '@/lib/utils'
import { MapPin, Camera, Clock, Settings, ExternalLink } from 'lucide-react'

interface EXIFDisplayProps {
  exifData: EXIFData
}

export function EXIFDisplay({ exifData }: EXIFDisplayProps) {
  const hasLocation = exifData.gps?.latitude && exifData.gps?.longitude
  const hasDateTime = exifData.dateTimeOriginal || exifData.dateTime

  return (
    <div className="space-y-6">
      {/* Location Card */}
      {hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Coordinates</p>
                <p className="text-lg font-mono">
                  {formatGPS({
                    lat: exifData.gps!.latitude,
                    lng: exifData.gps!.longitude
                  })}
                </p>
              </div>
              {exifData.gps?.altitude && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Altitude</p>
                  <p className="text-lg">{exifData.gps.altitude.toFixed(2)}m</p>
                </div>
              )}
            </div>
            <Button asChild className="w-full">
              <a
                href={generateGoogleMapsLink(exifData.gps!.latitude, exifData.gps!.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Maps
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Date/Time Card */}
      {hasDateTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exifData.dateTimeOriginal && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Original Date</p>
                  <p className="text-lg">{formatDate(new Date(exifData.dateTimeOriginal))}</p>
                </div>
              )}
              {exifData.dateTime && exifData.dateTime !== exifData.dateTimeOriginal && (
                <div>
                  <p className="text-sm font-medium text-gray-600">File Date</p>
                  <p className="text-lg">{formatDate(new Date(exifData.dateTime))}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Information */}
      {(exifData.make || exifData.model || exifData.software) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Camera Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exifData.make && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Make</p>
                  <p className="text-lg">{exifData.make}</p>
                </div>
              )}
              {exifData.model && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Model</p>
                  <p className="text-lg">{exifData.model}</p>
                </div>
              )}
              {exifData.software && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Software</p>
                  <p className="text-lg">{exifData.software}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exposure Settings */}
      {exifData.exposure && Object.values(exifData.exposure).some(v => v !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Exposure Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exifData.exposure.fNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Aperture</p>
                  <p className="text-lg">f/{exifData.exposure.fNumber}</p>
                </div>
              )}
              {exifData.exposure.exposureTime && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Shutter Speed</p>
                  <p className="text-lg">1/{Math.round(1/exifData.exposure.exposureTime)}s</p>
                </div>
              )}
              {exifData.exposure.iso && (
                <div>
                  <p className="text-sm font-medium text-gray-600">ISO</p>
                  <p className="text-lg">{exifData.exposure.iso}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Settings */}
      {exifData.camera && Object.values(exifData.camera).some(v => v !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Camera Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exifData.camera.focalLength && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Focal Length</p>
                  <p className="text-lg">{exifData.camera.focalLength}mm</p>
                </div>
              )}
              {exifData.camera.flash !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Flash</p>
                  <p className="text-lg">{exifData.camera.flash ? 'On' : 'Off'}</p>
                </div>
              )}
              {exifData.camera.whiteBalance !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600">White Balance</p>
                  <p className="text-lg">{exifData.camera.whiteBalance ? 'Auto' : 'Manual'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Properties */}
      {exifData.image && Object.values(exifData.image).some(v => v !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Image Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exifData.image.width && exifData.image.height && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Dimensions</p>
                  <p className="text-lg">{exifData.image.width} × {exifData.image.height}</p>
                </div>
              )}
              {exifData.image.xResolution && exifData.image.yResolution && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution</p>
                  <p className="text-lg">{exifData.image.xResolution} × {exifData.image.yResolution} DPI</p>
                </div>
              )}
              {exifData.image.orientation && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Orientation</p>
                  <p className="text-lg">{exifData.image.orientation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
