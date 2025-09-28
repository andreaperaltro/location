'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EXIFData } from '@/lib/exif'
import { formatDate, formatGPS, generateGoogleMapsLink } from '@/lib/utils'
import { formatSunTime, formatSunPosition } from '@/lib/sun'
import { MapPin, Camera, Clock, Settings, Aperture, ImageIcon, ChevronDown, ChevronRight, Sun, Edit2, Save, X, Type } from 'lucide-react'
import { DataFilter } from './DataFilter'

interface EXIFDisplayProps {
  exifData: EXIFData
  filters: DataFilter
  title: string
  isGeocoded: boolean
  onTitleChange: (newTitle: string) => void
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
        <div className="border-b border-gray-300 dark:border-gray-700 last:border-b-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium text-sm text-value">{title}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-900 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-900 dark:text-gray-400" />
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

export function EXIFDisplay({ exifData, filters, title, isGeocoded, onTitleChange }: EXIFDisplayProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editValue, setEditValue] = useState(title)

  const handleSaveTitle = () => {
    if (editValue.trim()) {
      onTitleChange(editValue.trim())
      setIsEditingTitle(false)
    }
  }

  const handleCancelTitle = () => {
    setEditValue(title)
    setIsEditingTitle(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelTitle()
    }
  }
  return (
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Photo Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Photo Title */}
            <CollapsibleSection
              title="Photo Title"
              icon={<Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              defaultOpen={true}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isGeocoded && (
                    <Type className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 input-field"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-value flex-1">
                      {title}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditingTitle ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveTitle}
                        className="h-7 text-xs"
                        disabled={!editValue.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelTitle}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingTitle(true)}
                      className="h-7 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* GPS Location */}
            {filters.location && exifData.gps && (
              <CollapsibleSection
                title="Location"
                icon={<MapPin className="h-4 w-4 text-green-600" />}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {/* Show address if this photo is geocoded (title contains the address) */}
                  {isGeocoded && (
                  <div>
                    <p className="text-xs font-medium text-label">Address</p>
                    <p className="text-sm text-value">{title}</p>
                  </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-label">Coordinates</p>
                    <p className="text-sm font-mono text-value">
                      {formatGPS({ lat: exifData.gps.latitude, lng: exifData.gps.longitude })}
                    </p>
                  </div>
              {exifData.gps.altitude && (
                <div>
                  <p className="text-xs font-medium text-label">Altitude</p>
                  <p className="text-sm font-mono text-value">{exifData.gps.altitude.toFixed(2)} m</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="h-7 text-xs">
                  <a
                    href={generateGoogleMapsLink(exifData.gps.latitude, exifData.gps.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Maps
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <a
                    href={generateGoogleMapsLink(exifData.gps.latitude, exifData.gps.longitude)}
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
            {filters.dateTime && (exifData.dateTime || exifData.dateTimeOriginal || exifData.dateTimeDigitized) && (
          <CollapsibleSection
            title="Date & Time"
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {exifData.dateTimeOriginal && (
                <div>
                  <p className="text-xs font-medium text-label">Original Date</p>
                  <p className="text-sm text-value">{formatDate(new Date(exifData.dateTimeOriginal))}</p>
                </div>
              )}
              {exifData.dateTime && (
                <div>
                  <p className="text-xs font-medium text-label">File Date</p>
                  <p className="text-sm text-value">{formatDate(new Date(exifData.dateTime))}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

            {/* Camera Information */}
            {filters.camera && (exifData.make || exifData.model || exifData.software) && (
          <CollapsibleSection
            title="Camera"
            icon={<Camera className="h-4 w-4 text-purple-600" />}
          >
            <div className="space-y-2">
              {exifData.make && (
                <div>
                  <p className="text-xs font-medium text-label">Make</p>
                  <p className="text-sm text-value">{exifData.make}</p>
                </div>
              )}
              {exifData.model && (
                <div>
                  <p className="text-xs font-medium text-label">Model</p>
                  <p className="text-sm text-value">{exifData.model}</p>
                </div>
              )}
              {exifData.software && (
                <div>
                  <p className="text-xs font-medium text-label">Software</p>
                  <p className="text-sm text-value">{exifData.software}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

            {/* Exposure Settings */}
            {filters.exposure && exifData.exposure && (
          <CollapsibleSection
            title="Exposure"
            icon={<Aperture className="h-4 w-4 text-orange-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {exifData.exposure.aperture && (
                <div>
                  <p className="text-xs font-medium text-label">Aperture</p>
                  <p className="text-sm font-mono text-value">f/{exifData.exposure.aperture.toFixed(1)}</p>
                </div>
              )}
              {exifData.exposure.shutterSpeed && (
                <div>
                  <p className="text-xs font-medium text-label">Shutter</p>
                  <p className="text-sm font-mono text-value">1/{Math.round(1/exifData.exposure.shutterSpeed)}s</p>
                </div>
              )}
              {exifData.exposure.iso && (
                <div>
                  <p className="text-xs font-medium text-label">ISO</p>
                  <p className="text-sm font-mono text-value">{exifData.exposure.iso}</p>
                </div>
              )}
              {exifData.exposure.fNumber && (
                <div>
                  <p className="text-xs font-medium text-label">F-Number</p>
                  <p className="text-sm font-mono text-value">f/{exifData.exposure.fNumber.toFixed(1)}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

            {/* Camera Settings */}
            {filters.settings && exifData.camera && (
          <CollapsibleSection
            title="Settings"
            icon={<Settings className="h-4 w-4 text-indigo-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {exifData.camera.focalLength && (
                <div>
                  <p className="text-xs font-medium text-label">Focal Length</p>
                  <p className="text-sm font-mono text-value">{exifData.camera.focalLength.toFixed(0)}mm</p>
                </div>
              )}
              {exifData.camera.flash !== undefined && (
                <div>
                  <p className="text-xs font-medium text-label">Flash</p>
                  <p className="text-sm text-value">{exifData.camera.flash ? 'On' : 'Off'}</p>
                </div>
              )}
              {exifData.camera.whiteBalance !== undefined && (
                <div>
                  <p className="text-xs font-medium text-label">WB</p>
                  <p className="text-sm text-value">{exifData.camera.whiteBalance ? 'Auto' : 'Manual'}</p>
                </div>
              )}
              {exifData.camera.meteringMode !== undefined && (
                <div>
                  <p className="text-xs font-medium text-label">Metering</p>
                  <p className="text-sm text-value">{exifData.camera.meteringMode}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

            {/* Sun Data */}
            {filters.sun && exifData.sun && (
              <CollapsibleSection
                title="Sun Data"
                icon={<Sun className="h-4 w-4 text-yellow-600" />}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-label">Sunrise</p>
                      <p className="text-sm font-mono text-value">{formatSunTime(exifData.sun.sunrise)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-label">Sunset</p>
                      <p className="text-sm font-mono text-value">{formatSunTime(exifData.sun.sunset)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-label">Solar Noon</p>
                      <p className="text-sm font-mono text-value">{formatSunTime(exifData.sun.solarNoon)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-label">Day Length</p>
                      <p className="text-sm font-mono text-value">{Math.floor(exifData.sun.dayLength / 60)}h {exifData.sun.dayLength % 60}m</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-label">Sun Position</p>
                    <p className="text-sm text-value">{formatSunPosition(exifData.sun.sunPosition.azimuth, exifData.sun.sunPosition.altitude)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${exifData.sun.isDaytime ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>
                    <p className="text-sm text-value">
                      {exifData.sun.isDaytime ? 'Daytime' : 'Nighttime'}
                    </p>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Image Properties */}
            {filters.image && exifData.image && (
              <CollapsibleSection
                title="Image"
                icon={<ImageIcon className="h-4 w-4 text-cyan-600" />}
              >
                <div className="grid grid-cols-2 gap-3">
                  {exifData.image.width && exifData.image.height && (
                    <div>
                      <p className="text-xs font-medium text-label">Dimensions</p>
                      <p className="text-sm font-mono text-value">{exifData.image.width} × {exifData.image.height}</p>
                    </div>
                  )}
                  {exifData.image.xResolution && exifData.image.yResolution && (
                    <div>
                      <p className="text-xs font-medium text-label">Resolution</p>
                      <p className="text-sm font-mono text-value">{exifData.image.xResolution} × {exifData.image.yResolution} DPI</p>
                    </div>
                  )}
                  {exifData.image.orientation && (
                    <div>
                      <p className="text-xs font-medium text-label">Orientation</p>
                      <p className="text-sm text-value">{exifData.image.orientation}</p>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}
      </CardContent>
    </Card>
  )
}