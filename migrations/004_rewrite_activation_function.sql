-- This migration rewrites the activation function to be more robust and secure.

CREATE OR REPLACE FUNCTION activate_account_with_code(p_code TEXT, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_code_id UUID;
BEGIN
    -- Find the specific, unused code.
    -- LOCK the row for update to prevent race conditions.
    SELECT id INTO v_code_id
    FROM public.activation_codes
    WHERE code = p_code AND is_used = FALSE
    FOR UPDATE;

    -- If no such code is found (either invalid or already locked/used), raise an error.
    IF v_code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code is invalid or has already been used.';
    END IF;

    -- If we found a valid code, proceed with the transaction.
    -- Update the activation code record.
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = p_user_id,
        used_at = now()
    WHERE id = v_code_id;

    -- Update the user's profile to 'Pro'.
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant ownership to ensure permissions are correct
ALTER FUNCTION activate_account_with_code(text, uuid) OWNER TO postgres;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION activate_account_with_code(text, uuid) TO authenticated;
