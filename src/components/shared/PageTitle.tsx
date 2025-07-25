"use client";

import { useEffect } from 'react';
import { pageTitles } from '@/lib/page-titles';

interface PageTitleProps {
  title: string | keyof typeof pageTitles;
  playlistTitle?: string;
}

export function PageTitle({ title, playlistTitle }: PageTitleProps) {
  useEffect(() => {
    let pageTitle: string;
    
    if (typeof title === 'string') {
      pageTitle = title;
    } else if (title === 'playlist' && playlistTitle) {
      pageTitle = pageTitles.playlist(playlistTitle);
    } else {
      pageTitle = pageTitles[title];
    }
    
    document.title = pageTitle;
  }, [title, playlistTitle]);

  return null;
} 