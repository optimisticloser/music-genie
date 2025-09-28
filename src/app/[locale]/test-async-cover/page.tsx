"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverArtStatus } from "@/components/playlist/CoverArtStatus";
import { PageTitle } from "@/components/shared/PageTitle";
import { Loader2, Music, CheckCircle } from "lucide-react";
import { localeToMarket } from "@/lib/locale";

function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export default function TestAsyncCoverPage() {
  const locale = useLocale();
  const [prompt, setPrompt] = useState("Contemporary indie party anthems with energetic vibes");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<{ id: string; title: string; total_tracks?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePlaylist = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPlaylist(null);

    try {
      const response = await fetch("/api/playlist/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          locale,
           market: localeToMarket(locale, readClientCookie("APP_MARKET")),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate playlist");
      }

      const data = await response.json();
      setGeneratedPlaylist(data.playlist);

      console.log("✅ Playlist generated:", data);
      console.log("🎨 Cover generation started:", data.cover_generation_started);

    } catch (err) {
      console.error("Playlist generation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageTitle title="🎵 Teste de Geração Assíncrona de Capas" />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎵 Teste de Geração Assíncrona de Capas</h1>
        <p className="text-muted-foreground">
          Teste o fluxo completo: geração de playlist + capa automática
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music className="h-5 w-5" />
              <span>Gerar Playlist</span>
            </CardTitle>
            <CardDescription>
              Crie uma playlist e veja a capa ser gerada automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt da Playlist</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o tipo de playlist que você quer..."
                rows={3}
              />
            </div>

            <Button
              onClick={generatePlaylist}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando playlist...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4 mr-2" />
                  Gerar Playlist + Capa
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">❌ {error}</p>
              </div>
            )}

            {generatedPlaylist && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Playlist Criada!</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {generatedPlaylist.title}</p>
                  <p><strong>ID:</strong> {generatedPlaylist.id}</p>
                  <p><strong>Músicas:</strong> {generatedPlaylist.total_tracks || 0}</p>
                  <p><strong>Status da Capa:</strong> Geração iniciada automaticamente</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel de Status da Capa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music className="h-5 w-5" />
              <span>Status da Capa</span>
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso da geração da capa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPlaylist ? (
              <CoverArtStatus playlistId={generatedPlaylist.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gere uma playlist primeiro para ver o status da capa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <span className="font-medium">Geração da Playlist</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A playlist é criada com IA usando o prompt fornecido
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <span className="font-medium">Geração Assíncrona da Capa</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automaticamente após a playlist ser criada, a capa é gerada em background
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <span className="font-medium">Atualização em Tempo Real</span>
              </div>
              <p className="text-sm text-muted-foreground">
                O status é atualizado automaticamente até a capa estar pronta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
