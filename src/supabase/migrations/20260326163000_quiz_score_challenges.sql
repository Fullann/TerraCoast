-- Friend challenges: "Beat my score on this quiz"

CREATE TABLE IF NOT EXISTS public.quiz_score_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  target_score integer NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  beaten boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS quiz_score_challenges_to_user_pending_idx
ON public.quiz_score_challenges (to_user_id, status, created_at DESC);

-- RLS
ALTER TABLE public.quiz_score_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenges: participants can select" ON public.quiz_score_challenges;
CREATE POLICY "Challenges: participants can select"
ON public.quiz_score_challenges FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Challenges: sender can insert" ON public.quiz_score_challenges;
CREATE POLICY "Challenges: sender can insert"
ON public.quiz_score_challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Challenges: receiver can accept/decline" ON public.quiz_score_challenges;
CREATE POLICY "Challenges: receiver can accept/decline"
ON public.quiz_score_challenges FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Challenges: sender can mark completed" ON public.quiz_score_challenges;
CREATE POLICY "Challenges: sender can mark completed"
ON public.quiz_score_challenges FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id)
WITH CHECK (auth.uid() = to_user_id OR auth.uid() = from_user_id);

