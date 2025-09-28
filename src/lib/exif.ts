import EXIF from 'exif-js'

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
}

export function extractEXIFData(file: File): Promise<EXIFData> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file)
    console.log('Extracting EXIF data from:', file.name, 'URL:', imageUrl)
    
    EXIF.getData(imageUrl, function(this: HTMLImageElement) {
      try {
        console.log('EXIF.getData callback called')
        const exifData: EXIFData = {}

        // Basic camera info
        exifData.make = EXIF.getTag(this, 'Make')
        exifData.model = EXIF.getTag(this, 'Model')
        exifData.software = EXIF.getTag(this, 'Software')
        
        console.log('Basic info extracted:', {
          make: exifData.make,
          model: exifData.model,
          software: exifData.software
        })

        // Date/Time
        exifData.dateTime = EXIF.getTag(this, 'DateTime')
        exifData.dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal')
        exifData.dateTimeDigitized = EXIF.getTag(this, 'DateTimeDigitized')

        // GPS Data
        const lat = EXIF.getTag(this, 'GPSLatitude')
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef')
        const lng = EXIF.getTag(this, 'GPSLongitude')
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef')
        const alt = EXIF.getTag(this, 'GPSAltitude')
        
        console.log('GPS data:', { lat, latRef, lng, lngRef, alt })

        if (lat && lng && latRef && lngRef) {
          const latitude = convertDMSToDD(lat, latRef)
          const longitude = convertDMSToDD(lng, lngRef)
          
          exifData.gps = {
            latitude,
            longitude,
            latitudeRef: latRef,
            longitudeRef: lngRef
          }
          
          if (alt) {
            exifData.gps.altitude = alt
          }
          
          console.log('GPS coordinates converted:', { latitude, longitude })
        }

        // Exposure settings
        exifData.exposure = {
          aperture: EXIF.getTag(this, 'ApertureValue'),
          shutterSpeed: EXIF.getTag(this, 'ShutterSpeedValue'),
          iso: EXIF.getTag(this, 'ISOSpeedRatings'),
          exposureTime: EXIF.getTag(this, 'ExposureTime'),
          fNumber: EXIF.getTag(this, 'FNumber')
        }

        // Camera settings
        exifData.camera = {
          focalLength: EXIF.getTag(this, 'FocalLength'),
          flash: EXIF.getTag(this, 'Flash'),
          whiteBalance: EXIF.getTag(this, 'WhiteBalance'),
          meteringMode: EXIF.getTag(this, 'MeteringMode'),
          exposureMode: EXIF.getTag(this, 'ExposureMode')
        }

        // Image properties
        exifData.image = {
          width: EXIF.getTag(this, 'PixelXDimension'),
          height: EXIF.getTag(this, 'PixelYDimension'),
          orientation: EXIF.getTag(this, 'Orientation'),
          xResolution: EXIF.getTag(this, 'XResolution'),
          yResolution: EXIF.getTag(this, 'YResolution')
        }

        console.log('Final EXIF data:', exifData)
        resolve(exifData)
      } catch (error) {
        console.error('Error in EXIF extraction:', error)
        reject(error)
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
    })
  })
}

function convertDMSToDD(dms: number[], ref: string): number {
  let dd = dms[0] + dms[1]/60 + dms[2]/(60*60)
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1
  }
  return dd
}
