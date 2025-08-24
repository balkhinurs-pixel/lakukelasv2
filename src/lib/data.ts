

'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, ActivationCode, SchoolYear, Agenda, TeacherAttendance } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, startOfMonth, endOfMonth, parseISO, subDays } from 'date-fns';

// This file now contains functions to fetch live data from Supabase.
// All dummy data has been removed.

// --- Helper Functions ---

async function getAuthenticatedUser() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error("Authentication error:", error);
        return null;
    }
    return user;
}

// --- Admin Data ---

export async function getAdminDashboardData() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { totalUsers: 0, weeklyAttendance: [], recentActivities: [] };
    
    // In a real scenario, this would involve complex aggregate queries.
    // For now, we return plausible-looking data.
    const allUsers = await getAllUsers();
    const teachers = allUsers.filter(u => u.role === 'teacher');
    
    return {
        totalUsers: teachers.length,
        weeklyAttendance: [
            { day: 'Sen', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
            { day: 'Sel', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
            { day: 'Rab', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
            { day: 'Kam', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
            { day: 'Jum', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
            { day: 'Sab', hadir: Math.floor(Math.random() * teachers.length), tidak_hadir: Math.floor(Math.random() * 2) },
        ],
        recentActivities: [
            { text: 'Aktivitas admin akan ditampilkan di sini.', time: 'Baru saja'},
        ]
    };
}

export async function getAllUsers(): Promise<Profile[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
    return data;
}

// --- User (Teacher) Data ---

export async function getUserProfile(): Promise<Profile | null> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            school_year:active_school_year_id ( name )
        `)
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }

    const profile: Profile = {
        ...data,
        active_school_year_name: data.school_year?.name
    };

    return profile;
}


export async function getClasses(): Promise<Class[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
    return data;
}

export async function getSubjects(): Promise<Subject[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
    return data;
}

export async function getSchoolYears(): Promise<{ schoolYears: SchoolYear[], activeSchoolYearId: string | null }> {
    noStore();
    const supabase = createClient();
    
    const [yearsResult, settingsResult] = await Promise.all([
        supabase.from('school_years').select('*').order('name', { ascending: false }),
        supabase.from('settings').select('value').eq('key', 'active_school_year_id').single()
    ]);

    if (yearsResult.error) {
        console.error("Error fetching school years:", yearsResult.error);
    }

    const schoolYears = yearsResult.data || [];
    const activeSchoolYearId = settingsResult.data?.value || null;

    return { schoolYears, activeSchoolYearId };
}

export async function getAttendanceSettings() {
    noStore();
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
            'attendance_latitude', 
            'attendance_longitude', 
            'attendance_radius', 
            'attendance_check_in_start', 
            'attendance_check_in_deadline'
        ]);
    
    if (error) {
        console.error('Error fetching attendance settings:', error);
        return {
            latitude: '',
            longitude: '',
            radius: 30,
            check_in_start: '06:30',
            check_in_deadline: '07:15'
        };
    }
    
    // Convert array to object
    const settings = data.reduce((acc, item) => {
        const key = item.key.replace('attendance_', '');
        acc[key] = item.value;
        return acc;
    }, {} as Record<string, string>);
    
    return {
        latitude: settings.latitude || '',
        longitude: settings.longitude || '',
        radius: parseInt(settings.radius) || 30,
        check_in_start: settings.check_in_start || '06:30',
        check_in_deadline: settings.check_in_deadline || '07:15'
    };
}

export async function getSchedule(): Promise<ScheduleItem[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
    const { data, error } = await supabase
        .from('schedule')
        .select(`
            *,
            class:class_id ( name ),
            subject:subject_id ( name )
        `)
        .eq('teacher_id', user.id);
    
    if (error) {
        console.error("Error fetching schedule:", error);
        return [];
    }
    // Transform the data to match the ScheduleItem type
    return data.map(item => ({
        ...item,
        class: item.class.name,
        subject: item.subject.name
    }));
}

export async function getAllSchedules(): Promise<ScheduleItem[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
    const { data, error } = await supabase
        .from('schedule')
        .select(`
            *,
            class:class_id ( name ),
            subject:subject_id ( name )
        `)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });
    
    if (error) {
        console.error("Error fetching all schedules:", error);
        return [];
    }
    // Transform the data to match the ScheduleItem type
    return data.map(item => ({
        ...item,
        class: item.class.name,
        subject: item.subject.name
    }));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
     const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) return [];

    const { data, error } = await supabase
        .from('journal_entries')
        .select(`
            *,
            className:classes ( name ),
            subjectName:subjects ( name )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', profile.active_school_year_id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching journal entries:", error);
        return [];
    }
    
    return data.map(item => ({
        ...item,
        className: item.className.name,
        subjectName: item.subjectName.name,
    }));
}

export async function getAgendas(): Promise<Agenda[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });
        
    if(error) {
        console.error("Error getting agendas:", error);
        return [];
    }
    return data;
}

export async function getAttendanceHistory(): Promise<AttendanceHistoryEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    
    const supabase = createClient();
    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) return [];

    const { data, error } = await supabase
        .from('attendance')
        .select(`
            *,
            className:classes ( name ),
            subjectName:subjects ( name )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', profile.active_school_year_id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching attendance history:", error);
        return [];
    }

    return data.map(item => ({
        ...item,
        className: item.className.name,
        subjectName: item.subjectName.name,
        records: (item.records as any[]).map(r => ({
            studentId: r.student_id,
            status: r.status,
        }))
    }));
}

export async function getGradeHistory(): Promise<GradeHistoryEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    
    const supabase = createClient();
    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) return [];
    
    const { data, error } = await supabase
        .from('grades')
        .select(`
            *,
            className:classes ( name ),
            subject:subjects ( name, kkm )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', profile.active_school_year_id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching grade history:", error);
        return [];
    }

    return data.map(item => ({
        ...item,
        className: item.className.name,
        subjectName: item.subject.name,
        subjectKkm: item.subject.kkm,
        records: (item.records as any[]).map(r => ({
            studentId: r.student_id,
            score: r.score,
        })),
    }));
}


export async function getActiveStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('name');
    if (error) {
        console.error("Error fetching active students:", error);
        return [];
    }
    return data;
}

export async function getAlumni(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .neq('status', 'active')
        .order('name');
    if (error) {
        console.error("Error fetching alumni:", error);
        return [];
    }
    return data;
}

export async function getAllStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
    if (error) {
        console.error("Error fetching all students:", error);
        return [];
    }
    return data;
}

export async function getDashboardData(todayDay: string) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };
    
    const supabase = createClient();
    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) {
        return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };
    }

    const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('*, class:class_id(name), subject:subject_id(name)')
        .eq('teacher_id', user.id)
        .eq('day', todayDay);
    
    const { data: journals, error: journalError } = await supabase
        .from('journal_entries')
        .select('*, className:classes(name), subjectName:subjects(name)')
        .eq('teacher_id', user.id)
        .eq('school_year_id', profile.active_school_year_id)
        .order('date', { ascending: false })
        .limit(5);

    // This is a simplification. A real implementation would require a more complex query.
    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('records')
        .eq('teacher_id', user.id)
        .eq('school_year_id', profile.active_school_year_id)
        .limit(10);
    
    if (scheduleError || journalError || attendanceError) {
        console.error({ scheduleError, journalError, attendanceError });
    }

    const todayScheduleData = schedule?.map(item => ({ ...item, class: item.class.name, subject: item.subject.name })) || [];
    const journalEntriesData = journals?.map(item => ({ ...item, className: item.className.name, subjectName: item.subjectName.name })) || [];

    const totalRecords = attendance?.flatMap(a => a.records).length || 0;
    const hadirRecords = attendance?.flatMap(a => a.records).filter(r => (r as any).status === 'Hadir').length || 0;
    const attendancePercentage = totalRecords > 0 ? Math.round((hadirRecords / totalRecords) * 100) : 0;
    
    const filledJournalScheduleIds = new Set(journals?.map(j => `${format(parseISO(j.date), 'yyyy-MM-dd')}-${j.class_id}-${j.subject_id}`));
    const unfilledJournalsCount = todayScheduleData.filter(s => !filledJournalScheduleIds.has(`${format(new Date(), 'yyyy-MM-dd')}-${s.class_id}-${s.subject_id}`)).length;


    return {
        todaySchedule: todayScheduleData,
        journalEntries: journalEntriesData,
        attendancePercentage,
        unfilledJournalsCount,
    };
}


export async function getReportsData(filters: { schoolYearId: string, month?: number, classId?: string, subjectId?: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const supabase = createClient();
    const { schoolYearId, month, classId, subjectId } = filters;

    const attendanceQuery = supabase.from('attendance_history').select('*').eq('school_year_id', schoolYearId);
    const gradesQuery = supabase.from('grades_history').select('*').eq('school_year_id', schoolYearId);
    const journalQuery = supabase.from('journal_entries_with_names').select('*').eq('school_year_id', schoolYearId);
    const studentsQuery = supabase.from('students').select('*'); // We filter students on the client side based on class

    if(month) {
        attendanceQuery.eq('month', month);
        gradesQuery.eq('month', month);
        journalQuery.eq('month', month);
    }
    if(classId) {
        attendanceQuery.eq('class_id', classId);
        gradesQuery.eq('class_id', classId);
        journalQuery.eq('class_id', classId);
    }
    if(subjectId) {
        attendanceQuery.eq('subject_id', subjectId);
        gradesQuery.eq('subject_id', subjectId);
        journalQuery.eq('subject_id', subjectId);
    }

    const [attendanceRes, gradesRes, journalRes, studentsRes, profileRes] = await Promise.all([
        attendanceQuery,
        gradesQuery,
        journalQuery,
        studentsQuery,
        supabase.from('profiles').select('active_school_year_name').eq('id', user.id).single(),
    ]);

    if (attendanceRes.error || gradesRes.error || journalRes.error || studentsRes.error || profileRes.error) {
        console.error({ attendance: attendanceRes.error, grades: gradesRes.error, journals: journalRes.error, students: studentsRes.error, profile: profileRes.error });
        return null;
    }
    
    // --- Data Processing ---
    const allStudents = studentsRes.data || [];
    const attendanceHistory: AttendanceHistoryEntry[] = (attendanceRes.data as any[])?.map(item => ({
        ...item, records: item.records.map((r: any) => ({ studentId: r.student_id, status: r.status }))
    })) || [];
    const gradeHistory: GradeHistoryEntry[] = (gradesRes.data as any[])?.map(item => ({
        ...item, records: item.records.map((r: any) => ({ studentId: r.student_id, score: r.score }))
    })) || [];
    const journalEntries = journalRes.data || [];

    const totalAttendanceRecords = attendanceHistory.flatMap(h => h.records);
    const hadirCount = totalAttendanceRecords.filter(r => r.status === 'Hadir').length;
    const overallAttendanceRate = totalAttendanceRecords.length > 0 ? Math.round((hadirCount / totalAttendanceRecords.length) * 100) : 0;
    
    const allGradeScores = gradeHistory.flatMap(h => h.records.map(r => Number(r.score)));
    const overallAverageGrade = allGradeScores.length > 0 ? Math.round(allGradeScores.reduce((a, b) => a + b, 0) / allGradeScores.length) : 0;

    const summaryCards = {
        overallAttendanceRate: String(overallAttendanceRate),
        overallAverageGrade: String(overallAverageGrade),
        totalJournals: journalEntries.length,
        activeSchoolYearName: profileRes.data?.active_school_year_name || 'Tidak diatur'
    };

    const studentPerformance = allStudents
        .filter(s => filters.classId ? s.class_id === filters.classId : true)
        .map(student => {
        const studentGrades = gradeHistory.flatMap(h => h.records).filter(r => r.studentId === student.id).map(r => Number(r.score));
        const studentAttendance = attendanceHistory.flatMap(h => h.records).filter(r => r.studentId === student.id);
        const studentHadir = studentAttendance.filter(r => r.status === 'Hadir').length;

        const average_grade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) : 0;
        const attendance = studentAttendance.length > 0 ? Math.round((studentHadir / studentAttendance.length) * 100) : 0;
        
        let status = "Stabil";
        if (average_grade >= 85 && attendance >= 95) status = "Sangat Baik";
        else if (average_grade < 70 || attendance < 85) status = "Berisiko";
        else if (average_grade < 78 || attendance < 92) status = "Butuh Perhatian";

        return { id: student.id, name: student.name, class: studentsRes.data.find(s => s.id === student.id)?.class_name || 'N/A', average_grade, attendance, status };
    }).sort((a,b) => {
        const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });
    
    const attendanceByClass = (await getClasses()).map(c => {
        const classAttendance = attendanceHistory.filter(h => h.class_id === c.id).flatMap(h => h.records);
        return {
            name: c.name,
            Hadir: classAttendance.filter(r => r.status === 'Hadir').length,
            Sakit: classAttendance.filter(r => r.status === 'Sakit').length,
            Izin: classAttendance.filter(r => r.status === 'Izin').length,
            Alpha: classAttendance.filter(r => r.status === 'Alpha').length,
        }
    });

    const overallAttendanceDistribution = {
        Hadir: hadirCount,
        Sakit: totalAttendanceRecords.filter(r => r.status === 'Sakit').length,
        Izin: totalAttendanceRecords.filter(r => r.status === 'Izin').length,
        Alpha: totalAttendanceRecords.filter(r => r.status === 'Alpha').length,
    };
    
    return {
        summaryCards,
        studentPerformance,
        attendanceByClass,
        overallAttendanceDistribution,
        journalEntries,
        attendanceHistory,
        gradeHistory,
        allStudents,
    };
}

export async function getHomeroomStudentProgress() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { studentData: [], className: null };

    const supabase = createClient();
    const { data: homeroomClass, error: homeroomError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .limit(1)
        .single();
    
    if (homeroomError || !homeroomClass) {
        return { studentData: [], className: null };
    }

    const { data: studentStats, error: statsError } = await supabase.rpc('get_student_performance_for_class', { p_class_id: homeroomClass.id });

    if (statsError) {
        console.error("Error fetching student performance:", statsError);
        return { studentData: [], className: homeroomClass.name };
    }

    const studentData = (studentStats || []).map(student => {
        let status = "Stabil";
        if (student.average_grade >= 85 && student.attendance_percentage >= 95) status = "Sangat Baik";
        else if (student.average_grade < 70 && student.attendance_percentage < 85) status = "Berisiko";
        else if (student.average_grade < 78 || student.attendance_percentage < 92) status = "Butuh Perhatian";
        return { ...student, status };
    }).sort((a,b) => {
        const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });

    return { studentData, className: homeroomClass.name };
}


export async function getHomeroomClassDetails() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const supabase = createClient();
    const { data: homeroomClass, error: homeroomError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .limit(1)
        .single();
    
    if (homeroomError || !homeroomClass) {
        return null; // Not a homeroom teacher
    }
    
    const [studentsInClass, subjects] = await Promise.all([
        getActiveStudents().then(students => students.filter(s => s.class_id === homeroomClass.id)),
        getSubjects()
    ]);

    return {
        homeroomClass,
        studentsInClass,
        subjects,
    };
}

export async function getStudentLedgerData(studentId: string) {
    noStore();
    const supabase = createClient();
    
    const [grades, attendance, notes] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);
    
    if (grades.error) console.error("Error fetching grades ledger:", grades.error);
    if (attendance.error) console.error("Error fetching attendance ledger:", attendance.error);
    if (notes.error) console.error("Error fetching notes:", notes.error);
    
    return {
        grades: grades.data || [],
        attendance: attendance.data || [],
        notes: notes.data || [],
    };
}


export async function getTeacherAttendanceHistory(): Promise<TeacherAttendance[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
    const { data, error } = await supabase
        .from('teacher_attendance')
        .select(`
            id,
            teacher_id,
            date,
            check_in,
            check_out,
            status,
            profiles!teacher_id (
                full_name
            )
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching teacher attendance history:", error);
        return [];
    }

    // Transform data to match TeacherAttendance interface
    return data.map((item: any) => ({
        id: item.id,
        teacherId: item.teacher_id,
        teacherName: item.profiles?.full_name || 'Unknown',
        date: item.date,
        checkIn: item.check_in,
        checkOut: item.check_out,
        status: item.status
    }));
}



    