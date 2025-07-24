import { workflowAI } from "./client";

// === Playlist Prompt Generation ===
export interface PlaylistPromptGenerationInput {
  category_selections?: {
    categories?: string[];
    selections?: string[];
  };
  custom_text?: string;
}

export interface PlaylistPromptGenerationOutput {
  playlist_prompt?: string;
}

export const playlistPromptAgent = workflowAI.agent<
  PlaylistPromptGenerationInput,
  PlaylistPromptGenerationOutput
>({
  id: "playlist-prompt-generation",
  schemaId: 1,
  version: "dev",
  useCache: "auto",
});

// === Playlist Generator ===
export interface PlaylistGeneratorInput {
  prompt?: string;
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
  schemaId: 3,
  version: "dev",
  useCache: "auto",
});

// === Playlist Cover Art Generation (opcional) ===
export interface PlaylistCoverArtGenerationInput {
  playlist_name?: string;
  playlist_description?: string;
  song_list?: string;
  style_preferences?: string;
  color_preferences?: string;
}

export interface PlaylistCoverArtGenerationOutput {
  cover_art?: any; // Image type from SDK
  design_description?: string;
}

export const playlistCoverArtAgent = workflowAI.agent<
  PlaylistCoverArtGenerationInput,
  PlaylistCoverArtGenerationOutput
>({
  id: "playlist-cover-art-generation",
  schemaId: 1,
  version: "dev",
  useCache: "auto",
}); 