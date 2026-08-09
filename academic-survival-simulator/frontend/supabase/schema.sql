-- =============================================================================
-- Student Analysis – Supabase Schema
-- =============================================================================
-- Run this file in the Supabase SQL Editor (or via supabase db push) to
-- create all tables, enable RLS, and apply row-level security policies.
--
-- Every table follows the same conventions:
--   • id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
--   • created_at  timestamptz NOT NULL DEFAULT now()
--   • user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE
--                 (except leaderboard which stores a denormalised display_name)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. users
--    Mirrors auth.users with extra application-level columns.
--    A row is created (via trigger or Server Action) on first sign-up.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  full_name     text,
  avatar_url    text,
  user_type     text        NOT NULL DEFAULT 'student'
                              CHECK (user_type IN ('student', 'teacher', 'admin')),
  cgpa          numeric(4,2) NOT NULL DEFAULT 0
                              CHECK (cgpa >= 0 AND cgpa <= 10),
  is_premium    boolean      NOT NULL DEFAULT false,
  premium_expires_at timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row.
CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- Users can insert their own row (profile creation on sign-up).
CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own row (profile edits).
CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ---------------------------------------------------------------------------
-- 2. daily_assessments
--    One row per quiz/test attempt per day per subject.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_assessments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  subject     text        NOT NULL,
  score       numeric(5,2) NOT NULL CHECK (score >= 0),
  total       numeric(5,2) NOT NULL CHECK (total > 0),
  notes       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_assessments: owner all"
  ON public.daily_assessments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 3. critical_thinking_submissions
--    Stores a user's open-ended response and the Gemini AI feedback.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.critical_thinking_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id     text        NOT NULL DEFAULT 'default_challenge',
  prompt           text        NOT NULL,
  response         text        NOT NULL,
  gemini_feedback  text,
  score            numeric(4,2) CHECK (score >= 0 AND score <= 10),
  created_at       timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.critical_thinking_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "critical_thinking_submissions: owner all"
  ON public.critical_thinking_submissions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 4. revision_shelf
--    Spaced-repetition items the user has saved for review.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revision_shelf (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic         text        NOT NULL,
  subject       text        NOT NULL,
  due_date      date        NOT NULL DEFAULT CURRENT_DATE,
  review_count  int         NOT NULL DEFAULT 0,
  last_reviewed timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.revision_shelf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revision_shelf: owner all"
  ON public.revision_shelf FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 5. leaderboard
--    Public read — anyone can see the rankings.
--    Writes are owner-only (the row's user_id must equal auth.uid()).
--    Actual rank computation is done server-side / via a DB function.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text        NOT NULL,
  score         numeric(10,2) NOT NULL DEFAULT 0,
  rank          int,
  period        text        NOT NULL DEFAULT 'all-time'
                              CHECK (period IN ('weekly', 'monthly', 'all-time')),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can read leaderboard rows.
CREATE POLICY "leaderboard: public select"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Only the owner of a row can insert / update / delete it.
CREATE POLICY "leaderboard: owner write"
  ON public.leaderboard FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leaderboard: owner update"
  ON public.leaderboard FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leaderboard: owner delete"
  ON public.leaderboard FOR DELETE
  USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 6. gemini_usage
--    Tracks per-request token/cost consumption for rate-limiting & billing.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gemini_usage (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type  text        NOT NULL,
  tokens_used   int         NOT NULL DEFAULT 0,
  cost_usd      numeric(10,6) NOT NULL DEFAULT 0,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.gemini_usage ENABLE ROW LEVEL SECURITY;

-- Users can see their own usage history.
CREATE POLICY "gemini_usage: owner select"
  ON public.gemini_usage FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own usage records (via a Server Action).
CREATE POLICY "gemini_usage: owner insert"
  ON public.gemini_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. subscriptions
--    Tracks Razorpay plan subscriptions.
--
--    READ  → owner only  (user can see their own plan)
--    WRITE → service_role only  (never the anon/authenticated client)
--
--    All subscription mutations (create, update, cancel) must go through
--    a server-side Route Handler that uses the admin client (admin.ts),
--    typically triggered by a Razorpay webhook.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan              text        NOT NULL CHECK (plan IN ('free', 'pro', 'elite')),
  status            text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  razorpay_sub_id   text        UNIQUE,
  razorpay_plan_id  text,
  valid_until       timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own subscription row.
CREATE POLICY "subscriptions: owner select"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- INSERT is restricted to the service role (e.g. webhook handler via admin.ts).
-- The authenticated client role can NEVER insert a subscription row directly.
CREATE POLICY "subscriptions: service_role insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE is also restricted to the service role.
CREATE POLICY "subscriptions: service_role update"
  ON public.subscriptions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- =============================================================================
-- Utility: auto-update updated_at columns
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach the trigger to tables that have an updated_at column.
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================================
-- Utility: auto-create a users row when someone signs up via Supabase Auth
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with the privileges of the function owner
SET search_path = public  -- prevents search_path hijacking
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
