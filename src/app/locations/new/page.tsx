'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, MapPin, Tag, FileText, Camera } from 'lucide-react';
import PhotoUpload from '@/components/photo-upload';
import MapPreview from '@/components/map-preview';

interface LocationFormData {
  title: string;
  address: string;
  lat: number;
  lng: number;
  timezone: string;
  notes: string;
  tags: string[];
  projectId: string;
}

export default function NewLocationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<LocationFormData>({
    title: '',
    address: '',
    lat: 0,
    lng: 0,
    timezone: 'UTC',
    notes: '',
    tags: [],
    projectId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);

  const handleInputChange = (field: keyof LocationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handlePhotoUpload = (result: { success: boolean; photo?: any; error?: string }) => {
    if (result.success && result.photo) {
      setPhotos(prev => [...prev, result.photo]);
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.address || !formData.projectId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          photos: photos.map(photo => photo.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }

      const data = await response.json();
      router.push(`/locations/${data.id}`);
    } catch (error) {
      console.error('Error creating location:', error);
      setError(error instanceof Error ? error.message : 'Failed to create location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeocode = async () => {
    if (!formData.address) {
      setError('Please enter an address first');
      return;
    }

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
      const data = await response.json();
      
      if (data.lat && data.lng) {
        setFormData(prev => ({
          ...prev,
          lat: data.lat,
          lng: data.lng,
        }));
      } else {
        setError('Could not find coordinates for this address');
      }
    } catch (error) {
      setError('Failed to geocode address');
    }
  };

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
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Create New Location</h1>
            <p className="text-sm text-muted-foreground">Add a new shooting location</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Location Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Downtown Plaza, Beach Sunset Point"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium text-foreground">
                  Project *
                </label>
                <select
                  id="project"
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select a project</option>
                  {/* TODO: Fetch projects from API */}
                  <option value="test-project">Sample Project</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-foreground">
                Address *
              </label>
              <div className="flex gap-2">
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter full address"
                  required
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Get Coordinates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="lat" className="text-sm font-medium text-foreground">
                  Latitude
                </label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => handleInputChange('lat', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="34.0522"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lng" className="text-sm font-medium text-foreground">
                  Longitude
                </label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => handleInputChange('lng', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="-118.2437"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="timezone" className="text-sm font-medium text-foreground">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          {formData.lat !== 0 && formData.lng !== 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Map Preview</h2>
              <MapPreview
                lat={formData.lat}
                lng={formData.lng}
                title={formData.title}
                address={formData.address}
                size="medium"
                showTitle={false}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </h2>
            
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder="Add any additional notes about this location..."
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos
            </h2>
            <PhotoUpload
              locationId="temp" // Will be updated after location creation
              onUploadComplete={handlePhotoUpload}
              currentPhotoCount={photos.length}
              maxPhotos={50}
            />
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
        </form>
      </main>
    </div>
  );
}
