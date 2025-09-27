'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Plus, Trash2, Eye, Camera, MapPin, FileText } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Project {
  id: string;
  title: string;
  locations: Location[];
}

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

function NewProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  
  const [formData, setFormData] = useState({
    title: '',
    introMd: '',
    outroMd: '',
    projectId: projectId,
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setFormData(prev => ({ ...prev, projectId }));
      }
    }
  }, [projectId, projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLocationToProposal = (location: Location) => {
    const newItem: ProposalItem = {
      id: `temp-${Date.now()}`,
      locationId: location.id,
      location,
      selectedPhotoIds: [],
      order: proposalItems.length,
    };
    setProposalItems(prev => [...prev, newItem]);
  };

  const removeLocationFromProposal = (itemId: string) => {
    setProposalItems(prev => prev.filter(item => item.id !== itemId));
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(proposalItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setProposalItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.projectId || proposalItems.length === 0) {
      setError('Please fill in all required fields and add at least one location');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: proposalItems.map(item => ({
            locationId: item.locationId,
            selectedPhotoIds: item.selectedPhotoIds,
            order: item.order,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }

      const data = await response.json();
      router.push(`/proposals/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      setError(error instanceof Error ? error.message : 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-lg font-semibold">Create New Proposal</h1>
            <p className="text-sm text-muted-foreground">Build a proposal with locations and photos</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create Proposal'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Proposal Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Wedding Photography Proposal"
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
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setSelectedProject(project || null);
                    handleInputChange('projectId', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="intro" className="text-sm font-medium text-foreground">
                Introduction
              </label>
              <textarea
                id="intro"
                value={formData.introMd}
                onChange={(e) => handleInputChange('introMd', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Welcome message or introduction for your proposal..."
              />
            </div>
          </div>

          {/* Location Selection */}
          {selectedProject && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Select Locations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProject.locations.map((location) => {
                  const isAdded = proposalItems.some(item => item.locationId === location.id);
                  
                  return (
                    <div
                      key={location.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isAdded
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 cursor-pointer'
                      }`}
                      onClick={() => !isAdded && addLocationToProposal(location)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{location.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Camera className="h-3 w-3" />
                            <span>{location.photos.length}</span>
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

                        {isAdded && (
                          <div className="flex items-center gap-2 text-xs text-primary">
                            <span>✓ Added to proposal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proposal Items */}
          {proposalItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Proposal Content</h2>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="proposal-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {proposalItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 border border-border rounded-lg bg-card ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="space-y-4">
                                {/* Item Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="p-1 hover:bg-muted rounded cursor-grab"
                                    >
                                      <div className="w-1 h-6 bg-muted-foreground/30 rounded"></div>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">{item.location.title}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {item.location.address}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeLocationFromProposal(item.id)}
                                    className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Photo Selection */}
                                {item.location.photos.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-medium">
                                      Select Photos ({item.selectedPhotoIds.length} selected)
                                    </h4>
                                    
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                      {item.location.photos.map((photo) => {
                                        const isSelected = item.selectedPhotoIds.includes(photo.id);
                                        
                                        return (
                                          <button
                                            key={photo.id}
                                            type="button"
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
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {/* Conclusion */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Conclusion</h2>
            
            <div className="space-y-2">
              <label htmlFor="outro" className="text-sm font-medium text-foreground">
                Closing Message
              </label>
              <textarea
                id="outro"
                value={formData.outroMd}
                onChange={(e) => handleInputChange('outroMd', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Thank you message or call to action..."
              />
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
        </form>
      </main>
    </div>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProposalContent />
    </Suspense>
  );
}
