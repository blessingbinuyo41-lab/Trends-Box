-- ==============================================================================
-- TRENDS BOX NIGERIA: DATABASE OPTIMIZATION & HISTORY RETENTION CLEANUP
-- Platform: Supabase (PostgreSQL)
-- Rule:
--   - Preserves up to 10 most recent past generations per user indefinitely.
--   - Any excess past generations (rank > 10) older than 24 hours are auto-deleted.
-- ==============================================================================

-- 1. Index on (user_id, created_at DESC) for fast history fetches and pruning
CREATE INDEX IF NOT EXISTS idx_history_user_created_at 
ON public.history(user_id, created_at DESC);

-- 2. Trigger function to automatically purge excess generations older than 24h
CREATE OR REPLACE FUNCTION public.cleanup_stale_history()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.history
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id, created_at,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rank
            FROM public.history
            WHERE user_id = NEW.user_id
        ) ranked
        WHERE rank > 10
          AND created_at < NOW() - INTERVAL '24 hours'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to history table after new generation inserts
DROP TRIGGER IF EXISTS trigger_cleanup_stale_history ON public.history;
CREATE TRIGGER trigger_cleanup_stale_history
AFTER INSERT ON public.history
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_stale_history();
