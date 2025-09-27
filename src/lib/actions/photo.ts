'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getSignedUrl } from '@/lib/supabase';
import sharp from 'sharp';
import exifr from 'exifr';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export interface PhotoUploadResult {
  success: boolean;
  photo?: {
    id: string;
    url: string;
    thumbUrl: string;
    takenAt: Date;
    lat?: number;
    lng?: number;
  };
  error?: string;
}

export async function processPhotoUpload(
  originalUrl: string,
  locationId: string,
  order: number = 0
): Promise<PhotoUploadResult> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify location belongs to user
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: session.user.id,
      },
    });

    if (!location) {
      return { success: false, error: 'Location not found' };
    }

    // Download the original image
    const imageResponse = await fetch(originalUrl);
    if (!imageResponse.ok) {
      return { success: false, error: 'Failed to download image' };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Extract EXIF data
    const exifData = await exifr.parse(buffer, {
      gps: true,
      ifd0: true,
      ifd1: true,
      exif: true,
      gps: true,
    });

    // Extract datetime from EXIF or use current time
    let takenAt = new Date();
    if (exifData?.DateTimeOriginal) {
      takenAt = new Date(exifData.DateTimeOriginal);
    } else if (exifData?.CreateDate) {
      takenAt = new Date(exifData.CreateDate);
    } else if (exifData?.ModifyDate) {
      takenAt = new Date(exifData.ModifyDate);
    }

    // Extract GPS coordinates
    let lat: number | undefined;
    let lng: number | undefined;
    if (exifData?.latitude && exifData?.longitude) {
      lat = exifData.latitude;
      lng = exifData.longitude;
    }

    // Generate thumbnail using Sharp
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to Supabase
    const thumbnailPath = originalUrl.replace(/\/[^/]+$/, '/thumb_') + originalUrl.split('/').pop();
    
    // For now, we'll use the original URL for thumbnail
    // In a real implementation, you'd upload the thumbnail buffer to Supabase
    const thumbUrl = originalUrl; // TODO: Upload thumbnail to separate path

    // Save photo to database
    const photo = await prisma.photo.create({
      data: {
        locationId,
        url: originalUrl,
        thumbUrl,
        takenAt,
        exifJson: exifData || null,
        lat: lat ? lat : null,
        lng: lng ? lng : null,
        order,
      },
    });

    // Revalidate the location page
    revalidatePath(`/locations/${locationId}`);

    return {
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        thumbUrl: photo.thumbUrl || photo.url,
        takenAt: photo.takenAt,
        lat: photo.lat ? Number(photo.lat) : undefined,
        lng: photo.lng ? Number(photo.lng) : undefined,
      },
    };
  } catch (error) {
    console.error('Photo processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deletePhoto(photoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify photo belongs to user's location
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        location: {
          userId: session.user.id,
        },
      },
      include: {
        location: true,
      },
    });

    if (!photo) {
      return { success: false, error: 'Photo not found' };
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId },
    });

    // TODO: Delete files from Supabase storage
    // await deleteFile(photo.url);
    // if (photo.thumbUrl) await deleteFile(photo.thumbUrl);

    // Revalidate the location page
    revalidatePath(`/locations/${photo.location.id}`);

    return { success: true };
  } catch (error) {
    console.error('Photo deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function reorderPhotos(
  photoIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify all photos belong to user
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        location: {
          userId: session.user.id,
        },
      },
    });

    if (photos.length !== photoIds.length) {
      return { success: false, error: 'Some photos not found' };
    }

    // Update order for each photo
    await Promise.all(
      photoIds.map((photoId, index) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { order: index },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error('Photo reorder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
