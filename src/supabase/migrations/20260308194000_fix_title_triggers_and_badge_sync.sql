-- Fix title assignment trigger context and sync titles after badge unlocks.

CREATE OR REPLACE FUNCTION public.trigger_assign_titles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'game_sessions' THEN
    target_user_id := (to_jsonb(NEW) ->> 'player_id')::uuid;
  ELSE
    target_user_id := (to_jsonb(NEW) ->> 'id')::uuid;
  END IF;

  IF target_user_id IS NOT NULL THEN
    PERFORM public.assign_earned_titles(target_user_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_titles_on_badge_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assign_earned_titles(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_titles_on_badge_earned ON public.user_badges;
CREATE TRIGGER auto_assign_titles_on_badge_earned
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.trigger_assign_titles_on_badge_earned();
