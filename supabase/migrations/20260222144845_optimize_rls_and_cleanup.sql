/*
  # Optimize RLS Policies and Clean Up Unused Indexes

  1. RLS Policy Optimization
    - Replace direct auth.uid() calls with (select auth.uid()) in USING and WITH CHECK clauses
    - This improves performance by preventing re-evaluation for each row
    - Affects: profiles, history, feedback, usage tables

  2. Remove Unused Indexes
    - idx_history_user_id (not used)
    - idx_history_created_at (not used)
    - idx_feedback_user_id (not used)
    - idx_usage_user_id (not used)
    - idx_usage_date (not used)

  3. Fix Function Search Path
    - Set search_path to restrict function behavior for security
*/

-- Optimize profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Optimize history policies
DROP POLICY IF EXISTS "Users can read own history" ON history;
CREATE POLICY "Users can read own history"
  ON history
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON history;
CREATE POLICY "Users can insert own history"
  ON history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own history" ON history;
CREATE POLICY "Users can delete own history"
  ON history
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Optimize feedback policies
DROP POLICY IF EXISTS "Users can read own feedback" ON feedback;
CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Optimize usage policies
DROP POLICY IF EXISTS "Users can read own usage" ON usage;
CREATE POLICY "Users can read own usage"
  ON usage
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON usage;
CREATE POLICY "Users can insert own usage"
  ON usage
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own usage" ON usage;
CREATE POLICY "Users can update own usage"
  ON usage
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Remove unused indexes
DROP INDEX IF EXISTS idx_history_user_id;
DROP INDEX IF EXISTS idx_history_created_at;
DROP INDEX IF EXISTS idx_feedback_user_id;
DROP INDEX IF EXISTS idx_usage_user_id;
DROP INDEX IF EXISTS idx_usage_date;

-- Fix function search_path for security
ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;
