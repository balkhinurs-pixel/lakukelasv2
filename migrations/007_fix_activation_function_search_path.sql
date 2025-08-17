-- First, drop the old, faulty function to ensure a clean slate.
-- This is necessary because we are changing its fundamental behavior.
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid, text);

-- Then, recreate the function with the correct and complete definition.
CREATE OR REPLACE FUNCTION activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
-- SECURITY DEFINER allows the function to run with the permissions of the user who created it (postgres).
-- This is crucial for modifying tables owned by the system.
SECURITY DEFINER
-- SET search_path is the critical fix. It tells the function to look for tables in the 'public' schema.
-- Without this, the function can't find 'activation_codes' or 'profiles'.
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  -- 1. Find the ID of the provided activation code, but only if it's not already used.
  -- The "FOR UPDATE" clause locks the selected row to prevent race conditions where two users might try to use the same code simultaneously.
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false
  LIMIT 1
  FOR UPDATE;

  -- 2. If no valid, unused code is found (v_code_id is null), raise a specific error.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. If a valid code was found, proceed with the transaction.
  -- Update the activation_codes table to mark the code as used.
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update the user's profile to set their account status to 'Pro'.
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- The function completes successfully. The changes will be committed automatically.
END;
$$;
