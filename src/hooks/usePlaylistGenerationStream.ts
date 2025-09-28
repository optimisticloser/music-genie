import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localeToMarket } from "@/lib/locale";
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

const FALLBACK_FUN_MESSAGES = [
  "Reticulating splines…",
  "Tuning intergalactic radios…",
  "Polishing highs and waxing lows…",
  "Requesting a solo from the imaginary guitarist…",
  "Warming up virtual backup vocals…",
  "Slicing BPMs into perfect cubes…",
];

function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

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
  const t = useTranslations("dashboard.playlist.stream");
  const locale = useLocale();
  const funMessagesSource = useMemo(() => {
    const raw = t.raw("funMessages") as unknown;
    if (Array.isArray(raw) && raw.length > 0 && raw.every((entry) => typeof entry === "string")) {
      return raw as string[];
    }
    return FALLBACK_FUN_MESSAGES;
  }, [t]);

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [funMessage, setFunMessage] = useState<string>(funMessagesSource[0] ?? FALLBACK_FUN_MESSAGES[0]);
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
    if (!isRunning || hasAiUpdate || funMessagesSource.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      funIndexRef.current =
        funIndexRef.current + 1 >= funMessagesSource.length
          ? 0
          : funIndexRef.current + 1;
      setFunMessage(funMessagesSource[funIndexRef.current]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isRunning, hasAiUpdate, funMessagesSource]);

  const resetState = useCallback(() => {
    setStatus(null);
    setFunMessage(funMessagesSource[0] ?? FALLBACK_FUN_MESSAGES[0]);
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
  }, [funMessagesSource]);

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
      setStatus({ stage: "starting" });
      setFunMessage(funMessagesSource[0] ?? FALLBACK_FUN_MESSAGES[0]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const resolvedMarket = localeToMarket(locale, readClientCookie("APP_MARKET"));
        const response = await fetch("/api/playlist/generate/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            playlist_id: playlistIdOverride,
            locale,
            market: resolvedMarket,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error(t("errors.streamUnsupported"));
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
              setStatus({ stage: "complete" });
              setFunMessage(t("complete"));
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
              const message =
                typeof data?.message === "string" && data.message.trim().length > 0
                  ? data.message
                  : t("errors.unknown");
              setError(message);
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
        setError(err instanceof Error ? err.message : t("errors.unknown"));
        setIsRunning(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cancel, isRunning, resetState, funMessagesSource, t, locale]
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
