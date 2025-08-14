

'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, ActivationCode, AttendanceRecord, SchoolYear, Agenda } from './types';
import { format, startOfDay, endOfDay, getMonth } from 'date-fns';

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
    
    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();


    const { data: todayScheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .eq('day', todayDay)
        .order('start_time', { ascending: true });
    
    let journalQuery = supabase
        .from('journals')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (profile?.active_school_year_id) {
        journalQuery = journalQuery.eq('school_year_id', profile.active_school_year_id);
    }
    
    const { data: journalEntriesData, error: journalError } = await journalQuery;

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
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'));
    
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
        .eq('date', format(today, 'yyyy-MM-dd'));

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
    return null;
  }
  
  const { data, error } = await supabase.rpc('get_report_data', {
      p_teacher_id: user.id,
      p_school_year_id: schoolYearId,
      p_month: month,
  }).single();


  if (error) {
    console.error('Error fetching reports data via RPC:', error);
    return null;
  }
  
  // The data from RPC is a single object with JSON fields. We need to parse them.
  // This structure matches the one in `reports-page-component`
  return {
    summaryCards: data.summary_cards ?? { overallAttendanceRate: 0, overallAverageGrade: 0, totalJournals: 0 },
    studentPerformance: data.student_performance ?? [],
    attendanceByClass: data.attendance_by_class ?? [],
    overallAttendanceDistribution: data.overall_attendance_distribution ?? {},
    journalEntries: data.journal_entries ?? [],
    attendanceHistory: data.attendance_history ?? [],
    gradeHistory: data.grade_history ?? [],
    allStudents: data.all_students ?? [],
  };
}
