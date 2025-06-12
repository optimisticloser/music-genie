# Architecture

> Last updated: 2024-06-12

This document gives a birds-eye view of how the Music Genie codebase is structured and how its major subsystems interact.

---

## 1. High-Level Overview

```
Browser ──▶ Next.js (App Router)
              ├─ React Server Components (RSC)
              ├─ API Routes (Route Handlers)
              └─ Edge Runtime
                   │
                   ▼
              Supabase  ←─▶  Postgres
                   ▲
                   │
              Spotify Web API
```

1. **Next.js** serves both the UI and server-side logic.
2. **Supabase** provides Postgres, Auth, Storage and optional Edge Functions.
3. **Spotify Web API** is called from the server (for secret-bearing calls) or client (for playback-only scopes).

---

## 2. Folder Layout

```
src/
├─ app/                  # Next.js routes (RSC + SSR)
│   └─ (marketing)/      # static marketing pages (optional)
│   └─ (dashboard)/      # authenticated user app shell
│        ├─ layout.tsx   # shell with <Sidebar /> + <Header />
│        ├─ page.tsx     # home – generate playlist
│        ├─ history/
│        └─ settings/
├─ components/
│   ├─ ui/               # auto-generated shadcn
│   └─ shared/
├─ features/             # domain modules (see below)
│   ├─ auth/
│   ├─ playlist/         # Core playlist generation, versioning, and editing logic
│   ├─ history/
│   └─ settings/
├─ lib/
│   ├─ supabase/         # typed Supabase client factory
│   ├─ spotify/          # Helpers, typed API SDK, and Enrichment Service
│   └─ utils.ts
└─ types/
    └─ index.ts          # Includes types for Playlist, Song, StreamingServiceSongStatus
```

### 2.1 Domain-Driven `features/`

Each feature directory owns:
• UI components specific to the feature (built to be responsive)
• Server actions / route handlers
• Client hooks (e.g., `useGeneratePlaylist`)
• Type definitions

This keeps files small and colocated, surfacing boundaries naturally.

---

## 3. Data Flow

1. **Authentication** – handled by Supabase Auth (OAuth with Spotify).
2. **Generate Playlist**
   a. User submits a prompt → handled by a **Server Action**. A placeholder/loading playlist is immediately added to the UI state.
   b. Server Action calls the **AI Service** with the structured prompt.
   c. AI returns a list of song ideas.
   d. The **Spotify Enrichment Service** takes these ideas, searches for them on Spotify, and builds a rich track list. It also tracks which songs were found and which were not.
   e. The resulting playlist, including the `StreamingServiceSongStatus`, is saved to Postgres.
   f. The final tracklist is streamed back to the client, replacing the placeholder.
3. **Edit Playlist**
   a. User modifies an existing playlist (e.g., "add more upbeat tracks").
   b. This triggers the generation flow again, but with the context of the original playlist.
   c. A **new version** of the playlist is created in the database, linked to the original. The old playlist is preserved for history. This creates a version chain.
4. **History** – DB query that can retrieve all versions of a playlist.

---

## 4. Supabase Schema (v1 - with Versioning)

The schema must support playlist versioning to match the power of the iOS app.

```sql
-- For Music Genie App

-- Represents a "root" playlist idea that can have multiple versions.
create table playlist_lineage (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  created_at   timestamptz default now() not null
);

-- A specific, immutable version of a playlist.
create table playlists (
  id           uuid primary key default gen_random_uuid(),
  lineage_id   uuid references playlist_lineage on delete cascade not null,
  user_id      uuid references auth.users not null,
  prompt       text,
  title        text not null,
  description  text,
  version      integer not null default 1,
  created_at   timestamptz default now() not null
);

-- Tracks within a specific playlist version.
create table playlist_tracks (
  playlist_id   uuid references playlists on delete cascade,
  track_id      text,             -- Spotify track ID
  track_name    text,
  artist_name   text,
  album_art_url text,
  position      int,
  -- Status of the track from the streaming service search
  found_on_spotify boolean default true,
  primary key (playlist_id, track_id, position)
);
```

RLS policies restrict rows to `auth.uid()`. See [`docs/supabase-setup.md`](./supabase-setup.md).

---

## 5. Error Handling & Observability

• UI level: toast notifications from `sonner` (optional).  
• Server level: typed errors returned from server actions.  
• Logging: `console` in dev, [Vercel OG logging](https://vercel.com/docs/observability/logs) in prod.

---

## 6. Why shadcn/ui?

shadcn/ui gives us:
• Accessible primitives (Radix UI)
• Tailwind-friendly styling via `class-variance-authority`, perfect for responsive design.
• Copy-paste source, so no runtime dependency

---

## 7. Future Improvements

• Add Edge Function to call OpenAI for advanced prompt parsing.  
• Use [Drizzle](https://drizzle.team/) for ORM-level type safety.  
• Offline caching via Service Worker. 