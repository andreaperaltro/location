import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, watermarkText } = await req.json();

    if (!imageUrl || !watermarkText) {
      return NextResponse.json({ error: 'Missing imageUrl or watermarkText' }, { status: 400 });
    }

    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 0, height = 0 } = metadata;

    // Calculate text dimensions (approximate)
    const fontSize = Math.max(16, Math.min(32, Math.floor(width / 20)));
    const textWidth = watermarkText.length * (fontSize * 0.6);
    const textHeight = fontSize + 10;

    // Position watermark in bottom-right corner
    const margin = 20;
    const x = Math.max(0, width - textWidth - margin);
    const y = Math.max(0, height - textHeight - margin);

    // Create watermark text SVG
    const svg = `
      <svg width="${width}" height="${height}">
        <text
          x="${x}"
          y="${y + fontSize}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="white"
          opacity="0.6"
          text-shadow="2px 2px 4px rgba(0,0,0,0.8)"
        >
          ${watermarkText}
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

    // Convert to base64 data URL
    const base64 = watermarkedImage.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({ watermarkedImageUrl: dataUrl });
  } catch (error) {
    console.error('Watermark API error:', error);
    return NextResponse.json(
      { error: 'Failed to apply watermark' },
      { status: 500 }
    );
  }
}
