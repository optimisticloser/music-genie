-- Create demo prompts table
CREATE TABLE public.demo_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert sample demo prompts
INSERT INTO public.demo_prompts (prompt, category, popularity_score) VALUES
('Funky 80s songs played on cop movies', 'movie_soundtrack', 95),
('Indie folk songs for studying on rainy days', 'mood_activity', 88),
('High-energy electronic music for workouts', 'fitness', 92),
('Jazz standards that played in old movies', 'vintage_soundtrack', 78),
('Chill lo-fi beats for late night coding', 'work_study', 85),
('Upbeat reggae songs for summer road trips', 'travel_adventure', 90),
('Melancholic singer-songwriter tracks about heartbreak', 'emotional', 72),
('Epic orchestral pieces from fantasy movie soundtracks', 'cinematic', 82),
('Retro synthwave tracks that sound like Miami Vice', 'retro_tv', 89),
('Acoustic guitar songs perfect for campfire gatherings', 'social_acoustic', 75),
('Hard rock anthems that make you feel invincible', 'motivational', 87),
('Bossa nova classics for a sophisticated dinner party', 'elegant_social', 73),
('Punk rock songs about teenage rebellion', 'rebellious', 76),
('Ambient soundscapes for deep meditation sessions', 'wellness', 71),
('Country songs about small town life and pickup trucks', 'americana', 74),
('Disco hits that dominated the dance floor in the 70s', 'dance_vintage', 83),
('Alternative rock from the grunge era that defined a generation', 'generational', 81),
('Celtic folk music that tells ancient stories', 'cultural_traditional', 69),
('Trap beats with heavy bass for the gym', 'fitness_modern', 86),
('Romantic ballads perfect for a candlelit dinner', 'romantic', 79);

-- Create index for better performance
CREATE INDEX idx_demo_prompts_category ON public.demo_prompts(category);
CREATE INDEX idx_demo_prompts_popularity ON public.demo_prompts(popularity_score DESC);
CREATE INDEX idx_demo_prompts_active ON public.demo_prompts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.demo_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policy - demo prompts are public (read-only)
CREATE POLICY "Demo prompts are viewable by everyone" ON public.demo_prompts
  FOR SELECT USING (is_active = true); 