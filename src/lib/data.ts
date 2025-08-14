

'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, ActivationCode, AttendanceRecord, SchoolYear, Agenda } from './types';
import { format, startOfDay, endOfDay } from 'date-fns';

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

    const { data, error } = await supabase.from('students').select('*, classes!inner(name, teacher_id)').eq('classes.teacher_id', user.id).order('name', { ascending: true });
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
    if (!user) return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };

    const today = new Date();
    const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(today);
    const todayDate = format(today, 'yyyy-MM-dd');
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();


    const { data: todayScheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .eq('day', todayDay)
        .order('start_time', { ascending: true });

    const { data: journalEntriesData, error: journalError } = await supabase
        .from('journals')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

    if (scheduleError || journalError) {
        console.error("Dashboard data error:", scheduleError || journalError);
    }
    
    const todaySchedule = (todayScheduleData || []).map(item => ({
        ...item,
        // @ts-ignore
        class: item.classes!.name,
        // @ts-ignore
        subject: item.subjects!.name,
    }));
    const journalEntries = (journalEntriesData || []).map(entry => ({
        ...entry,
        // @ts-ignore
        className: entry.classes!.name,
        // @ts-ignore
        subjectName: entry.subjects!.name,
    }));

    const { data: attendanceTodayData, error: attendanceError } = await supabase
        .from('attendance_history')
        .select('records')
        .eq('teacher_id', user.id)
        .gte('date', startOfToday)
        .lte('date', endOfToday);
    
    let attendancePercentage = 0;
    if (!attendanceError && attendanceTodayData.length > 0) {
        const allRecords = attendanceTodayData.flatMap(entry => entry.records as AttendanceRecord[]);
        const totalPresent = allRecords.filter(r => r.status === 'Hadir').length;
        if (allRecords.length > 0) {
            attendancePercentage = Math.round((totalPresent / allRecords.length) * 100);
        }
    }

    const { data: filledJournalsToday, error: filledJournalsError } = await supabase
        .from('journals')
        .select('class_id, subject_id')
        .eq('teacher_id', user.id)
        .eq('date', todayDate);

    let unfilledJournalsCount = 0;
    if (!filledJournalsError) {
        unfilledJournalsCount = todaySchedule.filter(scheduleItem => {
            return !filledJournalsToday.some(journal => 
                journal.class_id === scheduleItem.class_id && journal.subject_id === scheduleItem.subject_id
            );
        }).length;
    }

    return { 
        todaySchedule, 
        journalEntries,
        attendancePercentage,
        unfilledJournalsCount
    };
}

export async function getReportsData(schoolYearId: string, month?: number) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Return a default, empty structure if user is not found
        return {
            summaryCards: { overallAttendanceRate: 0, overallAverageGrade: 0, totalJournals: 0 },
            studentPerformance: [],
            attendanceByClass: [],
            overallAttendanceDistribution: {},
            journalEntries: [],
            attendanceHistory: [],
            gradeHistory: [],
            allStudents: []
        };
    }

    // --- Fetch Raw Data ---
    let attendanceQuery = supabase.from('attendance_history').select('*, classes(name), subjects(name)').eq('teacher_id', user.id);
    let gradesQuery = supabase.from('grade_history').select('*, classes(name), subjects(name, kkm)').eq('teacher_id', user.id);
    let journalsQuery = supabase.from('journals').select('*, classes(name), subjects(name)').eq('teacher_id', user.id);

    if (schoolYearId) {
        attendanceQuery = attendanceQuery.eq('school_year_id', schoolYearId);
        gradesQuery = gradesQuery.eq('school_year_id', schoolYearId);
        journalsQuery = journalsQuery.eq('school_year_id', schoolYearId);
    }
    if (month) {
        // Supabase doesn't have a direct month filter, so we filter in JS after fetching for the whole year.
        // This is less efficient but necessary without complex date range logic.
    }

    const [
        attendanceHistoryRes,
        gradeHistoryRes,
        journalEntriesRes,
        allStudentsRes,
        classesRes
    ] = await Promise.all([
        attendanceQuery.order('date', { ascending: false }),
        gradesQuery.order('date', { ascending: false }),
        journalsQuery.order('date', { ascending: false }),
        getAllStudents(),
        getClasses()
    ]);
    
    // --- Data Processing and Filtering ---
    let attendanceHistory = attendanceHistoryRes.data || [];
    let gradeHistory = gradeHistoryRes.data || [];
    let journalEntries = journalEntriesRes.data || [];

    if (month) {
        attendanceHistory = attendanceHistory.filter(r => new Date(r.date).getMonth() + 1 === month);
        gradeHistory = gradeHistory.filter(r => new Date(r.date).getMonth() + 1 === month);
        journalEntries = journalEntries.filter(r => new Date(r.date).getMonth() + 1 === month);
    }

    // --- Calculations ---
    const allAttendanceRecords = attendanceHistory.flatMap(h => h.records as AttendanceRecord[]);
    const totalPresent = allAttendanceRecords.filter(r => r.status === 'Hadir').length;
    const overallAttendanceRate = allAttendanceRecords.length > 0 ? Math.round((totalPresent / allAttendanceRecords.length) * 100) : 0;

    const allGradeRecords = gradeHistory.flatMap(h => h.records as GradeRecord[]);
    const totalScore = allGradeRecords.reduce((acc, r) => acc + Number(r.score || 0), 0);
    const overallAverageGrade = allGradeRecords.length > 0 ? Math.round(totalScore / allGradeRecords.length) : 0;
    
    const summaryCards = {
        overallAttendanceRate: isNaN(overallAttendanceRate) ? 0 : overallAttendanceRate,
        overallAverageGrade: isNaN(overallAverageGrade) ? 0 : overallAverageGrade,
        totalJournals: journalEntries.length
    };

    const overallAttendanceDistribution: { [key: string]: number } = allAttendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const studentPerformance = allStudentsRes.map(student => {
        const studentGrades = allGradeRecords.filter(g => g.studentId === student.id).map(g => Number(g.score));
        const studentAttendance = allAttendanceRecords.filter(a => a.studentId === student.id);
        const presentCount = studentAttendance.filter(a => a.status === 'Hadir').length;

        const averageGrade = studentGrades.length > 0 ? studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length : 0;
        const attendancePercentage = studentAttendance.length > 0 ? (presentCount / studentAttendance.length) * 100 : 100;
        
        let status = 'Butuh Perhatian';
        if (averageGrade >= 85 && attendancePercentage >= 90) status = 'Sangat Baik';
        else if (averageGrade >= 75 && attendancePercentage >= 80) status = 'Stabil';
        else if (averageGrade < 70 || attendancePercentage < 70) status = 'Berisiko';

        return {
            id: student.id,
            name: student.name,
            class: student.class_name,
            average_grade: Math.round(averageGrade),
            attendance: Math.round(attendancePercentage),
            status: status
        };
    });

    const attendanceByClass = classesRes.map(c => {
        const classAttendance = attendanceHistory.filter(h => h.class_id === c.id).flatMap(h => h.records as AttendanceRecord[]);
        return {
            name: c.name,
            Hadir: classAttendance.filter(r => r.status === 'Hadir').length,
            Sakit: classAttendance.filter(r => r.status === 'Sakit').length,
            Izin: classAttendance.filter(r => r.status === 'Izin').length,
            Alpha: classAttendance.filter(r => r.status === 'Alpha').length,
        };
    }).filter(c => c.Hadir > 0 || c.Sakit > 0 || c.Izin > 0 || c.Alpha > 0);

    return {
        summaryCards,
        studentPerformance,
        attendanceByClass,
        overallAttendanceDistribution,
        journalEntries: journalEntries.map((j: any) => ({...j, className: j.classes.name, subjectName: j.subjects.name})),
        attendanceHistory: attendanceHistory.map((a: any) => ({...a, className: a.classes.name, subjectName: a.subjects.name, records: a.records.map((r:any) => ({studentId: r.student_id, status: r.status}))})),
        gradeHistory: gradeHistory.map((g: any) => ({...g, className: g.classes.name, subjectName: g.subjects.name, records: g.records.map((r:any) => ({studentId: r.student_id, score: r.score}))})),
        allStudents: allStudentsRes
    };
}
