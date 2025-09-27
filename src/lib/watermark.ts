// Client-side watermarking utility that calls the server-side API
export async function addWatermarkToPublicImage(
  imageUrl: string,
  watermarkText: string
): Promise<string> {
  try {
    const response = await fetch('/api/watermark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        watermarkText,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to apply watermark');
    }

    const data = await response.json();
    return data.watermarkedImageUrl;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Return original URL if watermarking fails
    return imageUrl;
  }
}

export function shouldWatermarkImage(isPublic: boolean, watermarkEnabled: boolean): boolean {
  return isPublic && watermarkEnabled;
}
