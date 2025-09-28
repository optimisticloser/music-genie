'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2, AlertCircle, X, Send } from 'lucide-react';

const TAG_CATEGORY_CONFIG = {
  genre: [
    'indie-folk',
    'mellow',
    'pop',
    'rock',
    'hip-hop-rap',
    'electronic',
    'classic-rock',
    'alternative-rock',
    'indie',
  ],
  mood: ['chill', 'energetic', 'melancholic', 'upbeat', 'romantic', 'nostalgic'],
  era: ['2010s', '2000s', '90s', '80s', '70s'],
  occasion: ['road-trip', 'workout', 'study', 'party', 'relaxing', 'cooking'],
  source: ['movies-soundtrack', 'tv-shows', 'video-games', 'commercials', 'viral-tiktok'],
} as const;

type TagCategory = keyof typeof TAG_CATEGORY_CONFIG;
type TagId = (typeof TAG_CATEGORY_CONFIG)[TagCategory][number];

interface Tag {
  id: TagId;
  label: string;
  category: TagCategory;
}

export default function GeneratePage() {
  // Estados principais
  const [promptParts, setPromptParts] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<TagCategory | null>(null);
  const router = useRouter();
  const t = useTranslations('dashboard.generate');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const categoryOrder = useMemo(
    () => Object.keys(TAG_CATEGORY_CONFIG) as TagCategory[],
    []
  );

  const tagCategories = useMemo(() => {
    return categoryOrder.reduce<Record<TagCategory, { title: string; tags: Tag[] }>>(
      (acc, category) => {
        acc[category] = {
          title: t(`tags.categoryTitles.${category}`),
          tags: TAG_CATEGORY_CONFIG[category].map((id) => ({
            id,
            category,
            label: t(`tags.${category}.options.${id}`),
          })),
        };
        return acc;
      },
      {} as Record<TagCategory, { title: string; tags: Tag[] }>
    );
  }, [categoryOrder, t]);

  // Carrega sugestões iniciais
  useEffect(() => {
    loadSuggestions('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega sugestões baseadas no modo
  const loadSuggestions = async (
    requestMode: 'initial' | 'enhancement',
    currentPromptText?: string,
    categorySelections: Tag[] = []
  ) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/prompt-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_prompt: currentPromptText || getAllSelections(),
          mode: requestMode,
          category_selections: categorySelections.map((t) => ({
            category: t.category,
            selection: t.label,
          })),
        }),
      });
       
      if (!response.ok) throw new Error('REQUEST_FAILED');

      const { suggestions: newSuggestions } = await response.json();
      setSuggestions(newSuggestions);
      setError(null);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
      setError((prev) => prev ?? t('messages.suggestionsFailed'));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Helper para obter todas as seleções como string
  const getAllSelections = () => {
    const tagLabels = selectedTags.map(tag => tag.label);
    const allSelections = [...promptParts, ...tagLabels];
    return allSelections.join(' ');
  };

  // Atualiza o prompt baseado em seleções
  const generatePromptFromParts = async (
    overrideTags: Tag[] = selectedTags,
    overrideParts: string[] = promptParts
  ) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`🚀 STARTING generatePromptFromParts [${requestId}]`);
    
    const allSelections = (
      [...overrideTags.map(t => `${t.category}: ${t.label}`), ...overrideParts].join(' ')
    ).trim();
    if (!allSelections.trim()) {
      console.log(`⚠️ EMPTY SELECTION, skipping [${requestId}]`);
      setCurrentPrompt('');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      // Separar category_selections e custom_text usando overrides (estado mais recente)
      const categorySelections = overrideTags.map(tag => ({
        category: tag.category,
        selection: tag.label,
      }));
      const customText = overrideParts.join(' ');

      // Debug logs
      console.log(`🔍 DEBUG [${requestId}] - selectedTags:`, overrideTags);
      console.log(`🔍 DEBUG [${requestId}] - promptParts:`, overrideParts);
      console.log(`🔍 DEBUG [${requestId}] - categorySelections:`, categorySelections);
      console.log(`🔍 DEBUG [${requestId}] - customText:`, customText);

      const requestBody = {
        category_selections: categorySelections,
        custom_text: customText,
      };

      console.log(`🔍 DEBUG [${requestId}] - Request body:`, requestBody);

      const response = await fetch('/api/playlist/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('REQUEST_FAILED');

      const { prompt, suggestions: newSuggestions } = await response.json();
      // Usar só o prompt gerado pelo WorkflowAI, não concatenar
      setCurrentPrompt(prompt || '');
      if (Array.isArray(newSuggestions) && newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      }
      setError(null);
      console.log(`✅ COMPLETED generatePromptFromParts [${requestId}]`);
    } catch (error) {
      console.error(`❌ ERROR generatePromptFromParts [${requestId}]:`, error);
      // Se falhar, não mostrar nada no prompt colorido
      setCurrentPrompt('');
      setError((prev) => prev ?? t('messages.unexpected'));
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Função centralizada que sempre envia o estado mais atual
  const updatePrompt = async (tagsToUse: Tag[] = selectedTags, partsToUse: string[] = promptParts) => {
    console.log('📍 updatePrompt called with:', { tagsToUse, partsToUse });
    await generatePromptFromParts(tagsToUse, partsToUse);
  };

  // Adiciona sugestão ao prompt
  const handleAddSuggestion = async (suggestion: string) => {
    // Agora somamos a nova sugestão às partes existentes
    const newPromptParts = [...promptParts, suggestion];
    setPromptParts(newPromptParts);
    setError(null);

    // Usa função centralizada
    await updatePrompt(selectedTags, newPromptParts);
  };

  // Adiciona input customizado
  const handleAddCustomInput = async () => {
    if (!customInput.trim()) return;

    const newPromptParts = [...promptParts, customInput.trim()];
    setPromptParts(newPromptParts);
    setCustomInput('');
    setError(null);

    // Usa função centralizada
    await updatePrompt(selectedTags, newPromptParts);
  };

  // Toggle tag das categorias predefinidas
  const toggleTag = async (tag: Tag) => {
    const exists = selectedTags.find((t) => t.id === tag.id);
    let newSelectedTags: Tag[];

    if (exists) {
      newSelectedTags = selectedTags.filter((t) => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }

    setSelectedTags(newSelectedTags);

    // Agora geramos o prompt imediatamente sempre que as tags mudam
    await updatePrompt(newSelectedTags, promptParts);
  };

  // Remove parte do prompt
  const handleRemovePromptPart = async (index: number) => {
    const newPromptParts = promptParts.filter((_, i) => i !== index);
    setPromptParts(newPromptParts);
    setError(null);

    if (newPromptParts.length === 0 && selectedTags.length === 0) {
      setCurrentPrompt('');
      setActiveCategory(null);
      loadSuggestions('initial');
    } else {
      // Usa função centralizada
      await updatePrompt(selectedTags, newPromptParts);
    }
  };

  // Remove tag selecionada
  const handleRemoveTag = async (tagId: TagId) => {
    const newSelectedTags = selectedTags.filter(t => t.id !== tagId);
    setSelectedTags(newSelectedTags);
    setError(null);

    if (promptParts.length === 0 && newSelectedTags.length === 0) {
      setCurrentPrompt('');
      setActiveCategory(null);
      loadSuggestions('initial');
    } else {
      // Usa função centralizada
      await updatePrompt(newSelectedTags, promptParts);
    }
  };

  // Toggle categoria
  const toggleCategory = (category: TagCategory) => {
    setActiveCategory(prev => prev === category ? null : category);
  };

  // Verifica se tag está selecionada
  const isTagSelected = (tagId: TagId) => {
    return selectedTags.some(tag => tag.id === tagId);
  };

  // Gera playlist
  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      setError(t('messages.addElements'));
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const response = await fetch('/api/playlist/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (!response.ok) {
        throw new Error('REQUEST_FAILED');
      }

      const { playlistId } = await response.json();
      router.push({
        pathname: '/dashboard/playlist/[id]',
        params: { id: playlistId },
      });
    } catch (err) {
      console.error('Generation error:', err);
      setError(t('messages.createDraftFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Determina se estamos no estado vazio (sem seleções)
  const isEmpty = promptParts.length === 0 && selectedTags.length === 0;

  return (
    <div className="bg-gray-50 min-h-[100dvh] flex flex-col">
      {/* Header simplificado (fixo no topo do painel direito) */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-end max-w-4xl mx-auto">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !currentPrompt.trim()}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full font-medium flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('cta.submitting')}
              </>
            ) : (
              t('cta.submit')
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex-1 w-full relative">
        {/* Scrollable content */}
        <div className="overflow-y-auto h-full">
          
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

            {/* Initial State - Só quando não tem seleções */}
            {isEmpty && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-gray-800 mb-2">
                  {t('empty.title')}
                </h2>
                <p className="text-gray-600 mb-8">
                  {t('empty.description')}
                </p>
                
                {/* Carrossel só aparece quando vazio */}
                {suggestions.length > 0 && (
                  <div className="mb-8">
                    <p className="text-gray-600 mb-4">{t('empty.suggestionsTitle')}</p>
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span>{t('suggestions.loading')}</span>
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

            {/* Selected Items - Só quando tem seleções */}
            {!isEmpty && (
              <div className="space-y-4">
                {/* Tags and Parts */}
                <div className="flex flex-wrap gap-2">
                  {/* Tags das categorias */}
                  {selectedTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm border border-green-200"
                    >
                      <span>{tag.label}</span>
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Parts do texto customizado */}
                  {promptParts.map((part, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm border border-blue-200"
                    >
                      <span>&quot;{part}&quot;</span>
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
                        <div className="text-sm text-gray-600 mb-2">{t('messages.aiPromptTitle')}</div>
                        {isGeneratingPrompt ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t('messages.aiPromptLoading')}</span>
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

            {/* Generation Progress & Result */}
          </div>

          {/* Spacer to avoid overlap with sticky input */}
          <div className="h-4" />
        </div>

        {/* Input Area - Sticky at bottom of right pane */}
        <div
          className="border-t border-gray-200 bg-white sticky bottom-0 z-20 px-4 md:px-6 pt-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
        >
            
            {/* Categorias predefinidas - SEMPRE VISÍVEIS */}
            <div className="mb-6">
              {isEmpty && <p className="text-gray-600 mb-4 text-center">{t('empty.categoryHint')}</p>}
              
              {/* Category Buttons */}
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {categoryOrder.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {tagCategories[category].title}
                  </button>
                ))}
              </div>

              {/* Tags da categoria ativa */}
              {activeCategory && (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto mb-4">
                  {tagCategories[activeCategory]?.tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        isTagSelected(tag.id)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sugestões - Só aparecem quando não está vazio (modo enhancement) */}
            {!isEmpty && suggestions.length > 0 && (
              <div className="mb-4">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span>{t('suggestions.loading')}</span>
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
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 p-1 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 focus-within:shadow-md">
                <Input
                  placeholder={isEmpty
                    ? t('input.placeholderEmpty')
                    : t('input.placeholderFilled')
                  }
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddCustomInput();
                    }
                  }}
                  className="flex-1 h-12 rounded-full border-0 bg-transparent px-5 text-base placeholder:text-gray-400 shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
                <Button
                  onClick={handleAddCustomInput}
                  disabled={!customInput.trim()}
                  size="sm"
                  className="mr-1 flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm transition-transform hover:scale-[1.02] hover:from-blue-500 hover:to-blue-600 hover:shadow-md disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500 disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
} 
