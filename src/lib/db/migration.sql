-- This migration script is designed to be run on an existing database
-- to apply changes without dropping all tables.

-- Drop the old trigger and function if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Use CASCADE to ensure dependent objects are also dropped, fixing permission errors.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text) CASCADE;

-- Recreate the handle_new_user function which will be triggered by a webhook
-- It's defined with SECURITY DEFINER to run with the permissions of the function owner.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for school years if it doesn't exist
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid,
    CONSTRAINT school_years_pkey PRIMARY KEY (id),
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS and define policies for school_years
ALTER TABLE IF EXISTS public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert access for assigned teacher" ON public.school_years FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Add active_school_year_id to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_school_year_id UUID,
ADD CONSTRAINT IF NOT EXISTS profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- A new, secure function to handle account activation.
-- This function will be called via an RPC from a server-side action,
-- which has the necessary permissions.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void AS $$
DECLARE
  code_id UUID;
BEGIN
    -- Check for the code's existence and get its ID
    SELECT id INTO code_id FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false;

    -- If no code was found or it's already used, raise an exception that the action can catch
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
    END IF;

    -- Update the activation code table
    UPDATE public.activation_codes
    SET
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now(),
        used_by_email = user_email_to_set
    WHERE id = code_id;

    -- Update the user's profile status
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the new function to authenticated users
-- This allows the function to be called via RPC from server actions.
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(TEXT, UUID, TEXT) TO authenticated;
