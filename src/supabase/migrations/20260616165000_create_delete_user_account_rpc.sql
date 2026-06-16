-- Create delete_user_account RPC function
-- Allows a user to delete their own account, or an admin to delete any user account.

CREATE OR REPLACE FUNCTION public.delete_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security check: users can only delete their own account, unless they are an admin
  IF auth.uid() <> user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized to delete this account'
      USING ERRCODE = '42501';
  END IF;

  -- Delete from auth.users (this will cascade delete from public.profiles and other CASCADE-linked tables)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
