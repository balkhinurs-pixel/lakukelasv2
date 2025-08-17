--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Debian 15.1-1.pgdg110+1)
-- Dumped by pg_dump version 15.1 (Debian 15.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema "public" since it already exists


--
-- Name: gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."gender" AS ENUM (
    'Laki-laki',
    'Perempuan'
);


--
-- Name: role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."role" AS ENUM (
    'admin',
    'teacher'
);


--
-- Name: status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."status" AS ENUM (
    'active',
    'graduated',
    'dropout',
    'inactive'
);


--
-- Name: student_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."student_status" AS ENUM (
    'Hadir',
    'Sakit',
    'Izin',
    'Alpha'
);


--
-- Name: activate_account_with_code(text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  code_id_to_use UUID;
BEGIN
  -- 1. Find the ID of a valid, unused activation code
  SELECT id INTO code_id_to_use
  FROM public.activation_codes
  WHERE code = activation_code_to_use AND is_used = false
  LIMIT 1;

  -- 2. If no valid code is found, raise an error
  IF code_id_to_use IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- 3. Update the user's profile to 'Pro'
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

  -- 4. Mark the specific code as used
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id_to_activate,
    used_by_email = user_email_to_set,
    used_at = now()
  WHERE id = code_id_to_use;

END;
$$;


--
-- Name: add_student_with_teacher_check(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_teacher_id UUID;
  v_nis_exists BOOLEAN;
BEGIN
  -- Get the teacher_id from the user's session
  v_teacher_id := auth.uid();

  -- Check if a student with the same NIS already exists for this teacher
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
  ) INTO v_nis_exists;

  -- If the NIS exists for this teacher, raise an exception
  IF v_nis_exists THEN
    RAISE EXCEPTION 'NIS already exists for this teacher';
  END IF;

  -- If the NIS is unique for this teacher, insert the new student
  INSERT INTO public.students (class_id, nis, name, gender, status)
  VALUES (p_class_id, p_nis, p_name, p_gender::public.gender, 'active');
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, account_status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    'teacher',
    'Free'
  );
  RETURN NEW;
END;
$$;


--
-- Name: on_delete_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."on_delete_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- This will delete the corresponding row in the public.profiles table
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: activation_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid",
    "used_at" "timestamp with time zone",
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "used_by_email" "text"
);


--
-- Name: agendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."agendas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "tag" "text",
    "color" "text" DEFAULT '#6b7280'::"text",
    "start_time" "time without time zone",
    "end_time" "time without time zone",
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);


--
-- Name: attendance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: grade_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: journals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer,
    "learning_objectives" "text" NOT NULL,
    "learning_activities" "text" NOT NULL,
    "assessment" "text",
    "reflection" "text",
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "nip" "text",
    "pangkat" "text",
    "jabatan" "text",
    "school_name" "text",
    "school_address" "text",
    "headmaster_name" "text",
    "headmaster_nip" "text",
    "school_logo_url" "text",
    "account_status" "public"."role" DEFAULT 'Free'::"public"."role" NOT NULL,
    "role" "public"."role" DEFAULT 'teacher'::"public"."role" NOT NULL,
    "email" "text",
    "active_school_year_id" "uuid"
);


--
-- Name: schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" "time without time zone" NOT NULL,
    "end_time" "time without time zone" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."school_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text" NOT NULL,
    "gender" "public"."gender" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "status" "public"."status" DEFAULT 'active'::"public"."status" NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" integer DEFAULT 75 NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: activation_codes activation_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_code_key" UNIQUE ("code");


--
-- Name: activation_codes activation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id");


--
-- Name: agendas agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."agendas"
    ADD CONSTRAINT "agendas_pkey" PRIMARY KEY ("id");


--
-- Name: attendance_history attendance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id");


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");


--
-- Name: grade_history grade_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_pkey" PRIMARY KEY ("id");


--
-- Name: journals journals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("id");


--
-- Name: school_years school_years_name_teacher_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_name_teacher_id_key" UNIQUE ("name", "teacher_id");


--
-- Name: school_years school_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_pkey" PRIMARY KEY ("id");


--
-- Name: students students_nis_class_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_nis_class_id_key" UNIQUE ("nis", "class_id");


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");


--
-- Name: on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


--
-- Name: on_auth_user_deleted; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER "on_auth_user_deleted" AFTER DELETE ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."on_delete_user"();


--
-- Name: activation_codes activation_codes_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id");


--
-- Name: agendas agendas_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."agendas"
    ADD CONSTRAINT "agendas_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: attendance_history attendance_history_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: grade_history grade_history_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: journals journals_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: journals journals_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: journals journals_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: journals journals_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_active_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_active_school_year_id_fkey" FOREIGN KEY ("active_school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: school_years school_years_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: subjects subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: activation_codes Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: agendas Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."agendas" ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_history Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: classes Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

--
-- Name: grade_history Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: journals Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;

--
-- Name: school_years Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."school_years" ENABLE ROW LEVEL SECURITY;

--
-- Name: students Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

--
-- Name: activation_codes admin_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_all_access" ON "public"."activation_codes" FOR ALL TO "service_role" USING (true);


--
-- Name: agendas owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."agendas" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: attendance_history owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."attendance_history" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: classes owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."classes" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: grade_history owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."grade_history" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: journals owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."journals" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: schedule owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."schedule" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: school_years owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."school_years" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: subjects owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."subjects" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: profiles public_profiles_read_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_profiles_read_access" ON "public"."profiles" FOR SELECT USING (true);


--
-- Name: students students_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "students_owner_access" ON "public"."students" FOR ALL USING (("auth"."uid"() IN ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id"))));


--
-- Name: profiles update_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update_own_profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"() TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"() TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"() TO "dashboard_user";


--
-- Name: FUNCTION "sign"("signables" "text", "secret" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."sign"("signables" "text", "secret" "text") TO "dashboard_user";


--
-- Name: FUNCTION "try_cast_double"("inp" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_decode"("data" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_encode"("data" "bytea"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "verify"("token" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "comment_on_column"("relation" "text", "column_name" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_root_field"("field" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_schema"("comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_table"("relation" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_type"("type" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "disable_root_field_for_role"("field" "text", "role" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "service_role";


--
-- Name: FUNCTION "exception"("message" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "service_role";


--
-- Name: FUNCTION "rebuild_schema"(); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "postgres";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "anon";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "service_role";


--
-- Name: FUNCTION "rebuild_schema"("roles" "text"[]); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "service_role";


--
-- Name: FUNCTION "resolve"("name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regclass"("relation_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regrole"("role_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regtype"("type_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "service_role";


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "decrypted_key_id"(); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "pgsodium"."decrypted_key_id"() TO "pgsodium_key_holder";


--
-- Name: FUNCTION "pgsodium_random_bytes_deterministic"("size" integer, "seed" "bytea"); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "pgsodium"."pgsodium_random_bytes_deterministic"("size" integer, "seed" "bytea") TO "service_role";


--
-- Name: TABLE "decrypted_keys"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."decrypted_keys" TO "pgsodium_key_holder";


--
-- Name: TABLE "masking_rules"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."masking_rules" TO "pgsodium_key_holder";


--
-- Name: TABLE "valid_key"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."valid_key" TO "pgsodium_key_holder";


--
-- Name: FUNCTION "activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "service_role";


--
-- Name: FUNCTION "add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "on_delete_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "service_role";


--
-- Name: TABLE "activation_codes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activation_codes" TO "anon";
GRANT ALL ON TABLE "public"."activation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_codes" TO "service_role";


--
-- Name: TABLE "agendas"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."agendas" TO "anon";
GRANT ALL ON TABLE "public"."agendas" TO "authenticated";
GRANT ALL ON TABLE "public"."agendas" TO "service_role";


--
-- Name: TABLE "attendance_history"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."attendance_history" TO "anon";
GRANT ALL ON TABLE "public"."attendance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_history" TO "service_role";


--
-- Name: TABLE "classes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";


--
-- Name: TABLE "grade_history"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."grade_history" TO "anon";
GRANT ALL ON TABLE "public"."grade_history" TO "authenticated";
GRANT ALL ON TABLE "public"."grade_history" TO "service_role";


--
-- Name: TABLE "journals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."journals" TO "anon";
GRANT ALL ON TABLE "public"."journals" TO "authenticated";
GRANT ALL ON TABLE "public"."journals" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "schedule"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."schedule" TO "anon";
GRANT ALL ON TABLE "public"."schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule" TO "service_role";


--
-- Name: TABLE "school_years"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."school_years" TO "anon";
GRANT ALL ON TABLE "public"."school_years" TO "authenticated";
GRANT ALL ON TABLE "public"."school_years" TO "service_role";


--
-- Name: TABLE "students"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";


--
-- Name: TABLE "subjects"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: activate_account_with_code(text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

ALTER FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") OWNER TO "postgres";

--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Debian 15.1-1.pgdg110+1)
-- Dumped by pg_dump version 15.1 (Debian 15.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: supabase_admin
--

-- CREATE DATABASE "postgres" WITH TEMPLATE = "template0" ENCODING = 'UTF8' LOCALE_PROVIDER = "libc" LOCALE = 'en_US.utf8';


-- ALTER DATABASE "postgres" OWNER TO "supabase_admin";

-- \connect "postgres"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema "public" since it already exists


--
-- Name: gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."gender" AS ENUM (
    'Laki-laki',
    'Perempuan'
);


--
-- Name: role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."role" AS ENUM (
    'admin',
    'teacher'
);


--
-- Name: status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."status" AS ENUM (
    'active',
    'graduated',
    'dropout',
    'inactive'
);


--
-- Name: student_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."student_status" AS ENUM (
    'Hadir',
    'Sakit',
    'Izin',
    'Alpha'
);


--
-- Name: activate_account_with_code(text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  code_id_to_use UUID;
BEGIN
  -- 1. Find the ID of a valid, unused activation code
  SELECT id INTO code_id_to_use
  FROM public.activation_codes
  WHERE code = activation_code_to_use AND is_used = false
  LIMIT 1;

  -- 2. If no valid code is found, raise an error
  IF code_id_to_use IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- 3. Update the user's profile to 'Pro'
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

  -- 4. Mark the specific code as used
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id_to_activate,
    used_by_email = user_email_to_set,
    used_at = now()
  WHERE id = code_id_to_use;

END;
$$;


--
-- Name: add_student_with_teacher_check(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_teacher_id UUID;
  v_nis_exists BOOLEAN;
BEGIN
  -- Get the teacher_id from the user's session
  v_teacher_id := auth.uid();

  -- Check if a student with the same NIS already exists for this teacher
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
  ) INTO v_nis_exists;

  -- If the NIS exists for this teacher, raise an exception
  IF v_nis_exists THEN
    RAISE EXCEPTION 'NIS already exists for this teacher';
  END IF;

  -- If the NIS is unique for this teacher, insert the new student
  INSERT INTO public.students (class_id, nis, name, gender, status)
  VALUES (p_class_id, p_nis, p_name, p_gender::public.gender, 'active');
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, account_status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    'teacher',
    'Free'
  );
  RETURN NEW;
END;
$$;


--
-- Name: on_delete_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."on_delete_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- This will delete the corresponding row in the public.profiles table
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: activation_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid",
    "used_at" "timestamp with time zone",
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "used_by_email" "text"
);


--
-- Name: agendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."agendas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "tag" "text",
    "color" "text" DEFAULT '#6b7280'::"text",
    "start_time" "time without time zone",
    "end_time" "time without time zone",
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);


--
-- Name: attendance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: grade_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: journals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer,
    "learning_objectives" "text" NOT NULL,
    "learning_activities" "text" NOT NULL,
    "assessment" "text",
    "reflection" "text",
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid"
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "nip" "text",
    "pangkat" "text",
    "jabatan" "text",
    "school_name" "text",
    "school_address" "text",
    "headmaster_name" "text",
    "headmaster_nip" "text",
    "school_logo_url" "text",
    "account_status" "public"."role" DEFAULT 'Free'::"public"."role" NOT NULL,
    "role" "public"."role" DEFAULT 'teacher'::"public"."role" NOT NULL,
    "email" "text",
    "active_school_year_id" "uuid"
);


--
-- Name: schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" "time without time zone" NOT NULL,
    "end_time" "time without time zone" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."school_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text" NOT NULL,
    "gender" "public"."gender" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "status" "public"."status" DEFAULT 'active'::"public"."status" NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" integer DEFAULT 75 NOT NULL,
    "teacher_id" "uuid" NOT NULL
);


--
-- Name: activation_codes activation_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_code_key" UNIQUE ("code");


--
-- Name: activation_codes activation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id");


--
-- Name: agendas agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."agendas"
    ADD CONSTRAINT "agendas_pkey" PRIMARY KEY ("id");


--
-- Name: attendance_history attendance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id");


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");


--
-- Name: grade_history grade_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_pkey" PRIMARY KEY ("id");


--
-- Name: journals journals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("id");


--
-- Name: school_years school_years_name_teacher_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_name_teacher_id_key" UNIQUE ("name", "teacher_id");


--
-- Name: school_years school_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_pkey" PRIMARY KEY ("id");


--
-- Name: students students_nis_class_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_nis_class_id_key" UNIQUE ("nis", "class_id");


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");


--
-- Name: on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


--
-- Name: on_auth_user_deleted; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER "on_auth_user_deleted" AFTER DELETE ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."on_delete_user"();


--
-- Name: activation_codes activation_codes_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activation_codes"
    ADD CONSTRAINT "activation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id");


--
-- Name: agendas agendas_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."agendas"
    ADD CONSTRAINT "agendas_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: attendance_history attendance_history_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: attendance_history attendance_history_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."attendance_history"
    ADD CONSTRAINT "attendance_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: grade_history grade_history_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: grade_history grade_history_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grade_history"
    ADD CONSTRAINT "grade_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: journals journals_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: journals journals_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: journals journals_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: journals journals_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_active_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_active_school_year_id_fkey" FOREIGN KEY ("active_school_year_id") REFERENCES "public"."school_years"("id") ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;


--
-- Name: schedule schedule_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: school_years school_years_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."school_years"
    ADD CONSTRAINT "school_years_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;


--
-- Name: subjects subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: activation_codes Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: agendas Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."agendas" ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_history Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: classes Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

--
-- Name: grade_history Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: journals Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;

--
-- Name: school_years Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."school_years" ENABLE ROW LEVEL SECURITY;

--
-- Name: students Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects Enable RLS; Type: POLICY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

--
-- Name: activation_codes admin_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_all_access" ON "public"."activation_codes" FOR ALL TO "service_role" USING (true);


--
-- Name: agendas owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."agendas" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: attendance_history owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."attendance_history" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: classes owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."classes" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: grade_history owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."grade_history" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: journals owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."journals" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: schedule owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."schedule" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: school_years owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."school_years" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: subjects owner_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner_all_access" ON "public"."subjects" FOR ALL USING (("auth"."uid"() = "teacher_id")) WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: profiles public_profiles_read_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public_profiles_read_access" ON "public"."profiles" FOR SELECT USING (true);


--
-- Name: students students_owner_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "students_owner_access" ON "public"."students" FOR ALL USING (("auth"."uid"() IN ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id"))));


--
-- Name: profiles update_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update_own_profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"() TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"() TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"() TO "dashboard_user";


--
-- Name: FUNCTION "sign"("signables" "text", "secret" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."sign"("signables" "text", "secret" "text") TO "dashboard_user";


--
-- Name: FUNCTION "try_cast_double"("inp" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_decode"("data" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_encode"("data" "bytea"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "verify"("token" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_functions_admin
--

GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "comment_on_column"("relation" "text", "column_name" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_column"("relation" "text", "column_name" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_root_field"("field" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_root_field"("field" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_schema"("comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_schema"("comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_table"("relation" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_table"("relation" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "comment_on_type"("type" "text", "comment" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."comment_on_type"("type" "text", "comment" "text") TO "service_role";


--
-- Name: FUNCTION "disable_root_field_for_role"("field" "text", "role" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."disable_root_field_for_role"("field" "text", "role" "text") TO "service_role";


--
-- Name: FUNCTION "exception"("message" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."exception"("message" "text") TO "service_role";


--
-- Name: FUNCTION "rebuild_schema"(); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "postgres";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "anon";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"() TO "service_role";


--
-- Name: FUNCTION "rebuild_schema"("roles" "text"[]); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."rebuild_schema"("roles" "text"[]) TO "service_role";


--
-- Name: FUNCTION "resolve"("name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."resolve"("name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regclass"("relation_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regclass"("relation_name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regrole"("role_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regrole"("role_name" "text") TO "service_role";


--
-- Name: FUNCTION "to_regtype"("type_name" "text"); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "anon";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "graphql"."to_regtype"("type_name" "text") TO "service_role";


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "decrypted_key_id"(); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "pgsodium"."decrypted_key_id"() TO "pgsodium_key_holder";


--
-- Name: FUNCTION "pgsodium_random_bytes_deterministic"("size" integer, "seed" "bytea"); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "pgsodium"."pgsodium_random_bytes_deterministic"("size" integer, "seed" "bytea") TO "service_role";


--
-- Name: TABLE "decrypted_keys"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."decrypted_keys" TO "pgsodium_key_holder";


--
-- Name: TABLE "masking_rules"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."masking_rules" TO "pgsodium_key_holder";


--
-- Name: TABLE "valid_key"; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE "pgsodium"."valid_key" TO "pgsodium_key_holder";


--
-- Name: FUNCTION "activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") TO "service_role";


--
-- Name: FUNCTION "add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "on_delete_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_delete_user"() TO "service_role";


--
-- Name: TABLE "activation_codes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activation_codes" TO "anon";
GRANT ALL ON TABLE "public"."activation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_codes" TO "service_role";


--
-- Name: TABLE "agendas"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."agendas" TO "anon";
GRANT ALL ON TABLE "public"."agendas" TO "authenticated";
GRANT ALL ON TABLE "public"."agendas" TO "service_role";


--
-- Name: TABLE "attendance_history"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."attendance_history" TO "anon";
GRANT ALL ON TABLE "public"."attendance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_history" TO "service_role";


--
-- Name: TABLE "classes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";


--
-- Name: TABLE "grade_history"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."grade_history" TO "anon";
GRANT ALL ON TABLE "public"."grade_history" TO "authenticated";
GRANT ALL ON TABLE "public"."grade_history" TO "service_role";


--
-- Name: TABLE "journals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."journals" TO "anon";
GRANT ALL ON TABLE "public"."journals" TO "authenticated";
GRANT ALL ON TABLE "public"."journals" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "schedule"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."schedule" TO "anon";
GRANT ALL ON TABLE "public"."schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule" TO "service_role";


--
-- Name: TABLE "school_years"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."school_years" TO "anon";
GRANT ALL ON TABLE "public"."school_years" TO "authenticated";
GRANT ALL ON TABLE "public"."school_years" TO "service_role";


--
-- Name: TABLE "students"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";


--
-- Name: TABLE "subjects"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: activate_account_with_code(text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

ALTER FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") OWNER TO "postgres";

--
-- PostgreSQL database dump complete
--

