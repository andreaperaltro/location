'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  locationId: string;
  onUploadComplete: (result: { success: boolean; photo?: any; error?: string }) => void;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

export default function PhotoUpload({ 
  locationId, 
  onUploadComplete, 
  maxPhotos = 50,
  currentPhotoCount = 0 
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingPhotos = maxPhotos - currentPhotoCount;
  const canUpload = remainingPhotos > 0;

  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 2, // Compress to max 2MB
        maxWidthOrHeight: 2048, // Max width or height
        useWebWorker: true,
        fileType: 'image/jpeg',
        quality: 0.8,
      };

      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      // Return original file if compression fails
      return file;
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Compress image
      setUploadProgress(10);
      const compressedFile = await compressImage(file);
      setUploadProgress(30);

      // Generate file path
      const timestamp = Date.now();
      const extension = compressedFile.name.split('.').pop();
      const filename = `${timestamp}_${compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `users/${locationId}/photos/${filename}`;

      // Upload to Supabase
      setUploadProgress(50);
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('path', path);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(70);

      // Process photo with server action
      const processResponse = await fetch('/api/photo/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: uploadData.url,
          locationId,
          order: currentPhotoCount,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Photo processing failed');
      }

      const processData = await processResponse.json();
      setUploadProgress(100);

      onUploadComplete(processData);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      onUploadComplete({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canUpload) return;
    
    const file = acceptedFiles[0];
    if (file) {
      uploadFile(file);
    }
  }, [canUpload, currentPhotoCount]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: false,
    disabled: !canUpload || isUploading,
  });

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  if (!canUpload) {
    return (
      <div className="p-6 border border-border rounded-lg bg-muted/50 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Maximum photos reached ({maxPhotos})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-3">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading photo...</p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center space-x-4">
                <Camera className="h-8 w-8 text-primary" />
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  {isDragActive ? 'Drop photo here' : 'Upload Photos'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap to select or drag & drop
                </p>
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="inline-flex items-center px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3 w-3 mr-1" />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Gallery
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          {remainingPhotos} of {maxPhotos} photos remaining
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Use the camera button for best mobile experience</p>
        <p>• Photos are automatically compressed to save space</p>
        <p>• EXIF data (GPS, date/time) is preserved when available</p>
      </div>
    </div>
  );
}
