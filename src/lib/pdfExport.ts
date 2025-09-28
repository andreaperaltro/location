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

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const maxWidth = contentWidth - (x - margin)
    const lines = pdf.splitTextToSize(text, maxWidth)
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
  const addDataRow = (label: string, value: string, y: number, isLink: boolean = false) => {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    addText(`${label}:`, margin, y)
    
    pdf.setFont('helvetica', 'normal')
    if (isLink) {
      pdf.setTextColor(0, 0, 255)
    } else {
      pdf.setTextColor(0, 0, 0)
    }
    const newY = addText(value, margin + 30, y)
    return newY + 2
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
    if (currentY > pageHeight - 50) {
      pdf.addPage()
      currentY = margin
    }

    // Photo title
    currentY = addSectionHeader(`Photo ${i + 1}: ${photo.title}`, currentY)

    // Photo title section (always visible)
    currentY = addDataRow('Title', photo.title, currentY)
    if (photo.isGeocoded) {
      currentY = addDataRow('Source', 'GPS Coordinates (Geocoded)', currentY)
    } else {
      currentY = addDataRow('Source', 'Manual Entry', currentY)
    }
    currentY += 5

    // Location section
    if (filters.location && photo.exifData.gps) {
      currentY = addSectionHeader('Location', currentY)
      currentY = addDataRow('Coordinates', formatGPS({ lat: photo.exifData.gps.latitude, lng: photo.exifData.gps.longitude }), currentY)
      if (photo.exifData.gps.altitude) {
        currentY = addDataRow('Altitude', `${photo.exifData.gps.altitude.toFixed(2)} m`, currentY)
      }
      currentY = addDataRow('Google Maps', generateGoogleMapsLink(photo.exifData.gps.latitude, photo.exifData.gps.longitude), currentY, true)
      currentY += 5
    }

    // Date/Time section
    if (filters.dateTime && (photo.exifData.dateTime || photo.exifData.dateTimeOriginal || photo.exifData.dateTimeDigitized)) {
      currentY = addSectionHeader('Date & Time', currentY)
      if (photo.exifData.dateTimeOriginal) {
        currentY = addDataRow('Original Date', formatDate(new Date(photo.exifData.dateTimeOriginal)), currentY)
      }
      if (photo.exifData.dateTime) {
        currentY = addDataRow('File Date', formatDate(new Date(photo.exifData.dateTime)), currentY)
      }
      currentY += 5
    }

    // Camera section
    if (filters.camera && (photo.exifData.make || photo.exifData.model || photo.exifData.software)) {
      currentY = addSectionHeader('Camera', currentY)
      if (photo.exifData.make) {
        currentY = addDataRow('Make', photo.exifData.make, currentY)
      }
      if (photo.exifData.model) {
        currentY = addDataRow('Model', photo.exifData.model, currentY)
      }
      if (photo.exifData.software) {
        currentY = addDataRow('Software', photo.exifData.software, currentY)
      }
      currentY += 5
    }

    // Exposure section
    if (filters.exposure && photo.exifData.exposure) {
      currentY = addSectionHeader('Exposure', currentY)
      if (photo.exifData.exposure.aperture) {
        currentY = addDataRow('Aperture', `f/${photo.exifData.exposure.aperture.toFixed(1)}`, currentY)
      }
      if (photo.exifData.exposure.shutterSpeed) {
        currentY = addDataRow('Shutter Speed', `1/${Math.round(1/photo.exifData.exposure.shutterSpeed)}s`, currentY)
      }
      if (photo.exifData.exposure.iso) {
        currentY = addDataRow('ISO', photo.exifData.exposure.iso.toString(), currentY)
      }
      if (photo.exifData.exposure.fNumber) {
        currentY = addDataRow('F-Number', `f/${photo.exifData.exposure.fNumber.toFixed(1)}`, currentY)
      }
      currentY += 5
    }

    // Settings section
    if (filters.settings && photo.exifData.camera) {
      currentY = addSectionHeader('Settings', currentY)
      if (photo.exifData.camera.focalLength) {
        currentY = addDataRow('Focal Length', `${photo.exifData.camera.focalLength.toFixed(0)}mm`, currentY)
      }
      if (photo.exifData.camera.flash !== undefined) {
        currentY = addDataRow('Flash', photo.exifData.camera.flash ? 'On' : 'Off', currentY)
      }
      if (photo.exifData.camera.whiteBalance !== undefined) {
        currentY = addDataRow('White Balance', photo.exifData.camera.whiteBalance ? 'Auto' : 'Manual', currentY)
      }
      if (photo.exifData.camera.meteringMode !== undefined) {
        currentY = addDataRow('Metering Mode', photo.exifData.camera.meteringMode.toString(), currentY)
      }
      currentY += 5
    }

    // Sun Data section
    if (filters.sun && photo.exifData.sun) {
      currentY = addSectionHeader('Sun Data', currentY)
      currentY = addDataRow('Sunrise', formatSunTime(photo.exifData.sun.sunrise), currentY)
      currentY = addDataRow('Sunset', formatSunTime(photo.exifData.sun.sunset), currentY)
      currentY = addDataRow('Solar Noon', formatSunTime(photo.exifData.sun.solarNoon), currentY)
      currentY = addDataRow('Day Length', `${Math.floor(photo.exifData.sun.dayLength / 60)}h ${photo.exifData.sun.dayLength % 60}m`, currentY)
      currentY = addDataRow('Sun Position', formatSunPosition(photo.exifData.sun.sunPosition.azimuth, photo.exifData.sun.sunPosition.altitude), currentY)
      currentY = addDataRow('Time of Day', photo.exifData.sun.isDaytime ? 'Daytime' : 'Nighttime', currentY)
      currentY += 5
    }

    // Image section
    if (filters.image && photo.exifData.image) {
      currentY = addSectionHeader('Image', currentY)
      if (photo.exifData.image.width && photo.exifData.image.height) {
        currentY = addDataRow('Dimensions', `${photo.exifData.image.width} × ${photo.exifData.image.height}`, currentY)
      }
      if (photo.exifData.image.xResolution && photo.exifData.image.yResolution) {
        currentY = addDataRow('Resolution', `${photo.exifData.image.xResolution} × ${photo.exifData.image.yResolution} DPI`, currentY)
      }
      if (photo.exifData.image.orientation) {
        currentY = addDataRow('Orientation', photo.exifData.image.orientation.toString(), currentY)
      }
      currentY += 5
    }

    // Add spacing between photos
    currentY += 10
  }

  // Save the PDF
  const fileName = `location-manager-report-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
