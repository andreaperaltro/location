import { getSignedUrl } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  error?: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresIn: number;
  error?: string;
}

/**
 * Upload a file to Supabase storage via our API
 */
export async function uploadPhoto(file: File, path: string): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        url: '',
        path: '',
        size: 0,
        type: '',
        error: data.error || 'Upload failed'
      };
    }

    return {
      url: data.url,
      path: data.path,
      size: data.size,
      type: data.type
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      path: '',
      size: 0,
      type: '',
      error: 'Network error during upload'
    };
  }
}

/**
 * Get a signed URL for private file access via our API
 */
export async function getPhotoSignedUrl(path: string, expiresIn: number = 3600): Promise<SignedUrlResult> {
  try {
    const response = await fetch('/api/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, expiresIn }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        signedUrl: '',
        expiresIn: 0,
        error: data.error || 'Failed to get signed URL'
      };
    }

    return {
      signedUrl: data.signedUrl,
      expiresIn: data.expiresIn
    };
  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      signedUrl: '',
      expiresIn: 0,
      error: 'Network error getting signed URL'
    };
  }
}

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(userId: string, locationId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `users/${userId}/locations/${locationId}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Generate a thumbnail path for an image
 */
export function generateThumbnailPath(originalPath: string): string {
  const pathParts = originalPath.split('/');
  const filename = pathParts.pop();
  const extension = filename?.split('.').pop();
  const nameWithoutExt = filename?.replace(/\.[^/.]+$/, '');
  
  if (!filename || !nameWithoutExt || !extension) {
    throw new Error('Invalid file path for thumbnail generation');
  }
  
  pathParts.push(`${nameWithoutExt}_thumb.${extension}`);
  return pathParts.join('/');
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
    };
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 50MB.'
    };
  }

  return { valid: true };
}
