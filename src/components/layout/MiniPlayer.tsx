"use client";

import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Heart,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MiniPlayerProps {
  currentTrack?: {
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: number;
    currentTime: number;
  };
  isPlaying?: boolean;
  volume?: number;
}

export function MiniPlayer({ 
  currentTrack,
  isPlaying = false,
  volume = 75 
}: MiniPlayerProps) {
  // Mock data for now
  const track = currentTrack || {
    title: "Smooth Operator",
    artist: "Sade",
    album: "The Best of Sade",
    artwork: "/api/placeholder/60/60",
    duration: 258,
    currentTime: 142
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-20 bg-white border-t border-gray-200 flex items-center px-6">
      {/* Track Info */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Artwork */}
        <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500"></div>
        </div>
        
        {/* Track Details */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {track.title}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {track.artist}
          </p>
        </div>

        {/* Like Button */}
        <Button variant="ghost" size="sm" className="flex-shrink-0">
          <Heart className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button 
            size="sm" 
            className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-gray-500 min-w-[35px]">
            {formatTime(track.currentTime)}
          </span>
          <Slider
            value={[(track.currentTime / track.duration) * 100]}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 min-w-[35px]">
            {formatTime(track.duration)}
          </span>
        </div>
      </div>

      {/* Volume & Options */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
} 