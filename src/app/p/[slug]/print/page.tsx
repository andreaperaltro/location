'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Camera, Calendar, Sun, Sunrise, Sunset, Shield } from 'lucide-react';
import { addWatermarkToPublicImage } from '@/lib/watermark';
import { createPublicLocationData, formatCoordinatesForDisplay, shouldShowPrivacyWarning } from '@/lib/location-privacy';

interface Proposal {
  id: string;
  title: string;
  introMd?: string;
  outroMd?: string;
  status: string;
  slug: string;
  createdAt: string;
  watermarkText?: string;
  watermarkEnabled: boolean;
  project: {
    title: string;
    client?: {
      name: string;
    };
  };
  items: ProposalItem[];
}

interface ProposalItem {
  id: string;
  order: number;
  location: {
    id: string;
    title: string;
    address: string;
    lat: number;
    lng: number;
    timezone: string;
    notes?: string;
    tags: string[];
    isPrivate: boolean;
  };
  photos: ProposalPhoto[];
}

interface ProposalPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  takenAt: string;
  lat?: number;
  lng?: number;
  order: number;
}

export default function PrintPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [watermarkedImages, setWatermarkedImages] = useState<Record<string, string>>({});

  const slug = params.slug as string;

  useEffect(() => {
    // Get base URL for absolute links
    setBaseUrl(window.location.origin);
    fetchProposal();
  }, [slug]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.origin}/api/proposals/public/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }

      const data = await response.json();
      setProposal(data);

      // Process watermarked images if watermarking is enabled
      if (data.watermarkEnabled && data.watermarkText) {
        await processWatermarkedImages(data.items);
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setError(error instanceof Error ? error.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const processWatermarkedImages = async (items: ProposalItem[]) => {
    const watermarked: Record<string, string> = {};
    
    for (const item of items) {
      for (const photo of item.photos) {
        if (proposal?.watermarkText) {
          const watermarkedUrl = await addWatermarkToPublicImage(photo.url, proposal.watermarkText);
          watermarked[photo.id] = watermarkedUrl;
        }
      }
    }
    
    setWatermarkedImages(watermarked);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600">{error || 'The requested proposal could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white print:text-black">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-after-page { page-break-after: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
          .print\\:no-print { display: none !important; }
        }
        
        /* Ensure absolute URLs work in PDF */
        a[href^="/"] {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        
        /* Print-friendly styling */
        @media print {
          .shadow-lg { box-shadow: none !important; }
          .border { border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8 print:border-gray-400">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
            <div className="space-y-1 text-gray-600">
              <p><strong>Project:</strong> {proposal.project.title}</p>
              {proposal.project.client && (
                <p><strong>Client:</strong> {proposal.project.client.name}</p>
              )}
              <p><strong>Generated:</strong> {formatDate(proposal.createdAt)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">
              <a href={`${baseUrl}/p/${proposal.slug}`} className="text-blue-600 hover:text-blue-800">
                View Online
              </a>
            </p>
          </div>
        </div>

        {proposal.introMd && (
          <div className="mt-6 prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: proposal.introMd.replace(/\n/g, '<br>') }} />
          </div>
        )}
      </div>

      {/* Proposal Items */}
      <div className="space-y-12">
        {proposal.items.map((item, index) => (
          <div key={item.id} className="print:break-inside-avoid">
            {/* Location Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                Location {index + 1}: {item.location.title}
                {item.location.isPrivate && (
                  <Shield className="h-5 w-5 text-amber-600" />
                )}
              </h2>
              
              {(() => {
                const publicLocation = createPublicLocationData(item.location);
                return (
                  <div className="flex items-start gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{publicLocation.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        {formatCoordinatesForDisplay(item.location.lat, item.location.lng, item.location.isPrivate)}
                      </span>
                    </div>
                  </div>
                );
              })()}
              
              {item.location.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.location.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {item.location.notes && (
                <p className="mt-2 text-gray-600 text-sm">{item.location.notes}</p>
              )}
            </div>

            {/* Photos Grid */}
            {item.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos ({item.photos.length})
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.photos.map((photo) => {
                    const imageUrl = watermarkedImages[photo.id] || photo.url;
                    return (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={`Location photo from ${item.location.title}`}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      
                        {/* Photo Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span>{formatTime(photo.takenAt)}</span>
                            {photo.lat && photo.lng && !item.location.isPrivate && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                GPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                Location Details
                {item.location.isPrivate && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    Private Location
                  </span>
                )}
              </h4>
              
              {(() => {
                const publicLocation = createPublicLocationData(item.location);
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Address:</strong> {publicLocation.address}</p>
                      <p><strong>Coordinates:</strong> {formatCoordinatesForDisplay(item.location.lat, item.location.lng, item.location.isPrivate)}</p>
                    </div>
                    <div>
                      <p><strong>Timezone:</strong> {item.location.timezone}</p>
                      <p><strong>Photo Count:</strong> {item.photos.length}</p>
                    </div>
                  </div>
                );
              })()}
              
              <div className="mt-3">
                {item.location.isPrivate ? (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Exact location hidden for privacy</span>
                  </div>
                ) : (
                  <a
                    href={`https://www.google.com/maps?q=${item.location.lat},${item.location.lng}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Page Break After Each Location (except last) */}
            {index < proposal.items.length - 1 && (
              <div className="print:break-after-page" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {proposal.outroMd && (
        <div className="mt-12 pt-8 border-t border-gray-200 print:border-gray-400">
          <div className="prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: proposal.outroMd.replace(/\n/g, '<br>') }} />
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="mt-12 pt-8 border-t border-gray-200 print:border-gray-400 text-center text-sm text-gray-600">
        <p>
          Generated by <a href={baseUrl} className="text-blue-600 hover:text-blue-800">Location Manager</a>
        </p>
        <p className="mt-1">
          <a href={`${baseUrl}/p/${proposal.slug}`} className="text-blue-600 hover:text-blue-800">
            View this proposal online
          </a>
        </p>
      </div>
    </div>
  );
}
