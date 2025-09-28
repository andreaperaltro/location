'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { extractEXIFData, EXIFData } from '@/lib/exif'
import heic2any from 'heic2any'

interface PhotoUploadProps {
  onPhotoProcessed: (exifData: EXIFData, imageUrl: string) => void
}

export function PhotoUpload({ onPhotoProcessed }: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Check if it's an image file (including HEIC)
    const isImage = file.type.startsWith('image/') || 
                   file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif')
    
    if (!isImage) {
      alert('Please select an image file')
      return
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size)
    setIsProcessing(true)
    
    try {
      // Create preview - convert HEIC files to displayable format
      let imageUrl: string
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || 
          file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heif')) {
        // Convert HEIC to JPEG for preview
        console.log('Converting HEIC file to JPEG for preview...')
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          })
          
          // heic2any returns an array, take the first item
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          imageUrl = URL.createObjectURL(blob)
          console.log('HEIC conversion successful')
        } catch (conversionError) {
          console.warn('HEIC conversion failed, using placeholder:', conversionError)
          // Fallback to placeholder if conversion fails
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
      setPreview(imageUrl)

      // Extract EXIF data
      console.log('Starting EXIF extraction...')
      const exifData = await extractEXIFData(file)
      console.log('EXIF extraction completed:', exifData)
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
                    <p className="text-sm text-gray-500 mt-1">
                      Supports JPEG, PNG, HEIC, and other image formats
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
              accept="image/*,.heic,.heif"
              onChange={handleFileInput}
              className="hidden"
            />
      </CardContent>
    </Card>
  )
}
