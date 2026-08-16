-- =============================================================================
-- Academic Survival Simulator — Master Supabase SQL Schema
-- =============================================================================
-- This script is fully idempotent (safe to run multiple times without errors).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. users table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  full_name           text,
  avatar_url          text,
  avatar_id           text NOT NULL DEFAULT 'boy_1',
  user_type           text NOT NULL DEFAULT 'student' CHECK (user_type IN ('student', 'teacher', 'admin')),
  student_level       text NOT NULL DEFAULT 'college' CHECK (student_level IN ('school_9_10', 'school_11_12', 'college', 'postgraduate')),
  student_field       text NOT NULL DEFAULT 'computer_science',
  cgpa                numeric(4,2) NOT NULL DEFAULT 3.00 CHECK (cgpa >= 0 AND cgpa <= 10),
  is_premium          boolean NOT NULL DEFAULT false,
  premium_expires_at  timestamptz,
  last_weekly_review  date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Safely add new columns to existing databases (idempotent)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_id          text NOT NULL DEFAULT 'boy_1';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_level      text NOT NULL DEFAULT 'college';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_field      text NOT NULL DEFAULT 'computer_science';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_weekly_review date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS semester_start_date timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_rollup_date   date;


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clean up any legacy permissive select policies
DROP POLICY IF EXISTS "users: leaderboard select" ON public.users;
DROP POLICY IF EXISTS "users: select own row" ON public.users;
CREATE POLICY "users: select own row" ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users: insert own row" ON public.users;
CREATE POLICY "users: insert own row" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users: update own row" ON public.users;
CREATE POLICY "users: update own row" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- SECURITY TRIGGER: Prevent regular users from directly modifying sensitive columns
CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If update is initiated by a regular user session (not service_role)
  IF (current_setting('request.jwt.claim.role', true) <> 'service_role') THEN
    IF (NEW.is_premium IS DISTINCT FROM OLD.is_premium) OR
       (NEW.user_type IS DISTINCT FROM OLD.user_type) OR
       (NEW.cgpa IS DISTINCT FROM OLD.cgpa) OR
       (NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at) THEN
      RAISE EXCEPTION 'Unauthorized: Mutating is_premium, user_type, or cgpa directly is forbidden.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_users_columns_trg ON public.users;
CREATE TRIGGER protect_users_columns_trg
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_user_columns();


-- ---------------------------------------------------------------------------
-- 2. daily_assessments table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_assessments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  subject     text NOT NULL,
  score       numeric(5,2) NOT NULL CHECK (score >= 0),
  total       numeric(5,2) NOT NULL CHECK (total > 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_assessments: owner all" ON public.daily_assessments;
CREATE POLICY "daily_assessments: owner all" ON public.daily_assessments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 3. critical_thinking_submissions table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.critical_thinking_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id     text NOT NULL DEFAULT 'default_challenge',
  prompt           text NOT NULL,
  response         text NOT NULL,
  gemini_feedback  text,
  score            numeric(4,2) DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  quality_score    int DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  uniqueness_score int DEFAULT 0 CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.critical_thinking_submissions ENABLE ROW LEVEL SECURITY;

-- Safety migrations if table pre-existed
ALTER TABLE public.critical_thinking_submissions ADD COLUMN IF NOT EXISTS quality_score int DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE public.critical_thinking_submissions ADD COLUMN IF NOT EXISTS uniqueness_score int DEFAULT 0 CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100);

DROP POLICY IF EXISTS "critical_thinking_submissions: owner all" ON public.critical_thinking_submissions;
CREATE POLICY "critical_thinking_submissions: owner all" ON public.critical_thinking_submissions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ct_submissions: owner select" ON public.critical_thinking_submissions;
CREATE POLICY "ct_submissions: owner select" ON public.critical_thinking_submissions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ct_submissions: owner insert" ON public.critical_thinking_submissions;
CREATE POLICY "ct_submissions: owner insert" ON public.critical_thinking_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ct_monthly ON public.critical_thinking_submissions (user_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- 4. revision_shelf table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revision_shelf (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'UNTITLED',
  subject     text NOT NULL DEFAULT 'GENERAL',
  summary     text NOT NULL DEFAULT '',
  difficulty  text NOT NULL DEFAULT 'Hard' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revision_shelf ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.revision_shelf ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'UNTITLED';
ALTER TABLE public.revision_shelf ADD COLUMN IF NOT EXISTS topic text NOT NULL DEFAULT '';
ALTER TABLE public.revision_shelf ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '';
ALTER TABLE public.revision_shelf ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'Hard';

DROP POLICY IF EXISTS "revision_shelf: owner all" ON public.revision_shelf;
CREATE POLICY "revision_shelf: owner all" ON public.revision_shelf FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 5. daily_habit_logs table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_habit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hrs   numeric(4,2) NOT NULL DEFAULT 7.5,
  study_hrs   numeric(4,2) NOT NULL DEFAULT 6.0,
  coffee_cups int NOT NULL DEFAULT 3,
  gaming_hrs  numeric(4,2) NOT NULL DEFAULT 2.0,
  energy      int DEFAULT 75,
  stress      int DEFAULT 40,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_date)
);

ALTER TABLE public.daily_habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habit_logs: owner all" ON public.daily_habit_logs;
CREATE POLICY "habit_logs: owner all" ON public.daily_habit_logs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 6. quiz_attempts table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject         text NOT NULL DEFAULT 'General',
  questions_total int NOT NULL DEFAULT 10,
  correct_answers int NOT NULL DEFAULT 0,
  score_pct       numeric(5,2) NOT NULL DEFAULT 0,
  cgpa_delta      numeric(4,3) NOT NULL DEFAULT 0,
  attempted_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts: owner all" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts: owner all" ON public.quiz_attempts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. leaderboard table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  score         numeric(10,2) NOT NULL DEFAULT 0,
  rank          int,
  period        text NOT NULL DEFAULT 'all-time' CHECK (period IN ('weekly', 'monthly', 'all-time')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leaderboard: public select" ON public.leaderboard;
CREATE POLICY "leaderboard: public select" ON public.leaderboard FOR SELECT USING (true);

-- Clean up any legacy owner write policies
DROP POLICY IF EXISTS "leaderboard: owner write" ON public.leaderboard;
DROP POLICY IF EXISTS "leaderboard: owner update" ON public.leaderboard;
DROP POLICY IF EXISTS "leaderboard: owner delete" ON public.leaderboard;

-- Direct writes restricted to server-side service_role (prevent client score tampering)
DROP POLICY IF EXISTS "leaderboard: service_role insert" ON public.leaderboard;
CREATE POLICY "leaderboard: service_role insert" ON public.leaderboard FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "leaderboard: service_role update" ON public.leaderboard;
CREATE POLICY "leaderboard: service_role update" ON public.leaderboard FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "leaderboard: service_role delete" ON public.leaderboard;
CREATE POLICY "leaderboard: service_role delete" ON public.leaderboard FOR DELETE USING (auth.role() = 'service_role');


-- ---------------------------------------------------------------------------
-- 8. gemini_usage table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gemini_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type  text NOT NULL,
  tokens_used   int NOT NULL DEFAULT 0,
  cost_usd      numeric(10,6) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gemini_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gemini_usage: owner select" ON public.gemini_usage;
CREATE POLICY "gemini_usage: owner select" ON public.gemini_usage FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "gemini_usage: owner insert" ON public.gemini_usage;
CREATE POLICY "gemini_usage: owner insert" ON public.gemini_usage FOR INSERT WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 9. subscriptions table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan              text NOT NULL CHECK (plan IN ('free', 'pro', 'elite', 'monthly', 'quarterly', 'yearly')),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  razorpay_sub_id   text UNIQUE,
  razorpay_plan_id  text,
  valid_until       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions: owner select" ON public.subscriptions;
CREATE POLICY "subscriptions: owner select" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "subscriptions: service_role insert" ON public.subscriptions;
CREATE POLICY "subscriptions: service_role insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "subscriptions: service_role update" ON public.subscriptions;
CREATE POLICY "subscriptions: service_role update" ON public.subscriptions FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ---------------------------------------------------------------------------
-- 10. Triggers & Automation Functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_leaderboard_updated_at ON public.leaderboard;
CREATE TRIGGER set_leaderboard_updated_at BEFORE UPDATE ON public.leaderboard FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_revision_shelf_updated_at ON public.revision_shelf;
CREATE TRIGGER set_revision_shelf_updated_at BEFORE UPDATE ON public.revision_shelf FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto create profile row on auth signup with Level 1 Novice CGPA (3.00)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, cgpa)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    3.00
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 11. quiz_sessions — server-side quiz session tracking (anti-spoofing)
-- ---------------------------------------------------------------------------
-- Stores generated quiz questions server-side so /api/quiz/submit can verify
-- that correctAnswers is re-calculated server-side, not trusted from client.
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions       jsonb NOT NULL,                 -- full question array with correctAnswer
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  submitted_at    timestamptz,                    -- null = not yet submitted; set on first submit
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_sessions: owner all" ON public.quiz_sessions;
CREATE POLICY "quiz_sessions: owner all" ON public.quiz_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auto-delete expired sessions (optional — run manually or via pg_cron)
-- DELETE FROM public.quiz_sessions WHERE expires_at < now();

-- Fix: remove duplicate SELECT policy on critical_thinking_submissions
-- (keep only the "owner all" FOR ALL policy, drop the redundant SELECT-only one)
DROP POLICY IF EXISTS "ct_submissions: owner select" ON public.critical_thinking_submissions;
