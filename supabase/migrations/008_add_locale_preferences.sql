ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS default_locale TEXT NOT NULL DEFAULT 'en';

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS default_market TEXT NOT NULL DEFAULT 'US';
