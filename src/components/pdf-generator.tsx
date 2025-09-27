'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface PdfGeneratorProps {
  proposalId: string;
  proposalTitle: string;
  className?: string;
}

export default function PdfGenerator({ proposalId, proposalTitle, className = '' }: PdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedUrl(null);

      const response = await fetch(`/api/proposals/${proposalId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      setGeneratedUrl(data.url);
      
      // Automatically download the PDF
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `${proposalTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('PDF generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={generatePdf}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
        </button>

        {generatedUrl && (
          <a
            href={generatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-destructive hover:text-destructive/80 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Generating PDF... This may take a few moments.
          </p>
        </div>
      )}

      {generatedUrl && !isGenerating && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✅ PDF generated successfully! Click the download button to save it.
          </p>
        </div>
      )}
    </div>
  );
}
