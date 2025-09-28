'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoUpload } from '@/components/PhotoUpload'
import { EXIFDisplay } from '@/components/EXIFDisplay'
import { EXIFData } from '@/lib/exif'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Camera, Clock } from 'lucide-react'

export default function Home() {
  const [exifData, setExifData] = useState<EXIFData | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handlePhotoProcessed = (data: EXIFData, url: string) => {
    setExifData(data)
    setImageUrl(url)
  }

  const resetApp = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setExifData(null)
    setImageUrl(null)
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

        {!exifData ? (
          <PhotoUpload onPhotoProcessed={handlePhotoProcessed} />
        ) : (
          <div className="space-y-6">
            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Photo Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Image
                    src={imageUrl!}
                    alt="Uploaded photo"
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-96 object-contain rounded-lg"
                    unoptimized
                  />
                </div>
                <button
                  onClick={resetApp}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Upload another photo
                </button>
              </CardContent>
            </Card>

            {/* EXIF Data Display */}
            <EXIFDisplay exifData={exifData} />
          </div>
        )}

        {/* Quick Stats */}
        {exifData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {exifData.gps?.latitude && exifData.gps?.longitude ? 'Location Found' : 'No Location'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    {exifData.dateTimeOriginal || exifData.dateTime ? 'Date Available' : 'No Date'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">
                    {exifData.make || exifData.model ? 'Camera Info' : 'No Camera Info'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}