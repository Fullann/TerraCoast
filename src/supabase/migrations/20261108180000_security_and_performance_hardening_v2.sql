-- ====================================================================================
-- Migration: 20261108180000_security_and_performance_hardening_v2.sql
-- Description:
--   1. S1: Tighten Supabase Storage RLS on `avatars` & `quiz-images` (owner/admin check on UPDATE & DELETE).
--   2. S2: Harden `grant_arcade_rewards` RPC (strict cap on `p_score`, anti-spam cooldown, pinned search_path).
--   3. S2: Server-side trigger for `profiles.published_quiz_count` (eliminates unauthorized client-side profile updates).
--   4. S4: Tighten `party_players` UPDATE policy with score bounds & active room verification.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. STORAGE RLS HARDENING (`avatars` & `quiz-images`)
-- ------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (select auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
CREATE POLICY "Authenticated update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Authenticated delete avatars" ON storage.objects;
CREATE POLICY "Authenticated delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
);

-- Quiz Images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quiz-images'
  AND (select auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quiz-images'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'quiz-images'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quiz-images'
  AND (
    owner = (select auth.uid())
    OR (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
);


-- ------------------------------------------------------------------------------------
-- 2. HARDEN `grant_arcade_rewards` RPC (Cap `p_score` + Anti-Spam Rate Limiting)
-- ------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_arcade_rewards(
  p_xp integer,
  p_score integer DEFAULT 0,
  p_game_mode text DEFAULT 'arcade'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_profile public.profiles%ROWTYPE;
  v_current_month text;
  v_needs_month_reset boolean;
  v_earned_xp integer;
  v_earned_score integer;
  v_new_xp integer;
  v_new_level integer;
  v_leveled_up boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour enregistrer les récompenses'
      USING ERRCODE = '42501';
  END IF;

  -- Bypasser la protection de profil pour cette fonction server-side sécurisée
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  -- Verrouillage du profil pour mise à jour atomique
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable';
  END IF;

  -- Protection anti-spam (cooldown de 3 secondes minimum entre deux attributions de récompenses)
  IF v_profile.updated_at IS NOT NULL AND (NOW() - v_profile.updated_at) < interval '3 seconds' THEN
    RETURN jsonb_build_object(
      'success', false,
      'throttled', true,
      'earned_xp', 0,
      'new_experience_points', COALESCE(v_profile.experience_points, 0),
      'new_level', COALESCE(v_profile.level, 1),
      'leveled_up', false,
      'game_mode', p_game_mode
    );
  END IF;

  -- Borner strictement les gains d'XP et de score mensuel (max 1000 par appel)
  v_earned_xp := GREATEST(0, LEAST(1000, COALESCE(p_xp, 0)));
  v_earned_score := GREATEST(0, LEAST(1000, COALESCE(p_score, v_earned_xp)));

  v_current_month := to_char(NOW(), 'YYYY-MM');
  v_needs_month_reset := COALESCE(v_profile.last_reset_month, '') <> v_current_month;

  IF v_needs_month_reset AND v_profile.last_reset_month IS NOT NULL THEN
    PERFORM public.finalize_monthly_ranking_if_needed(v_profile.last_reset_month);
  END IF;

  v_new_xp := COALESCE(v_profile.experience_points, 0) + v_earned_xp;
  v_new_level := FLOOR(v_new_xp / 100) + 1;
  v_leveled_up := v_new_level > COALESCE(v_profile.level, 1);

  UPDATE public.profiles
  SET
    experience_points = v_new_xp,
    level = v_new_level,
    monthly_score = CASE
      WHEN v_needs_month_reset THEN v_earned_score
      ELSE COALESCE(monthly_score, 0) + v_earned_score
    END,
    monthly_games_played = CASE
      WHEN v_needs_month_reset THEN 1
      ELSE COALESCE(monthly_games_played, 0) + 1
    END,
    last_reset_month = v_current_month,
    updated_at = NOW()
  WHERE id = v_profile.id;

  -- Vérification des nouveaux badges et titres débloqués
  PERFORM public.assign_earned_badges(v_profile.id);
  PERFORM public.assign_earned_titles(v_profile.id);

  RETURN jsonb_build_object(
    'success', true,
    'earned_xp', v_earned_xp,
    'earned_score', v_earned_score,
    'new_experience_points', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'game_mode', p_game_mode
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_arcade_rewards(integer, integer, text) TO authenticated;


-- ------------------------------------------------------------------------------------
-- 3. SERVER-SIDE TRIGGER FOR `published_quiz_count`
-- ------------------------------------------------------------------------------------
-- Nettoyage préventif des données existantes
UPDATE public.profiles
SET published_quiz_count = LEAST(10, GREATEST(0, COALESCE(published_quiz_count, 0)))
WHERE (role IS NULL OR role <> 'admin') AND (published_quiz_count > 10 OR published_quiz_count < 0);

-- Supprimer la contrainte restrictive CHECK (published_quiz_count <= 10) sur profiles
-- pour permettre aux admins d'avoir plus de 10 quiz (et pour les utilisateurs normaux, la limite
-- de 10 quiz publics est validée par l'application, avec borne à >= 0).
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_published_quiz_count_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_published_quiz_count_check
CHECK (
  published_quiz_count >= 0
  AND (role = 'admin' OR published_quiz_count <= 10)
);

CREATE OR REPLACE FUNCTION public.sync_profile_published_quiz_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user_id uuid;
  v_role text;
  v_count integer;
BEGIN
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  v_target_user_id := COALESCE(NEW.creator_id, OLD.creator_id);
  IF v_target_user_id IS NOT NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = v_target_user_id;

    SELECT count(*)::integer INTO v_count
    FROM public.quizzes q
    WHERE q.creator_id = v_target_user_id
      AND (q.is_public = true OR q.pending_validation = true);

    -- Pour un utilisateur régulier, borner entre 0 et 10; pour un admin, illimité
    IF v_role <> 'admin' THEN
      v_count := LEAST(10, GREATEST(0, v_count));
    ELSE
      v_count := GREATEST(0, v_count);
    END IF;

    UPDATE public.profiles p
    SET published_quiz_count = v_count
    WHERE p.id = v_target_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_profile_published_quiz_count ON public.quizzes;
CREATE TRIGGER trigger_sync_profile_published_quiz_count
AFTER INSERT OR UPDATE OF is_public, pending_validation, creator_id OR DELETE
ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_published_quiz_count();


-- ------------------------------------------------------------------------------------
-- 4. PARTY PLAYERS RLS HARDENING (Score bounds & active room check)
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'party_players') THEN
    DROP POLICY IF EXISTS "Public can update own party player" ON public.party_players;
    CREATE POLICY "Public can update own party player"
    ON public.party_players FOR UPDATE
    TO public
    USING (
      length(trim(guest_id)) > 0
      AND EXISTS (
        SELECT 1 FROM public.party_rooms r
        WHERE r.id = room_id
          AND r.status IN ('lobby', 'question', 'round_reveal', 'podium', 'finished')
      )
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
      AND score >= 0
      AND score <= 100000
      AND streak >= 0
      AND last_points_earned >= 0
      AND last_points_earned <= 2000
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
