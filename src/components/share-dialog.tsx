'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Share, Mail, ExternalLink, Download, QrCode } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  proposalSlug: string;
  className?: string;
}

export default function ShareDialog({ 
  isOpen, 
  onClose, 
  proposalTitle, 
  proposalSlug,
  className = '' 
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShareUrl(`${window.location.origin}/p/${proposalSlug}`);
    }
  }, [isOpen, proposalSlug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: proposalTitle,
          text: `Check out this proposal: ${proposalTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Proposal: ${proposalTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share this proposal with you: ${proposalTitle}\n\nYou can view it here: ${shareUrl}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleDownloadPdf = () => {
    // This would trigger the PDF generation
    window.open(`${shareUrl}/print`, '_blank');
  };

  const handleQRCode = () => {
    // This would generate and show a QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    window.open(qrUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-background border border-border rounded-lg shadow-lg max-w-md w-full ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Share Proposal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Proposal Info */}
          <div className="space-y-2">
            <h3 className="font-medium">{proposalTitle}</h3>
            <p className="text-sm text-muted-foreground">Share this proposal with clients and collaborators</p>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Public URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-input rounded-md bg-muted text-foreground text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-md transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600">✓ URL copied to clipboard!</p>
            )}
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Share Options</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Native Share */}
              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Share className="h-5 w-5 text-primary" />
                  <span className="text-sm">Share</span>
                </button>
              )}

              {/* Email */}
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm">Email</span>
              </button>

              {/* PDF Download */}
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Download className="h-5 w-5 text-primary" />
                <span className="text-sm">PDF</span>
              </button>

              {/* QR Code */}
              <button
                onClick={handleQRCode}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <QrCode className="h-5 w-5 text-primary" />
                <span className="text-sm">QR Code</span>
              </button>
            </div>
          </div>

          {/* Preview Link */}
          <div className="pt-4 border-t border-border">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
              Preview public page
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Anyone with this link can view the proposal
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
