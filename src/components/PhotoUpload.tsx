'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { extractEXIFData, EXIFData } from '@/lib/exif'

interface PhotoUploadProps {
  onPhotoProcessed: (exifData: EXIFData, imageUrl: string) => void
}

export function PhotoUpload({ onPhotoProcessed }: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsProcessing(true)
    
    try {
      // Create preview
      const imageUrl = URL.createObjectURL(file)
      setPreview(imageUrl)

      // Extract EXIF data
      const exifData = await extractEXIFData(file)
      onPhotoProcessed(exifData, imageUrl)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-blue-100">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Upload a Photo</h3>
                <p className="text-gray-600">
                  Drag and drop an image here, or click to browse
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                width={800}
                height={600}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
                unoptimized
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
