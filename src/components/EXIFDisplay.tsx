'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EXIFData } from '@/lib/exif'
import { formatDate, formatGPS, generateGoogleMapsLink } from '@/lib/utils'
import { MapPin, Camera, Clock, Settings, ExternalLink, Aperture, ImageIcon } from 'lucide-react'

interface EXIFDisplayProps {
  exifData: EXIFData
}

export function EXIFDisplay({ exifData }: EXIFDisplayProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Photo Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GPS Location */}
        {exifData.gps && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-gray-900">Location</h3>
            </div>
            <div className="pl-6 space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Coordinates</p>
                <p className="text-lg font-mono text-gray-900">
                  {formatGPS({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                </p>
              </div>
              {exifData.gps.altitude && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Altitude</p>
                  <p className="text-lg font-mono text-gray-900">{exifData.gps.altitude.toFixed(2)} m</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <a
                    href={generateGoogleMapsLink({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={generateGoogleMapsLink({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Copy Link
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Date/Time Information */}
        {(exifData.dateTime || exifData.dateTimeOriginal || exifData.dateTimeDigitized) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Date & Time</h3>
            </div>
            <div className="pl-6 space-y-2">
              {exifData.dateTimeOriginal && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Original Date</p>
                  <p className="text-lg text-gray-900">{formatDate(new Date(exifData.dateTimeOriginal))}</p>
                </div>
              )}
              {exifData.dateTime && (
                <div>
                  <p className="text-sm font-medium text-gray-600">File Date</p>
                  <p className="text-lg text-gray-900">{formatDate(new Date(exifData.dateTime))}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Information */}
        {(exifData.make || exifData.model || exifData.software) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Camera</h3>
            </div>
            <div className="pl-6 space-y-2">
              {exifData.make && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Make</p>
                  <p className="text-lg text-gray-900">{exifData.make}</p>
                </div>
              )}
              {exifData.model && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Model</p>
                  <p className="text-lg text-gray-900">{exifData.model}</p>
                </div>
              )}
              {exifData.software && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Software</p>
                  <p className="text-lg text-gray-900">{exifData.software}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exposure Settings */}
        {exifData.exposure && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Aperture className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Exposure Settings</h3>
            </div>
            <div className="pl-6 grid grid-cols-2 gap-4">
              {exifData.exposure.aperture && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Aperture</p>
                  <p className="text-lg font-mono text-gray-900">f/{exifData.exposure.aperture.toFixed(1)}</p>
                </div>
              )}
              {exifData.exposure.shutterSpeed && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Shutter Speed</p>
                  <p className="text-lg font-mono text-gray-900">1/{Math.round(1/exifData.exposure.shutterSpeed)}s</p>
                </div>
              )}
              {exifData.exposure.iso && (
                <div>
                  <p className="text-sm font-medium text-gray-600">ISO</p>
                  <p className="text-lg font-mono text-gray-900">ISO {exifData.exposure.iso}</p>
                </div>
              )}
              {exifData.exposure.fNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-600">F-Number</p>
                  <p className="text-lg font-mono text-gray-900">f/{exifData.exposure.fNumber.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Settings */}
        {exifData.camera && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Camera Settings</h3>
            </div>
            <div className="pl-6 grid grid-cols-2 gap-4">
              {exifData.camera.focalLength && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Focal Length</p>
                  <p className="text-lg font-mono text-gray-900">{exifData.camera.focalLength.toFixed(0)}mm</p>
                </div>
              )}
              {exifData.camera.flash !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Flash</p>
                  <p className="text-lg text-gray-900">{exifData.camera.flash ? 'On' : 'Off'}</p>
                </div>
              )}
              {exifData.camera.whiteBalance !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600">White Balance</p>
                  <p className="text-lg text-gray-900">{exifData.camera.whiteBalance ? 'Auto' : 'Manual'}</p>
                </div>
              )}
              {exifData.camera.meteringMode !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Metering Mode</p>
                  <p className="text-lg text-gray-900">{exifData.camera.meteringMode}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Properties */}
        {exifData.image && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-cyan-600" />
              <h3 className="font-semibold text-gray-900">Image Properties</h3>
            </div>
            <div className="pl-6 grid grid-cols-2 gap-4">
              {exifData.image.width && exifData.image.height && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Dimensions</p>
                  <p className="text-lg font-mono text-gray-900">{exifData.image.width} × {exifData.image.height}</p>
                </div>
              )}
              {exifData.image.xResolution && exifData.image.yResolution && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution</p>
                  <p className="text-lg font-mono text-gray-900">{exifData.image.xResolution} × {exifData.image.yResolution} DPI</p>
                </div>
              )}
              {exifData.image.orientation && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Orientation</p>
                  <p className="text-lg text-gray-900">{exifData.image.orientation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}