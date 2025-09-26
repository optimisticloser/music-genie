"use client";

import { useCallback, useEffect, useState } from "react";

interface CoverArtStatus {
  playlist_id: string;
  title: string;
  has_cover_art: boolean;
  cover_art_url?: string;
  cover_art_description?: string;
  metadata?: {
    model?: string;
    cost_usd?: number;
    duration_seconds?: number;
    generated_at?: string;
  };
  created_at: string;
}

interface UseCoverArtStatusProps {
  playlistId: string;
  autoPoll?: boolean;
  pollInterval?: number;
}

export function useCoverArtStatus({
  playlistId,
  autoPoll = true,
  pollInterval = 5000, // 5 segundos
}: UseCoverArtStatusProps) {
  const [status, setStatus] = useState<CoverArtStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!playlistId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/playlist/cover-status/${playlistId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);

      // Se a capa foi gerada, parar o polling
      if (data.has_cover_art) {
        setPolling(false);
      }

    } catch (err) {
      console.error("Error checking cover art status:", err);
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  // Polling automático
  useEffect(() => {
    if (!autoPoll || !playlistId) return;

    // Verificação inicial
    checkStatus();

    // Configurar polling se a capa ainda não foi gerada
    if (!status?.has_cover_art) {
      setPolling(true);
    }

    const interval = setInterval(() => {
      if (polling && !status?.has_cover_art) {
        checkStatus();
      }
    }, pollInterval);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [playlistId, autoPoll, polling, status?.has_cover_art, pollInterval, checkStatus]);

  // Parar polling quando a capa for gerada
  useEffect(() => {
    if (status?.has_cover_art && polling) {
      setPolling(false);
    }
  }, [status?.has_cover_art, polling]);

  const startPolling = () => {
    setPolling(true);
  };

  const stopPolling = () => {
    setPolling(false);
  };

  const refresh = () => {
    checkStatus();
  };

  return {
    status,
    loading,
    error,
    polling,
    hasCoverArt: status?.has_cover_art || false,
    coverArtUrl: status?.cover_art_url,
    coverArtDescription: status?.cover_art_description,
    metadata: status?.metadata,
    startPolling,
    stopPolling,
    refresh,
  };
} 