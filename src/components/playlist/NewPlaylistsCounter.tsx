"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface NewPlaylistsCounterProps {
  className?: string;
}

export function NewPlaylistsCounter({ className }: NewPlaylistsCounterProps) {
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewPlaylistsCount = async () => {
      try {
        const response = await fetch('/api/playlists/user?limit=100');
        
        if (response.ok) {
          const data = await response.json();
          const newPlaylists = data.playlists?.filter((playlist: any) => 
            playlist.status === 'published' && !playlist.viewed_at
          ) || [];
          
          setNewCount(newPlaylists.length);
        }
      } catch (error) {
        console.error('Error fetching new playlists count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewPlaylistsCount();
  }, []);

  if (loading) {
    return null;
  }

  if (newCount === 0) {
    return null;
  }

  return (
    <Badge 
      className={`bg-green-500 hover:bg-green-600 text-white animate-pulse ${className}`}
    >
      <Sparkles className="w-3 h-3 mr-1" />
      {newCount} {newCount === 1 ? 'nova' : 'novas'}
    </Badge>
  );
} 