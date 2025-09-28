'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EXIFData } from '@/lib/exif'
import { formatDate, formatGPS, generateGoogleMapsLink } from '@/lib/utils'
import { MapPin, Camera, Clock, Settings, ExternalLink, Aperture, ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'

interface EXIFDisplayProps {
  exifData: EXIFData
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-300 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}

export function EXIFDisplay({ exifData }: EXIFDisplayProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-blue-600" />
          Photo Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* GPS Location */}
        {exifData.gps && (
          <CollapsibleSection
            title="Location"
            icon={<MapPin className="h-4 w-4 text-green-600" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-600">Coordinates</p>
                <p className="text-sm font-mono text-gray-900">
                  {formatGPS({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                </p>
              </div>
              {exifData.gps.altitude && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Altitude</p>
                  <p className="text-sm font-mono text-gray-900">{exifData.gps.altitude.toFixed(2)} m</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="h-7 text-xs">
                  <a
                    href={generateGoogleMapsLink({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Maps
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <a
                    href={generateGoogleMapsLink({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </a>
                </Button>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Date/Time Information */}
        {(exifData.dateTime || exifData.dateTimeOriginal || exifData.dateTimeDigitized) && (
          <CollapsibleSection
            title="Date & Time"
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {exifData.dateTimeOriginal && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Original Date</p>
                  <p className="text-sm text-gray-900">{formatDate(new Date(exifData.dateTimeOriginal))}</p>
                </div>
              )}
              {exifData.dateTime && (
                <div>
                  <p className="text-xs font-medium text-gray-600">File Date</p>
                  <p className="text-sm text-gray-900">{formatDate(new Date(exifData.dateTime))}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Camera Information */}
        {(exifData.make || exifData.model || exifData.software) && (
          <CollapsibleSection
            title="Camera"
            icon={<Camera className="h-4 w-4 text-purple-600" />}
          >
            <div className="space-y-2">
              {exifData.make && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Make</p>
                  <p className="text-sm text-gray-900">{exifData.make}</p>
                </div>
              )}
              {exifData.model && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Model</p>
                  <p className="text-sm text-gray-900">{exifData.model}</p>
                </div>
              )}
              {exifData.software && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Software</p>
                  <p className="text-sm text-gray-900">{exifData.software}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Exposure Settings */}
        {exifData.exposure && (
          <CollapsibleSection
            title="Exposure"
            icon={<Aperture className="h-4 w-4 text-orange-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {exifData.exposure.aperture && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Aperture</p>
                  <p className="text-sm font-mono text-gray-900">f/{exifData.exposure.aperture.toFixed(1)}</p>
                </div>
              )}
              {exifData.exposure.shutterSpeed && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Shutter</p>
                  <p className="text-sm font-mono text-gray-900">1/{Math.round(1/exifData.exposure.shutterSpeed)}s</p>
                </div>
              )}
              {exifData.exposure.iso && (
                <div>
                  <p className="text-xs font-medium text-gray-600">ISO</p>
                  <p className="text-sm font-mono text-gray-900">{exifData.exposure.iso}</p>
                </div>
              )}
              {exifData.exposure.fNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-600">F-Number</p>
                  <p className="text-sm font-mono text-gray-900">f/{exifData.exposure.fNumber.toFixed(1)}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Camera Settings */}
        {exifData.camera && (
          <CollapsibleSection
            title="Settings"
            icon={<Settings className="h-4 w-4 text-indigo-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {exifData.camera.focalLength && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Focal Length</p>
                  <p className="text-sm font-mono text-gray-900">{exifData.camera.focalLength.toFixed(0)}mm</p>
                </div>
              )}
              {exifData.camera.flash !== undefined && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Flash</p>
                  <p className="text-sm text-gray-900">{exifData.camera.flash ? 'On' : 'Off'}</p>
                </div>
              )}
              {exifData.camera.whiteBalance !== undefined && (
                <div>
                  <p className="text-xs font-medium text-gray-600">WB</p>
                  <p className="text-sm text-gray-900">{exifData.camera.whiteBalance ? 'Auto' : 'Manual'}</p>
                </div>
              )}
              {exifData.camera.meteringMode !== undefined && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Metering</p>
                  <p className="text-sm text-gray-900">{exifData.camera.meteringMode}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Image Properties */}
        {exifData.image && (
          <CollapsibleSection
            title="Image"
            icon={<ImageIcon className="h-4 w-4 text-cyan-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {exifData.image.width && exifData.image.height && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Dimensions</p>
                  <p className="text-sm font-mono text-gray-900">{exifData.image.width} × {exifData.image.height}</p>
                </div>
              )}
              {exifData.image.xResolution && exifData.image.yResolution && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Resolution</p>
                  <p className="text-sm font-mono text-gray-900">{exifData.image.xResolution} × {exifData.image.yResolution} DPI</p>
                </div>
              )}
              {exifData.image.orientation && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Orientation</p>
                  <p className="text-sm text-gray-900">{exifData.image.orientation}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>
  )
}