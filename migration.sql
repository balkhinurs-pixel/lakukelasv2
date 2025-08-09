-- Disables the trigger to safely drop the function
ALTER TABLE "auth"."users" DISABLE TRIGGER "on_auth_user_created";

-- Drops the dependent objects first, then the function itself
DROP FUNCTION IF EXISTS "public"."handle_new_user" CASCADE;
DROP FUNCTION IF EXISTS "public"."get_my_role" CASCADE;

-- Re-creates the function to get the user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  ELSE
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
  END IF;
END;
$$;

-- Re-creates the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    'teacher', -- Default role
    'Free'     -- Default account status
  );
  RETURN new;
END;
$$;


-- Re-enables the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create the new tables if they don't exist
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT school_years_pkey PRIMARY KEY (id),
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Add the new column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Clear all old RLS policies before creating new ones
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can read all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."classes";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."classes";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."subjects";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."subjects";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."students";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."students";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."schedule";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."schedule";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."attendance_history";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."attendance_history";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."grade_history";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."grade_history";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."journals";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."journals";
DROP POLICY IF EXISTS "Enable read access for admin" ON "public"."activation_codes";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."school_years";
DROP POLICY IF EXISTS "Enable full access for assigned teacher" ON "public"."school_years";

-- Re-create all RLS policies
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.classes FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.subjects FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

-- STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Enable full access for assigned teacher" ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));

-- SCHEDULE
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- ATTENDANCE HISTORY
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.attendance_history FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

-- GRADE HISTORY
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.grade_history FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- JOURNALS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.journals FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- ACTIVATION CODES
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for admin" ON public.activation_codes FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Enable full access for admin" ON public.activation_codes FOR ALL USING (get_my_role() = 'admin');

-- SCHOOL YEARS
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);

-- Function for activation code
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Check if the code exists and is not used
    SELECT * INTO code_record
    FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Code not found or already used';
    END IF;

    -- Update the user's account status
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the code as used
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_record.id;

END;
$$;
