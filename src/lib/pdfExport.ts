import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PhotoData } from '@/app/page'
import { DataFilter } from '@/components/DataFilter'
import { formatDate, formatGPS, generateGoogleMapsLink } from './utils'
import { formatSunTime, formatSunPosition } from './sun'

export async function exportToPDF(photos: PhotoData[], filters: DataFilter): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  let currentY = margin
  const lineHeight = 6
  const sectionSpacing = 8
  const imageMaxWidth = 45 // 25% of page width (180mm * 0.25 = 45mm)
  const imageMaxHeight = 80 // Increased height to fill column better
  const dataColumnWidth = 135 // 75% of page width (180mm * 0.75 = 135mm)

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, options: any = {}) => {
    const textMaxWidth = maxWidth || (contentWidth - (x - margin))
    const lines = pdf.splitTextToSize(text, textMaxWidth)
    pdf.text(lines, x, y, options)
    return y + (lines.length * lineHeight)
  }

  // Helper function to add a section header
  const addSectionHeader = (title: string, y: number) => {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const newY = addText(title, margin, y)
    pdf.setLineWidth(0.5)
    pdf.line(margin, newY + 2, pageWidth - margin, newY + 2)
    return newY + sectionSpacing
  }

  // Helper function to add a data row
  const addDataRow = (label: string, value: string, x: number, y: number, isLink: boolean = false) => {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    addText(`${label}:`, x, y, dataColumnWidth)
    
    pdf.setFont('helvetica', 'normal')
    if (isLink) {
      pdf.setTextColor(0, 0, 255)
    } else {
      pdf.setTextColor(0, 0, 0)
    }
    const newY = addText(value, x + 25, y, dataColumnWidth - 25)
    return newY + 2
  }

  // Helper function to add an image to the PDF
  const addImage = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
    try {
      // Create an image element to get dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise<number>((resolve) => {
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio
          let imgWidth = img.width
          let imgHeight = img.height
          
          // Always fill the width of the column, then scale height proportionally
          const ratio = maxWidth / imgWidth
          imgWidth = maxWidth
          imgHeight = imgHeight * ratio
          
          // Only scale down height if it exceeds the maximum
          if (imgHeight > maxHeight) {
            const heightRatio = maxHeight / imgHeight
            imgHeight = maxHeight
            imgWidth = imgWidth * heightRatio
          }
          
          // Convert to mm (assuming 96 DPI)
          const mmWidth = (imgWidth * 25.4) / 96
          const mmHeight = (imgHeight * 25.4) / 96
          
          // Add image to PDF
          pdf.addImage(imageUrl, 'JPEG', x, y, mmWidth, mmHeight)
          resolve(y + mmHeight + 5)
        }
        img.onerror = () => {
          // If image fails to load, just return current Y
          resolve(y)
        }
        img.src = imageUrl
      })
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      return y
    }
  }

  // Add title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  currentY = addText('Location Manager - Photo Report', margin, currentY)
  currentY += 10

  // Add generation date
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  currentY = addText(`Generated on: ${new Date().toLocaleString()}`, margin, currentY)
  currentY += 15

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage()
      currentY = margin
    }

    // Photo title
    currentY = addSectionHeader(`Photo ${i + 1}: ${photo.title}`, currentY)

    // Add the image on the left side
    const imageX = margin
    const imageY = currentY
    const imageBottomY = await addImage(photo.imageUrl, imageX, imageY, imageMaxWidth, imageMaxHeight)
    
    // Start data on the right side of the image with proper spacing
    const dataStartX = margin + imageMaxWidth + 10
    let dataY = imageY

    // Photo title section (always visible)
    dataY = addDataRow('Title', photo.title, dataStartX, dataY)
    if (photo.isGeocoded) {
      dataY = addDataRow('Source', 'GPS Coordinates (Geocoded)', dataStartX, dataY)
    } else {
      dataY = addDataRow('Source', 'Manual Entry', dataStartX, dataY)
    }
    dataY += 5

    // Location section
    if (filters.location && photo.exifData.gps) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Location', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      dataY = addDataRow('Coordinates', formatGPS({ lat: photo.exifData.gps.latitude, lng: photo.exifData.gps.longitude }), dataStartX, dataY)
      if (photo.exifData.gps.altitude) {
        dataY = addDataRow('Altitude', `${photo.exifData.gps.altitude.toFixed(2)} m`, dataStartX, dataY)
      }
      dataY = addDataRow('Google Maps', generateGoogleMapsLink(photo.exifData.gps.latitude, photo.exifData.gps.longitude), dataStartX, dataY, true)
      dataY += 5
    }

    // Date/Time section
    if (filters.dateTime && (photo.exifData.dateTime || photo.exifData.dateTimeOriginal || photo.exifData.dateTimeDigitized)) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Date & Time', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      if (photo.exifData.dateTimeOriginal) {
        dataY = addDataRow('Original Date', formatDate(new Date(photo.exifData.dateTimeOriginal)), dataStartX, dataY)
      }
      if (photo.exifData.dateTime) {
        dataY = addDataRow('File Date', formatDate(new Date(photo.exifData.dateTime)), dataStartX, dataY)
      }
      dataY += 5
    }

    // Camera section
    if (filters.camera && (photo.exifData.make || photo.exifData.model || photo.exifData.software)) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Camera', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      if (photo.exifData.make) {
        dataY = addDataRow('Make', photo.exifData.make, dataStartX, dataY)
      }
      if (photo.exifData.model) {
        dataY = addDataRow('Model', photo.exifData.model, dataStartX, dataY)
      }
      if (photo.exifData.software) {
        dataY = addDataRow('Software', photo.exifData.software, dataStartX, dataY)
      }
      dataY += 5
    }

    // Exposure section
    if (filters.exposure && photo.exifData.exposure) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Exposure', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      if (photo.exifData.exposure.aperture) {
        dataY = addDataRow('Aperture', `f/${photo.exifData.exposure.aperture.toFixed(1)}`, dataStartX, dataY)
      }
      if (photo.exifData.exposure.shutterSpeed) {
        dataY = addDataRow('Shutter Speed', `1/${Math.round(1/photo.exifData.exposure.shutterSpeed)}s`, dataStartX, dataY)
      }
      if (photo.exifData.exposure.iso) {
        dataY = addDataRow('ISO', photo.exifData.exposure.iso.toString(), dataStartX, dataY)
      }
      if (photo.exifData.exposure.fNumber) {
        dataY = addDataRow('F-Number', `f/${photo.exifData.exposure.fNumber.toFixed(1)}`, dataStartX, dataY)
      }
      dataY += 5
    }

    // Settings section
    if (filters.settings && photo.exifData.camera) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Settings', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      if (photo.exifData.camera.focalLength) {
        dataY = addDataRow('Focal Length', `${photo.exifData.camera.focalLength.toFixed(0)}mm`, dataStartX, dataY)
      }
      if (photo.exifData.camera.flash !== undefined) {
        dataY = addDataRow('Flash', photo.exifData.camera.flash ? 'On' : 'Off', dataStartX, dataY)
      }
      if (photo.exifData.camera.whiteBalance !== undefined) {
        dataY = addDataRow('White Balance', photo.exifData.camera.whiteBalance ? 'Auto' : 'Manual', dataStartX, dataY)
      }
      if (photo.exifData.camera.meteringMode !== undefined) {
        dataY = addDataRow('Metering Mode', photo.exifData.camera.meteringMode.toString(), dataStartX, dataY)
      }
      dataY += 5
    }

    // Sun Data section
    if (filters.sun && photo.exifData.sun) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Sun Data', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      dataY = addDataRow('Sunrise', formatSunTime(photo.exifData.sun.sunrise), dataStartX, dataY)
      dataY = addDataRow('Sunset', formatSunTime(photo.exifData.sun.sunset), dataStartX, dataY)
      dataY = addDataRow('Solar Noon', formatSunTime(photo.exifData.sun.solarNoon), dataStartX, dataY)
      dataY = addDataRow('Day Length', `${Math.floor(photo.exifData.sun.dayLength / 60)}h ${photo.exifData.sun.dayLength % 60}m`, dataStartX, dataY)
      dataY = addDataRow('Sun Position', formatSunPosition(photo.exifData.sun.sunPosition.azimuth, photo.exifData.sun.sunPosition.altitude), dataStartX, dataY)
      dataY = addDataRow('Time of Day', photo.exifData.sun.isDaytime ? 'Daytime' : 'Nighttime', dataStartX, dataY)
      dataY += 5
    }

    // Image section
    if (filters.image && photo.exifData.image) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      dataY = addText('Image', dataStartX, dataY, dataColumnWidth)
      dataY += 3
      
      if (photo.exifData.image.width && photo.exifData.image.height) {
        dataY = addDataRow('Dimensions', `${photo.exifData.image.width} × ${photo.exifData.image.height}`, dataStartX, dataY)
      }
      if (photo.exifData.image.xResolution && photo.exifData.image.yResolution) {
        dataY = addDataRow('Resolution', `${photo.exifData.image.xResolution} × ${photo.exifData.image.yResolution} DPI`, dataStartX, dataY)
      }
      if (photo.exifData.image.orientation) {
        dataY = addDataRow('Orientation', photo.exifData.image.orientation.toString(), dataStartX, dataY)
      }
      dataY += 5
    }

    // Move to the next line after the image and data
    currentY = Math.max(imageBottomY, dataY) + 10
  }

  // Save the PDF
  const fileName = `location-manager-report-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}