import sharp from 'sharp';

interface WatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  margin?: number;
}

export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions
): Promise<Buffer> {
  const {
    text,
    opacity = 0.7,
    fontSize = 24,
    color = 'white',
    position = 'bottom-right',
    margin = 20,
  } = options;

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const { width = 0, height = 0 } = metadata;

  // Calculate text dimensions (approximate)
  const textWidth = text.length * (fontSize * 0.6);
  const textHeight = fontSize + 10;

  // Calculate position based on placement
  let x = margin;
  let y = height - textHeight - margin;

  switch (position) {
    case 'bottom-left':
      x = margin;
      y = height - textHeight - margin;
      break;
    case 'bottom-right':
      x = width - textWidth - margin;
      y = height - textHeight - margin;
      break;
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = width - textWidth - margin;
      y = margin;
      break;
    case 'center':
      x = Math.floor((width - textWidth) / 2);
      y = Math.floor((height - textHeight) / 2);
      break;
  }

  // Ensure coordinates are within bounds
  x = Math.max(0, Math.min(x, width - textWidth));
  y = Math.max(0, Math.min(y, height - textHeight));

  // Create watermark text SVG
  const svg = `
    <svg width="${width}" height="${height}">
      <text
        x="${x}"
        y="${y + fontSize}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${color}"
        opacity="${opacity}"
        text-shadow="2px 2px 4px rgba(0,0,0,0.8)"
      >
        ${text}
      </text>
    </svg>
  `;

  // Apply watermark to image
  const watermarkedImage = await sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return watermarkedImage;
}

export async function addWatermarkToPublicImage(
  imageUrl: string,
  watermarkText: string
): Promise<string> {
  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Add watermark
    const watermarkedBuffer = await addWatermark(imageBuffer, {
      text: watermarkText,
      opacity: 0.6,
      fontSize: 20,
      color: 'white',
      position: 'bottom-right',
    });

    // Convert back to base64 data URL for immediate use
    const base64 = watermarkedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Return original URL if watermarking fails
    return imageUrl;
  }
}

export function shouldWatermarkImage(isPublic: boolean, watermarkEnabled: boolean): boolean {
  return isPublic && watermarkEnabled;
}
