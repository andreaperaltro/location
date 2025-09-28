'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoUpload } from '@/components/PhotoUpload'
import { EXIFDisplay } from '@/components/EXIFDisplay'
import { DataFilter, DataFilter as DataFilterType } from '@/components/DataFilter'
import { EXIFData } from '@/lib/exif'
import { reverseGeocode, generateFallbackTitle } from '@/lib/geocoding'
import { exportToPDF } from '@/lib/pdfExport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Trash2, Plus, Download } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export interface PhotoData {
  exifData: EXIFData
  imageUrl: string
  id: string
  title: string
  isGeocoded: boolean
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [filters, setFilters] = useState<DataFilterType>({
    location: true,
    dateTime: true,
    camera: false,
    exposure: false,
    settings: false,
    sun: false,
    image: false,
  })
  const [reportTitle, setReportTitle] = useState('Location Manager - Photo Report')
  const [reportDescription, setReportDescription] = useState('')

  const handlePhotoProcessed = async (data: EXIFData, url: string) => {
    const id = Date.now().toString()
    let title = generateFallbackTitle(photos.length)
    let isGeocoded = false

    // Try to get address from GPS coordinates
    if (data.gps) {
      try {
        const geocodingResult = await reverseGeocode(data.gps.latitude, data.gps.longitude)
        if (geocodingResult.success) {
          title = geocodingResult.address
          isGeocoded = true
        }
      } catch (error) {
        console.error('Geocoding failed:', error)
      }
    }

    const newPhoto: PhotoData = {
      exifData: data,
      imageUrl: url,
      id,
      title,
      isGeocoded
    }
    setPhotos(prev => [...prev, newPhoto])
  }

  const handleMultiplePhotosProcessed = async (newPhotos: Array<{exifData: EXIFData, imageUrl: string, title?: string, isGeocoded?: boolean}>) => {
    const processedPhotos: PhotoData[] = []
    
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i]
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      // Use provided title/isGeocoded if available, otherwise generate them
      let title = photo.title || generateFallbackTitle(photos.length + i)
      let isGeocoded = photo.isGeocoded || false

      // If no title was provided, try to get address from GPS coordinates
      if (!photo.title && photo.exifData.gps) {
        try {
          const geocodingResult = await reverseGeocode(photo.exifData.gps.latitude, photo.exifData.gps.longitude)
          if (geocodingResult.success) {
            title = geocodingResult.address
            isGeocoded = true
          }
        } catch (error) {
          console.error('Geocoding failed for photo', i + 1, ':', error)
        }
      }

      processedPhotos.push({
        ...photo,
        id,
        title,
        isGeocoded
      })
    }
    
    setPhotos(prev => [...prev, ...processedPhotos])
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id)
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.imageUrl)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const clearAllPhotos = () => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.imageUrl)
    })
    setPhotos([])
  }

  const handleTitleChange = (id: string, newTitle: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, title: newTitle, isGeocoded: false } : photo
    ))
  }

  const handleExportPDF = async () => {
    try {
      await exportToPDF(photos, filters, reportTitle, reportDescription)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Please try again.')
    }
  }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <div className="text-center flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Location Manager
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Extract location and EXIF data from your photos
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>

            {photos.length === 0 ? (
              <PhotoUpload 
                onPhotoProcessed={handlePhotoProcessed}
                onMultiplePhotosProcessed={handleMultiplePhotosProcessed}
              />
            ) : (
              <div className="space-y-8">
                {/* Report Settings and Data Filter in a single row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Report Settings - Left */}
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Download className="h-4 w-4 text-blue-600" />
                        Report Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label htmlFor="report-title" className="block text-sm font-medium text-gray-700 mb-2">
                          Report Title
                        </label>
                        <input
                          id="report-title"
                          type="text"
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter report title..."
                        />
                      </div>
                      <div>
                        <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-2">
                          Report Description (Optional)
                        </label>
                        <textarea
                          id="report-description"
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter report description..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Filter - Right */}
                  <DataFilter 
                    filters={filters} 
                    onFiltersChange={setFilters} 
                  />
                </div>
            {/* Photos List */}
            {photos.map((photo, index) => (
              <div key={photo.id} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Photo {index + 1}
                  </h2>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePhoto(photo.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Left Column - Image Preview (25%) */}
                  <div className="lg:col-span-1 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5 text-blue-600" />
                          Photo Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
          <Image
                            src={photo.imageUrl}
                            alt={`Uploaded photo ${index + 1}`}
                            width={800}
                            height={600}
                            className="w-full h-auto max-h-96 object-contain rounded-lg"
                            unoptimized
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - EXIF Data (75%) */}
                  <div className="lg:col-span-3 space-y-4">
                    <EXIFDisplay 
                      exifData={photo.exifData} 
                      filters={filters}
                      title={photo.title}
                      isGeocoded={photo.isGeocoded}
                      onTitleChange={(newTitle) => handleTitleChange(photo.id, newTitle)}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More Photos
              </Button>
              <Button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="destructive"
                onClick={clearAllPhotos}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>

            {/* Hidden file input for adding more photos */}
            <input
              id="file-input"
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={async (e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  const fileArray = Array.from(files)
                  const imageFiles = fileArray.filter(file => 
                    file.type.startsWith('image/') || 
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif')
                  )
                  
                  if (imageFiles.length > 0) {
                    // Process each file properly with EXIF extraction and HEIC conversion
                    const processedPhotos = []
                    
                    for (let i = 0; i < imageFiles.length; i++) {
                      const file = imageFiles[i]
                      try {
                        // Import EXIF extraction
                        const { extractEXIFData } = await import('@/lib/exif')
                        
                        // Create preview - convert HEIC files to displayable format
                        let imageUrl: string
                        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || 
                            file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heif')) {
                          // Convert HEIC to JPEG for preview using heic-to library
                          try {
                            const { heicTo } = await import('heic-to')
                            const jpegBlob = await heicTo({
                              blob: file,
                              type: 'image/jpeg',
                              quality: 0.8
                            })
                            imageUrl = URL.createObjectURL(jpegBlob)
                          } catch (conversionError) {
                            console.error('HEIC conversion failed:', conversionError)
                            // Fallback to placeholder
                            imageUrl = 'data:image/svg+xml;base64,' + btoa(`
                              <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="5,5"/>
                                <circle cx="200" cy="120" r="30" fill="#3b82f6" opacity="0.1"/>
                                <text x="200" y="120" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#3b82f6">CAMERA</text>
                                <text x="200" y="160" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" font-weight="bold" fill="#374151">
                                  HEIC Preview Not Available
                                </text>
                                <text x="200" y="180" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#6b7280">
                                  ${file.name}
                                </text>
                                <text x="200" y="200" text-anchor="middle" dy=".3em" font-family="Arial" font-size="10" fill="#9ca3af">
                                  EXIF data will still be extracted
                                </text>
                              </svg>
                            `)
                          }
                        } else {
                          imageUrl = URL.createObjectURL(file)
                        }

                        // Extract EXIF data
                        const exifData = await extractEXIFData(file)
                        
                        // Generate title
                        let title = generateFallbackTitle(photos.length + i)
                        let isGeocoded = false

                        // Try to get address from GPS coordinates
                        if (exifData.gps) {
                          try {
                            const geocodingResult = await reverseGeocode(exifData.gps.latitude, exifData.gps.longitude)
                            if (geocodingResult.success) {
                              title = geocodingResult.address
                              isGeocoded = true
                            }
                          } catch (error) {
                            console.error('Geocoding failed for additional photo', i + 1, ':', error)
                          }
                        }
                        
                        processedPhotos.push({
                          exifData,
                          imageUrl,
                          title,
                          isGeocoded
                        })
                      } catch (error) {
                        console.error('Error processing file:', file.name, error)
                      }
                    }
                    
                    if (processedPhotos.length > 0) {
                      handleMultiplePhotosProcessed(processedPhotos)
                    }
                  }
                }
                // Reset input
                e.target.value = ''
              }}
              className="hidden"
            />
          </div>
        )}

      </div>
    </div>
  )
}