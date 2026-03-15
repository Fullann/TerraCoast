-- Extend badges/titles progression with duel-specific requirements.
-- Examples: 50 duel wins, 3000+ ranked duel rating.

CREATE OR REPLACE FUNCTION public.check_badge_requirement(
  p_user_id uuid,
  p_requirement_type text,
  p_requirement_value integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_count integer;
  v_total_score integer;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_requirement_type
    WHEN 'level' THEN
      RETURN COALESCE(v_profile.level, 1) >= p_requirement_value;
    WHEN 'wins', 'duel_wins' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.duels
      WHERE winner_id = p_user_id
        AND status = 'completed';
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'duel_rating' THEN
      RETURN COALESCE(v_profile.duel_rating, 1000) >= p_requirement_value;
    WHEN 'quizzes_completed' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'perfect_scores' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true
        AND COALESCE(total_questions, 0) > 0
        AND COALESCE(correct_answers, 0) = COALESCE(total_questions, 0);
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'streak' THEN
      RETURN COALESCE(v_profile.current_streak, 0) >= p_requirement_value;
    WHEN 'total_points', 'total_score' THEN
      SELECT COALESCE(SUM(score), 0)::integer INTO v_total_score
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true;
      RETURN COALESCE(v_total_score, 0) >= p_requirement_value;
    WHEN 'friends_count' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.friendships
      WHERE (user_id = p_user_id OR friend_id = p_user_id)
        AND status = 'accepted';
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'published_quizzes' THEN
      RETURN COALESCE(v_profile.published_quiz_count, 0) >= p_requirement_value;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_title_requirement(
  p_user_id uuid,
  p_requirement_type text,
  p_requirement_value int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_count int;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_requirement_type
    WHEN 'level' THEN
      RETURN COALESCE(v_profile.level, 1) >= p_requirement_value;
    WHEN 'wins', 'duel_wins' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.duels
      WHERE winner_id = p_user_id
        AND status = 'completed';
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'duel_rating' THEN
      RETURN COALESCE(v_profile.duel_rating, 1000) >= p_requirement_value;
    WHEN 'quizzes_completed' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'perfect_scores' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true
        AND correct_answers = total_questions;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'published_quizzes' THEN
      RETURN COALESCE(v_profile.published_quiz_count, 0) >= p_requirement_value;
    WHEN 'total_score' THEN
      SELECT COALESCE(SUM(score), 0) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'account_age_days' THEN
      RETURN EXTRACT(EPOCH FROM (NOW() - v_profile.created_at)) / 86400 >= p_requirement_value;
    WHEN 'first_place' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.monthly_rankings_history
      WHERE user_id = p_user_id
        AND final_rank = 1;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'monthly_rank' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.monthly_rankings_history
      WHERE user_id = p_user_id
        AND final_rank <= p_requirement_value;
      RETURN COALESCE(v_count, 0) > 0;
    WHEN 'badges_earned' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.user_badges
      WHERE user_id = p_user_id;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'friends_count' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.friendships
      WHERE (user_id = p_user_id OR friend_id = p_user_id)
        AND status = 'accepted';
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_progression_on_duel_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  -- Fire once when duel completes, and once after ranked rating processing if needed.
  IF COALESCE(OLD.status, '') <> 'completed'
     OR (COALESCE(OLD.ranking_processed, false) = false AND COALESCE(NEW.ranking_processed, false) = true) THEN
    IF NEW.player1_id IS NOT NULL THEN
      PERFORM public.assign_earned_badges(NEW.player1_id);
      PERFORM public.assign_earned_titles(NEW.player1_id);
    END IF;

    IF NEW.player2_id IS NOT NULL THEN
      PERFORM public.assign_earned_badges(NEW.player2_id);
      PERFORM public.assign_earned_titles(NEW.player2_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_auto_assign_progression_on_duel_complete ON public.duels;
CREATE TRIGGER zz_auto_assign_progression_on_duel_complete
AFTER UPDATE ON public.duels
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.trigger_assign_progression_on_duel_complete();

INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value)
VALUES
  ('dueliste_50', 'A remporte 50 duels', 'swords', 'duel_wins', 50),
  ('elo_3000', 'Atteindre 3000 ELO en duel classe', 'crown', 'duel_rating', 3000)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.titles (name, description, requirement_type, requirement_value, is_special)
VALUES
  ('Seigneur des Duels', 'A remporte 50 duels', 'duel_wins', 50, true),
  ('Legende ELO', 'Atteindre 3000 ELO en duel classe', 'duel_rating', 3000, true)
ON CONFLICT (name) DO NOTHING;
