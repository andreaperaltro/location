'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, MapPin, Camera, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  client?: {
    name: string;
  };
  locations: {
    id: string;
    title: string;
    photos: { id: string }[];
  }[];
  proposals: {
    id: string;
    title: string;
    status: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    // Temporarily allow access without authentication
    // TODO: Re-enable authentication when database is configured
    fetchProjects();
  }, [session, status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
            onClick={fetchProjects}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalLocations = projects.reduce((sum, project) => sum + project.locations.length, 0);
  const totalPhotos = projects.reduce((sum, project) => 
    sum + project.locations.reduce((locSum, location) => locSum + location.photos.length, 0), 0
  );
  const totalProposals = projects.reduce((sum, project) => sum + project.proposals.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Location Manager</h1>
              <p className="text-sm text-muted-foreground">
                Welcome to Location Manager
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{totalLocations}</p>
                <p className="text-sm text-muted-foreground">Locations</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{totalPhotos}</p>
                <p className="text-sm text-muted-foreground">Photos</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{totalProposals}</p>
                <p className="text-sm text-muted-foreground">Proposals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
            <Link
              href="/locations/new"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start managing locations and proposals
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        {project.client && (
                          <p className="text-sm text-muted-foreground">
                            Client: {project.client.name}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : project.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {project.locations.length} locations
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.proposals.length} proposals
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}