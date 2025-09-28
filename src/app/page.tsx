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
  const [isUploading, setIsUploading] = useState(false)

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
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  if (files.length === 1) {
                    // Handle single file
                    const file = files[0]
                    const isImage = file.type.startsWith('image/') || 
                                   file.name.toLowerCase().endsWith('.heic') || 
                                   file.name.toLowerCase().endsWith('.heif')
                    
                    if (isImage) {
                      // Process single file
                      handlePhotoProcessed({} as EXIFData, URL.createObjectURL(file))
                    }
                  } else {
                    // Handle multiple files
                    const fileArray = Array.from(files)
                    const imageFiles = fileArray.filter(file => 
                      file.type.startsWith('image/') || 
                      file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif')
                    )
                    
                    const processedPhotos = imageFiles.map(file => ({
                      exifData: {} as EXIFData,
                      imageUrl: URL.createObjectURL(file)
                    }))
                    
                    handleMultiplePhotosProcessed(processedPhotos)
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