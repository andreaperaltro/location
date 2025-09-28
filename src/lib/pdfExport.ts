import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { PhotoData } from '@/app/page'
import { DataFilter } from '@/components/DataFilter'
import { formatDate, formatGPS, generateGoogleMapsLink } from './utils'
import { formatSunTime, formatSunPosition } from './sun'

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric characters with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 100) // Limit length
}

// Helper function to create and download zip file
async function createZipFile(photos: PhotoData[], pdfBlob: Blob, customTitle?: string): Promise<void> {
  const zip = new JSZip()
  
  // Add PDF to zip
  const pdfFilename = `${customTitle || 'Location Manager - Photo Report'}.pdf`
  zip.file(pdfFilename, pdfBlob)
  
  // Add images to zip
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const sanitizedTitle = sanitizeFilename(photo.title)
    const imageFilename = `${i + 1}_${sanitizedTitle}.jpg`
    
    try {
      const response = await fetch(photo.imageUrl)
      const imageBlob = await response.blob()
      zip.file(imageFilename, imageBlob)
      console.log(`Added to zip: ${imageFilename}`)
    } catch (error) {
      console.error(`Error adding image ${i + 1} to zip:`, error)
    }
  }
  
  // Generate and download zip
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = window.URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `location-manager-export-${new Date().toISOString().split('T')[0]}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function exportToPDF(photos: PhotoData[], filters: DataFilter, customTitle?: string, customDescription?: string): Promise<void> {
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

  // Helper function to add text with word wrapping and page overflow handling
  const addText = (text: string, x: number, y: number, maxWidth?: number, options: Record<string, unknown> = {}) => {
    const textMaxWidth = maxWidth || (contentWidth - (x - margin))
    const lines = pdf.splitTextToSize(text, textMaxWidth)
    const textHeight = lines.length * lineHeight
    
    // Check if text will fit on current page
    if (y + textHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.text(lines, x, newY, options)
      return newY + textHeight
    }
    
    pdf.text(lines, x, y, options)
    return y + textHeight
  }

  // Helper function to add a section header with page overflow handling
  const addSectionHeader = (title: string, y: number) => {
    // Check if we need a new page for the section header
    const estimatedHeight = 15 // Approximate height for section header
    if (y + estimatedHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(title, margin, newY)
      
      pdf.setLineWidth(0.5)
      pdf.line(margin, newY + 2, pageWidth - margin, newY + 2)
      return newY + sectionSpacing
    }

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, margin, y)
    
    pdf.setLineWidth(0.5)
    pdf.line(margin, y + 2, pageWidth - margin, y + 2)
    return y + sectionSpacing
  }

  // Helper function to check if we need a new page
  const checkPageOverflow = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage()
      currentY = margin
      return true
    }
    return false
  }

  // Helper function to add a data row with page overflow handling
  const addDataRow = (label: string, value: string, x: number, y: number, isLink: boolean = false) => {
    // Check if we need a new page before adding content
    const estimatedHeight = 8 // Approximate height for a data row
    if (y + estimatedHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      addText(`${label}:`, x, newY, dataColumnWidth)
      
      pdf.setFont('helvetica', 'normal')
      if (isLink) {
        pdf.setTextColor(0, 0, 255)
      } else {
        pdf.setTextColor(0, 0, 0)
      }
      const finalY = addText(value, x + 25, newY, dataColumnWidth - 25)
      return finalY + 2
    }

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

  // Helper function to add a section with proper page overflow handling
  const addSection = (title: string, x: number, y: number, content: () => number) => {
    // Check if we need a new page for the section
    const estimatedHeight = 20 // Approximate height for section header + some content
    if (y + estimatedHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(title, x, newY)
      const finalY = newY + 6
      return content()
    }

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, x, y)
    const contentY = y + 6
    return content()
  }

  // Helper function to add an image to the PDF
  const addImage = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
    try {
      // Create an image element to get dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise<number>((resolve) => {
        img.onload = () => {
          // Always fill the full width of the column (45mm)
          const mmWidth = maxWidth // Use the maxWidth directly (45mm)
          const mmHeight = (img.height * maxWidth) / img.width // Calculate height maintaining aspect ratio
          
          // Only scale down if height exceeds maximum
          let finalWidth = mmWidth
          let finalHeight = mmHeight
          if (mmHeight > maxHeight) {
            const heightRatio = maxHeight / mmHeight
            finalHeight = maxHeight
            finalWidth = mmWidth * heightRatio
          }
          
          // Add image to PDF
          pdf.addImage(imageUrl, 'JPEG', x, y, finalWidth, finalHeight)
          resolve(y + finalHeight + 5)
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
  const title = customTitle || 'Location Manager - Photo Report'
  currentY = addText(title, margin, currentY)
  currentY += 10

  // Add description if provided
  if (customDescription && customDescription.trim()) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(60, 60, 60)
    currentY = addText(customDescription.trim(), margin, currentY)
    currentY += 15
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    
    // Check if we need a new page for the entire photo section
    const estimatedPhotoHeight = 100 // Approximate height for photo + data
    if (currentY + estimatedPhotoHeight > pageHeight - margin) {
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
    dataY += 5

        // Location section
        if (filters.location && photo.exifData.gps) {
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(0, 0, 0)
          pdf.text('Location', dataStartX, dataY)
          dataY += 6
          
          // Show address if this photo is geocoded
          if (photo.isGeocoded) {
            dataY = addDataRow('Address', photo.title, dataStartX, dataY)
          }
          
          dataY = addDataRow('Coordinates', formatGPS({ lat: photo.exifData.gps.latitude, lng: photo.exifData.gps.longitude }), dataStartX, dataY)
      if (photo.exifData.gps.altitude) {
        dataY = addDataRow('Altitude', `${photo.exifData.gps.altitude.toFixed(2)} m`, dataStartX, dataY)
      }
          // Add Google Maps link as clickable text
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(0, 0, 0)
          pdf.text('Google Maps:', dataStartX, dataY)
          
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 255)
          const mapsLink = generateGoogleMapsLink(photo.exifData.gps.latitude, photo.exifData.gps.longitude)
          const linkText = 'Click here'
          const linkX = dataStartX + 25
          pdf.text(linkText, linkX, dataY)
          
          // Add the actual link
          pdf.link(linkX, dataY - 2, 30, 4, { url: mapsLink })
          dataY += 4
      dataY += 5
    }

    // Date/Time section
    if (filters.dateTime && (photo.exifData.dateTime || photo.exifData.dateTimeOriginal || photo.exifData.dateTimeDigitized)) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Date & Time', dataStartX, dataY)
      dataY += 6
      
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
      pdf.text('Camera', dataStartX, dataY)
      dataY += 6
      
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
      pdf.text('Exposure', dataStartX, dataY)
      dataY += 6
      
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
      pdf.text('Settings', dataStartX, dataY)
      dataY += 6
      
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
      pdf.text('Sun Data', dataStartX, dataY)
      dataY += 6
      
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
      pdf.text('Image', dataStartX, dataY)
      dataY += 6
      
      if (photo.exifData.image.width && photo.exifData.image.height) {
        dataY = addDataRow('Dimensions', `${photo.exifData.image.width} x ${photo.exifData.image.height}`, dataStartX, dataY)
      }
      if (photo.exifData.image.xResolution && photo.exifData.image.yResolution) {
        dataY = addDataRow('Resolution', `${photo.exifData.image.xResolution} x ${photo.exifData.image.yResolution} DPI`, dataStartX, dataY)
      }
      if (photo.exifData.image.orientation) {
        dataY = addDataRow('Orientation', photo.exifData.image.orientation.toString(), dataStartX, dataY)
      }
      dataY += 5
    }

    // Move to the next line after the image and data
    currentY = Math.max(imageBottomY, dataY) + 10
  }

  // Generate PDF blob and create zip file
  const pdfBlob = pdf.output('blob')
  await createZipFile(photos, pdfBlob, customTitle)
}