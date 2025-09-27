'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Camera, Calendar, Sun, Download, Share } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  introMd?: string;
  outroMd?: string;
  status: string;
  slug: string;
  createdAt: string;
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

export default function PublicProposalPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProposalPhoto | null>(null);

  const slug = params.slug as string;

  useEffect(() => {
    fetchProposal();
  }, [slug]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/public/${slug}`);
      
      if (!response.ok) {
        throw new Error('Proposal not found');
      }

      const data = await response.json();
      setProposal(data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setError(error instanceof Error ? error.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: proposal?.title,
          text: `Check out this proposal: ${proposal?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Proposal Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested proposal could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{proposal.title}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {proposal.project.title}
              {proposal.project.client && ` • ${proposal.project.client.name}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            >
              <Share className="h-4 w-4" />
              Share
            </button>
            <a
              href={`/p/${proposal.slug}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Print/PDF
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Introduction */}
        {proposal.introMd && (
          <div className="prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: proposal.introMd.replace(/\n/g, '<br>') }} />
          </div>
        )}

        {/* Proposal Items */}
        <div className="space-y-12">
          {proposal.items.map((item, index) => (
            <div key={item.id} className="space-y-6">
              {/* Location Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  {index + 1}. {item.location.title}
                </h2>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{item.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm">{item.photos.length} photos</span>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              {item.photos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {item.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={photo.url}
                          alt={`Photo from ${item.location.title}`}
                          width={600}
                          height={450}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                      
                      {/* Photo Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="text-white">
                          <div className="flex items-center justify-between text-sm">
                            <span>{formatTime(photo.takenAt)}</span>
                            {photo.lat && photo.lng && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                GPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Location Details */}
              <div className="bg-muted/30 p-6 rounded-lg">
                <h3 className="font-semibold text-foreground mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Address:</strong> {item.location.address}</p>
                    <p><strong>Coordinates:</strong> {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Timezone:</strong> {item.location.timezone}</p>
                    <p><strong>Photo Count:</strong> {item.photos.length}</p>
                  </div>
                </div>
                
                {item.location.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm whitespace-pre-wrap">{item.location.notes}</p>
                  </div>
                )}

                {item.location.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {item.location.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <a
                    href={`https://www.google.com/maps?q=${item.location.lat},${item.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        {proposal.outroMd && (
          <div className="prose prose-gray max-w-none pt-8 border-t border-border">
            <div dangerouslySetInnerHTML={{ __html: proposal.outroMd.replace(/\n/g, '<br>') }} />
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border text-sm text-muted-foreground">
          <p>
            Generated by <a href="/" className="text-primary hover:text-primary/80">Location Manager</a>
          </p>
          <p className="mt-1">
            Created {formatDate(proposal.createdAt)}
          </p>
        </div>
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedPhoto.url}
              alt="Selected photo"
              width={1200}
              height={900}
              className="max-w-full max-h-full object-contain rounded-lg"
              unoptimized
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
