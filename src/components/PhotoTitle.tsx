'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit2, Save, X, MapPin } from 'lucide-react'

interface PhotoTitleProps {
  title: string
  onTitleChange: (newTitle: string) => void
  isGeocoded: boolean
}

export function PhotoTitle({ title, onTitleChange, isGeocoded }: PhotoTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)

  useEffect(() => {
    setEditValue(title)
  }, [title])

  const handleSave = () => {
    if (editValue.trim()) {
      onTitleChange(editValue.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditValue(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {isGeocoded && (
              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900 flex-1">
                {title}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="h-8 w-8 p-0"
                  disabled={!editValue.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
