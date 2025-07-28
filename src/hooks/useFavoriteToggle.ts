"use client";

import { useState } from "react";

interface UseFavoriteToggleReturn {
  toggleFavorite: (playlistId: string, currentFavorite: boolean) => Promise<boolean>;
  isToggling: (playlistId: string) => boolean;
}

export function useFavoriteToggle(): UseFavoriteToggleReturn {
  const [togglingStates, setTogglingStates] = useState<Record<string, boolean>>({});

  const toggleFavorite = async (playlistId: string, currentFavorite: boolean): Promise<boolean> => {
    setTogglingStates(prev => ({ ...prev, [playlistId]: true }));

    try {
      const response = await fetch(`/api/playlists/${playlistId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_favorite: !currentFavorite,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    } finally {
      setTogglingStates(prev => ({ ...prev, [playlistId]: false }));
    }
  };

  const isToggling = (playlistId: string): boolean => {
    return togglingStates[playlistId] || false;
  };

  return {
    toggleFavorite,
    isToggling,
  };
} 