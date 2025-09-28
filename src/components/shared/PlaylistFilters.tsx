"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

export interface PlaylistFiltersState {
  search: string;
  sortBy: 'created_at' | 'title' | 'popularity';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  favoritesOnly: boolean;
  genre?: string;
  mood?: string;
  energyLevel?: string;
  instruments?: string[];
  themes?: string[];
  years?: string[];
  duration?: string;
  timeRange?: string;
}

interface PlaylistFiltersProps {
  filters: PlaylistFiltersState;
  onFiltersChange: (filters: PlaylistFiltersState) => void;
  totalResults?: number;
  isLoading?: boolean;
}

const GENRES = [
  "rock",
  "pop",
  "jazz",
  "electronic",
  "hipHop",
  "rnb",
  "country",
  "classical",
  "folk",
  "blues",
  "reggae",
  "latin",
  "indie",
  "alternative",
  "metal",
  "punk",
] as const;

const MOODS = [
  "happy",
  "melancholic",
  "energetic",
  "relaxing",
  "romantic",
  "nostalgic",
  "motivational",
  "calm",
  "lively",
  "dark",
  "party",
  "thoughtful",
] as const;

const ENERGY_LEVELS = ["low", "medium", "high"] as const;

const INSTRUMENTS = [
  "guitar",
  "piano",
  "drums",
  "synth",
  "acousticGuitar",
  "bass",
  "sax",
  "trumpet",
  "violin",
  "flute",
  "vocal",
  "percussion",
  "keyboard",
  "harmonica",
] as const;

const THEMES = [
  "love",
  "travel",
  "work",
  "party",
  "study",
  "exercise",
  "meditation",
  "nostalgia",
  "adventure",
  "reflection",
  "celebration",
  "relaxation",
] as const;

const YEARS = ["60s", "70s", "80s", "90s", "2000s", "2010s", "2020s"] as const;

const DURATIONS = ["short", "medium", "long"] as const;

const TIME_RANGES = ["7days", "30days", "3months", "1year"] as const;

export function PlaylistFilters({ 
  filters, 
  onFiltersChange, 
  totalResults = 0, 
  isLoading = false 
}: PlaylistFiltersProps) {
  const t = useTranslations('dashboard.filters');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const updateFilters = (updates: Partial<PlaylistFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (filterKey: keyof PlaylistFiltersState, value: string) => {
    const currentArray = filters[filterKey] as string[] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilters({ [filterKey]: newArray });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      sortBy: "created_at",
      sortOrder: "desc",
      viewMode: "grid",
      favoritesOnly: false,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.favoritesOnly ||
    filters.genre ||
    filters.mood ||
    filters.energyLevel ||
    (filters.instruments && filters.instruments.length > 0) ||
    (filters.themes && filters.themes.length > 0) ||
    (filters.years && filters.years.length > 0) ||
    filters.duration ||
    filters.timeRange;

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ 
              sortBy: "created_at", 
              sortOrder: filters.sortOrder === "desc" ? "asc" : "desc" 
            })}
            className="flex items-center gap-1"
          >
            {filters.sortBy === "created_at" ? t('buttons.sortDate') : t('buttons.sortName')}
            {filters.sortOrder === "desc" ? "↓" : "↑"}
          </Button>

          {/* View Mode */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ 
              viewMode: filters.viewMode === "grid" ? "list" : "grid" 
            })}
            className="flex items-center gap-1"
          >
            {filters.viewMode === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {filters.viewMode === "grid" ? t('buttons.viewGrid') : t('buttons.viewList')}
          </Button>

          {/* Favorites */}
          <Button
            variant={filters.favoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ favoritesOnly: !filters.favoritesOnly })}
            className="flex items-center gap-1"
          >
            {t('buttons.favorites')}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-1 text-gray-600"
        >
          <Filter className="w-4 h-4" />
          {t('advanced.toggle')}
          {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            {t('advanced.clearAll')}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="space-y-6 p-4 bg-gray-50 rounded-lg border">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.genre')}</label>
              <select
                value={filters.genre || ""}
                onChange={(e) => updateFilters({ genre: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('select.genre')}</option>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {t(`options.genres.${genre}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.mood')}</label>
              <select
                value={filters.mood || ""}
                onChange={(e) => updateFilters({ mood: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('select.mood')}</option>
                {MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {t(`options.moods.${mood}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.energy')}</label>
              <select
                value={filters.energyLevel || ""}
                onChange={(e) => updateFilters({ energyLevel: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('select.energy')}</option>
                {ENERGY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`options.energy.${level}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.duration')}</label>
              <select
                value={filters.duration || ""}
                onChange={(e) => updateFilters({ duration: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('select.duration')}</option>
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {t(`options.duration.${duration}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-select Filters */}
          <div className="space-y-4">
            {/* Instruments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.instruments')}</label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.map((instrument) => (
                  <Badge
                    key={instrument}
                    variant={filters.instruments?.includes(instrument) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleArrayFilter('instruments', instrument)}
                  >
                    {t(`options.instruments.${instrument}`)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.themes')}</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => (
                  <Badge
                    key={theme}
                    variant={filters.themes?.includes(theme) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleArrayFilter('themes', theme)}
                  >
                    {t(`options.themes.${theme}`)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.years')}</label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map(year => (
                  <Badge
                    key={year}
                    variant={filters.years?.includes(year) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleArrayFilter('years', year)}
                  >
                    {year}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.timeRange')}</label>
              <select
                value={filters.timeRange || ""}
                onChange={(e) => updateFilters({ timeRange: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('select.timeRange')}</option>
                {TIME_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {t(`options.timeRange.${range}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('badges.search', { value: filters.search })}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilters({ search: "" })}
              />
            </Badge>
          )}
          {filters.genre && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('badges.genre', { value: t(`options.genres.${filters.genre}`) })}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilters({ genre: undefined })}
              />
            </Badge>
          )}
          {filters.mood && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('badges.mood', { value: t(`options.moods.${filters.mood}`) })}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilters({ mood: undefined })}
              />
            </Badge>
          )}
          {filters.instruments?.map((instrument) => (
            <Badge key={instrument} variant="secondary" className="flex items-center gap-1">
              {t(`options.instruments.${instrument}`)}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('instruments', instrument)}
              />
            </Badge>
          ))}
          {filters.themes?.map((theme) => (
            <Badge key={theme} variant="secondary" className="flex items-center gap-1">
              {t(`options.themes.${theme}`)}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('themes', theme)}
              />
            </Badge>
          ))}
          {filters.favoritesOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('badges.favorites')}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => updateFilters({ favoritesOnly: false })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Info */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
            {t('results.loading')}
          </>
        ) : (
          <>{t('results.count', { count: totalResults })}</>
        )}
      </div>
    </div>
  );
}
