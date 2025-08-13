-- Run this SQL in your Supabase SQL Editor to create the views
-- that are necessary for the reporting page to function correctly.

drop view if exists public.v_attendance_history;
create or replace view public.v_attendance_history as
select
    ah.id,
    ah.date,
    extract(month from ah.date) as month,
    ah.class_id,
    c.name as class_name,
    ah.subject_id,
    s.name as subject_name,
    ah.school_year_id,
    ah.meeting_number,
    ah.records,
    ah.teacher_id,
    (select jsonb_object_agg(student.id, student.name)
     from jsonb_to_recordset(ah.records) as item(student_id uuid),
          public.students as student
     where student.id = item.student_id) as student_names
from
    attendance_history ah
join
    classes c on ah.class_id = c.id
join
    subjects s on ah.subject_id = s.id;

drop view if exists public.v_grade_history;
create or replace view public.v_grade_history as
select
    gh.id,
    gh.date,
    extract(month from gh.date) as month,
    gh.class_id,
    c.name as class_name,
    gh.subject_id,
    s.name as subject_name,
    gh.school_year_id,
    gh.assessment_type,
    gh.records,
    gh.teacher_id,
    (select jsonb_object_agg(student.id, student.name)
     from jsonb_to_recordset(gh.records) as item(student_id uuid),
          public.students as student
     where student.id = item.student_id) as student_names
from
    grade_history gh
join
    classes c on gh.class_id = c.id
join
    subjects s on gh.subject_id = s.id;
