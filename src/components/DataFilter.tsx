'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, MapPin, Camera, Clock, Settings, Aperture, ImageIcon } from 'lucide-react'

export interface DataFilter {
  location: boolean
  dateTime: boolean
  camera: boolean
  exposure: boolean
  settings: boolean
  sun: boolean
  image: boolean
}

interface DataFilterProps {
  filters: DataFilter
  onFiltersChange: (filters: DataFilter) => void
}

export function DataFilter({ filters, onFiltersChange }: DataFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const filterOptions = [
    { key: 'location' as keyof DataFilter, label: 'Location', icon: <MapPin className="h-4 w-4" />, color: 'text-green-600' },
    { key: 'dateTime' as keyof DataFilter, label: 'Date & Time', icon: <Clock className="h-4 w-4" />, color: 'text-blue-600' },
    { key: 'camera' as keyof DataFilter, label: 'Camera', icon: <Camera className="h-4 w-4" />, color: 'text-purple-600' },
    { key: 'exposure' as keyof DataFilter, label: 'Exposure', icon: <Aperture className="h-4 w-4" />, color: 'text-orange-600' },
    { key: 'settings' as keyof DataFilter, label: 'Settings', icon: <Settings className="h-4 w-4" />, color: 'text-indigo-600' },
    { key: 'sun' as keyof DataFilter, label: 'Sun Data', icon: <Sun className="h-4 w-4" />, color: 'text-yellow-600' },
    { key: 'image' as keyof DataFilter, label: 'Image', icon: <ImageIcon className="h-4 w-4" />, color: 'text-cyan-600' },
  ]

  const handleFilterChange = (key: keyof DataFilter) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key]
    })
  }

  const selectAll = () => {
    const allTrue: DataFilter = {
      location: true,
      dateTime: true,
      camera: true,
      exposure: true,
      settings: true,
      sun: true,
      image: true,
    }
    onFiltersChange(allTrue)
  }

  const selectNone = () => {
    const allFalse: DataFilter = {
      location: false,
      dateTime: false,
      camera: false,
      exposure: false,
      settings: false,
      sun: false,
      image: false,
    }
    onFiltersChange(allFalse)
  }

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <Card className="w-full max-w-4xl mx-auto mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg text-primary">Data Filters</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">
              {activeCount} of {filterOptions.length} sections active
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Select None
              </Button>
            </div>

            {/* Filter Options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filterOptions.map((option) => (
                <label
                  key={option.key}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    filters[option.key]
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters[option.key]}
                    onChange={() => handleFilterChange(option.key)}
                    className="sr-only"
                  />
                  <div className={`${option.color}`}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
