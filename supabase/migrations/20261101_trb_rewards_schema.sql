-- ==============================================================================
-- TRENDS BOX NIGERIA: IDEMPOTENT TRB REWARDS & USAGE SCHEMA MIGRATION
-- Platform: Supabase (PostgreSQL)
-- Safe to run repeatedly without error 42710 (policy already exists)
-- ==============================================================================

-- 1. Ensure 'usage' table exists with unique constraint
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_usage UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON public.usage(user_id, date);

-- 2. Create 'trb_rewards' table (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_trb_user_date ON public.trb_rewards(user_id, date);

-- 3. Enable RLS
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trb_rewards ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies before creating them to ensure 100% safe re-runs
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage;
DROP POLICY IF EXISTS "Users can insert/update their own usage" ON public.usage;
DROP POLICY IF EXISTS "Users can view their own TRB rewards" ON public.trb_rewards;
DROP POLICY IF EXISTS "Users can insert/update their own TRB rewards" ON public.trb_rewards;

-- 5. Recreate fresh RLS policies
CREATE POLICY "Users can view their own usage"
    ON public.usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own usage"
    ON public.usage FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own TRB rewards"
    ON public.trb_rewards FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own TRB rewards"
    ON public.trb_rewards FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
