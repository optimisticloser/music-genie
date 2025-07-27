"use client";

import { useCoverArtStatus } from "@/hooks/useCoverArtStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Image, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface CoverArtStatusProps {
  playlistId: string;
  className?: string;
}

export function CoverArtStatus({ playlistId, className }: CoverArtStatusProps) {
  const {
    status,
    loading,
    error,
    polling,
    hasCoverArt,
    coverArtUrl,
    coverArtDescription,
    metadata,
    startPolling,
    stopPolling,
    refresh,
  } = useCoverArtStatus({ playlistId });

  if (loading && !status) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando status da capa...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao verificar capa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasCoverArt && coverArtUrl) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Capa Gerada</span>
          </CardTitle>
          <CardDescription>
            {coverArtDescription || "Capa personalizada criada com IA"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-square w-full max-w-md mx-auto">
            <img
              src={coverArtUrl}
              alt="Playlist cover art"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>

          {metadata && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detalhes da Geração</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {metadata.model && (
                  <div>
                    <span className="text-muted-foreground">Modelo:</span>
                    <p className="font-medium">{metadata.model}</p>
                  </div>
                )}
                {metadata.cost_usd && (
                  <div>
                    <span className="text-muted-foreground">Custo:</span>
                    <p className="font-medium">${metadata.cost_usd.toFixed(4)}</p>
                  </div>
                )}
                {metadata.duration_seconds && (
                  <div>
                    <span className="text-muted-foreground">Tempo:</span>
                    <p className="font-medium">{metadata.duration_seconds.toFixed(2)}s</p>
                  </div>
                )}
                {metadata.generated_at && (
                  <div>
                    <span className="text-muted-foreground">Gerado em:</span>
                    <p className="font-medium">
                      {new Date(metadata.generated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5 text-blue-600" />
          <span>Gerando Capa</span>
          {polling && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          A capa personalizada está sendo criada com IA...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processando...</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {polling ? "Gerando..." : "Aguardando"}
          </Badge>
          
          <div className="flex space-x-2">
            {polling ? (
              <Button onClick={stopPolling} variant="outline" size="sm">
                Parar verificação
              </Button>
            ) : (
              <Button onClick={startPolling} variant="outline" size="sm">
                Verificar status
              </Button>
            )}
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• A geração da capa acontece automaticamente após a playlist ser criada</p>
          <p>• O processo pode levar alguns segundos</p>
          <p>• Você pode verificar o status manualmente ou aguardar a atualização automática</p>
        </div>
      </CardContent>
    </Card>
  );
} 