-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Admins can manage all profiles" ON "public"."profiles";

DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "public"."classes";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."classes";

DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "public"."subjects";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."subjects";

DROP POLICY IF EXISTS "Enable read for users based on teacher_id" ON "public"."students";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."students";

DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "public"."schedule";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."schedule";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."schedule";

DROP POLICY IF EXISTS "Enable access for users based on user_id" ON "public"."attendance_history";
DROP POLICY IF EXISTS "Enable access for users based on user_id" ON "public"."grade_history";
DROP POLICY IF EXISTS "Enable access for users based on user_id" ON "public"."journals";

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role;
DROP FUNCTION IF EXISTS public.activate_account_with_code;

-- Create school_years table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name character varying NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT school_years_pkey PRIMARY KEY (id),
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Add RLS to school_years
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."school_years"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);


-- Add active_school_year_id to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_schema = 'public'
        AND    table_name = 'profiles'
        AND    column_name = 'active_school_year_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN active_school_year_id UUID;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;
    END IF;
END;
$$;


-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'teacher', 'Free');
  RETURN new;
END;
$function$;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to safely get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Function for account activation
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_id UUID;
BEGIN
    -- Find the code and lock the row for update
    SELECT id INTO code_id
    FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false
    FOR UPDATE;

    -- If code is not found or already used, raise an exception
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code not found or already used';
    END IF;

    -- Update the user's account status to Pro
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the activation code as used
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id;

    RETURN true;
END;
$$;

-- Recreate RLS Policies
-- Profiles Table
CREATE POLICY "Enable read access for all authenticated users" ON "public"."profiles"
AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

-- Other tables
CREATE POLICY "Enable access for users based on user_id" ON "public"."classes"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable access for users based on user_id" ON "public"."subjects"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable read for users based on teacher_id" ON "public"."students"
AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))));
CREATE POLICY "Enable insert for authenticated users only" ON "public"."students"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1 FROM classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))));

CREATE POLICY "Enable access for users based on user_id" ON "public"."schedule"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable access for users based on user_id" ON "public"."attendance_history"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable access for users based on user_id" ON "public"."grade_history"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable access for users based on user_id" ON "public"."journals"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Activation Codes Table (only admins can read all, nobody can update/delete directly)
CREATE POLICY "Enable read access for admins" ON "public"."activation_codes"
AS PERMISSIVE FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable insert for admins" ON "public"."activation_codes"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'admin');
