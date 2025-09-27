'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Eye, ArrowUp, ArrowDown } from 'lucide-react';

interface Location {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  timezone: string;
  tags: string[];
  photos: Photo[];
}

interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  takenAt: string;
  order: number;
}

interface ProposalItem {
  id: string;
  locationId: string;
  location: Location;
  selectedPhotoIds: string[];
  order: number;
}

interface ProposalBuilderProps {
  locations: Location[];
  initialItems?: ProposalItem[];
  onSave?: (items: ProposalItem[]) => void;
  onPreview?: () => void;
  className?: string;
}

export default function ProposalBuilder({
  locations,
  initialItems = [],
  onSave,
  onPreview,
  className = ''
}: ProposalBuilderProps) {
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>(initialItems);
  const [availableLocations, setAvailableLocations] = useState<Location[]>(
    locations.filter(loc => !initialItems.some(item => item.locationId === loc.id))
  );

  const addLocationToProposal = (location: Location) => {
    const newItem: ProposalItem = {
      id: `temp-${Date.now()}`,
      locationId: location.id,
      location,
      selectedPhotoIds: [],
      order: proposalItems.length,
    };

    setProposalItems(prev => [...prev, newItem]);
    setAvailableLocations(prev => prev.filter(loc => loc.id !== location.id));
  };

  const removeLocationFromProposal = (itemId: string) => {
    const item = proposalItems.find(item => item.id === itemId);
    if (item) {
      setProposalItems(prev => prev.filter(item => item.id !== itemId));
      setAvailableLocations(prev => [...prev, item.location]);
    }
  };

  const togglePhotoSelection = (itemId: string, photoId: string) => {
    setProposalItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isSelected = item.selectedPhotoIds.includes(photoId);
        return {
          ...item,
          selectedPhotoIds: isSelected
            ? item.selectedPhotoIds.filter(id => id !== photoId)
            : [...item.selectedPhotoIds, photoId],
        };
      }
      return item;
    }));
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    setProposalItems(prev => {
      const items = [...prev];
      const currentIndex = items.findIndex(item => item.id === itemId);
      
      if (direction === 'up' && currentIndex > 0) {
        [items[currentIndex], items[currentIndex - 1]] = [items[currentIndex - 1], items[currentIndex]];
      } else if (direction === 'down' && currentIndex < items.length - 1) {
        [items[currentIndex], items[currentIndex + 1]] = [items[currentIndex + 1], items[currentIndex]];
      }

      // Update order values
      return items.map((item, index) => ({ ...item, order: index }));
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(proposalItems);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Proposal Builder</h2>
          <p className="text-sm text-muted-foreground">
            {proposalItems.length} locations selected
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {onPreview && (
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}
          
          {onSave && (
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Available Locations */}
      {availableLocations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Available Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableLocations.map((location) => (
              <div
                key={location.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => addLocationToProposal(location)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium group-hover:text-primary transition-colors">
                      {location.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{location.photos.length} photos</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {location.address}
                  </p>

                  {location.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {location.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {location.tags.length > 2 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                          +{location.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Click to add</span>
                    <Plus className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Locations */}
      {proposalItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selected Locations</h3>
          <div className="space-y-4">
            {proposalItems.map((item, index) => (
              <div key={item.id} className="p-4 border border-border rounded-lg bg-card">
                <div className="space-y-4">
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveItem(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveItem(item.id, 'down')}
                          disabled={index === proposalItems.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">
                          {index + 1}. {item.location.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.location.address}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeLocationFromProposal(item.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Photo Selection */}
                  {item.location.photos.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium">
                        Select Photos ({item.selectedPhotoIds.length} selected)
                      </h5>
                      
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {item.location.photos.map((photo) => {
                          const isSelected = item.selectedPhotoIds.includes(photo.id);
                          
                          return (
                            <button
                              key={photo.id}
                              onClick={() => togglePhotoSelection(item.id, photo.id)}
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/20'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img
                                src={photo.thumbUrl || photo.url}
                                alt={`Photo from ${item.location.title}`}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                                    ✓
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
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
      )}

      {/* Empty State */}
      {proposalItems.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No locations selected</h3>
          <p className="text-sm text-muted-foreground">
            Choose locations from above to build your proposal
          </p>
        </div>
      )}
    </div>
  );
}
