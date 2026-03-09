-- Allow admins to delete user profiles.
-- This is required for account deletion from the admin panel.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can delete all profiles'
  ) THEN
    CREATE POLICY "Admins can delete all profiles"
      ON profiles
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
      );
  END IF;
END $$;
