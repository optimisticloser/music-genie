import { workflowAI } from "./client";
import { Image } from "@workflowai/workflowai";

// === Playlist Prompt Generation ===
export interface PlaylistPromptGenerationInput {
  category_selections?: {
    category?: string;
    selection?: string;
  }[];
  custom_text?: string;
}

export interface PlaylistPromptGenerationOutput {
  playlist_prompt?: string;
  prompt_suggestions?: string[];
}

export const playlistPromptAgent = workflowAI.agent<
  PlaylistPromptGenerationInput,
  PlaylistPromptGenerationOutput
>({
  id: "playlist-prompt-generation",
  schemaId: 3,
  version: "5.1",
  useCache: "auto",
});

// === Playlist Generator ===
export interface PlaylistGeneratorInput {
  prompt?: string;
  locale?: string;
  market?: string;
  cultural_context?: string;
}

export interface PlaylistGeneratorOutput {
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

export const playlistGeneratorAgent = workflowAI.agent<
  PlaylistGeneratorInput,
  PlaylistGeneratorOutput
>({
  id: "playlist-generator",
  schemaId: 4,
  version: "dev",
  useCache: "auto",
});

// === Playlist Cover Art Generation ===
export interface PlaylistCoverArtGenerationInput {
  playlist_name?: string;
  playlist_description?: string;
  song_list?: string;
  style_preferences?: string;
  color_preferences?: string;
}

export interface PlaylistCoverArtGenerationOutput {
  cover_art?: Image;
  design_description?: string;
}

export const playlistCoverArtGeneration = workflowAI.agent<
  PlaylistCoverArtGenerationInput,
  PlaylistCoverArtGenerationOutput
>({
  id: "playlist-cover-art-generation",
  schemaId: 1,
  version: "production",
  useCache: "auto",
}); 
