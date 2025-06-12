# Supabase Setup Guide

Follow these steps to spin up Supabase for Music Genie Web in under 5 minutes.

---

## 1. Create a Supabase Project

1. Sign in to https://app.supabase.com and hit **New project**.  
2. Choose a project name (e.g., `musicgenie`) and a secure password.  
3. Select the closest region to your audience.

After a minute Supabase will provision:
• Postgres database  
• Edge functions runtime  
• Auth & Storage buckets

---

## 2. Grab API Keys

Navigate to **Project Settings → API** and copy:

| Variable | Location | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL field | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | Used client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | Keep **secret**; only used server-side |

Add them to `.env.local` and Vercel dashboard.

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL="https://xyzcompany.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="ey..."
SUPABASE_SERVICE_ROLE_KEY="ey..."
```

---

## 3. Initialise the Schema

In the Supabase SQL editor run the script below (same as in [`docs/architecture.md`](./architecture.md)).

```sql
-- Playlist & track tables
-- paste the schema from architecture doc here
```

Alternatively, commit migration SQL in `/supabase/migrations/` and `supabase db push`.

---

## 4. Configure Row Level Security (RLS)

```sql
alter table playlists enable row level security;
alter table playlist_tracks enable row level security;

create policy "Playlists are viewable by owner" on playlists
  for select using ( auth.uid() = user_id );
create policy "Insert playlist for self" on playlists
  for insert with check ( auth.uid() = user_id );

-- repeat for playlist_tracks
```

Supabase Auth JWT will now gate DB access automatically.

---

## 5. OAuth with Spotify

Supabase Auth can proxy OAuth to Spotify:

1. Go to **Auth → Settings → External OAuth Providers**.  
2. Enable **Spotify** and paste your client ID & secret.  
3. Set redirect to `https://<project-ref>.supabase.co/auth/v1/callback`.

Your users can now sign in with their Spotify account and you'll get access tokens in `user_metadata`.

---

## 6. Local Development Options

Option A (simple): use the hosted Supabase project even in dev.  
Option B (offline): install the Supabase CLI and run `supabase start` (Docker required).

```bash
npm i -g supabase
supabase start
```

This will spin up Postgres, Studio UI and edge functions locally on ports `54322-3`.

---

## 7. Edge Functions (Optional)

Edge Functions are perfect for tasks that require your service_role key (e.g., server-side OpenAI calls).  
Place TypeScript source in `supabase/functions/` and deploy with `supabase functions deploy generatePlaylist`.

---

## 8. Further Reading

• https://supabase.com/docs  
• https://supabase.com/blog/supabase-nextjs-app-router 