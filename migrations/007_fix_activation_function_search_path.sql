-- Drop the old function with its specific parameter signature to avoid conflicts
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);

-- Recreate the function with the correct logic and, crucially, the correct search_path configuration
-- This ensures the function can find tables in the 'public' schema when executed.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void -- Explicitly define the return type
LANGUAGE plpgsql
SECURITY DEFINER
-- This is the critical line that was missing. It tells the function where to look for tables.
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  -- 1. Find the code_id for the given activation code, ensuring it is not used.
  -- This is the critical step to ensure we are targeting a valid, available code.
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false;

  -- 2. Check if a valid, unused code was found. If not, raise an exception with a clear message.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. Update the activation_codes table using the specific ID found.
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update the user's profile to 'Pro'.
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

END;
$$;

-- Grant ownership to the postgres role to ensure it has all necessary privileges.
-- This is a safety measure to confirm permissions are correctly set.
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;
