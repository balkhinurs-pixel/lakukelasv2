-- 1. Hapus VIEW yang lama dan salah jika ada
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- 2. Hapus fungsi yang lama jika ada (untuk memastikan kita membuat yang baru)
DROP FUNCTION IF EXISTS public.get_report_data(uuid, uuid, int);

-- 3. Buat fungsi database yang baru dan cerdas untuk mengambil data laporan
create
or replace function get_report_data (
  p_teacher_id uuid,
  p_school_year_id uuid default null,
  p_month int default null
) returns table (
  summary_cards jsonb,
  student_performance jsonb,
  attendance_by_class jsonb,
  overall_attendance_distribution jsonb,
  journal_entries jsonb,
  attendance_history jsonb,
  grade_history jsonb,
  all_students jsonb
) as $$
declare
  active_school_year_id uuid;
begin
  -- Determine the active school year if not provided
  if p_school_year_id is null then
    select p.active_school_year_id into active_school_year_id from profiles p where p.id = p_teacher_id;
  else
    active_school_year_id := p_school_year_id;
  end if;

  return query
  with
  -- Raw history data filtered by teacher and optionally by school year/month
  filtered_attendance as (
    select * from public.attendance_history
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_grades as (
    select * from public.grade_history
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_journals as (
     select * from public.journals
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  teacher_students as (
    select s.id, s.name, s.class_id, c.name as class_name
    from public.students s
    join public.classes c on s.class_id = c.id
    where c.teacher_id = p_teacher_id and s.status = 'active'
  )

  select
    -- 1. Summary Cards
    coalesce((select jsonb_build_object(
      'overallAttendanceRate', (select coalesce(
          (sum(case when (r->>'status') = 'Hadir' then 1 else 0 end)::decimal / nullif(count(*), 0)) * 100, 0)
          from filtered_attendance, jsonb_to_recordset(records) as r(student_id uuid, status text)
      ),
      'overallAverageGrade', (select coalesce(avg((r->>'score')::numeric), 0)
          from filtered_grades, jsonb_to_recordset(records) as r(student_id uuid, score text)
      ),
      'totalJournals', (select count(*) from filtered_journals)
    )), '{}'::jsonb) as summary_cards,

    -- 2. Student Performance
    coalesce((select jsonb_agg(sp) from (
        select
            s.id,
            s.name,
            s.class_name,
            coalesce(avg((gr.r->>'score')::numeric), 0) as average_grade,
            coalesce(
                (sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100,
            100) as attendance_percentage,
            case
                when coalesce(avg((gr.r->>'score')::numeric), 0) >= 85 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 90 then 'Sangat Baik'
                when coalesce(avg((gr.r->>'score')::numeric), 0) >= 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 80 then 'Stabil'
                when coalesce(avg((gr.r->>'score')::numeric), 0) < 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) < 80 then 'Berisiko'
                else 'Butuh Perhatian'
            end as status
        from teacher_students s
        left join filtered_attendance fa on true
        left join jsonb_to_recordset(fa.records) as ar(r) on (ar.r->>'student_id')::uuid = s.id
        left join filtered_grades fg on true
        left join jsonb_to_recordset(fg.records) as gr(r) on (gr.r->>'student_id')::uuid = s.id
        group by s.id, s.name, s.class_name
        order by average_grade desc
    ) sp), '[]'::jsonb) as student_performance,

    -- 3. Attendance by Class
    coalesce((select jsonb_agg(abc) from (
        select
            c.name as class_name,
            jsonb_agg(jsonb_build_object('status', r.status, 'count', count(r.status))) as distribution
        from filtered_attendance fa
        join public.classes c on fa.class_id = c.id,
        jsonb_to_recordset(fa.records) as r(status text)
        group by c.name
    ) abc), '[]'::jsonb) as attendance_by_class,

    -- 4. Overall Attendance Distribution
    coalesce((select jsonb_object_agg(status, count)
      from (
          select r->>'status' as status, count(*)
          from filtered_attendance, jsonb_array_elements(records) as r
          group by r->>'status'
      ) t
    ), '{}'::jsonb) as overall_attendance_distribution,

    -- 5. Journal Entries
    coalesce((select jsonb_agg(j) from (
        select j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, c.name as "className", s.name as "subjectName"
        from filtered_journals j
        join public.classes c on j.class_id = c.id
        join public.subjects s on j.subject_id = s.id
        order by j.date desc
    ) j), '[]'::jsonb) as journal_entries,

    -- 6. Attendance History
    coalesce((select jsonb_agg(ah) from (
      select ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name as "className", s.name as "subjectName"
      from filtered_attendance ah
      join public.classes c on ah.class_id = c.id
      join public.subjects s on ah.subject_id = s.id
      order by ah.date desc
    ) ah), '[]'::jsonb) as attendance_history,

    -- 7. Grade History
    coalesce((select jsonb_agg(gh) from (
      select gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name as "className", s.name as "subjectName"
      from filtered_grades gh
      join public.classes c on gh.class_id = c.id
      join public.subjects s on gh.subject_id = s.id
      order by gh.date desc
    ) gh), '[]'::jsonb) as grade_history,

    -- 8. All students (for the teacher)
    coalesce((select jsonb_agg(s) from teacher_students s), '[]'::jsonb) as all_students;
end;
$$ language plpgsql;
