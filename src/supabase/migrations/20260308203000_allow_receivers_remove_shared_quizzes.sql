-- Allow recipients to remove shared quizzes from their own list.

DROP POLICY IF EXISTS "Users can delete own shares" ON public.quiz_shares;

CREATE POLICY "Users can delete shares involving them"
ON public.quiz_shares
FOR DELETE
TO authenticated
USING (
  shared_by_user_id = auth.uid()
  OR shared_with_user_id = auth.uid()
);
