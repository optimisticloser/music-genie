'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { SuggestionCarousel } from '@/components/shared/SuggestionCarousel';

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

export default function GeneratePage() {
  // Estados principais
  const [mode, setMode] = useState<'initial' | 'building'>('initial');
  const [promptParts, setPromptParts] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<'idle' | 'prompt' | 'generating' | 'complete' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);

  // Carrega sugestões iniciais
  useEffect(() => {
    loadSuggestions('initial');
  }, []);

  // Carrega sugestões baseadas no modo
  const loadSuggestions = async (requestMode: 'initial' | 'enhancement', currentPrompt?: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/prompt-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_prompt: currentPrompt || promptParts.join(' '),
          mode: requestMode
        })
      });

      if (!response.ok) throw new Error('Failed to load suggestions');

      const { suggestions: newSuggestions } = await response.json();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Adiciona sugestão ao prompt
  const handleAddSuggestion = (suggestion: string) => {
    if (mode === 'initial') {
      // Primeira seleção - prompt completo
      setPromptParts([suggestion]);
      setMode('building');
      loadSuggestions('enhancement', suggestion);
    } else {
      // Adições subsequentes - complementos
      const newPromptParts = [...promptParts, suggestion];
      setPromptParts(newPromptParts);
      loadSuggestions('enhancement', newPromptParts.join(' '));
    }
  };

  // Adiciona input customizado
  const handleAddCustomInput = () => {
    if (!customInput.trim()) return;

    if (mode === 'initial') {
      setPromptParts([customInput.trim()]);
      setMode('building');
      loadSuggestions('enhancement', customInput.trim());
    } else {
      const newPromptParts = [...promptParts, customInput.trim()];
      setPromptParts(newPromptParts);
      loadSuggestions('enhancement', newPromptParts.join(' '));
    }

    setCustomInput('');
  };

  // Remove parte do prompt
  const handleRemovePromptPart = (index: number) => {
    const newPromptParts = promptParts.filter((_, i) => i !== index);
    setPromptParts(newPromptParts);

    if (newPromptParts.length === 0) {
      setMode('initial');
      loadSuggestions('initial');
    } else {
      loadSuggestions('enhancement', newPromptParts.join(' '));
    }
  };

  // Gera playlist
  const handleGenerate = async () => {
    if (promptParts.length === 0) {
      setError('Please add at least one prompt part');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPlaylist(null);
    setGenerationStep('prompt');

    try {
      const finalPrompt = promptParts.join(' ');

      // Step 1: Generate prompt from parts
      const promptResponse = await fetch('/api/playlist/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_selections: {
            categories: [],
            selections: []
          },
          custom_text: finalPrompt
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

  // Salva playlist
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
          prompt: promptParts.join(' ')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save playlist');
      }

      const { playlist } = await response.json();
      setSavedPlaylistId(playlist.id);
      setError(null);
      
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save playlist');
    } finally {
      setIsSaving(false);
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
        return 'Generate';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
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
              onClick={() => {
                setMode('initial');
                setPromptParts([]);
                setGeneratedPlaylist(null);
                setError(null);
                loadSuggestions('initial');
              }}
            >
              Clear
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || promptParts.length === 0}
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

        {/* Selected Prompt Parts */}
        {promptParts.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-6">
              {promptParts.map((part, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium border border-blue-200"
                >
                  <span>"{part}"</span>
                  <button
                    onClick={() => handleRemovePromptPart(index)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Input */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {mode === 'initial' ? (
              <h2 className="text-xl font-medium text-center mb-6 text-gray-800">
                Type anything you want your playlist to be like
              </h2>
            ) : (
              <h2 className="text-xl font-medium text-center mb-6 text-gray-800">
                Anything else you want to add?
              </h2>
            )}
            
            <div className="relative mb-6">
              <Music className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 w-5 h-5" />
              <Input
                placeholder="Ex: 'para academia', 'com guitarras pesadas', 'que me façam dançar'"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomInput();
                  }
                }}
                className="pl-12 py-4 text-lg bg-gray-100 border-0 rounded-xl placeholder:text-gray-400"
              />
              <Button
                onClick={handleAddCustomInput}
                disabled={!customInput.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestion Carousel */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            {mode === 'initial' && (
              <p className="text-center text-gray-600 mb-4">
                Or choose any of these options
              </p>
            )}
            {isLoadingSuggestions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <SuggestionCarousel
                suggestions={suggestions}
                onAddSuggestion={handleAddSuggestion}
              />
            )}
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