-- First, drop the existing function to avoid signature conflicts.
-- We drop both possible signatures that might exist due to previous errors.
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid, text);
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid);

-- Then, create the correct, robust function from scratch.
CREATE OR REPLACE FUNCTION activate_account_with_code(
    p_code TEXT,
    p_user_id UUID,
    p_user_email TEXT
)
RETURNS void AS $$
DECLARE
    v_code_id UUID;
BEGIN
    -- Step 1: Find the code and verify it's not used. Lock the row for update.
    SELECT id INTO v_code_id
    FROM public.activation_codes
    WHERE code = p_code AND is_used = FALSE
    FOR UPDATE;

    -- Step 2: If no such code is found, raise an error.
    IF v_code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code is invalid or has already been used.';
    END IF;

    -- Step 3: Update the activation code to mark it as used.
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = p_user_id,
        used_by_email = p_user_email,
        used_at = NOW()
    WHERE id = v_code_id;

    -- Step 4: Update the user's profile to 'Pro'.
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant ownership to the postgres user to ensure it has the necessary permissions.
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;
