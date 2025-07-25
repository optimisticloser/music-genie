'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2, CheckCircle, AlertCircle, X, Send } from 'lucide-react';

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
  const [promptParts, setPromptParts] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);

  // Carrega sugestões iniciais
  useEffect(() => {
    loadSuggestions('initial');
  }, []);

  // Carrega sugestões baseadas no modo
  const loadSuggestions = async (requestMode: 'initial' | 'enhancement', currentPromptText?: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/prompt-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_prompt: currentPromptText || promptParts.join(' '),
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

  // Gera prompt usando WorkflowAI
  const generatePromptFromParts = async (parts: string[]) => {
    if (parts.length === 0) {
      setCurrentPrompt('');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/playlist/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_selections: [
            { category: "Style", selection: parts[0] || "" },
            { category: "Mood", selection: parts[1] || "" },
            { category: "Activity", selection: parts[2] || "" },
            { category: "Additional", selection: parts.slice(3).join(' ') || "" }
          ].filter(item => item.selection.trim() !== ""),
          custom_text: parts.join(' ')
        })
      });

      if (!response.ok) throw new Error('Failed to generate prompt');

      const { prompt } = await response.json();
      // Usar só o prompt gerado pelo WorkflowAI, não concatenar
      setCurrentPrompt(prompt || '');
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Se falhar, não mostrar nada no prompt colorido
      setCurrentPrompt('');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Adiciona sugestão ao prompt
  const handleAddSuggestion = async (suggestion: string) => {
    const newPromptParts = [...promptParts, suggestion];
    setPromptParts(newPromptParts);
    
    // Gera novo prompt e carrega sugestões
    await generatePromptFromParts(newPromptParts);
    loadSuggestions('enhancement', newPromptParts.join(' '));
  };

  // Adiciona input customizado
  const handleAddCustomInput = async () => {
    if (!customInput.trim()) return;

    const newPromptParts = [...promptParts, customInput.trim()];
    setPromptParts(newPromptParts);
    setCustomInput('');

    // Gera novo prompt e carrega sugestões
    await generatePromptFromParts(newPromptParts);
    loadSuggestions('enhancement', newPromptParts.join(' '));
  };

  // Remove parte do prompt
  const handleRemovePromptPart = async (index: number) => {
    const newPromptParts = promptParts.filter((_, i) => i !== index);
    setPromptParts(newPromptParts);

    if (newPromptParts.length === 0) {
      setCurrentPrompt('');
      loadSuggestions('initial');
    } else {
      await generatePromptFromParts(newPromptParts);
      loadSuggestions('enhancement', newPromptParts.join(' '));
    }
  };

  // Gera playlist
  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      setError('Please add some elements to your prompt first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPlaylist(null);
    setGenerationStep('generating');

    try {
      // Generate playlist directly from the current prompt
      const playlistResponse = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt })
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
          prompt: currentPrompt
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

  // Determina se estamos no estado vazio (sem seleções)
  const isEmpty = promptParts.length === 0;

  return (
    <div className="bg-gray-50 min-h-screen">
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
                setPromptParts([]);
                setCurrentPrompt('');
                setGeneratedPlaylist(null);
                setError(null);
                loadSuggestions('initial');
              }}
            >
              Clear
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !currentPrompt.trim()}
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

      <div className="max-w-4xl mx-auto">
        {/* Chat-like Container */}
        <div className="min-h-screen flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 p-6 space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Success Display */}
            {savedPlaylistId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Playlist saved successfully to your library!</span>
                </div>
              </div>
            )}

            {/* Initial State - Só quando não tem seleções */}
            {isEmpty && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-gray-800 mb-2">
                  Let's build your perfect playlist
                </h2>
                <p className="text-gray-600 mb-8">
                  Start by choosing one of the options below, or type what you have in mind
                </p>
                
                {/* Carrossel só aparece quando vazio */}
                {suggestions.length > 0 && (
                  <div className="mt-8">
                    {isLoadingSuggestions ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleAddSuggestion(suggestion)}
                            className="px-4 py-3 bg-white hover:bg-gray-50 rounded-xl text-sm text-gray-700 transition-colors border border-gray-200 shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            <span>{suggestion}</span>
                            <span className="text-blue-500">+</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Prompt Parts - Só quando tem seleções */}
            {!isEmpty && (
              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {promptParts.map((part, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm border border-blue-200"
                    >
                      <span>"{part}"</span>
                      <button
                        onClick={() => handleRemovePromptPart(index)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* AI Generated Prompt - Só o texto do WorkflowAI */}
                {(currentPrompt || isGeneratingPrompt) && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">AI Generated Prompt:</div>
                        {isGeneratingPrompt ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating prompt...</span>
                          </div>
                        ) : currentPrompt ? (
                          <div className="text-lg leading-relaxed">
                            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent font-medium">
                              {currentPrompt}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Playlist Display */}
            {generatedPlaylist && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
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
                  <div className="mb-6">
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

                <div className="flex gap-4">
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

          {/* Input Area - Só aparece quando tem seleções OU no estado inicial */}
          <div className="border-t border-gray-200 bg-white p-6">
            
            {/* Sugestões - Só aparecem quando não está vazio (modo enhancement) */}
            {!isEmpty && suggestions.length > 0 && (
              <div className="mb-4">
                {isLoadingSuggestions ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors border border-gray-300 flex items-center gap-2"
                      >
                        <span>{suggestion}</span>
                        <span className="text-gray-400">+</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <div className="relative">
              <Input
                placeholder={isEmpty 
                  ? "Type anything you want your playlist to be like..." 
                  : "Add more details to your playlist..."
                }
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddCustomInput();
                  }
                }}
                className="pr-12 py-4 text-base bg-gray-50 border-gray-200 rounded-2xl placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={handleAddCustomInput}
                disabled={!customInput.trim()}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 