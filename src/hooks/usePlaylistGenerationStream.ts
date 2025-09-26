import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaylistGeneratorOutput } from "@/lib/workflowai/agents";

type WorkflowMetrics = Record<string, unknown> | null;

type StreamStatus = {
  stage?: string;
  message?: string;
  connected?: boolean;
};

type SpotifyProgressStatus =
  | "searching"
  | "found"
  | "not_found"
  | "skipped"
  | "error"
  | "no_token";

type SpotifyProgressEvent = {
  index: number;
  status: SpotifyProgressStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song?: any;
  message?: string;
};

type PlaylistRecord = {
  id?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
};

type CoverStatusEvent =
  | {
      stage: "started";
    }
  | {
      stage: "success";
      cover_art_url?: string;
      cover_art_description?: string;
      metadata?: Record<string, unknown> | null;
    }
  | {
      stage: "error";
      message?: string;
    };

export type { CoverStatusEvent };

const FUN_LOADING_MESSAGES = [
  "Reticulating splines…",
  "Sintonizando rádios intergalácticas…",
  "Polendo agudos e encerando graves…",
  "Pedindo um solo pra guitarra imaginária…",
  "Aquecendo vocais dos backing vocals virtuais…",
  "Fatiando BPMs em cubinhos perfeitos…",
];

function mergeOutputs(
  previous: PlaylistGeneratorOutput | null,
  incoming: PlaylistGeneratorOutput
): PlaylistGeneratorOutput {
  if (!previous) {
    return incoming;
  }

  return {
    ...previous,
    ...incoming,
    songs: incoming.songs ?? previous.songs,
    album_art: incoming.album_art ?? previous.album_art,
    categorization: incoming.categorization ?? previous.categorization,
  };
}

function parseEventBlock(block: string) {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const dataString = dataLines.join("\n");
  let data: unknown = undefined;

  if (dataString) {
    try {
      data = JSON.parse(dataString);
    } catch (error) {
      console.error("Failed to parse SSE data", error, dataString);
      data = null;
    }
  }

  return { eventName, data } as const;
}

export function usePlaylistGenerationStream() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [funMessage, setFunMessage] = useState<string>(FUN_LOADING_MESSAGES[0]);
  const [partialOutput, setPartialOutput] = useState<PlaylistGeneratorOutput | null>(
    null
  );
  const [spotifyProgress, setSpotifyProgress] = useState<
    Record<number, SpotifyProgressEvent>
  >({});
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<WorkflowMetrics>(null);
  const [error, setError] = useState<string | null>(null);
  const [completeData, setCompleteData] = useState<{
    playlist: PlaylistRecord | PlaylistGeneratorOutput | null;
    spotify_connected?: boolean;
    metrics?: WorkflowMetrics;
    tracks?: unknown[];
    metadata?: Record<string, unknown> | null;
    songs?: unknown[];
    cover_art_url?: string;
  } | null>(null);
  const [hasAiUpdate, setHasAiUpdate] = useState(false);
  const [coverStatusEvent, setCoverStatusEvent] = useState<CoverStatusEvent | null>(
    null
  );
  const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);

  const funIndexRef = useRef(0);

  useEffect(() => {
    if (!isRunning || hasAiUpdate) {
      return;
    }

    const interval = setInterval(() => {
      funIndexRef.current =
        funIndexRef.current + 1 >= FUN_LOADING_MESSAGES.length
          ? 0
          : funIndexRef.current + 1;
      setFunMessage(FUN_LOADING_MESSAGES[funIndexRef.current]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isRunning, hasAiUpdate]);

  const resetState = useCallback(() => {
    setStatus(null);
    setFunMessage(FUN_LOADING_MESSAGES[0]);
    setPartialOutput(null);
    setSpotifyProgress({});
    setPlaylistId(null);
    setSpotifyPlaylistId(null);
    setMetrics(null);
    setError(null);
    setCompleteData(null);
    setHasAiUpdate(false);
    setCoverStatusEvent(null);
    setCoverArtUrl(null);
    funIndexRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsRunning(false);
  }, []);

  const generate = useCallback(
    async (prompt: string, playlistIdOverride?: string) => {
      if (!prompt.trim()) {
        throw new Error("Prompt is required");
      }

      if (isRunning) {
        cancel();
      }

      resetState();
      setIsRunning(true);
      setStatus({
        stage: "starting",
        message: "Preparando geração da playlist…",
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/playlist/generate/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            playlist_id: playlistIdOverride,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Resposta de streaming não suportada pelo navegador");
        }

        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        const handleEvent = (
          eventName: string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: any
        ) => {
          switch (eventName) {
            case "status": {
              setStatus(data as StreamStatus);
              if (data?.message) {
                setFunMessage(data.message);
              }
              break;
            }
            case "ai_update": {
              const chunk = data?.output as PlaylistGeneratorOutput | undefined;
              if (chunk) {
                setPartialOutput((prev) => mergeOutputs(prev, chunk));
                setHasAiUpdate(true);
              }
              break;
            }
            case "spotify_progress": {
              const progress = data as SpotifyProgressEvent;
              if (typeof progress?.index === "number") {
                setSpotifyProgress((prev) => ({
                  ...prev,
                  [progress.index]: progress,
                }));
              }
              break;
            }
            case "cover_status": {
              if (data) {
                setCoverStatusEvent(data as CoverStatusEvent);
                if (data?.cover_art_url) {
                  setCoverArtUrl(data.cover_art_url as string);
                }
              }
              break;
            }
            case "playlist_saved": {
              if (data?.playlist_id) {
                setPlaylistId(data.playlist_id);
              }
              if (data?.spotify_playlist_id) {
                setSpotifyPlaylistId(data.spotify_playlist_id);
              }
              break;
            }
            case "complete": {
              setStatus({ stage: "complete", message: "Playlist pronta!" });
              setCompleteData(data ?? null);
              if (data?.metrics) {
                setMetrics(data.metrics as WorkflowMetrics);
              }
              if (data?.playlist) {
                setPartialOutput((prev) =>
                  mergeOutputs(prev, data.playlist as PlaylistGeneratorOutput)
                );
              }
              if (data?.playlist?.cover_art_url) {
                setCoverArtUrl(data.playlist.cover_art_url as string);
              } else if (data?.cover_art_url) {
                setCoverArtUrl(data.cover_art_url as string);
              }
              setIsRunning(false);
              break;
            }
            case "error": {
              setError(
                data?.message || "Algo deu errado durante a geração da playlist"
              );
              setIsRunning(false);
              break;
            }
            default: {
              break;
            }
          }
        };

        const flushBuffer = (force = false) => {
          let boundary = buffer.indexOf("\n\n");

          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const { eventName, data } = parseEventBlock(rawEvent);
            handleEvent(eventName as string, data);
            boundary = buffer.indexOf("\n\n");
          }

          if (force && buffer.trim().length > 0) {
            const { eventName, data } = parseEventBlock(buffer);
            handleEvent(eventName as string, data);
            buffer = "";
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          flushBuffer();
        }

        flushBuffer(true);
        reader.releaseLock();
        setIsRunning(false);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Streaming playlist error", err);
        setError(
          err instanceof Error ? err.message : "Falha na geração da playlist"
        );
        setIsRunning(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cancel, isRunning, resetState]
  );

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    generate,
    cancel,
    isRunning,
    status,
    funMessage,
    partialOutput,
    spotifyProgress,
    playlistId,
    spotifyPlaylistId,
    metrics,
    error,
    completeData,
    coverStatus: coverStatusEvent,
    coverArtUrl,
  };
}
