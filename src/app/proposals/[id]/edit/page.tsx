'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Eye, Share, FileText, Download, MapPin, Camera, Shield, Image as ImageIcon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import PdfGenerator from '@/components/pdf-generator';

interface Proposal {
  id: string;
  title: string;
  introMd: string;
  outroMd: string;
  status: string;
  slug: string;
  watermarkText?: string;
  watermarkEnabled: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  project: {
    id: string;
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
    tags: string[];
    photos: Photo[];
  };
  selectedPhotoIds: string[];
}

interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  takenAt: string;
  order: number;
}

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const proposalId = params.id as string;

  useEffect(() => {
    if (!session) {
      router.push('/signin');
      return;
    }

    fetchProposal();
  }, [session, proposalId]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Proposal not found');
        }
        throw new Error('Failed to fetch proposal');
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

  const handleInputChange = (field: string, value: string | boolean) => {
    if (!proposal) return;
    setProposal({ ...proposal, [field]: value });
  };

  const handleSave = async () => {
    if (!proposal) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: proposal.title,
          introMd: proposal.introMd,
          outroMd: proposal.outroMd,
          status: proposal.status,
          watermarkText: proposal.watermarkText,
          watermarkEnabled: proposal.watermarkEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save proposal');
      }

      // Show success message (you might want to use a toast library)
      console.log('Proposal saved successfully');
    } catch (error) {
      console.error('Error saving proposal:', error);
      setError(error instanceof Error ? error.message : 'Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!proposal) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...proposal,
          status: 'PUBLISHED',
          watermarkText: proposal.watermarkText,
          watermarkEnabled: proposal.watermarkEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish proposal');
      }

      const data = await response.json();
      setProposal(data);
      console.log('Proposal published successfully');
    } catch (error) {
      console.error('Error publishing proposal:', error);
      setError(error instanceof Error ? error.message : 'Failed to publish proposal');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Proposal not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{proposal.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                proposal.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {proposal.status}
              </span>
              <span>•</span>
              <span>{proposal.items.length} locations</span>
              <span>•</span>
              <span>{formatDate(proposal.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {proposal.status === 'PUBLISHED' && (
              <>
                <Link
                  href={`/p/${proposal.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4" />
                  View Public
                </Link>
                <PdfGenerator
                  proposalId={proposal.id}
                  proposalTitle={proposal.title}
                  className="text-sm"
                />
              </>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            {proposal.status === 'DRAFT' && (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Share className="h-4 w-4" />
                Publish
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Proposal Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={proposal.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="intro" className="block text-sm font-medium text-foreground mb-2">
                  Introduction
                </label>
                <textarea
                  id="intro"
                  value={proposal.introMd}
                  onChange={(e) => handleInputChange('introMd', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6}
                  placeholder="Welcome message or introduction..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="outro" className="block text-sm font-medium text-foreground mb-2">
                  Conclusion
                </label>
                <textarea
                  id="outro"
                  value={proposal.outroMd}
                  onChange={(e) => handleInputChange('outroMd', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6}
                  placeholder="Thank you message or call to action..."
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-2">Project Information</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Project:</strong> {proposal.project.title}
                </p>
                {proposal.project.client && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Client:</strong> {proposal.project.client.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Public URL:</strong>{' '}
                  <Link
                    href={`/p/${proposal.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    /p/{proposal.slug}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Watermark Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Watermark Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="watermarkEnabled"
                  checked={proposal.watermarkEnabled}
                  onChange={(e) => handleInputChange('watermarkEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="watermarkEnabled" className="text-sm font-medium text-foreground">
                  Enable watermark on public photos
                </label>
              </div>

              {proposal.watermarkEnabled && (
                <div>
                  <label htmlFor="watermarkText" className="block text-sm font-medium text-foreground mb-2">
                    Watermark Text
                  </label>
                  <input
                    id="watermarkText"
                    type="text"
                    value={proposal.watermarkText || ''}
                    onChange={(e) => handleInputChange('watermarkText', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Your Company Name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This text will appear as a watermark on all photos in public proposals
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-2">Watermark Preview</h3>
              <div className="aspect-video bg-muted rounded border border-border flex items-center justify-center">
                {proposal.watermarkEnabled && proposal.watermarkText ? (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Sample photo with watermark:</div>
                    <div className="text-lg font-bold text-white bg-black/50 px-3 py-1 rounded">
                      {proposal.watermarkText}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No watermark configured</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Views</h3>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{proposal.viewCount}</p>
              <p className="text-sm text-muted-foreground">Total proposal views</p>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Download className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Downloads</h3>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{proposal.downloadCount}</p>
              <p className="text-sm text-muted-foreground">PDF downloads</p>
            </div>
          </div>

          {proposal.status === 'PUBLISHED' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Analytics are being tracked</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                View and download counts are automatically updated when users interact with your public proposal
              </p>
            </div>
          )}
        </div>

        {/* Proposal Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Proposal Content</h2>
          
          <div className="space-y-6">
            {proposal.items.map((item, index) => (
              <div key={item.id} className="p-6 border border-border rounded-lg bg-card">
                <div className="space-y-4">
                  {/* Location Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {index + 1}. {item.location.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          <span>{item.selectedPhotoIds.length} photos selected</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/locations/${item.location.id}`}
                      className="text-sm text-primary hover:text-primary/80 underline"
                    >
                      Edit Location
                    </Link>
                  </div>

                  {/* Selected Photos */}
                  {item.selectedPhotoIds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Selected Photos
                      </h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {item.location.photos
                          .filter(photo => item.selectedPhotoIds.includes(photo.id))
                          .map((photo) => (
                            <div
                              key={photo.id}
                              className="aspect-square rounded-md overflow-hidden border border-border"
                            >
                              <img
                                src={photo.thumbUrl || photo.url}
                                alt={`Selected photo from ${item.location.title}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Location Tags */}
                  {item.location.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.location.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {proposal.status === 'PUBLISHED' ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Published and accessible to clients
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Draft - not accessible to clients yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {proposal.status === 'PUBLISHED' && (
              <>
                <Link
                  href={`/p/${proposal.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Public Page
                </Link>
                <PdfGenerator
                  proposalId={proposal.id}
                  proposalTitle={proposal.title}
                />
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-destructive hover:text-destructive/80 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
