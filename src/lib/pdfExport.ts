import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { PhotoData } from '@/app/page'
import { DataFilter } from '@/components/DataFilter'
import { formatDate, formatGPS, generateGoogleMapsLink } from './utils'
import { formatSunTime, formatSunPosition } from './sun'
import { getOrientedImageDataURL, getCorrectedDimensions } from './imageOrientation'

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
  const margin = 10
  const contentWidth = pageWidth - (margin * 2)
  
  let currentY = margin
  
  // Global styling configuration
  const styles = {
    // Font sizes
    title: 20,
    sectionHeader: 12,
    dataLabel: 9,
    dataValue: 9,
    
    // Spacing
    lineHeight: 4.5,
    sectionSpacing: 6,
    dataRowSpacing: 2,
    betweenSections: 2,
    photoSpacing: 2,
    
    // Layout
    dataRowHeight: 5,
    sectionHeaderHeight: 5
  }
  
  const lineHeight = styles.lineHeight
  const sectionSpacing = 6
  const imageMaxWidth = 50
  const imageMaxHeight = 50
  const dataColumnWidth = 150
  
  // Global layout state
  let currentPage = 1
  const maxContentHeight = pageHeight - margin * 2

  // Global layout management system
  const layoutManager = {
    // Calculate available space on current page
    getAvailableSpace: () => pageHeight - currentY - margin,
    
    // Check if content fits on current page - ULTRA aggressive
    canFit: (requiredHeight: number) => {
      // Add maximum tolerance - allow content to get very close to the bottom
      const tolerance = 20 // Allow 20mm closer to bottom
      return currentY + requiredHeight <= pageHeight - margin + tolerance
    },
    
    // Add new page and reset position
    addPage: () => {
      pdf.addPage()
      currentY = margin
      currentPage++
    },
    
    // Smart page break - only when absolutely necessary
    ensureSpace: (requiredHeight: number) => {
      if (!layoutManager.canFit(requiredHeight)) {
        layoutManager.addPage()
      }
    },
    
    // Calculate content height for a photo - ULTRA aggressive
    calculatePhotoHeight: (photo: PhotoData) => {
      let height = 15 // Photo title (ultra reduced)
      height += Math.min(imageMaxHeight, 35) // Image height (ultra reduced)
      height += 3 // Spacing (ultra reduced)
      
      // Add ultra-minimal height for enabled sections
      if (filters.location && photo.exifData.gps) height += 18
      if (filters.dateTime && (photo.exifData.dateTime || photo.exifData.dateTimeOriginal)) height += 12
      if (filters.camera && (photo.exifData.make || photo.exifData.model)) height += 12
      if (filters.exposure && photo.exifData.exposure) height += 18
      if (filters.settings && photo.exifData.camera) height += 12
      if (filters.sun && photo.exifData.sun) height += 25
      if (filters.image && photo.exifData.image) height += 12
      
      return height + 2 // Ultra minimal buffer
    }
  }

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

  // Global function to add section headers with consistent styling
  const addSectionHeader = (title: string, y: number) => {
    const estimatedHeight = 15
    if (y + estimatedHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.setFontSize(styles.title)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(title, margin, newY)
      
      pdf.setLineWidth(0.5)
      pdf.line(margin, newY + 2, pageWidth - margin, newY + 2)
      return newY + sectionSpacing
    }

    pdf.setFontSize(styles.title)
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

  // Global function to add data rows with consistent styling
  const addDataRow = (label: string, value: string, x: number, y: number, isLink: boolean = false) => {
    const estimatedHeight = styles.dataRowHeight
    if (y + estimatedHeight > pageHeight - margin) {
      pdf.addPage()
      const newY = margin
      pdf.setFontSize(styles.dataLabel)
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
      return finalY + styles.dataRowSpacing
    }

    pdf.setFontSize(styles.dataLabel)
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
    return newY + styles.dataRowSpacing
  }

  // Global function to add data section headers with consistent styling
  const addDataSectionHeader = (title: string, x: number, y: number) => {
    pdf.setFontSize(styles.sectionHeader)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, x, y)
    return y + styles.sectionHeaderHeight
  }

  // Helper function to compress and resize image for PDF
  const compressImageForPDF = async (imageUrl: string, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width
          let height = img.height
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(imageUrl) // Fallback to original
            return
          }
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        } catch (error) {
          console.error('Error compressing image:', error)
          resolve(imageUrl) // Fallback to original
        }
      }
      
      img.onerror = () => {
        resolve(imageUrl) // Fallback to original
      }
      
      img.src = imageUrl
    })
  }

  // Helper function to add an image to the PDF
  const addImage = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number, orientation?: number) => {
    try {
      // Create an image element to get dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise<number>((resolve) => {
        img.onload = async () => {
          try {
            // Apply orientation correction if needed
            let finalImageUrl = imageUrl
            let finalWidth = img.width
            let finalHeight = img.height
            
            if (orientation && orientation !== 1) {
              console.log('Applying orientation correction for PDF:', orientation)
              try {
                finalImageUrl = await getOrientedImageDataURL(imageUrl, orientation)
                // Get corrected dimensions after orientation
                const correctedDims = getCorrectedDimensions(img.width, img.height, orientation)
                finalWidth = correctedDims.width
                finalHeight = correctedDims.height
                console.log('Orientation correction applied for PDF')
              } catch (orientationError) {
                console.warn('Failed to apply orientation correction for PDF:', orientationError)
                // Use original image if correction fails
              }
            }
            
            // Compress image before adding to PDF (reduces file size significantly)
            console.log('Compressing image for PDF...')
            finalImageUrl = await compressImageForPDF(finalImageUrl, 800, 0.6)
            console.log('Image compressed for PDF')
            
            // Calculate PDF dimensions maintaining aspect ratio
            const aspectRatio = finalWidth / finalHeight
            let pdfWidth = maxWidth
            let pdfHeight = maxWidth / aspectRatio
            
            // If height is too tall, scale down by height
            if (pdfHeight > maxHeight) {
              const heightRatio = maxHeight / pdfHeight
              pdfHeight = maxHeight
              pdfWidth = pdfWidth * heightRatio
            }
            
            // If width is too wide, scale down by width
            if (pdfWidth > maxWidth) {
              const widthRatio = maxWidth / pdfWidth
              pdfWidth = maxWidth
              pdfHeight = pdfHeight * widthRatio
            }
            
            // Add compressed image to PDF
            pdf.addImage(finalImageUrl, 'JPEG', x, y, pdfWidth, pdfHeight)
            resolve(y + pdfHeight + 5)
          } catch (error) {
            console.error('Error processing image for PDF:', error)
            resolve(y)
          }
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

  // Process each photo with smart layout management
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    
    // Calculate the actual space needed for this photo
    const photoHeight = layoutManager.calculatePhotoHeight(photo)
    
    // Be very aggressive about fitting content - only break page when absolutely necessary
    // Allow content to flow very close to the bottom of the page
    if (!layoutManager.canFit(photoHeight)) {
      // Only add new page if we really can't fit
      layoutManager.addPage()
    }

    // Photo title
    currentY = addSectionHeader(`Photo ${i + 1}: ${photo.title}`, currentY)

    // Add the image on the left side
    const imageX = margin
    const imageY = currentY
    const imageBottomY = await addImage(
      photo.imageUrl, 
      imageX, 
      imageY, 
      imageMaxWidth, 
      imageMaxHeight, 
      photo.exifData.image?.orientation
    )
    
    // Start data on the right side of the image, aligned with the visual top of the image
    const dataStartX = margin + imageMaxWidth + 10
    let dataY = imageY + 2 // Slight offset to align with the visual top of the image

    // Skip the duplicate title since we already have it as a header above
    // dataY = addDataRow('Title', photo.title, dataStartX, dataY)
    // dataY += 5

        // Location section
        if (filters.location && photo.exifData.gps) {
          
          dataY = addDataSectionHeader('Location', dataStartX, dataY)
          
          // Show address if this photo is geocoded
          if (photo.isGeocoded) {
            dataY = addDataRow('Address', photo.title, dataStartX, dataY)
          }
          
          dataY = addDataRow('Coordinates', formatGPS({ lat: photo.exifData.gps.latitude, lng: photo.exifData.gps.longitude }), dataStartX, dataY)
          if (photo.exifData.gps.altitude) {
            dataY = addDataRow('Altitude', `${photo.exifData.gps.altitude.toFixed(2)} m`, dataStartX, dataY)
          }
          // Add Google Maps link as clickable text
          pdf.setFontSize(9)
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
          dataY += styles.betweenSections
        }

    // Date/Time section
    if (filters.dateTime && (photo.exifData.dateTime || photo.exifData.dateTimeOriginal || photo.exifData.dateTimeDigitized)) {
      
      dataY = addDataSectionHeader('Date & Time', dataStartX, dataY)
      
      if (photo.exifData.dateTimeOriginal) {
        dataY = addDataRow('Original Date', formatDate(new Date(photo.exifData.dateTimeOriginal)), dataStartX, dataY)
      }
      if (photo.exifData.dateTime) {
        dataY = addDataRow('File Date', formatDate(new Date(photo.exifData.dateTime)), dataStartX, dataY)
      }
      dataY += styles.betweenSections
    }

    // Camera section
    if (filters.camera && (photo.exifData.make || photo.exifData.model || photo.exifData.software)) {
      
      dataY = addDataSectionHeader('Camera', dataStartX, dataY)
      
      if (photo.exifData.make) {
        dataY = addDataRow('Make', photo.exifData.make, dataStartX, dataY)
      }
      if (photo.exifData.model) {
        dataY = addDataRow('Model', photo.exifData.model, dataStartX, dataY)
      }
      if (photo.exifData.software) {
        dataY = addDataRow('Software', photo.exifData.software, dataStartX, dataY)
      }
      dataY += styles.betweenSections
    }

    // Exposure section
    if (filters.exposure && photo.exifData.exposure) {
      
      dataY = addDataSectionHeader('Exposure', dataStartX, dataY)
      
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
      dataY += styles.betweenSections
    }

    // Settings section
    if (filters.settings && photo.exifData.camera) {
      
      dataY = addDataSectionHeader('Settings', dataStartX, dataY)
      
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
      dataY += styles.betweenSections
    }

    // Sun Data section
    if (filters.sun && photo.exifData.sun) {
      
      dataY = addDataSectionHeader('Sun Data', dataStartX, dataY)
      
      dataY = addDataRow('Sunrise', formatSunTime(photo.exifData.sun.sunrise), dataStartX, dataY)
      dataY = addDataRow('Sunset', formatSunTime(photo.exifData.sun.sunset), dataStartX, dataY)
      dataY = addDataRow('Solar Noon', formatSunTime(photo.exifData.sun.solarNoon), dataStartX, dataY)
      dataY = addDataRow('Day Length', `${Math.floor(photo.exifData.sun.dayLength / 60)}h ${photo.exifData.sun.dayLength % 60}m`, dataStartX, dataY)
      dataY = addDataRow('Sun Position', formatSunPosition(photo.exifData.sun.sunPosition.azimuth, photo.exifData.sun.sunPosition.altitude), dataStartX, dataY)
      dataY = addDataRow('Time of Day', photo.exifData.sun.isDaytime ? 'Daytime' : 'Nighttime', dataStartX, dataY)
      dataY += styles.betweenSections
    }

    // Image section
    if (filters.image && photo.exifData.image) {
      
      dataY = addDataSectionHeader('Image', dataStartX, dataY)
      
      if (photo.exifData.image.width && photo.exifData.image.height) {
        dataY = addDataRow('Dimensions', `${photo.exifData.image.width} x ${photo.exifData.image.height}`, dataStartX, dataY)
      }
      if (photo.exifData.image.xResolution && photo.exifData.image.yResolution) {
        dataY = addDataRow('Resolution', `${photo.exifData.image.xResolution} x ${photo.exifData.image.yResolution} DPI`, dataStartX, dataY)
      }
      if (photo.exifData.image.orientation) {
        dataY = addDataRow('Orientation', photo.exifData.image.orientation.toString(), dataStartX, dataY)
      }
      dataY += styles.betweenSections
    }

    // Move to the next line after the image and data
    // Use global spacing between photos
    currentY = Math.max(imageBottomY, dataY) + styles.photoSpacing
  }

  // Generate PDF blob and create zip file
  const pdfBlob = pdf.output('blob')
  await createZipFile(photos, pdfBlob, customTitle)
}