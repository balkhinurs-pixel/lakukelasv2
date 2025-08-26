

'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, startOfMonth, endOfMonth, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianDayName, toIndonesianTime } from './timezone';

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
    
    try {
        // Fetch all necessary data in parallel
        const [allUsers, attendanceHistory, journalEntries] = await Promise.all([
            getAllUsers(),
            getTeacherAttendanceHistory(),
            getJournalEntries() // For recent activities
        ]);
        
        const teachers = allUsers.filter(u => u.role === 'teacher');
        
        // Calculate weekly attendance data (last 7 days)
        const weeklyAttendance = [];
        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayName = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Monday start
            
            const dayAttendance = attendanceHistory.filter(a => a.date === dateStr);
            const hadirCount = dayAttendance.filter(a => a.status === 'Tepat Waktu' || a.status === 'Terlambat').length;
            const tidakHadirCount = dayAttendance.filter(a => a.status === 'Tidak Hadir').length;
            
            weeklyAttendance.push({
                day: dayName,
                hadir: hadirCount,
                tidak_hadir: tidakHadirCount
            });
        }
        
        // Generate recent activities based on actual data
        const recentActivities = [];
        
        // Add recent teacher attendance activities
        const recentAttendance = attendanceHistory
            .filter(a => {
                const diffTime = new Date().getTime() - new Date(a.date).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 3; // Last 3 days
            })
            .slice(0, 3);
            
        recentAttendance.forEach(attendance => {
            const timeAgo = (() => {
                const diffTime = new Date().getTime() - new Date(attendance.date).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) return 'Kemarin';
                if (diffDays === 2) return '2 hari lalu';
                if (diffDays === 3) return '3 hari lalu';
                return 'Hari ini';
            })();
            
            const teacherName = allUsers.find((u: Profile) => u.id === attendance.teacherId)?.full_name || 'Seorang guru';
            recentActivities.push({
                text: `${teacherName} ${attendance.status.toLowerCase()} pada ${format(new Date(attendance.date), 'dd MMM yyyy', { locale: id })}`,
                time: timeAgo
            });
        });
        
        // Add recent journal entries
        const recentJournals = journalEntries
            .filter(j => {
                const diffTime = new Date().getTime() - new Date(j.date).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 2; // Last 2 days
            })
            .slice(0, 2);
            
        recentJournals.forEach(journal => {
            const timeAgo = (() => {
                const diffTime = new Date().getTime() - new Date(journal.date).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) return 'Kemarin';
                if (diffDays === 2) return '2 hari lalu';
                return 'Hari ini';
            })();
            
            recentActivities.push({
                text: `Jurnal pembelajaran ${journal.subjectName} - ${journal.className} telah dibuat`,
                time: timeAgo
            });
        });
        
        // If no activities, show a default message
        if (recentActivities.length === 0) {
            recentActivities.push({
                text: 'Belum ada aktivitas terbaru',
                time: 'Hari ini'
            });
        }
        
        return {
            totalUsers: teachers.length,
            weeklyAttendance,
            recentActivities: recentActivities.slice(0, 5) // Limit to 5 activities
        };
        
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return {
            totalUsers: 0,
            weeklyAttendance: [],
            recentActivities: [{
                text: 'Error memuat data aktivitas',
                time: 'Baru saja'
            }]
        };
    }
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

export async function getActiveSchoolYearName(): Promise<string> {
    noStore();
    const supabase = createClient();
    
    // First get the active school year ID from settings
    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    if (!settingsData?.value) {
        return 'Belum Diatur';
    }
    
    // Then get the school year name
    const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('name')
        .eq('id', settingsData.value)
        .single();
        
    return schoolYearData?.name || 'Belum Diatur';
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
    
    // Get the active school year from global settings
    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    if (!settingsData?.value) return [];

    const { data, error } = await supabase
        .from('journal_entries')
        .select(`
            *,
            className:classes ( name ),
            subjectName:subjects ( name )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', settingsData.value)
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
    
    // Get the active school year from global settings
    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    if (!settingsData?.value) return [];

    const { data, error } = await supabase
        .from('attendance')
        .select(`
            *,
            className:classes ( name ),
            subjectName:subjects ( name )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', settingsData.value)
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
    
    // Get the active school year from global settings
    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    if (!settingsData?.value) return [];
    
    const { data, error } = await supabase
        .from('grades')
        .select(`
            *,
            className:classes ( name ),
            subject:subjects ( name, kkm )
        `)
        .eq('teacher_id', user.id)
        .eq('school_year_id', settingsData.value)
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
    
    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    if (!settingsData?.value) {
        return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };
    }
    
    const activeSchoolYearId = settingsData.value;

    const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('*, class:class_id(name), subject:subject_id(name)')
        .eq('teacher_id', user.id)
        .eq('day', todayDay);
    
    const { data: journals, error: journalError } = await supabase
        .from('journal_entries')
        .select('*, className:classes(name), subjectName:subjects(name)')
        .eq('teacher_id', user.id)
        .eq('school_year_id', activeSchoolYearId)
        .order('date', { ascending: false })
        .limit(5);

    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('records')
        .eq('teacher_id', user.id)
        .eq('school_year_id', activeSchoolYearId)
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

    const [attendanceRes, gradesRes, journalRes, studentsRes, activeSchoolYearName] = await Promise.all([
        attendanceQuery,
        gradesQuery,
        journalQuery,
        studentsQuery,
        getActiveSchoolYearName(),
    ]);

    if (attendanceRes.error || gradesRes.error || journalRes.error || studentsRes.error) {
        console.error({ attendance: attendanceRes.error, grades: gradesRes.error, journals: journalRes.error, students: studentsRes.error });
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
        activeSchoolYearName: activeSchoolYearName
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
        else if (average_grade < 70 && attendance < 85) status = "Berisiko";
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
<<<<<<< HEAD
    if (!user) return { studentData: [], className: null };

    const supabase = createClient();
    const { data: homeroomClass, error: homeroomError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user.id)
        .limit(1)
        .single();
    
    if (homeroomError || !homeroomClass) {
        return { studentData: [], className: null };
    }

    const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
        
    const activeSchoolYearId = settingsData?.value;
    if (!activeSchoolYearId) {
        return { studentData: [], className: homeroomClass.name };
    }

=======
    if (!user) {
      return { studentData: [], className: null };
    }
  
    const supabase = createClient();
  
    const { data: homeroomClass, error: homeroomError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', user.id)
      .limit(1)
      .single();
  
    if (homeroomError || !homeroomClass) {
      return { studentData: [], className: null };
    }
    
>>>>>>> b1a44a6ba8788cbaf87652a93d67225b0df6bd7b
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, nis')
        .eq('class_id', homeroomClass.id)
        .eq('status', 'active');
<<<<<<< HEAD
    
    if (studentsError || !students) {
        console.error("Error fetching students for homeroom:", studentsError);
        return { studentData: [], className: homeroomClass.name };
    }

    const studentIds = students.map(s => s.id);

    const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('records')
        .in('records', `(${studentIds.map(id => `'[{"student_id":"${id}"}]'`).join(',')})`)
        .eq('school_year_id', activeSchoolYearId);

    const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('records')
        .in('records', `(${studentIds.map(id => `'[{"student_id":"${id}"}]'`).join(',')})`)
        .eq('school_year_id', activeSchoolYearId);
        
    if (gradesError || attendanceError) {
        console.error({gradesError, attendanceError});
        // Return students with 0 data if fetching aggregates fails
        const studentData = students.map(s => ({
            ...s,
            average_grade: 0,
            attendance_percentage: 0,
            status: 'Stabil'
        }));
        return { studentData, className: homeroomClass.name };
    }

    const studentAggregates = students.map(student => {
        const studentGrades = (gradesData || [])
            .flatMap(g => g.records as any[])
            .filter(r => r.student_id === student.id)
            .map(r => Number(r.score));

        const studentAttendance = (attendanceData || [])
            .flatMap(a => a.records as any[])
            .filter(r => r.student_id === student.id);
        
        const studentHadir = studentAttendance.filter(r => r.status === 'Hadir').length;

        const average_grade = studentGrades.length > 0 
            ? Math.round(studentGrades.reduce((acc, score) => acc + score, 0) / studentGrades.length) 
            : 0;
            
        const attendance_percentage = studentAttendance.length > 0 
            ? Math.round((studentHadir / studentAttendance.length) * 100) 
            : 0;

        let status = "Stabil";
        if (average_grade >= 85 && attendance_percentage >= 95) status = "Sangat Baik";
        else if (average_grade < 70 || attendance_percentage < 85) status = "Butuh Perhatian";
        if (average_grade < 60 && attendance_percentage < 75) status = "Berisiko";


        return {
            ...student,
            average_grade,
            attendance_percentage,
            status
        };
    });

    studentAggregates.sort((a,b) => {
        const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });

    return { studentData: studentAggregates, className: homeroomClass.name };
=======

    if (studentsError) {
        console.error("Error fetching students:", studentsError);
        return { studentData: [], className: homeroomClass.name };
    }

    const studentData = (students || []).map(s => ({
        id: s.id,
        name: s.name,
        nis: s.nis,
        average_grade: 0,
        attendance_percentage: 0,
        status: 'Stabil'
    }));
  
    return { studentData, className: homeroomClass.name };
>>>>>>> b1a44a6ba8788cbaf87652a93d67225b0df6bd7b
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
    if (!studentId) {
        return { grades: [], attendance: [], notes: [] };
    }
    const supabase = createClient();
    
    const [gradesRes, attendanceRes, notesRes] = await Promise.all([
      supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
      supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
      supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    if (gradesRes.error) console.error("Error fetching grades ledger:", gradesRes.error);
    if (attendanceRes.error) console.error("Error fetching attendance ledger:", attendanceRes.error);
    if (notesRes.error) console.error("Error fetching notes:", notesRes.error);
    
    return {
        grades: gradesRes.data || [],
        attendance: attendanceRes.data || [],
        notes: notesRes.data || [],
    };
}


export async function getTeacherAttendanceHistory(): Promise<TeacherAttendance[]> {
    noStore();

    const supabase = createClient();
    const { data, error } = await supabase
        .from('teacher_attendance')
        .select(`
            *,
            teacherName:profiles(full_name)
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching teacher attendance history:", error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        teacherId: item.teacher_id,
        teacherName: item.teacherName?.full_name || 'Unknown Teacher',
        date: item.date,
        checkIn: item.check_in || null,
        checkOut: item.check_out || null,
        status: item.status
    }));
}



    




<<<<<<< HEAD
    
=======
    

>>>>>>> b1a44a6ba8788cbaf87652a93d67225b0df6bd7b
