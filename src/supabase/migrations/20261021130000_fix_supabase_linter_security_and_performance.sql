-- ====================================================================================
-- Migration: 20261021130000_fix_supabase_linter_security_and_performance.sql
-- Description: Comprehensive resolution of all Supabase Database Linter & Advisor warnings:
--   1. Function security hardening: Pin mutable search_path to (public, pg_temp).
--   2. RLS policy unrestricted bypass hardening (party_rooms, party_players).
--   3. Multiple permissive policies elimination (consolidated single policy per action).
--   4. RLS performance optimization: Replace auth.<function>() with (select auth.<function>()).
--   5. Full idempotence: DROP POLICY IF EXISTS before every CREATE POLICY to avoid 42710 errors.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. FUNCTION SEARCH_PATH HARDENING (Security: Prevent search_path hijacking)
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  -- set_landing_testimonials_updated_at
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_landing_testimonials_updated_at') THEN
    ALTER FUNCTION public.set_landing_testimonials_updated_at() SET search_path = public, pg_temp;
  END IF;

  -- trigger_update_streak
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_update_streak') THEN
    ALTER FUNCTION public.trigger_update_streak() SET search_path = public, pg_temp;
  END IF;

  -- assign_earned_titles (uuid)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assign_earned_titles') THEN
    ALTER FUNCTION public.assign_earned_titles(uuid) SET search_path = public, pg_temp;
  END IF;

  -- trigger_assign_titles_on_duel
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_assign_titles_on_duel') THEN
    ALTER FUNCTION public.trigger_assign_titles_on_duel() SET search_path = public, pg_temp;
  END IF;

  -- update_updated_at_column
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
  END IF;

  -- update_user_streak (uuid)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_streak') THEN
    ALTER FUNCTION public.update_user_streak(uuid) SET search_path = public, pg_temp;
  END IF;

  -- check_title_requirement (uuid, text, int)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_title_requirement') THEN
    ALTER FUNCTION public.check_title_requirement(uuid, text, int) SET search_path = public, pg_temp;
  END IF;

  -- trigger_assign_titles
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_assign_titles') THEN
    ALTER FUNCTION public.trigger_assign_titles() SET search_path = public, pg_temp;
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 2. PARTY ROOMS & PLAYERS RLS HARDENING (Fix: Unrestricted WITH CHECK true)
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'party_rooms') THEN
    DROP POLICY IF EXISTS "Authenticated users can create party rooms" ON public.party_rooms;
    CREATE POLICY "Authenticated users can create party rooms"
    ON public.party_rooms FOR INSERT
    TO authenticated
    WITH CHECK (
      (select auth.uid()) IS NOT NULL
      AND (host_id IS NULL OR host_id = (select auth.uid()))
    );

    DROP POLICY IF EXISTS "Host can update party room" ON public.party_rooms;
    DROP POLICY IF EXISTS "Host or admin can update party room" ON public.party_rooms;
    CREATE POLICY "Host or admin can update party room"
    ON public.party_rooms FOR UPDATE
    TO public
    USING (
      (host_id IS NOT NULL AND host_id = (select auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    )
    WITH CHECK (
      (host_id IS NOT NULL AND host_id = (select auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'party_players') THEN
    DROP POLICY IF EXISTS "Public can join as party player" ON public.party_players;
    CREATE POLICY "Public can join as party player"
    ON public.party_players FOR INSERT
    TO public
    WITH CHECK (
      room_id IS NOT NULL
      AND length(trim(pseudo)) > 0
      AND length(trim(guest_id)) > 0
      AND EXISTS (
        SELECT 1 FROM public.party_rooms r
        WHERE r.id = room_id
          AND r.status IN ('lobby', 'question', 'round_reveal', 'podium', 'finished')
      )
    );

    DROP POLICY IF EXISTS "Public can update own party player" ON public.party_players;
    CREATE POLICY "Public can update own party player"
    ON public.party_players FOR UPDATE
    TO public
    USING (
      length(trim(guest_id)) > 0
      AND (
        user_id IS NULL
        OR user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
      )
    )
    WITH CHECK (
      length(trim(guest_id)) > 0
      AND (
        user_id IS NULL
        OR user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
      )
    );
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 3. PROFILES
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = id
);

DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  (select auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 4. SITE CONFIG (Eliminate multiple permissive SELECT + (select auth.uid()))
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_config') THEN
    DROP POLICY IF EXISTS "Admins can manage site config" ON public.site_config;
    DROP POLICY IF EXISTS "Anyone can view site config" ON public.site_config;
    DROP POLICY IF EXISTS "Admins can insert site config" ON public.site_config;
    DROP POLICY IF EXISTS "Admins can update site config" ON public.site_config;
    DROP POLICY IF EXISTS "Admins can delete site config" ON public.site_config;

    CREATE POLICY "Anyone can view site config"
    ON public.site_config FOR SELECT
    TO anon, authenticated
    USING (true);

    CREATE POLICY "Admins can insert site config"
    ON public.site_config FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins can update site config"
    ON public.site_config FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins can delete site config"
    ON public.site_config FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 5. BADGES, DIFFICULTIES, TITLES, CATEGORIES (Split FOR ALL to INSERT/UPDATE/DELETE)
-- ------------------------------------------------------------------------------------
-- Badges
DROP POLICY IF EXISTS "Only admins can manage badges" ON public.badges;
DROP POLICY IF EXISTS "Everyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Admins can insert badges" ON public.badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.badges;
DROP POLICY IF EXISTS "Admins can delete badges" ON public.badges;

CREATE POLICY "Everyone can view badges"
ON public.badges FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert badges"
ON public.badges FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update badges"
ON public.badges FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete badges"
ON public.badges FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Difficulties
DROP POLICY IF EXISTS "Only admins can manage difficulties" ON public.difficulties;
DROP POLICY IF EXISTS "Everyone can view difficulties" ON public.difficulties;
DROP POLICY IF EXISTS "Admins can insert difficulties" ON public.difficulties;
DROP POLICY IF EXISTS "Admins can update difficulties" ON public.difficulties;
DROP POLICY IF EXISTS "Admins can delete difficulties" ON public.difficulties;

CREATE POLICY "Everyone can view difficulties"
ON public.difficulties FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert difficulties"
ON public.difficulties FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update difficulties"
ON public.difficulties FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete difficulties"
ON public.difficulties FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Titles
DROP POLICY IF EXISTS "Only admins can manage titles" ON public.titles;
DROP POLICY IF EXISTS "Everyone can view titles" ON public.titles;
DROP POLICY IF EXISTS "Admins can insert titles" ON public.titles;
DROP POLICY IF EXISTS "Admins can update titles" ON public.titles;
DROP POLICY IF EXISTS "Admins can delete titles" ON public.titles;

CREATE POLICY "Everyone can view titles"
ON public.titles FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert titles"
ON public.titles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update titles"
ON public.titles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete titles"
ON public.titles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 6. QUIZ TYPES (Single SELECT policy + Admin CUD)
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all quiz types" ON public.quiz_types;
DROP POLICY IF EXISTS "Anyone can view active quiz types" ON public.quiz_types;
DROP POLICY IF EXISTS "Anyone can view active quiz types or admins view all" ON public.quiz_types;
DROP POLICY IF EXISTS "Admins can insert quiz types" ON public.quiz_types;
DROP POLICY IF EXISTS "Admins can update quiz types" ON public.quiz_types;
DROP POLICY IF EXISTS "Admins can delete quiz types" ON public.quiz_types;

CREATE POLICY "Anyone can view active quiz types or admins view all"
ON public.quiz_types FOR SELECT
TO authenticated, anon
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can insert quiz types"
ON public.quiz_types FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update quiz types"
ON public.quiz_types FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete quiz types"
ON public.quiz_types FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 7. QUIZZES (Consolidated single policy per action)
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can select all quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow admins or creators to select quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can view accessible quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can view public and global quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "View quizzes policy" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes select policy" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can insert any quiz" ON public.quizzes;
DROP POLICY IF EXISTS "Users can create own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes insert policy" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes update policy" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes delete policy" ON public.quizzes;

CREATE POLICY "Quizzes select policy"
ON public.quizzes FOR SELECT
TO public
USING (
  is_public = true
  OR is_global = true
  OR creator_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.quiz_shares qs
    WHERE qs.quiz_id = id
      AND (qs.shared_with_user_id = (select auth.uid()) OR qs.shared_by_user_id = (select auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Quizzes insert policy"
ON public.quizzes FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Quizzes update policy"
ON public.quizzes FOR UPDATE
TO authenticated
USING (
  creator_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  creator_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Quizzes delete policy"
ON public.quizzes FOR DELETE
TO authenticated
USING (
  creator_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 8. QUESTIONS (Consolidated single policy per action)
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Users can manage questions of own quizzes" ON public.questions;
DROP POLICY IF EXISTS "Users can view questions of accessible quizzes" ON public.questions;
DROP POLICY IF EXISTS "Questions select policy" ON public.questions;
DROP POLICY IF EXISTS "Questions insert policy" ON public.questions;
DROP POLICY IF EXISTS "Questions update policy" ON public.questions;
DROP POLICY IF EXISTS "Questions delete policy" ON public.questions;

CREATE POLICY "Questions select policy"
ON public.questions FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id
      AND (
        q.is_public = true
        OR q.is_global = true
        OR q.creator_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.quiz_shares qs
          WHERE qs.quiz_id = q.id
            AND (qs.shared_with_user_id = (select auth.uid()) OR qs.shared_by_user_id = (select auth.uid()))
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Questions insert policy"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND q.creator_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Questions update policy"
ON public.questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND q.creator_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND q.creator_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Questions delete policy"
ON public.questions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND q.creator_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 9. DUELS (Consolidated single policy per action)
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all duels" ON public.duels;
DROP POLICY IF EXISTS "Users can view own duels" ON public.duels;
DROP POLICY IF EXISTS "Users and admins can view duels" ON public.duels;
DROP POLICY IF EXISTS "Users can create duels from pending invitation" ON public.duels;
DROP POLICY IF EXISTS "Users can create duels" ON public.duels;
DROP POLICY IF EXISTS "Users from pending invitation or admins can insert duels" ON public.duels;
DROP POLICY IF EXISTS "Users can update own duels" ON public.duels;
DROP POLICY IF EXISTS "Admins can update duels" ON public.duels;
DROP POLICY IF EXISTS "Admins can delete duels" ON public.duels;

CREATE POLICY "Users and admins can view duels"
ON public.duels FOR SELECT
TO authenticated
USING (
  player1_id = (select auth.uid())
  OR player2_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Users from pending invitation or admins can insert duels"
ON public.duels FOR INSERT
TO authenticated
WITH CHECK (
  (
    player2_id = (select auth.uid())
    AND player1_id <> (select auth.uid())
    AND status = 'in_progress'
    AND match_type = 'casual'
    AND winner_id IS NULL
    AND player1_session_id IS NULL
    AND player2_session_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.duel_invitations di
      WHERE di.from_user_id = player1_id
        AND di.to_user_id = player2_id
        AND di.quiz_id = quiz_id
        AND di.status = 'pending'
        AND COALESCE(di.expires_at, NOW() + interval '1 second') > NOW()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update duels"
ON public.duels FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete duels"
ON public.duels FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 10. GAME SESSIONS & ANSWERS
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view all completed sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view own or completed sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Admins can update all sessions" ON public.game_sessions;

CREATE POLICY "Users can view own or completed sessions"
ON public.game_sessions FOR SELECT
TO authenticated, anon
USING (
  completed = true
  OR player_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Users can create own sessions"
ON public.game_sessions FOR INSERT
TO authenticated
WITH CHECK (
  player_id = (select auth.uid())
);

CREATE POLICY "Admins can update all sessions"
ON public.game_sessions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Game answers
DROP POLICY IF EXISTS "Users can view own answers" ON public.game_answers;
CREATE POLICY "Users can view own answers"
ON public.game_answers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_sessions gs
    WHERE gs.id = session_id AND gs.player_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert own answers" ON public.game_answers;
CREATE POLICY "Users can insert own answers"
ON public.game_answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_sessions gs
    WHERE gs.id = session_id AND gs.player_id = (select auth.uid())
  )
);


-- ------------------------------------------------------------------------------------
-- 11. DUEL FEATURE FLAGS, MATCHMAKING QUEUE & INVITATIONS
-- ------------------------------------------------------------------------------------
-- Feature flags
DROP POLICY IF EXISTS "Admins can manage duel feature flags" ON public.duel_feature_flags;
DROP POLICY IF EXISTS "Authenticated can read duel feature flags" ON public.duel_feature_flags;
DROP POLICY IF EXISTS "Admins can insert duel feature flags" ON public.duel_feature_flags;
DROP POLICY IF EXISTS "Admins can update duel feature flags" ON public.duel_feature_flags;
DROP POLICY IF EXISTS "Admins can delete duel feature flags" ON public.duel_feature_flags;

CREATE POLICY "Authenticated can read duel feature flags"
ON public.duel_feature_flags FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert duel feature flags"
ON public.duel_feature_flags FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update duel feature flags"
ON public.duel_feature_flags FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete duel feature flags"
ON public.duel_feature_flags FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Matchmaking queue
DROP POLICY IF EXISTS "Users can view own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can view own matchmaking queue"
ON public.duel_matchmaking_queue FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can insert own matchmaking queue"
ON public.duel_matchmaking_queue FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can delete own matchmaking queue"
ON public.duel_matchmaking_queue FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid())
);

-- Duel invitations
DROP POLICY IF EXISTS "Users can view own invitations" ON public.duel_invitations;
CREATE POLICY "Users can view own invitations"
ON public.duel_invitations FOR SELECT
TO authenticated
USING (
  from_user_id = (select auth.uid())
  OR to_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can create invitations" ON public.duel_invitations;
CREATE POLICY "Users can create invitations"
ON public.duel_invitations FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update received invitations" ON public.duel_invitations;
CREATE POLICY "Users can update received invitations"
ON public.duel_invitations FOR UPDATE
TO authenticated
USING (
  to_user_id = (select auth.uid())
)
WITH CHECK (
  to_user_id = (select auth.uid())
);


-- ------------------------------------------------------------------------------------
-- 12. FRIENDSHIPS & CHAT MESSAGES
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
ON public.friendships FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
  OR friend_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships"
ON public.friendships FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update friendships" ON public.friendships;
CREATE POLICY "Users can update friendships"
ON public.friendships FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid())
  OR friend_id = (select auth.uid())
)
WITH CHECK (
  user_id = (select auth.uid())
  OR friend_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;
CREATE POLICY "Users can delete friendships"
ON public.friendships FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid())
  OR friend_id = (select auth.uid())
);

-- Chat messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
CREATE POLICY "Users can view own messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  from_user_id = (select auth.uid())
  OR to_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update received messages" ON public.chat_messages;
CREATE POLICY "Users can update received messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  to_user_id = (select auth.uid())
)
WITH CHECK (
  to_user_id = (select auth.uid())
);


-- ------------------------------------------------------------------------------------
-- 13. QUIZ SHARES & QUIZ VALIDATIONS
-- ------------------------------------------------------------------------------------
-- Quiz shares
DROP POLICY IF EXISTS "Users can view shares involving them" ON public.quiz_shares;
CREATE POLICY "Users can view shares involving them"
ON public.quiz_shares FOR SELECT
TO authenticated
USING (
  shared_by_user_id = (select auth.uid())
  OR shared_with_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can create shares for own quizzes" ON public.quiz_shares;
CREATE POLICY "Users can create shares for own quizzes"
ON public.quiz_shares FOR INSERT
TO authenticated
WITH CHECK (
  shared_by_user_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id AND q.creator_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete shares involving them" ON public.quiz_shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON public.quiz_shares;
CREATE POLICY "Users can delete shares involving them"
ON public.quiz_shares FOR DELETE
TO authenticated
USING (
  shared_by_user_id = (select auth.uid())
  OR shared_with_user_id = (select auth.uid())
);

-- Quiz validations
DROP POLICY IF EXISTS "Admins can manage validations" ON public.quiz_validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.quiz_validations;
DROP POLICY IF EXISTS "Admins can select validations" ON public.quiz_validations;
DROP POLICY IF EXISTS "Admins can insert validations" ON public.quiz_validations;
DROP POLICY IF EXISTS "Admins can update validations" ON public.quiz_validations;
DROP POLICY IF EXISTS "Admins can delete validations" ON public.quiz_validations;

CREATE POLICY "Admins can select validations"
ON public.quiz_validations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can insert validations"
ON public.quiz_validations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update validations"
ON public.quiz_validations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete validations"
ON public.quiz_validations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 14. QUIZ SCORE CHALLENGES (Consolidated UPDATE + (select auth.uid()))
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_score_challenges') THEN
    DROP POLICY IF EXISTS "Challenges: participants can select" ON public.quiz_score_challenges;
    DROP POLICY IF EXISTS "Challenges: sender can insert" ON public.quiz_score_challenges;
    DROP POLICY IF EXISTS "Challenges: receiver can accept/decline" ON public.quiz_score_challenges;
    DROP POLICY IF EXISTS "Challenges: sender can mark completed" ON public.quiz_score_challenges;
    DROP POLICY IF EXISTS "Challenges: participants or admins can update" ON public.quiz_score_challenges;

    CREATE POLICY "Challenges: participants can select"
    ON public.quiz_score_challenges FOR SELECT
    TO authenticated
    USING (
      (select auth.uid()) = from_user_id
      OR (select auth.uid()) = to_user_id
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Challenges: sender can insert"
    ON public.quiz_score_challenges FOR INSERT
    TO authenticated
    WITH CHECK (
      (select auth.uid()) = from_user_id
    );

    CREATE POLICY "Challenges: participants or admins can update"
    ON public.quiz_score_challenges FOR UPDATE
    TO authenticated
    USING (
      (select auth.uid()) = to_user_id
      OR (select auth.uid()) = from_user_id
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    )
    WITH CHECK (
      (select auth.uid()) = to_user_id
      OR (select auth.uid()) = from_user_id
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 15. REPORTS & WARNINGS
-- ------------------------------------------------------------------------------------
-- Reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
TO authenticated
USING (
  reporter_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports"
ON public.reports FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Warnings (Single SELECT policy + (select auth.uid()))
DROP POLICY IF EXISTS "Users can view their own reports" ON public.warnings;
DROP POLICY IF EXISTS "Admins can view all warnings" ON public.warnings;
DROP POLICY IF EXISTS "Users can view own reports or admins view all warnings" ON public.warnings;
DROP POLICY IF EXISTS "Users can report other users" ON public.warnings;
DROP POLICY IF EXISTS "Admins can update warnings" ON public.warnings;

CREATE POLICY "Users can view own reports or admins view all warnings"
ON public.warnings FOR SELECT
TO authenticated
USING (
  reporter_user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

CREATE POLICY "Users can report other users"
ON public.warnings FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = reporter_user_id 
  AND (select auth.uid()) != reported_user_id
);

CREATE POLICY "Admins can update warnings"
ON public.warnings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);


-- ------------------------------------------------------------------------------------
-- 16. GEOJSON CUSTOM MAPS & LANDING TESTIMONIALS
-- ------------------------------------------------------------------------------------
-- GeoJSON custom maps
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geojson_custom_maps') THEN
    DROP POLICY IF EXISTS "Admins read all geojson maps" ON public.geojson_custom_maps;
    DROP POLICY IF EXISTS "Public read approved geojson maps" ON public.geojson_custom_maps;
    DROP POLICY IF EXISTS "Public read approved or admins read all geojson maps" ON public.geojson_custom_maps;
    DROP POLICY IF EXISTS "Admins insert geojson maps" ON public.geojson_custom_maps;
    DROP POLICY IF EXISTS "Admins update geojson maps" ON public.geojson_custom_maps;
    DROP POLICY IF EXISTS "Admins delete geojson maps" ON public.geojson_custom_maps;

    CREATE POLICY "Public read approved or admins read all geojson maps"
    ON public.geojson_custom_maps FOR SELECT
    TO authenticated, anon
    USING (
      status = 'approved'
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins insert geojson maps"
    ON public.geojson_custom_maps FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
      AND (created_by = (select auth.uid()) OR created_by IS NULL)
    );

    CREATE POLICY "Admins update geojson maps"
    ON public.geojson_custom_maps FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins delete geojson maps"
    ON public.geojson_custom_maps FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;
END $$;

-- Landing testimonials
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'landing_testimonials') THEN
    DROP POLICY IF EXISTS "Admins can manage landing testimonials" ON public.landing_testimonials;
    DROP POLICY IF EXISTS "Public can read active landing testimonials" ON public.landing_testimonials;
    DROP POLICY IF EXISTS "Public read active or admins read all testimonials" ON public.landing_testimonials;
    DROP POLICY IF EXISTS "Admins insert landing testimonials" ON public.landing_testimonials;
    DROP POLICY IF EXISTS "Admins update landing testimonials" ON public.landing_testimonials;
    DROP POLICY IF EXISTS "Admins delete landing testimonials" ON public.landing_testimonials;

    CREATE POLICY "Public read active or admins read all testimonials"
    ON public.landing_testimonials FOR SELECT
    TO authenticated, anon
    USING (
      is_active = true
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins insert landing testimonials"
    ON public.landing_testimonials FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins update landing testimonials"
    ON public.landing_testimonials FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    CREATE POLICY "Admins delete landing testimonials"
    ON public.landing_testimonials FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 17. ADMIN ACTIVITY LOGS, USER BADGES, USER TITLES, MONTHLY RANKINGS HISTORY
-- ------------------------------------------------------------------------------------
-- Admin activity logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_activity_logs') THEN
    DROP POLICY IF EXISTS "Admins can view admin activity logs" ON public.admin_activity_logs;
    CREATE POLICY "Admins can view admin activity logs"
    ON public.admin_activity_logs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

    DROP POLICY IF EXISTS "Admins can insert admin activity logs" ON public.admin_activity_logs;
    CREATE POLICY "Admins can insert admin activity logs"
    ON public.admin_activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );
  END IF;
END $$;

-- User badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view user badges" ON public.user_badges;
CREATE POLICY "Users can view user badges"
ON public.user_badges FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Users or admins can insert user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "Users or admins can insert user_badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- User titles
DROP POLICY IF EXISTS "Users can view own titles" ON public.user_titles;
DROP POLICY IF EXISTS "Users can view user titles" ON public.user_titles;
CREATE POLICY "Users can view user titles"
ON public.user_titles FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Users can update own titles" ON public.user_titles;
CREATE POLICY "Users can update own titles"
ON public.user_titles FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid())
)
WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users or admins can insert user_titles" ON public.user_titles;
DROP POLICY IF EXISTS "System can insert titles" ON public.user_titles;
CREATE POLICY "Users or admins can insert user_titles"
ON public.user_titles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

-- Monthly rankings history
DROP POLICY IF EXISTS "System can insert rankings" ON public.monthly_rankings_history;
CREATE POLICY "System can insert rankings"
ON public.monthly_rankings_history FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view all rankings history" ON public.monthly_rankings_history;
CREATE POLICY "Users can view all rankings history"
ON public.monthly_rankings_history FOR SELECT
TO authenticated, anon
USING (true);
