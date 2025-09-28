"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Image } from "@workflowai/workflowai";

interface CoverArtGeneratorProps {
  playlistName?: string;
  playlistDescription?: string;
  songList?: string;
  onCoverGenerated?: (coverArt: Image, description: string) => void;
}

export function CoverArtGenerator({
  playlistName = "",
  playlistDescription = "",
  songList = "",
  onCoverGenerated,
}: CoverArtGeneratorProps) {
  const [formData, setFormData] = useState({
    playlist_name: playlistName,
    playlist_description: playlistDescription,
    song_list: songList,
    style_preferences: "Bright, energetic, vibrant",
    color_preferences: "Vibrant yellows, energetic oranges, and bright magentas",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    cover_art?: Image;
    design_description?: string;
    metadata?: {
      model?: string;
      cost_usd?: number;
      duration_seconds?: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateCoverArt = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/playlist/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate cover art");
      }

      const data = await response.json();
      setResult(data);

      if (data.cover_art && data.design_description && onCoverGenerated) {
        onCoverGenerated(data.cover_art, data.design_description);
      }

    } catch (err) {
      console.error("Cover art generation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎨 Gerador de Capa de Playlist</CardTitle>
          <CardDescription>
            Use IA para criar capas personalizadas para suas playlists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playlist_name">Nome da Playlist *</Label>
              <Input
                id="playlist_name"
                value={formData.playlist_name}
                onChange={(e) => handleInputChange("playlist_name", e.target.value)}
                placeholder="Ex: Contemporary Indie Party Anthems"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style_preferences">Preferências de Estilo</Label>
              <Input
                id="style_preferences"
                value={formData.style_preferences}
                onChange={(e) => handleInputChange("style_preferences", e.target.value)}
                placeholder="Ex: Bright, energetic, vibrant"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist_description">Descrição da Playlist</Label>
            <Textarea
              id="playlist_description"
              value={formData.playlist_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("playlist_description", e.target.value)}
              placeholder="Descreva o tema, humor e estilo da playlist..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song_list">Lista de Músicas</Label>
            <Textarea
              id="song_list"
              value={formData.song_list}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("song_list", e.target.value)}
              placeholder="Ex: The Strokes - Reptilia; Franz Ferdinand - Take Me Out..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_preferences">Preferências de Cor</Label>
            <Input
              id="color_preferences"
              value={formData.color_preferences}
              onChange={(e) => handleInputChange("color_preferences", e.target.value)}
              placeholder="Ex: Vibrant yellows, energetic oranges, and bright magentas"
            />
          </div>

          <Button
            onClick={generateCoverArt}
            disabled={isGenerating || !formData.playlist_name}
            className="w-full"
          >
            {isGenerating ? "🎨 Gerando capa..." : "🎨 Gerar Capa com IA"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">❌ Erro: {error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>✨ Capa Gerada</CardTitle>
            <CardDescription>
              {result.design_description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.cover_art && result.cover_art.url && (
              <div className="space-y-2">
                <Label>Imagem da Capa</Label>
                <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-lg">
                  <NextImage
                    src={result.cover_art.url}
                    alt="Playlist cover art"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {result.metadata && (
              <div className="space-y-2">
                <Label>Metadados</Label>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Modelo:</span>
                    <p className="text-muted-foreground">{result.metadata.model || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Custo:</span>
                    <p className="text-muted-foreground">
                      ${result.metadata.cost_usd?.toFixed(4) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Tempo:</span>
                    <p className="text-muted-foreground">
                      {result.metadata.duration_seconds?.toFixed(2) || "N/A"}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
