

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

export async function getReportsData(schoolYearIdParam?: string, monthParam?: number) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let activeSchoolYearId = schoolYearIdParam;
    if (!activeSchoolYearId) {
        const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
        if (profile?.active_school_year_id) {
            activeSchoolYearId = profile.active_school_year_id;
        }
    }

    const { data, error } = await supabase.rpc('get_report_data', {
        p_teacher_id: user.id,
        p_school_year_id: activeSchoolYearId,
        p_month: monthParam
    });

    if (error) {
        console.error('Error calling get_report_data RPC:', error);
        return null;
    }

    if (!data) {
        console.error('No data returned from get_report_data RPC');
        return null;
    }

    const result = data; // The function returns a single row object directly

    const attendanceHistory = (result.attendance_history || []).map((entry:any) => ({
        ...entry,
        records: entry.records.map((r: any) => ({studentId: r.student_id, status: r.status}))
    }));

    const gradeHistory = (result.grade_history || []).map((entry:any) => ({
        ...entry,
        records: entry.records.map((r: any) => ({studentId: r.student_id, score: r.score}))
    }));

    const journalEntries = result.journal_entries || [];
    const allStudents = result.all_students || [];

    const totalAttendanceRecords = attendanceHistory.reduce((sum:number, entry:any) => sum + entry.records.length, 0);
    const totalHadirRecords = attendanceHistory.reduce((sum:number, entry:any) => sum + entry.records.filter((r:any) => r.status === 'Hadir').length, 0);
    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalHadirRecords / totalAttendanceRecords) * 100 : 0;

    const allGradeRecords = gradeHistory.flatMap((entry:any) => entry.records);
    const totalScore = allGradeRecords.reduce((sum:number, record:any) => sum + Number(record.score), 0);
    const overallAverageGrade = allGradeRecords.length > 0 ? totalScore / allGradeRecords.length : 0;

    const overallAttendanceDistribution: Record<AttendanceRecord['status'], number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
    attendanceHistory.flatMap((entry:any) => entry.records).forEach((record:any) => {
        overallAttendanceDistribution[record.status]++;
    });

    const attendanceByClass = (result.attendance_by_class || []).map((c:any) => {
        const distribution: Record<AttendanceRecord['status'], number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
        c.distribution.forEach((d:any) => {
            distribution[d.status as AttendanceRecord['status']] = d.count;
        });
        return { name: c.class_name, ...distribution };
    });

    const studentPerformance = (result.student_performance || []).map((student:any) => ({
      ...student,
      average_grade: parseFloat(student.average_grade ? student.average_grade.toFixed(1) : '0.0'),
      attendance: parseFloat(student.attendance_percentage ? student.attendance_percentage.toFixed(1) : '0.0'),
    }));

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
        attendanceHistory,
        gradeHistory,
        allStudents,
    };
}
