'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface SuggestionCarouselProps {
  suggestions: string[];
  onAddSuggestion: (suggestion: string) => void;
  className?: string;
}

interface CarouselLineProps {
  suggestions: string[];
  direction: 'left' | 'right';
  onAddSuggestion: (suggestion: string) => void;
}

function CarouselLine({ suggestions, direction, onAddSuggestion }: CarouselLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Duplica as sugestões para criar loop infinito
  const duplicatedSuggestions = [...suggestions, ...suggestions];
  
  return (
    <div 
      className="overflow-hidden relative h-12 flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`flex gap-4 items-center whitespace-nowrap ${
          direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
        } ${isHovered ? 'animation-paused' : ''}`}
        style={{
          animationDuration: isHovered ? '20s' : '10s',
        }}
      >
        {duplicatedSuggestions.map((suggestion, index) => (
          <div
            key={`${suggestion}-${index}`}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 transition-colors flex-shrink-0 cursor-pointer group"
            onClick={() => onAddSuggestion(suggestion)}
          >
            <span className="select-none">{suggestion}</span>
            <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestionCarousel({ suggestions, onAddSuggestion, className = '' }: SuggestionCarouselProps) {
  // Divide as sugestões em duas linhas
  const line1Suggestions = suggestions.slice(0, Math.ceil(suggestions.length / 2));
  const line2Suggestions = suggestions.slice(Math.ceil(suggestions.length / 2));
  
  return (
    <div className={`space-y-2 ${className}`}>
      <CarouselLine 
        suggestions={line1Suggestions}
        direction="right"
        onAddSuggestion={onAddSuggestion}
      />
      <CarouselLine 
        suggestions={line2Suggestions}
        direction="left"
        onAddSuggestion={onAddSuggestion}
      />
    </div>
  );
} 