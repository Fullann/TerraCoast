-- Allow admins to view all quiz questions for moderation/validation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'questions'
      AND policyname = 'Admins can view all questions'
  ) THEN
    CREATE POLICY "Admins can view all questions"
      ON questions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
