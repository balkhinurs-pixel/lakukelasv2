-- First, drop the existing function to avoid conflicts with return type changes.
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid, text);

-- Then, create the function with the correct logic and explicit return type.
CREATE OR REPLACE FUNCTION activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void -- Explicitly state that this function does not return a value.
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it.
AS $$
DECLARE
  v_code_id UUID;
BEGIN
  -- 1. Find the ID of a valid, unused activation code.
  SELECT id INTO v_code_id FROM public.activation_codes
  WHERE code = p_code AND is_used = false
  LIMIT 1;

  -- 2. If no valid code is found, raise a specific error.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- 3. Update the user's profile to 'Pro'.
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- 4. Mark the specific code as used, recording who used it and when.
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;
  
END;
$$;

-- Grant ownership to the postgres superuser to ensure it has all necessary permissions.
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;
