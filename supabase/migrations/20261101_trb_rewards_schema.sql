-- ==============================================================================
-- TRENDS BOX NIGERIA: TRB REWARD & DAILY QUOTA SCHEMA MIGRATION
-- Platform: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Ensure 'usage' table exists with strict composite primary key (user_id, date)
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_usage UNIQUE (user_id, date)
);

-- Index for instant quota lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON public.usage(user_id, date);

-- 2. Create 'trb_rewards' table to persist watched ads and bonus quotas across devices
-- This prevents tampering if the user clears browser data / cookies.
CREATE TABLE IF NOT EXISTS public.trb_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    ads_watched INTEGER NOT NULL DEFAULT 0 CHECK (ads_watched >= 0 AND ads_watched <= 10),
    bonus_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_trb UNIQUE (user_id, date)
);

-- Index for instant TRB lookups
CREATE INDEX IF NOT EXISTS idx_trb_user_date ON public.trb_rewards(user_id, date);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trb_rewards ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own usage
CREATE POLICY "Users can view their own usage"
    ON public.usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert/update their own usage
CREATE POLICY "Users can insert/update their own usage"
    ON public.usage FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own TRB rewards
CREATE POLICY "Users can view their own TRB rewards"
    ON public.trb_rewards FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert/update their own TRB rewards
CREATE POLICY "Users can insert/update their own TRB rewards"
    ON public.trb_rewards FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
