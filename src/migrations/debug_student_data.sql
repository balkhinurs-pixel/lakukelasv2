-- DIAGNOSTIC QUERIES TO DEBUG STUDENT VISIBILITY ISSUE
-- Run these queries one by one to identify the root cause

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

-- 4. Check if school year is set up correctly
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

-- 6. Test the current RPC function directly (will show error if function is broken)
-- Replace 'YOUR_CLASS_ID' with an actual class ID from query #5 above
-- SELECT * FROM get_student_performance_for_class('YOUR_CLASS_ID');

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

-- 8. Check the structure of existing JSONB records
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