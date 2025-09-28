/**
 * Image orientation utilities for handling EXIF orientation data
 */

export interface OrientationTransform {
  rotation: number
  scaleX: number
  scaleY: number
}

/**
 * Get CSS transform properties based on EXIF orientation value
 * EXIF orientation values:
 * 1 = Normal (0°)
 * 2 = Flip horizontal
 * 3 = Rotate 180°
 * 4 = Flip vertical
 * 5 = Rotate 90° CCW + flip horizontal
 * 6 = Rotate 90° CW
 * 7 = Rotate 90° CW + flip horizontal
 * 8 = Rotate 90° CCW
 */
export function getOrientationTransform(orientation: number): OrientationTransform {
  switch (orientation) {
    case 1:
      return { rotation: 0, scaleX: 1, scaleY: 1 }
    case 2:
      return { rotation: 0, scaleX: -1, scaleY: 1 }
    case 3:
      return { rotation: 180, scaleX: 1, scaleY: 1 }
    case 4:
      return { rotation: 0, scaleX: 1, scaleY: -1 }
    case 5:
      return { rotation: -90, scaleX: -1, scaleY: 1 }
    case 6:
      return { rotation: 90, scaleX: 1, scaleY: 1 }
    case 7:
      return { rotation: 90, scaleX: -1, scaleY: 1 }
    case 8:
      return { rotation: -90, scaleX: 1, scaleY: 1 }
    default:
      return { rotation: 0, scaleX: 1, scaleY: 1 }
  }
}

/**
 * Get CSS transform string for applying orientation
 */
export function getOrientationCSS(orientation: number): string {
  const transform = getOrientationTransform(orientation)
  return `rotate(${transform.rotation}deg) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
}

/**
 * Check if image needs rotation based on orientation
 */
export function needsRotation(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8
}

/**
 * Get corrected dimensions after applying orientation
 */
export function getCorrectedDimensions(
  width: number, 
  height: number, 
  orientation: number
): { width: number; height: number } {
  if (needsRotation(orientation)) {
    return { width: height, height: width }
  }
  return { width, height }
}

/**
 * Create a canvas with the image properly oriented
 */
export function createOrientedCanvas(
  image: HTMLImageElement, 
  orientation: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  const { width, height } = getCorrectedDimensions(image.width, image.height, orientation)
  canvas.width = width
  canvas.height = height
  
  // Apply the orientation transform
  const transform = getOrientationTransform(orientation)
  
  ctx.save()
  
  // Move to center
  ctx.translate(width / 2, height / 2)
  
  // Apply rotation
  ctx.rotate((transform.rotation * Math.PI) / 180)
  
  // Apply scaling
  ctx.scale(transform.scaleX, transform.scaleY)
  
  // Draw the image centered
  ctx.drawImage(image, -image.width / 2, -image.height / 2)
  
  ctx.restore()
  
  return canvas
}

/**
 * Convert image to properly oriented data URL
 */
export function getOrientedImageDataURL(
  imageUrl: string, 
  orientation: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = createOrientedCanvas(img, orientation)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        resolve(dataUrl)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageUrl
  })
}
