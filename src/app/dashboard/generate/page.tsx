'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Tag {
  id: string;
  label: string;
  category: string;
}

interface GeneratedPlaylist {
  name?: string;
  essay?: string;
  songs?: { title?: string; artist?: string }[];
  album_art?: {
    style_preferences?: string;
    color_preferences?: string;
    image_description?: string;
  }[];
  categorization?: {
    primary_genre?: string;
    subgenre?: string;
    mood?: string;
    years?: string[];
    energy_level?: string;
    tempo?: string;
    dominant_instruments?: string[];
    vocal_style?: string;
    themes?: string[];
  }[];
}

const TAG_CATEGORIES = {
  genre: [
    { id: 'indie-folk', label: 'Indie Folk', category: 'genre' },
    { id: 'mellow', label: 'Mellow', category: 'genre' },
    { id: 'pop', label: 'Pop', category: 'genre' },
    { id: 'rock', label: 'Rock', category: 'genre' },
    { id: 'hip-hop-rap', label: 'Hip-Hop/Rap', category: 'genre' },
    { id: 'electronic', label: 'Electronic', category: 'genre' },
    { id: 'classic-rock', label: 'Classic Rock', category: 'genre' },
    { id: 'alternative-rock', label: 'Alternative Rock', category: 'genre' },
    { id: 'indie', label: 'Indie', category: 'genre' },
  ],
  mood: [
    { id: 'chill', label: 'Chill', category: 'mood' },
    { id: 'energetic', label: 'Energetic', category: 'mood' },
    { id: 'melancholic', label: 'Melancholic', category: 'mood' },
    { id: 'upbeat', label: 'Upbeat', category: 'mood' },
    { id: 'romantic', label: 'Romantic', category: 'mood' },
    { id: 'nostalgic', label: 'Nostalgic', category: 'mood' },
  ],
  era: [
    { id: '2010s', label: '2010s', category: 'era' },
    { id: '2000s', label: '2000s', category: 'era' },
    { id: '90s', label: '90s', category: 'era' },
    { id: '80s', label: '80s', category: 'era' },
    { id: '70s', label: '70s', category: 'era' },
  ],
  occasion: [
    { id: 'road-trip', label: 'Road Trip', category: 'occasion' },
    { id: 'workout', label: 'Workout', category: 'occasion' },
    { id: 'study', label: 'Study', category: 'occasion' },
    { id: 'party', label: 'Party', category: 'occasion' },
    { id: 'relaxing', label: 'Relaxing', category: 'occasion' },
    { id: 'cooking', label: 'Cooking', category: 'occasion' },
  ],
  theme: [
    { id: 'movies-soundtrack', label: 'Movies Soundtrack', category: 'theme' },
    { id: 'adventure', label: 'Adventure', category: 'theme' },
    { id: 'summer-vibes', label: 'Summer Vibes', category: 'theme' },
    { id: 'rainy-day', label: 'Rainy Day', category: 'theme' },
    { id: 'late-night', label: 'Late Night', category: 'theme' },
  ]
};

export default function GeneratePage() {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [customDescription, setCustomDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<'idle' | 'prompt' | 'generating' | 'complete' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      if (exists) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };

  const toggleCategory = (category: string) => {
    setActiveCategory(prev => prev === category ? null : category);
  };

  const generatePromptPreview = () => {
    if (selectedTags.length === 0 && !customDescription.trim()) {
      return 'Describe your perfect playlist...';
    }

    const genres = selectedTags.filter(t => t.category === 'genre').map(t => t.label.toLowerCase());
    const moods = selectedTags.filter(t => t.category === 'mood').map(t => t.label.toLowerCase());
    const eras = selectedTags.filter(t => t.category === 'era').map(t => t.label);
    const occasions = selectedTags.filter(t => t.category === 'occasion').map(t => t.label);
    const themes = selectedTags.filter(t => t.category === 'theme').map(t => t.label);

    let prompt = '';
    
    if (moods.length > 0) {
      prompt += moods.join(' ') + ' ';
    }
    
    if (genres.length > 0) {
      prompt += genres.join(' ') + ' songs ';
    }
    
    if (eras.length > 0) {
      prompt += 'from ' + eras.join(', ') + ' ';
    }
    
    if (themes.length > 0) {
      prompt += themes.join(', ') + ', ';
    }
    
    if (occasions.length > 0) {
      prompt += 'perfect for ' + occasions.map(o => 
        o.includes(':') ? 'an ' + o : o
      ).join(' ');
    }

    if (customDescription.trim()) {
      if (prompt) prompt += ' ';
      prompt += customDescription.trim();
    }

    return prompt.trim().replace(/,$/, '');
  };

  const handleGenerate = async () => {
    if (selectedTags.length === 0 && !customDescription.trim()) {
      setError('Please select at least one tag or add a custom description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPlaylist(null);
    setGenerationStep('prompt');

    try {
      // Step 1: Generate prompt from tags and custom text
      const promptResponse = await fetch('/api/playlist/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_selections: {
            categories: selectedTags.map(t => t.category),
            selections: selectedTags.map(t => t.label)
          },
          custom_text: customDescription
        })
      });

      if (!promptResponse.ok) {
        throw new Error('Failed to generate prompt');
      }

      const { prompt } = await promptResponse.json();
      setGenerationStep('generating');

      // Step 2: Generate playlist from prompt
      const playlistResponse = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!playlistResponse.ok) {
        throw new Error('Failed to generate playlist');
      }

      const { playlist } = await playlistResponse.json();
      setGeneratedPlaylist(playlist);
      setGenerationStep('complete');

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate playlist');
      setGenerationStep('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepIcon = () => {
    switch (generationStep) {
      case 'prompt':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStepText = () => {
    switch (generationStep) {
      case 'prompt':
        return 'Generating prompt...';
      case 'generating':
        return 'Creating your playlist...';
      case 'complete':
        return 'Playlist ready!';
      case 'error':
        return 'Generation failed';
      default:
        return '';
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedPlaylist) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/playlist/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist: generatedPlaylist,
          prompt: generatePromptPreview()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save playlist');
      }

      const { playlist } = await response.json();
      setSavedPlaylistId(playlist.id);
      
      // Show success message
      setError(null);
      
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-mono">&lt;/&gt;</span>
            </div>
            <h1 className="text-lg font-medium text-gray-600">PromptBuilderView</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="px-6 py-2 rounded-full"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || (selectedTags.length === 0 && !customDescription.trim())}
              className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full font-medium flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  {getStepIcon()}
                  {getStepText()}
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Success Display */}
        {savedPlaylistId && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Playlist saved successfully to your library!</span>
            </div>
          </div>
        )}

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-6">
              {selectedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {tag.label}
                  <span className="text-gray-500">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Prompt Preview */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-lg leading-relaxed text-center">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent font-medium">
                {generatePromptPreview()}
              </span>
            </p>
          </div>
        </div>

        {/* Custom Description Input */}
        <div className="mb-8">
          <div className="relative">
            <Music className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 w-5 h-5" />
            <Input
              placeholder="Describe your playlist"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="pl-12 py-4 text-lg bg-gray-100 border-0 rounded-xl placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Category Buttons */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {['Genre', 'Mood', 'Era', 'Occasion', 'Theme'].map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category.toLowerCase())}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === category.toLowerCase()
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tag Categories - Only show when category is active */}
        {activeCategory && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {TAG_CATEGORIES[activeCategory as keyof typeof TAG_CATEGORIES]?.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isTagSelected(tag.id)
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generated Playlist Display */}
        {generatedPlaylist && (
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {generatedPlaylist.name}
              </h2>
              {generatedPlaylist.categorization && generatedPlaylist.categorization[0] && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{generatedPlaylist.categorization[0].primary_genre}</span>
                  <span>•</span>
                  <span>{generatedPlaylist.categorization[0].mood}</span>
                  <span>•</span>
                  <span>{generatedPlaylist.categorization[0].energy_level} Energy</span>
                </div>
              )}
            </div>

            {generatedPlaylist.essay && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {generatedPlaylist.essay}
                </p>
              </div>
            )}

            {generatedPlaylist.songs && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {generatedPlaylist.songs.length} Songs
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generatedPlaylist.songs.map((song, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{song.title}</div>
                        <div className="text-sm text-gray-600">{song.artist}</div>
                      </div>
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <Button className="bg-green-600 hover:bg-green-700">
                Save to Spotify
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveToLibrary}
                disabled={isSaving || !!savedPlaylistId}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : savedPlaylistId ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Saved to Library
                  </>
                ) : (
                  'Save to Library'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 