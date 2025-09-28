import { parse } from 'exifr'
import { calculateSunData, SunData } from './sun'

export interface EXIFData {
  make?: string
  model?: string
  software?: string
  dateTime?: string
  dateTimeOriginal?: string
  dateTimeDigitized?: string
  gps?: {
    latitude: number
    longitude: number
    altitude?: number
    latitudeRef?: string
    longitudeRef?: string
  }
  exposure?: {
    aperture?: number
    shutterSpeed?: number
    iso?: number
    exposureTime?: number
    fNumber?: number
  }
  camera?: {
    focalLength?: number
    flash?: number
    whiteBalance?: number
    meteringMode?: number
    exposureMode?: number
  }
  image?: {
    width?: number
    height?: number
    orientation?: number
    xResolution?: number
    yResolution?: number
  }
  sun?: SunData
}

export async function extractEXIFData(file: File): Promise<EXIFData> {
  console.log('Extracting EXIF data from:', file.name, 'Type:', file.type, 'Size:', file.size)
  
  try {
    // Parse EXIF data using exifr
    const exif = await parse(file, {
      gps: true,
      exif: true,
      iptc: true,
      icc: true,
      jfif: true,
      ihdr: true,
      multiSegment: true,
      mergeOutput: true
    })
    
    console.log('Raw EXIF data from exifr:', exif)
    
    if (!exif) {
      console.log('No EXIF data found')
      return {}
    }
    
    const exifData: EXIFData = {}
    
    // Basic camera info
    exifData.make = exif.Make || exif.make
    exifData.model = exif.Model || exif.model
    exifData.software = exif.Software || exif.software
    
    console.log('Basic info extracted:', {
      make: exifData.make,
      model: exifData.model,
      software: exifData.software
    })

    // Date/Time
    exifData.dateTime = exif.DateTime || exif.dateTime
    exifData.dateTimeOriginal = exif.DateTimeOriginal || exif.dateTimeOriginal
    exifData.dateTimeDigitized = exif.DateTimeDigitized || exif.dateTimeDigitized

    // GPS Data
    if (exif.latitude && exif.longitude) {
      exifData.gps = {
        latitude: exif.latitude,
        longitude: exif.longitude,
        altitude: exif.altitude,
        latitudeRef: exif.latitudeRef,
        longitudeRef: exif.longitudeRef
      }
      console.log('GPS coordinates found:', { 
        latitude: exifData.gps.latitude, 
        longitude: exifData.gps.longitude 
      })
    }

    // Exposure settings
    exifData.exposure = {
      aperture: exif.ApertureValue || exif.apertureValue,
      shutterSpeed: exif.ShutterSpeedValue || exif.shutterSpeedValue,
      iso: exif.ISOSpeedRatings || exif.isoSpeedRatings,
      exposureTime: exif.ExposureTime || exif.exposureTime,
      fNumber: exif.FNumber || exif.fNumber
    }

    // Camera settings
    exifData.camera = {
      focalLength: exif.FocalLength || exif.focalLength,
      flash: exif.Flash || exif.flash,
      whiteBalance: exif.WhiteBalance || exif.whiteBalance,
      meteringMode: exif.MeteringMode || exif.meteringMode,
      exposureMode: exif.ExposureMode || exif.exposureMode
    }

    // Image properties
    exifData.image = {
      width: exif.PixelXDimension || exif.pixelXDimension || exif.width,
      height: exif.PixelYDimension || exif.pixelYDimension || exif.height,
      orientation: exif.Orientation || exif.orientation,
      xResolution: exif.XResolution || exif.xResolution,
      yResolution: exif.YResolution || exif.yResolution
    }

        // Calculate sun data if we have GPS coordinates and date
        if (exifData.gps && (exifData.dateTimeOriginal || exifData.dateTime)) {
          try {
            const photoDate = new Date(exifData.dateTimeOriginal || exifData.dateTime!)
            console.log('Calculating sun data for:', photoDate, 'at', exifData.gps.latitude, exifData.gps.longitude)
            
            exifData.sun = calculateSunData(
              exifData.gps.latitude,
              exifData.gps.longitude,
              photoDate
            )
            
            console.log('Sun data calculated:', exifData.sun)
          } catch (sunError) {
            console.error('Error calculating sun data:', sunError)
          }
        }

        console.log('Final EXIF data:', exifData)
        return exifData
    
  } catch (error) {
    console.error('Error extracting EXIF data:', error)
    return {}
  }
}

