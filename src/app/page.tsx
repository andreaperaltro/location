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
                        src={imageUrl!}
                        alt="Uploaded photo"
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
                <EXIFDisplay exifData={exifData} />
              </div>
            </div>
            
            {/* Upload Another Button - Below the 2-column layout */}
            <div className="flex justify-center">
              <button
                onClick={resetApp}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Upload Another Photo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}