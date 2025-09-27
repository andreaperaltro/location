import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client with service role key (for server-only operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Bucket management
export const BUCKET_NAME = 'photos';

export async function ensureBucketExists() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false, // Private bucket for security
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log(`✅ Created bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`✅ Bucket already exists: ${BUCKET_NAME}`);
    }

    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}

// Upload a photo file to Supabase storage
export async function uploadPhoto(file: File, path: string): Promise<{ url: string; error?: string }> {
  try {
    // Ensure bucket exists
    const bucketExists = await ensureBucketExists();
    if (!bucketExists) {
      return { url: '', error: 'Failed to ensure bucket exists' };
    }

    // Upload file
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: 'Upload failed' };
  }
}

// Get a signed URL for private file access
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

// Delete a file from storage
export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Delete failed' };
  }
}

// List files in a folder
export async function listFiles(folderPath: string = ''): Promise<{ data: any[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(folderPath);

    if (error) {
      console.error('List error:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('List error:', error);
    return { data: [], error: 'List failed' };
  }
}

// Get file info
export async function getFileInfo(path: string): Promise<{ data: any; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error) {
      console.error('File info error:', error);
      return { data: null, error: error.message };
    }

    const file = data?.find(item => item.name === path.split('/').pop());
    return { data: file || null };
  } catch (error) {
    console.error('File info error:', error);
    return { data: null, error: 'Get file info failed' };
  }
}
