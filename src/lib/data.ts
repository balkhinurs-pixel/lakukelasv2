

'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianDayName, toIndonesianTime } from './timezone';
import { getActiveSchoolYearId } from './actions';

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
        const [allUsers, attendanceHistory, journalEntries, holidays] = await Promise.all([
            getAllUsers(),
            getTeacherAttendanceHistory(),
            getJournalEntries(), // For recent activities
            getHolidays()
        ]);
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const isTodayHoliday = holidays.some(h => h.date === todayStr);

        const teachers = allUsers.filter(u => u.role === 'teacher' || u.role === 'headmaster');
        
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
            const tidakHadirCount = dayAttendance.filter(a => a.status === 'Tidak Hadir' || a.status === 'Sakit' || a.status === 'Izin').length;
            
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
            recentActivities: recentActivities.slice(0, 5), // Limit to 5 activities
            isTodayHoliday,
        };
        
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return {
            totalUsers: 0,
            weeklyAttendance: [],
            recentActivities: [{
                text: 'Error memuat data aktivitas',
                time: 'Baru saja'
            }],
            isTodayHoliday: false,
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

// --- Data functions for Admin Panel ---
export async function getAllClasses(): Promise<Class[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) {
        console.error("Error fetching all classes for admin:", error);
        return [];
    }
    return data;
}

export async function getAllSubjects(): Promise<Subject[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) {
        console.error("Error fetching all subjects for admin:", error);
        return [];
    }
    return data;
}

export async function getHolidays(): Promise<{ id: string; date: string; description: string }[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('holidays').select('*').order('date', { ascending: true });
    if (error) {
        console.error("Error fetching holidays:", error);
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
    const { data: userProfileData, error } = await supabase
        .from('profiles')
        .select(`
            id,
            created_at,
            full_name,
            avatar_url,
            nip,
            pangkat,
            jabatan,
            role,
            email,
            active_school_year_id,
            is_homeroom_teacher,
            school_year:active_school_year_id ( name )
        `)
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
    
    const profile: Profile = {
        ...userProfileData,
        active_school_year_name: userProfileData.school_year?.name || 'Belum Diatur',
    };

    return profile;
}

export async function getAdminProfile(): Promise<Profile | null> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching admin profile:", error);
        return null;
    }
    return data;
}


export async function getClasses(): Promise<Class[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
    // Get schedule to find out what classes the teacher teaches
    const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('class_id')
        .eq('teacher_id', user.id);

    if (scheduleError || !scheduleData) {
        console.error("Error fetching teacher's schedule for classes:", scheduleError);
        return [];
    }

    const classIds = [...new Set(scheduleData.map(item => item.class_id))];

    if (classIds.length === 0) return [];

    const { data, error } = await supabase.from('classes').select('*').in('id', classIds).order('name');
    if (error) {
        console.error("Error fetching classes based on schedule:", error);
        return [];
    }
    return data;
}

export async function getSubjects(): Promise<Subject[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const supabase = createClient();
    // Get schedule to find out what subjects the teacher teaches
    const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('subject_id')
        .eq('teacher_id', user.id);

    if (scheduleError || !scheduleData) {
        console.error("Error fetching teacher's schedule for subjects:", scheduleError);
        return [];
    }
    
    const subjectIds = [...new Set(scheduleData.map(item => item.subject_id))];

    if (subjectIds.length === 0) return [];

    const { data, error } = await supabase.from('subjects').select('*').in('id', subjectIds).order('name');
    if (error) {
        console.error("Error fetching subjects based on schedule:", error);
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
    
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) return [];

    const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('school_year_id', activeSchoolYearId)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching attendance history:", error);
        return [];
    }
    return data;
}

export async function getGradeHistory(): Promise<GradeHistoryEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) return [];
    
    const { data, error } = await supabase
        .from('grades_history')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('school_year_id', activeSchoolYearId)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching grade history:", error);
        return [];
    }

    return data;
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
        .select('id, name, class_id')
        .eq('status', 'active')
        .order('name');
    if (error) {
        console.error("Error fetching all students:", error);
        return [];
    }
    return data as (Student & { class_name: string })[];
}

export async function getDashboardData(todayDay: string) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };
    
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
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
        .eq('school_year_id', activeSchoolYearId)
        .order('date', { ascending: false })
        .limit(5);

    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('teacher_id', user.id)
        .eq('school_year_id', activeSchoolYearId);
    
    if (scheduleError || journalError || attendanceError) {
        console.error({ scheduleError, journalError, attendanceError });
    }

    const todayScheduleData = schedule?.map(item => ({ ...item, class: item.class.name, subject: item.subject.name })) || [];
    const journalEntriesData = journals?.map(item => ({ ...item, className: item.className.name, subjectName: item.subjectName.name })) || [];

    const totalRecords = attendance?.length || 0;
    const hadirRecords = attendance?.filter(r => r.status === 'Hadir').length || 0;
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
    if (!user) {
        // Return a default structure if user is not found
        return {
            summaryCards: { overallAttendanceRate: "0", overallAverageGrade: "0", totalJournals: 0, activeSchoolYearName: "" },
            studentPerformance: [], attendanceByClass: [], overallAttendanceDistribution: {},
            journalEntries: [], attendanceHistory: [], gradeHistory: [], allStudents: []
        };
    }

    const supabase = createClient();
    const { schoolYearId, month, classId, subjectId } = filters;

    let attendanceQuery = supabase.from('attendance_history').select('*').eq('teacher_id', user.id);
    let gradesQuery = supabase.from('grades_history').select('*').eq('teacher_id', user.id);
    let journalQuery = supabase.from('journal_entries_with_names').select('*').eq('teacher_id', user.id);
    
    if (schoolYearId && schoolYearId !== 'all') {
        attendanceQuery = attendanceQuery.eq('school_year_id', schoolYearId);
        gradesQuery = gradesQuery.eq('school_year_id', schoolYearId);
        journalQuery = journalQuery.eq('school_year_id', schoolYearId);
    }
    if (month) {
        const year = new Date().getFullYear(); // Or get from schoolYearId if it contains year info
        const startDate = format(startOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');
        attendanceQuery = attendanceQuery.gte('date', startDate).lte('date', endDate);
        gradesQuery = gradesQuery.gte('date', startDate).lte('date', endDate);
        journalQuery = journalQuery.gte('date', startDate).lte('date', endDate);
    }
    if (classId) {
        attendanceQuery = attendanceQuery.eq('class_id', classId);
        gradesQuery = gradesQuery.eq('class_id', classId);
        journalQuery = journalQuery.eq('class_id', classId);
    }
    if (subjectId) {
        attendanceQuery = attendanceQuery.eq('subject_id', subjectId);
        gradesQuery = gradesQuery.eq('subject_id', subjectId);
        journalQuery = journalQuery.eq('subject_id', subjectId);
    }

    const [attendanceRes, gradesRes, journalRes, studentsRes, activeSchoolYearName, teacherClassesRes] = await Promise.all([
        attendanceQuery, gradesQuery, journalQuery, getActiveStudents(), getActiveSchoolYearName(), getClasses(),
    ]);

    if (attendanceRes.error || gradesRes.error || journalRes.error) {
        console.error({ attendance: attendanceRes.error, grades: gradesRes.error, journals: journalRes.error });
        return {
            summaryCards: { overallAttendanceRate: "0", overallAverageGrade: "0", totalJournals: 0, activeSchoolYearName: "" },
            studentPerformance: [], attendanceByClass: [], overallAttendanceDistribution: {},
            journalEntries: [], attendanceHistory: [], gradeHistory: [], allStudents: []
        };
    }
    
    const allStudents = studentsRes || [];
    const attendanceHistory: AttendanceHistoryEntry[] = attendanceRes.data || [];
    const gradeHistory: GradeHistoryEntry[] = gradesRes.data || [];
    const journalEntries = journalRes.data || [];

    const hadirCount = attendanceHistory.filter(r => r.status === 'Hadir').length;
    const overallAttendanceRate = attendanceHistory.length > 0 ? Math.round((hadirCount / attendanceHistory.length) * 100) : 0;
    
    const allGradeScores = gradeHistory.map(r => Number(r.score));
    const overallAverageGrade = allGradeScores.length > 0 ? Math.round(allGradeScores.reduce((a, b) => a + b, 0) / allGradeScores.length) : 0;

    const summaryCards = {
        overallAttendanceRate: String(overallAttendanceRate),
        overallAverageGrade: String(overallAverageGrade),
        totalJournals: journalEntries.length,
        activeSchoolYearName: activeSchoolYearName
    };

    const studentPerformance = allStudents
        .filter(s => (filters.classId ? s.class_id === filters.classId : true))
        .map(student => {
            const studentGrades = gradeHistory.filter(r => r.student_id === student.id).map(r => Number(r.score));
            const studentAttendance = attendanceHistory.filter(r => r.student_id === student.id);
            const studentHadir = studentAttendance.filter(r => r.status === 'Hadir').length;

            const average_grade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) : 0;
            const attendance = studentAttendance.length > 0 ? Math.round((studentHadir / studentAttendance.length) * 100) : 0;
            
            let status = "Stabil";
            if (average_grade >= 85 && attendance >= 95) status = "Sangat Baik";
            else if (average_grade < 70 && attendance < 85) status = "Berisiko";
            else if (average_grade < 78 || attendance < 92) status = "Butuh Perhatian";
            
            const studentClass = teacherClassesRes.find(c => c.id === student.class_id);
            return { id: student.id, name: student.name, nis: student.nis, class: studentClass?.name || 'N/A', average_grade, attendance, status };
        }).sort((a,b) => {
            const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
            return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        });
    
    const attendanceByClass = (teacherClassesRes).map(c => {
        const classAttendance = attendanceHistory.filter(h => h.class_id === c.id);
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
        Sakit: attendanceHistory.filter(r => r.status === 'Sakit').length,
        Izin: attendanceHistory.filter(r => r.status === 'Izin').length,
        Alpha: attendanceHistory.filter(r => r.status === 'Alpha').length,
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

    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
        const { data: students } = await supabase.from('students').select('id, name, nis').eq('class_id', homeroomClass.id).eq('status', 'active');
        const studentData = (students || []).map(s => ({ ...s, average_grade: 0, attendance_percentage: 0, status: 'Stabil' }));
        return { studentData, className: homeroomClass.name };
    }
    
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, nis')
        .eq('class_id', homeroomClass.id)
        .eq('status', 'active');
    
    if (studentsError || !students || students.length === 0) {
        return { studentData: [], className: homeroomClass.name };
    }
    
    const studentIds = students.map(s => s.id);

    const { data: gradesData, error: gradesError } = await supabase
        .from('grade_records')
        .select('student_id, score')
        .in('student_id', studentIds)
        .eq('school_year_id', activeSchoolYearId);

    const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('school_year_id', activeSchoolYearId);
    
    if (gradesError || attendanceError) {
        console.error({ gradesError, attendanceError });
        return { studentData: [], className: homeroomClass.name };
    }

    const studentAggregates = students.map(student => {
        const studentGrades = (gradesData || []).filter(r => r.student_id === student.id).map(r => Number(r.score));
        const studentAttendance = (attendanceData || []).filter(r => r.student_id === student.id);
        const studentHadir = studentAttendance.filter(r => r.status === 'Hadir').length;

        const average_grade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) : 0;
        const attendance_percentage = studentAttendance.length > 0 ? Math.round((studentHadir / studentAttendance.length) * 100) : 0;

        let status = "Stabil";
        if (average_grade >= 85 && attendance_percentage >= 95) status = "Sangat Baik";
        else if (average_grade < 70 && attendance_percentage < 85) status = "Berisiko";
        else if (average_grade < 78 || attendance_percentage < 92) status = "Butuh Perhatian";

        return { id: student.id, name: student.name, nis: student.nis, average_grade, attendance_percentage, status };
    }).sort((a,b) => {
        const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });

    return { studentData: studentAggregates, className: homeroomClass.name };
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

    const activeSchoolYearId = await getActiveSchoolYearId();

    let gradesQuery = supabase.from('grades_history').select('*').eq('student_id', studentId);
    let attendanceQuery = supabase.from('attendance_history').select('*').eq('student_id', studentId);

    if (activeSchoolYearId) {
        gradesQuery = gradesQuery.eq('school_year_id', activeSchoolYearId);
        attendanceQuery = attendanceQuery.eq('school_year_id', activeSchoolYearId);
    }
    
    const [gradesRes, attendanceRes, notesRes] = await Promise.all([
        gradesQuery.order('date', { ascending: false }),
        attendanceQuery.order('date', { ascending: false }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    if (gradesRes.error) console.error("Error fetching grades ledger:", gradesRes.error);
    if (attendanceRes.error) console.error("Error fetching attendance ledger:", attendanceRes.error);
    if (notesRes.error) console.error("Error fetching notes:", notesRes.error);

    const studentGrades = (gradesRes.data || []).map(grade => ({
        id: grade.id,
        subjectName: grade.subject_name,
        assessment_type: grade.assessment_type,
        date: grade.date,
        score: grade.score,
        kkm: grade.subject_kkm,
    }));

    const studentAttendance = (attendanceRes.data || []).map(att => ({
        id: att.id,
        subjectName: att.subject_name,
        date: att.date,
        meeting_number: att.meeting_number,
        status: att.status
    }));
    
    return {
        grades: studentGrades,
        attendance: studentAttendance,
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
        status: item.status,
        reason: item.reason || null,
    }));
}

export async function getTeacherActivityStats() {
    noStore();
    const supabase = createClient();

    const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['teacher', 'headmaster']);
    
    if (teachersError) {
        console.error("Error fetching teachers for activity stats:", teachersError);
        return [];
    }

    const { data: activityData, error: rpcError } = await supabase
        .rpc('get_teacher_activity_counts');

    if (rpcError) {
        console.error("Error fetching teacher activity stats from RPC:", rpcError);
        return [];
    }

    const statsMap = new Map(activityData.map(item => [item.teacher_id, item]));

    const result = teachers.map(teacher => {
        const stats = statsMap.get(teacher.id) || {
            attendance_count: 0,
            grades_count: 0,
            journal_count: 0
        };
        return {
            id: teacher.id,
            name: teacher.full_name,
            ...stats
        };
    });

    return result;
}

    
