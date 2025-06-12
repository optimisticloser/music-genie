# Deployment Guide (Vercel)

---

## 1. Push to GitHub

1. Create a new private repo.
2. Push your Next.js code.

```bash
git remote add origin git@github.com:yourname/music-genie.git
git push -u origin main
```

---

## 2. Import Project into Vercel

1. Log in to https://vercel.com → **New Project**.
2. Select the repository.
3. Vercel auto-detects Next.js and suggests the build command `npm run build` and output directory `.next`.

---

## 3. Set Environment Variables

Add the same vars from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   (mark *Encrypted*)
SPOTIFY_CLIENT_ID           (Encrypted)
SPOTIFY_CLIENT_SECRET       (Encrypted)
SPOTIFY_REDIRECT_URI        (e.g., https://musicgenie.vercel.app/api/auth/callback)
```

Tip: prefix secret-only vars with `VERCEL_` to avoid leaking in client bundles.

---

## 4. Production Database

Supabase is external to Vercel, so no extra steps are needed. Make sure RLS policies are production-ready.

---

## 5. Edge Runtime

If you rely on Supabase Edge Functions or Next.js Route Handlers running in the Edge runtime, add `export const runtime = "edge"` at the top of the handler file.

---

## 6. Custom Domain (Optional)

1. In Vercel, open **Settings → Domains**.  
2. Add `musicgenie.com` and follow DNS instructions.

---

## 7. Analytics & Logging

• Vercel provides request & function logs out of the box.  
• Add [Vercel Analytics](https://vercel.com/analytics) with a one-liner in `app/layout.tsx`.

---

## 8. Zero-Downtime DB Migrations

1. Commit SQL files inside `supabase/migrations/`.
2. Install `supabase` CLI in the build image: `npm install -g supabase` (via `vercel.json` build command override).
3. Run `supabase db push` before `next build`. 