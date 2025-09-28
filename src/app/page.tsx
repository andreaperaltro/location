'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoUpload } from '@/components/PhotoUpload'
import { EXIFDisplay } from '@/components/EXIFDisplay'
import { EXIFData } from '@/lib/exif'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Trash2, Plus } from 'lucide-react'

interface PhotoData {
  exifData: EXIFData
  imageUrl: string
  id: string
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoData[]>([])

  const handlePhotoProcessed = (data: EXIFData, url: string) => {
    const newPhoto: PhotoData = {
      exifData: data,
      imageUrl: url,
      id: Date.now().toString()
    }
    setPhotos(prev => [...prev, newPhoto])
  }

  const handleMultiplePhotosProcessed = (newPhotos: Array<{exifData: EXIFData, imageUrl: string}>) => {
    const photosWithIds = newPhotos.map(photo => ({
      ...photo,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }))
    setPhotos(prev => [...prev, ...photosWithIds])
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Location Manager
          </h1>
          <p className="text-lg text-gray-600">
            Extract location and EXIF data from your photos
          </p>
        </div>

        {photos.length === 0 ? (
          <PhotoUpload 
            onPhotoProcessed={handlePhotoProcessed}
            onMultiplePhotosProcessed={handleMultiplePhotosProcessed}
          />
        ) : (
          <div className="space-y-8">
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Image Preview */}
                  <div className="space-y-4">
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

                  {/* Right Column - EXIF Data */}
                  <div className="space-y-4">
                    <EXIFDisplay exifData={photo.exifData} />
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
                    
                    for (const file of imageFiles) {
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
                        
                        processedPhotos.push({
                          exifData,
                          imageUrl
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