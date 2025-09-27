import { chromium } from 'playwright';
import { supabaseAdmin } from './supabase';

export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  scale?: number;
  preferCSSPageSize?: boolean;
}

export interface PDFResult {
  buffer: Buffer;
  size: number;
  url?: string;
  error?: string;
}

/**
 * Render a proposal PDF from a print URL using Playwright
 * @param printUrl - The URL of the print page to render
 * @param options - PDF generation options
 * @returns Promise<PDFResult> - PDF buffer and metadata
 */
export async function renderProposalPdf(
  printUrl: string,
  options: PDFGenerationOptions = {}
): Promise<PDFResult> {
  let browser;
  
  try {
    // Default options for proposal PDFs
    const defaultOptions: PDFGenerationOptions = {
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
      displayHeaderFooter: false,
      printBackground: true,
      scale: 1,
      preferCSSPageSize: false,
    };

    const pdfOptions = { ...defaultOptions, ...options };

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Mozilla/5.0 (compatible; LocationManager-PDF-Generator/1.0)',
    });

    const page = await context.newPage();

    // Set timeout for page load
    await page.setDefaultTimeout(30000);

    // Navigate to the print page
    console.log(`Generating PDF from: ${printUrl}`);
    await page.goto(printUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);

    // Ensure all images are loaded
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    }, { timeout: 10000 }).catch(() => {
      console.warn('Some images may not have loaded completely');
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: pdfOptions.format,
      landscape: pdfOptions.orientation === 'landscape',
      margin: pdfOptions.margin,
      displayHeaderFooter: pdfOptions.displayHeaderFooter,
      headerTemplate: pdfOptions.headerTemplate,
      footerTemplate: pdfOptions.footerTemplate,
      printBackground: pdfOptions.printBackground,
      scale: pdfOptions.scale,
      preferCSSPageSize: pdfOptions.preferCSSPageSize,
      tagged: true, // Enable accessibility tags
    });

    await browser.close();

    return {
      buffer: pdfBuffer,
      size: pdfBuffer.length,
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (browser) {
      await browser.close();
    }

    return {
      buffer: Buffer.alloc(0),
      size: 0,
      error: error instanceof Error ? error.message : 'PDF generation failed',
    };
  }
}

/**
 * Upload PDF to Supabase storage and return public URL
 * @param pdfBuffer - PDF buffer to upload
 * @param filename - Filename for the PDF
 * @param bucket - Storage bucket name (default: 'pdfs')
 * @returns Promise<string> - Public URL of uploaded PDF
 */
export async function uploadPdfToSupabase(
  pdfBuffer: Buffer,
  filename: string,
  bucket: string = 'pdfs'
): Promise<{ url: string; error?: string }> {
  try {
    // Ensure bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { url: '', error: 'Failed to check storage buckets' };
    }

    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        allowedMimeTypes: ['application/pdf'],
      });

      if (createError) {
        console.error('Error creating PDF bucket:', createError);
        return { url: '', error: 'Failed to create PDF storage bucket' };
      }

      console.log(`✅ Created PDF bucket: ${bucket}`);
    }

    // Upload PDF
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return { url: '', error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (error) {
    console.error('PDF upload error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'PDF upload failed',
    };
  }
}

/**
 * Generate PDF for a proposal and store it in Supabase
 * @param proposalSlug - Slug of the proposal
 * @param proposalId - ID of the proposal
 * @param baseUrl - Base URL of the application
 * @param options - PDF generation options
 * @returns Promise<{ url: string; error?: string }> - Public URL of generated PDF
 */
export async function generateProposalPdf(
  proposalSlug: string,
  proposalId: string,
  baseUrl: string,
  options?: PDFGenerationOptions
): Promise<{ url: string; error?: string }> {
  try {
    const printUrl = `${baseUrl}/p/${proposalSlug}/print`;
    
    // Generate PDF
    const pdfResult = await renderProposalPdf(printUrl, options);
    
    if (pdfResult.error) {
      return { url: '', error: pdfResult.error };
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `proposals/${proposalId}/${proposalSlug}-${timestamp}.pdf`;

    // Upload to Supabase
    const uploadResult = await uploadPdfToSupabase(pdfResult.buffer, filename);

    if (uploadResult.error) {
      return { url: '', error: uploadResult.error };
    }

    console.log(`✅ Generated PDF: ${filename} (${pdfResult.size} bytes)`);
    return { url: uploadResult.url };

  } catch (error) {
    console.error('Proposal PDF generation error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'PDF generation failed',
    };
  }
}

/**
 * Delete PDF from Supabase storage
 * @param filename - Filename to delete
 * @param bucket - Storage bucket name (default: 'pdfs')
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function deletePdfFromSupabase(
  filename: string,
  bucket: string = 'pdfs'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filename]);

    if (error) {
      console.error('PDF deletion error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('PDF deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF deletion failed',
    };
  }
}
