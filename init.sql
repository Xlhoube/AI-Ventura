-- Create tables for AI-Ventura

CREATE TABLE IF NOT EXISTS sessions (
    code TEXT PRIMARY KEY,
    host_id UUID NOT NULL,
    story_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'lobby',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    author_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    original_language TEXT DEFAULT 'en',
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_likes (
    story_id UUID REFERENCES public_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    language_preference TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    stories_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (simplified for this app as it relies heavily on client-side state)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create generous policies for the MVP
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all on public_stories" ON public_stories FOR ALL USING (true);
CREATE POLICY "Allow all on story_likes" ON story_likes FOR ALL USING (true);
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
