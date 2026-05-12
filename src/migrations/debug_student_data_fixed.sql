-- FIXED DIAGNOSTIC QUERIES TO DEBUG STUDENT VISIBILITY ISSUE
-- This version works with the actual database schema

-- STEP 1: Add the missing is_active column to school_years table
ALTER TABLE public.school_years ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Set one school year as active if none exists
UPDATE public.school_years SET is_active = TRUE 
WHERE id = (SELECT id FROM public.school_years LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.school_years WHERE is_active = TRUE);

-- STEP 2: Now run diagnostic queries

-- 1. Check if there are any students in the database
SELECT 
    'Total Students' as info,
    COUNT(*) as count
FROM public.students;

-- 2. Check active students specifically
SELECT 
    'Active Students' as info,
    COUNT(*) as count
FROM public.students 
WHERE status = 'active';

-- 3. Check if there are any classes with teachers assigned
SELECT 
    c.id,
    c.name as class_name,
    c.teacher_id,
    p.full_name as teacher_name,
    COUNT(s.id) as student_count
FROM public.classes c
LEFT JOIN public.profiles p ON c.teacher_id = p.id
LEFT JOIN public.students s ON s.class_id = c.id AND s.status = 'active'
GROUP BY c.id, c.name, c.teacher_id, p.full_name
ORDER BY c.name;

-- 4. Check if school year is set up correctly (NOW WITH FIXED COLUMN)
SELECT 
    'School Years' as info,
    id,
    name,
    is_active
FROM public.school_years
ORDER BY is_active DESC, name;

-- 5. Check specific homeroom classes and their students
SELECT 
    'Homeroom Analysis' as category,
    c.name as class_name,
    p.full_name as teacher_name,
    p.is_homeroom_teacher,
    COUNT(s.id) as student_count,
    string_agg(s.name, ', ') as student_names
FROM public.classes c
JOIN public.profiles p ON c.teacher_id = p.id
LEFT JOIN public.students s ON s.class_id = c.id AND s.status = 'active'
GROUP BY c.id, c.name, p.full_name, p.is_homeroom_teacher
ORDER BY c.name;

-- 6. Check if current user is properly set as homeroom teacher
SELECT 
    'Current User Check' as info,
    p.id,
    p.full_name,
    p.is_homeroom_teacher,
    c.name as assigned_class
FROM public.profiles p
LEFT JOIN public.classes c ON c.teacher_id = p.id
WHERE p.id = auth.uid();

-- 7. Check if there's actual grade/attendance data
SELECT 
    'Grades Data' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT class_id) as classes_with_grades,
    COUNT(DISTINCT school_year_id) as school_years_with_grades
FROM public.grades;

SELECT 
    'Attendance Data' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT class_id) as classes_with_attendance,
    COUNT(DISTINCT school_year_id) as school_years_with_attendance
FROM public.attendance;

-- 8. Check the structure of existing JSONB records (if any)
SELECT 
    'Sample Grade Record' as type,
    records
FROM public.grades 
LIMIT 1;

SELECT 
    'Sample Attendance Record' as type,
    records
FROM public.attendance 
LIMIT 1;

-- 9. Test the get_active_school_year_id function
SELECT 'Active School Year Function Test' as info, get_active_school_year_id() as active_year_id;

-- 10. Test if we can find students for a specific class
SELECT 
    'Students for First Class' as info,
    s.id,
    s.name,
    s.nis,
    s.status,
    c.name as class_name
FROM public.students s
JOIN public.classes c ON s.class_id = c.id
WHERE c.id = (SELECT id FROM public.classes LIMIT 1)
AND s.status = 'active';