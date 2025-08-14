--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
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

-- *not* creating schema, since initdb creates it


ALTER SCHEMA "public" OWNER TO "postgres";

--
-- Name: activate_account_with_code("text", "uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  code_id_to_use UUID;
  is_code_used BOOLEAN;
BEGIN
  -- Find the code and lock the row for update
  SELECT id, is_used INTO code_id_to_use, is_code_used
  FROM public.activation_codes
  WHERE code = activation_code_to_use
  FOR UPDATE;

  -- Check if the code exists
  IF code_id_to_use IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  -- Check if the code has already been used
  IF is_code_used = TRUE THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

  -- Mark the code as used
  UPDATE public.activation_codes
  SET 
    is_used = TRUE,
    used_by = user_id_to_activate,
    used_at = NOW(),
    used_by_email = user_email_to_set
  WHERE id = code_id_to_use;

END;
$$;


ALTER FUNCTION "public"."activate_account_with_code"("activation_code_to_use" "text", "user_id_to_activate" "uuid", "user_email_to_set" "text") OWNER TO "postgres";

--
-- Name: add_student_with_teacher_check("uuid", "text", "text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_teacher_id UUID;
    v_nis_exists BOOLEAN;
BEGIN
    -- Get the teacher_id associated with the provided p_class_id
    SELECT teacher_id INTO v_teacher_id
    FROM public.classes
    WHERE id = p_class_id;

    -- Check if the teacher_id matches the currently authenticated user
    IF v_teacher_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied: You can only add students to your own classes.';
    END IF;

    -- Check if the NIS already exists for any student associated with this teacher
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = auth.uid()
    ) INTO v_nis_exists;

    IF v_nis_exists THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- Insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$;


ALTER FUNCTION "public"."add_student_with_teacher_check"("p_class_id" "uuid", "p_nis" "text", "p_name" "text", "p_gender" "text") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher',
    'Free'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: on_delete_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."on_delete_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE from public.profiles where id = old.id;
  return old;
END;
$$;


ALTER FUNCTION "public"."on_delete_user"() OWNER TO "postgres";

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
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_by_email" "text"
);


ALTER TABLE "public"."activation_codes" OWNER TO "postgres";

--
-- Name: agendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."agendas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "tag" "text",
    "color" "text" DEFAULT '#808080'::"text",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agendas" OWNER TO "postgres";

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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "school_year_id" "uuid"
);


ALTER TABLE "public"."attendance_history" OWNER TO "postgres";

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."classes" OWNER TO "postgres";

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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "school_year_id" "uuid"
);


ALTER TABLE "public"."grade_history" OWNER TO "postgres";

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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "school_year_id" "uuid"
);


ALTER TABLE "public"."journals" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
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
    "account_status" "text" DEFAULT 'Free'::"text" NOT NULL,
    "role" "text" DEFAULT 'teacher'::"text" NOT NULL,
    "email" "text",
    "active_school_year_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "schedule_day_check" CHECK (("day" = ANY (ARRAY['Senin'::"text", 'Selasa'::"text", 'Rabu'::"text", 'Kamis'::"text", 'Jumat'::"text", 'Sabtu'::"text", 'Minggu'::"text"])))
);


ALTER TABLE "public"."schedule" OWNER TO "postgres";

--
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."school_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."school_years" OWNER TO "postgres";

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "students_gender_check" CHECK ((("gender" = 'Laki-laki'::"text") OR ("gender" = 'Perempuan'::"text")))
);


ALTER TABLE "public"."students" OWNER TO "postgres";

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" integer DEFAULT 75 NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";

--
-- Name: v_attendance_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."v_attendance_history" AS
 SELECT "ah"."id",
    "ah"."date",
    "ah"."class_id",
    "ah"."subject_id",
    "ah"."school_year_id",
    "ah"."meeting_number",
    "ah"."records",
    "ah"."teacher_id",
    "ah"."created_at",
    "date_part"('month'::"text", "ah"."date") AS "month",
    "c"."name" AS "class_name",
    "s"."name" AS "subject_name",
    ( SELECT "jsonb_object_agg"("st"."id", "st"."name") AS "jsonb_object_agg"
           FROM ("jsonb_to_recordset"("ah"."records") "r"("student_id" "uuid", "status" "text")
             JOIN "public"."students" "st" ON (("st"."id" = "r"."student_id")))) AS "student_names"
   FROM (("public"."attendance_history" "ah"
     JOIN "public"."classes" "c" ON (("ah"."class_id" = "c"."id")))
     JOIN "public"."subjects" "s" ON (("ah"."subject_id" = "s"."id")));


ALTER TABLE "public"."v_attendance_history" OWNER TO "postgres";

--
-- Name: v_grade_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."v_grade_history" AS
 SELECT "gh"."id",
    "gh"."date",
    "gh"."class_id",
    "gh"."subject_id",
    "gh"."school_year_id",
    "gh"."assessment_type",
    "gh"."records",
    "gh"."teacher_id",
    "gh"."created_at",
    "date_part"('month'::"text", "gh"."date") AS "month",
    "c"."name" AS "class_name",
    "s"."name" AS "subject_name",
    ( SELECT "jsonb_object_agg"("st"."id", "st"."name") AS "jsonb_object_agg"
           FROM ("jsonb_to_recordset"("gh"."records") "r"("student_id" "uuid", "score" "numeric")
             JOIN "public"."students" "st" ON (("st"."id" = "r"."student_id")))) AS "student_names"
   FROM (("public"."grade_history" "gh"
     JOIN "public"."classes" "c" ON (("gh"."class_id" = "c"."id")))
     JOIN "public"."subjects" "s" ON (("gh"."subject_id" = "s"."id")));


ALTER TABLE "public"."v_grade_history" OWNER TO "postgres";

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
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");


--
-- Name: subjects subjects_name_teacher_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_name_teacher_id_key" UNIQUE ("name", "teacher_id");


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");


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
-- Name: on_auth_user_deleted; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_deleted AFTER DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.on_delete_user();


--
-- Name: agendas; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."agendas" ENABLE ROW LEVEL SECURITY;

--
-- Name: activation_codes; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: All can see codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "All can see codes" ON "public"."activation_codes" FOR SELECT USING (true);


--
-- Name: All users can view agendas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "All users can view agendas" ON "public"."agendas" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: attendance_history; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

--
-- Name: grade_history; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: journals; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: Public profiles are viewable by everyone.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);


--
-- Name: schedule; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;

--
-- Name: school_years; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."school_years" ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW LEVEL SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

--
-- Name: Teachers can delete their own agendas.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own agendas." ON "public"."agendas" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own attendance records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own attendance records." ON "public"."attendance_history" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own classes.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own classes." ON "public"."classes" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own grade records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own grade records." ON "public"."grade_history" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own journals.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own journals." ON "public"."journals" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own schedule.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own schedule." ON "public"."schedule" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own school years.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own school years." ON "public"."school_years" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can delete their own students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own students" ON "public"."students" FOR DELETE USING ((("auth"."uid"() = ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))));


--
-- Name: Teachers can delete their own subjects.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete their own subjects." ON "public"."subjects" FOR DELETE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own agendas.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own agendas." ON "public"."agendas" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own attendance records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own attendance records." ON "public"."attendance_history" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own classes.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own classes." ON "public"."classes" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own grade records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own grade records." ON "public"."grade_history" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own journals.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own journals." ON "public"."journals" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own schedule.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own schedule." ON "public"."schedule" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own school years.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own school years." ON "public"."school_years" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can insert their own students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own students" ON "public"."students" FOR INSERT WITH CHECK ((("auth"."uid"() = ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))));


--
-- Name: Teachers can insert their own subjects.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert their own subjects." ON "public"."subjects" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own agendas.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own agendas." ON "public"."agendas" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own attendance records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own attendance records." ON "public"."attendance_history" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own classes.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own classes." ON "public"."classes" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own grade records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own grade records." ON "public"."grade_history" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own journals.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own journals." ON "public"."journals" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own schedule.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own schedule." ON "public"."schedule" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own school years.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own school years." ON "public"."school_years" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can update their own students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own students" ON "public"."students" FOR UPDATE USING ((("auth"."uid"() = ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))));


--
-- Name: Teachers can update their own subjects.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update their own subjects." ON "public"."subjects" FOR UPDATE USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own attendance records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own attendance records." ON "public"."attendance_history" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own classes.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own classes." ON "public"."classes" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own grade records.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own grade records." ON "public"."grade_history" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own journals.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own journals." ON "public"."journals" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own schedule.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own schedule." ON "public"."schedule" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own school years.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own school years." ON "public"."school_years" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Teachers can view their own students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own students" ON "public"."students" FOR SELECT USING ((("auth"."uid"() = ( SELECT "classes"."teacher_id"
   FROM "public"."classes"
  WHERE ("classes"."id" = "students"."class_id")))));


--
-- Name: Teachers can view their own subjects.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their own subjects." ON "public"."subjects" FOR SELECT USING (("auth"."uid"() = "teacher_id"));


--
-- Name: Users can update their own profiles.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profiles." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: Enable read access for admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for admin users" ON "public"."activation_codes" FOR SELECT USING ((get_my_claim('user_role'::"text") = '"admin"'::"jsonb"));


--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION "supabase_realtime" FOR ALL TABLES;


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: Triggers; Type: SECTION; Schema: -; Owner: -
--

--
-- Name: on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- PostgreSQL database dump complete
--

--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20240813000000');
