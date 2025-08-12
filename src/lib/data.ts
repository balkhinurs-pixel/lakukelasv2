
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, ActivationCode, AttendanceRecord, SchoolYear, Agenda } from './types';

// --- Admin Data ---

export async function getAdminDashboardData() {
    noStore();
    const supabase = createClient();

    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: proUsers, error: proUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'Pro');
    
    if (usersError || proUsersError) {
        console.error("Error fetching admin dashboard data:", usersError || proUsersError);
        return { totalUsers: 0, proUsers: 0 };
    }

    return { totalUsers: totalUsers || 0, proUsers: proUsers || 0 };
}

export async function getAllUsers(): Promise<Profile[]> {
    noStore();
    const supabase = createClient();
    
    // Simplified and more reliable query directly from the profiles table.
    // The on_auth_user_created trigger ensures this table is populated.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }

    return profiles;
}

export async function getActivationCodes(): Promise<ActivationCode[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('activation_codes')
        .select(`
            *,
            profile:profiles(email)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching activation codes:", error);
        return [];
    }

    // The type from Supabase might be { email: string } | { email: string }[] | null
    // We need to flatten it.
    return data.map(code => ({
        ...code,
        // @ts-ignore
        used_by_email: code.profile?.email || null
    }));
}


// --- User (Teacher) Data ---

export async function getUserProfile() {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, school_year:school_years(name)')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }

    const typedProfile = profile as any;

    return {
        ...typedProfile,
        active_school_year_name: typedProfile.school_year?.name
    } as Profile
}

export async function getClasses(): Promise<Class[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase.from('classes').select('*').eq('teacher_id', user.id).order('name', { ascending: true });
    if (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
    return data;
}

export async function getSubjects(): Promise<Subject[]> {
    noStore();
    const supabase = createClient();
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.from('subjects').select('*').eq('teacher_id', user.id);
    if (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
    return data;
}

export async function getSchoolYears(): Promise<{ schoolYears: SchoolYear[], activeSchoolYearId: string | null }> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { schoolYears: [], activeSchoolYearId: null };

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_school_year_id')
        .eq('id', user.id)
        .single();

    const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .eq('teacher_id', user.id)
        .order('name', { ascending: false });

    if (error || profileError) {
        console.error("Error fetching school years:", error || profileError);
        return { schoolYears: [], activeSchoolYearId: null };
    }
    return { schoolYears: data || [], activeSchoolYearId: profile?.active_school_year_id || null };
}

export async function getSchedule(): Promise<ScheduleItem[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('schedule')
      .select('*, classes(name), subjects(name)')
      .eq('teacher_id', user.id);
    
    if (error) {
      console.error("Error fetching schedule:", error);
      return [];
    }
    // @ts-ignore
    return data.map(item => ({
      ...item,
      class: item.classes.name,
      subject: item.subjects.name,
    }));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();

    let query = supabase
      .from('journals')
      .select('*, classes(name), subjects(name)')
      .eq('teacher_id', user.id)
      .order('date', { ascending: false });

    if(profile?.active_school_year_id) {
        query = query.eq('school_year_id', profile.active_school_year_id)
    }

    const { data, error } = await query;


    if (error) {
      console.error("Error fetching journal entries:", error);
      return [];
    }
    // @ts-ignore
    return data.map(entry => ({
      ...entry,
      className: entry.classes.name,
      subjectName: entry.subjects.name,
    }));
}

export async function getAgendas(): Promise<Agenda[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('teacher_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });

    if (error) {
        console.error("Error fetching agendas:", error);
        return [];
    }
    return data;
}

export async function getAttendanceHistory(): Promise<AttendanceHistoryEntry[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();

    let query = supabase
      .from('attendance_history')
      .select('*, classes(name), subjects(name)')
      .eq('teacher_id', user.id)
      .order('date', { ascending: false });

    if(profile?.active_school_year_id) {
        query = query.eq('school_year_id', profile.active_school_year_id)
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error("Error fetching attendance history:", error);
        return [];
    }
    // @ts-ignore
    return data.map(entry => ({
        ...entry,
        className: entry.classes.name,
        subjectName: entry.subjects.name,
        records: entry.records.map((r: any) => ({studentId: r.student_id, status: r.status}))
    }));
}

export async function getGradeHistory(): Promise<GradeHistoryEntry[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();

    let query = supabase
      .from('grade_history')
      .select('*, classes(name), subjects(name, kkm)')
      .eq('teacher_id', user.id)
      .order('date', { ascending: false });
    
    if (profile?.active_school_year_id) {
        query = query.eq('school_year_id', profile.active_school_year_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching grade history:", error);
        return [];
    }
    // @ts-ignore
    return data.map(entry => ({
        ...entry,
        className: entry.classes.name,
        subjectName: entry.subjects.name,
        subjectKkm: entry.subjects.kkm,
        records: entry.records.map((r: any) => ({studentId: r.student_id, score: r.score}))
    }));
}

export async function getAllStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.from('students').select('*, classes!left(name, teacher_id)').eq('classes.teacher_id', user.id).order('name', { ascending: true });
    if (error) {
        console.error("Error fetching all students:", error);
        return [];
    }
    // @ts-ignore
    return data.map(s => ({...s, class_name: s.classes?.name}));
}

export async function getDashboardData() {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { todaySchedule: [], journalEntries: [] };

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const { data: todaySchedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .eq('day', today)
        .order('start_time', { ascending: true });
    
    const { data: journalEntries, error: journalError } = await supabase
        .from('journals')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

    if(scheduleError || journalError) {
        console.error("Dashboard data error:", scheduleError || journalError);
    }
    
    // @ts-ignore
    const formattedSchedule = (todaySchedule || []).map(item => ({
        ...item,
        class: item.classes.name,
        subject: item.subjects.name,
    }));

    // @ts-ignore
    const formattedJournals = (journalEntries || []).map(entry => ({
        ...entry,
        className: entry.classes.name,
        subjectName: entry.subjects.name,
    }));

    return { todaySchedule: formattedSchedule, journalEntries: formattedJournals };
}


export async function getReportsData(schoolYearId?: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let activeSchoolYearId = schoolYearId;

    if (!activeSchoolYearId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('active_school_year_id')
            .eq('id', user.id)
            .single();
        if (profile?.active_school_year_id) {
            activeSchoolYearId = profile.active_school_year_id;
        }
    }
    
    // Base queries
    let attendanceQuery = supabase.from('attendance_history').select('*, classes(name), subjects(name)').eq('teacher_id', user.id);
    let gradesQuery = supabase.from('grade_history').select('*, classes(name), subjects(name, kkm)').eq('teacher_id', user.id);
    let journalsQuery = supabase.from('journals').select('*').eq('teacher_id', user.id);

    // Apply school year filter if available
    if (activeSchoolYearId) {
        attendanceQuery = attendanceQuery.eq('school_year_id', activeSchoolYearId);
        gradesQuery = gradesQuery.eq('school_year_id', activeSchoolYearId);
        journalsQuery = journalsQuery.eq('school_year_id', activeSchoolYearId);
    }

    const [
        { data: attendanceData, error: attendanceError },
        { data: gradesData, error: gradesError },
        { data: journalsData, error: journalsError },
        allStudents,
        classes
    ] = await Promise.all([
        attendanceQuery,
        gradesQuery,
        journalsQuery,
        getAllStudents(),
        getClasses()
    ]);

    if (attendanceError || gradesError || journalsError) {
        console.error('Error fetching reports data:', attendanceError || gradesError || journalsError);
        return null;
    }

    const attendanceHistory = (attendanceData as any[]).map(entry => ({
        ...entry,
        className: entry.classes.name,
        subjectName: entry.subjects.name,
        records: entry.records.map((r: any) => ({studentId: r.student_id, status: r.status}))
    }));

    const gradeHistory = (gradesData as any[]).map(entry => ({
        ...entry,
        className: entry.classes.name,
        subjectName: entry.subjects.name,
        subjectKkm: entry.subjects.kkm,
        records: entry.records.map((r: any) => ({studentId: r.student_id, score: r.score}))
    }));

    const journalEntries = journalsData || [];

    // 1. Overall Attendance Rate
    const totalAttendanceRecords = attendanceHistory.reduce((sum, entry) => sum + entry.records.length, 0);
    const totalHadirRecords = attendanceHistory.reduce((sum, entry) => sum + entry.records.filter(r => r.status === 'Hadir').length, 0);
    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalHadirRecords / totalAttendanceRecords) * 100 : 0;

    // 2. Overall Average Grade
    const allGradeRecords = gradeHistory.flatMap(entry => entry.records);
    const totalScore = allGradeRecords.reduce((sum, record) => sum + Number(record.score), 0);
    const overallAverageGrade = allGradeRecords.length > 0 ? totalScore / allGradeRecords.length : 0;

    // 3. Overall Attendance Distribution (for Pie Chart)
    const overallAttendanceDistribution: Record<AttendanceRecord['status'], number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
    attendanceHistory.flatMap(entry => entry.records).forEach(record => {
        overallAttendanceDistribution[record.status]++;
    });

    // 4. Attendance by Class (for Bar Chart)
    const attendanceByClass = classes.map(c => {
        const classAttendance = attendanceHistory.filter(h => h.class_id === c.id).flatMap(h => h.records);
        const distribution: Record<AttendanceRecord['status'], number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
        classAttendance.forEach(record => {
            distribution[record.status]++;
        });
        return { name: c.name, ...distribution };
    });

    // 5. Student Performance Analysis
    const studentPerformance = allStudents.map(student => {
        const studentGrades = gradeHistory.flatMap(g => g.records.filter(r => r.studentId === student.id).map(r => Number(r.score)));
        const studentAttendance = attendanceHistory.flatMap(a => a.records.filter(r => r.studentId === student.id));
        
        const average_grade = studentGrades.length > 0 ? studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length : 0;
        const total_attendance = studentAttendance.length;
        const total_hadir = studentAttendance.filter(a => a.status === 'Hadir').length;
        const attendance_rate = total_attendance > 0 ? (total_hadir / total_attendance) * 100 : 100;

        let status = 'Stabil';
        if (average_grade >= 90 && attendance_rate >= 95) {
            status = 'Sangat Baik';
        } else if (average_grade < 75 && attendance_rate < 85) {
            status = 'Berisiko';
        } else if (average_grade < 75 || attendance_rate < 85) {
            status = 'Butuh Perhatian';
        }

        return {
            id: student.id,
            name: student.name,
            class: student.class_name,
            average_grade: parseFloat(average_grade.toFixed(1)),
            attendance: parseFloat(attendance_rate.toFixed(1)),
            status,
        };
    }).sort((a,b) => b.average_grade - a.average_grade);


    return {
        summaryCards: {
            overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(1)),
            overallAverageGrade: parseFloat(overallAverageGrade.toFixed(1)),
            totalJournals: journalEntries.length
        },
        studentPerformance,
        attendanceByClass,
        overallAttendanceDistribution,
        journalEntries,
        // Pass detailed history for PDF generation
        attendanceHistory,
        gradeHistory,
        allStudents,
    };
}
