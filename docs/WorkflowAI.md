# WorkflowAI Integration Guide

## Overview

This document explains how Play Genie integrates WorkflowAI as an alternative AI provider for playlist generation. The current implementation uses a lightweight service layer that performs direct HTTP requests with `fetch`, replacing the earlier `@workflowai/workflowai` SDK usage.

## Architecture

### Core Pieces

- **Service layer** – `workflowAIService` exposes a `generatePlaylist` helper for playlist prompts and wraps configuration checks.
- **Consumers** – API routes or React components import the service to request playlists and handle the transformed response payloads.
- **Configuration** – Environment variables (e.g., `NEXT_PUBLIC_WORKFLOWAI_API_KEY`) determine whether the WorkflowAI option is available.

This structure keeps the integration small and testable while making it easy to swap providers if needed.

## Implementation Details

### WorkflowAI Service

**File**: `src/services/workflowai.ts`

The `workflowAIService` encapsulates the direct integration with WorkflowAI's REST API. Key responsibilities include:

- Constructing the request body with `task_input.prompt`, `version`, and `use_cache` options.
- Performing a `fetch` call against `https://run.workflowai.com/v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run` with the appropriate headers.
- Logging request/response metadata for debugging purposes.
- Normalizing the API response into the application's `PlaylistGenerationResult` shape.
- Surfacing configuration helpers such as `isConfigured()` and `getStatus()`.

Consult the service class for the full implementation, including TypeScript interfaces describing request and response payloads.

### Example Usage

```ts
import { workflowAIService } from "@/services/workflowai";

const playlist = await workflowAIService.generatePlaylist(prompt, {
  version: "dev",
  useCache: "auto",
});
```

The returned object contains the playlist name, description, and normalized song metadata ready to pass to UI components or persistence layers.

## WorkflowAI API Integration

### Endpoint Configuration

```
POST /v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run
Host: https://run.workflowai.com
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### Request Format

```json
{
  "task_input": {
    "prompt": "Your playlist prompt here"
  },
  "version": "dev",
  "use_cache": "auto"
}
```

### Response Format

```json
{
  "task_output": {
    "name": "Playlist Name",
    "essay": "Playlist description...",
    "songs": [
      {
        "title": "Song Title",
        "artist": "Artist Name"
      }
    ]
  }
}
```

### Cache Options

- `"auto"` (default): Uses cache if temperature is 0 and previous run exists.
- `"always"`: Always uses cached output when available.
- `"never"`: Never uses cache.

## Setup Instructions

1. **Provide the WorkflowAI API key**:
   ```bash
   export NEXT_PUBLIC_WORKFLOWAI_API_KEY="your_actual_api_key_here"
   ```
   The `workflowAIService` reads this value during initialization and will warn if it is missing.

2. **Verify configuration**:
   - Call `workflowAIService.isConfigured()` or inspect `workflowAIService.getStatus()` to ensure the API key has been detected.
   - Use any relevant settings UI to confirm that WorkflowAI appears as an available provider.

3. **Generate playlists**:
   - Invoke `workflowAIService.generatePlaylist(prompt, options)` and handle the normalized result in your feature code.

## Benefits of WorkflowAI Integration

1. **Centralized Prompt Management** – Prompt templates can be iterated on server-side without client updates.
2. **Provider Flexibility** – Seamless switching between AI models for cost and performance optimization.
3. **Enhanced Monitoring** – Access to WorkflowAI's analytics and performance metrics.
4. **Simplified Deployment** – Managed infrastructure, automatic scaling, and built-in caching.

## Troubleshooting

- If requests fail with `WorkflowAI API key is required`, ensure `NEXT_PUBLIC_WORKFLOWAI_API_KEY` is defined in your environment (e.g., `.env.local`).
- Inspect console logs for detailed request/response diagnostics emitted by `workflowAIService`.

