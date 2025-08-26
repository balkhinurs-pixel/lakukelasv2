

'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO } from 'date-fns';
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
    if (!user) return {
        summaryCards: { overallAttendanceRate: "0", overallAverageGrade: "0", totalJournals: 0, activeSchoolYearName: "" },
        studentPerformance: [], attendanceByClass: [], overallAttendanceDistribution: {},
        journalEntries: [], attendanceHistory: [], gradeHistory: [], allStudents: []
    };

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
        attendanceQuery.eq('month', month);
        gradesQuery.eq('month', month);
        journalQuery.eq('month', month);
    }
    if (classId) {
        attendanceQuery.eq('class_id', classId);
        gradesQuery.eq('class_id', classId);
        journalQuery.eq('class_id', classId);
    }
    if (subjectId) {
        attendanceQuery.eq('subject_id', subjectId);
        gradesQuery.eq('subject_id', subjectId);
        journalQuery.eq('subject_id', subjectId);
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
            return { id: student.id, name: student.name, class: studentClass?.name || 'N/A', average_grade, attendance, status };
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
    const user = await getAuthenticatedUser();
    if (!user) return [];

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

```
  </change>
  <change>
    <file>src/app/dashboard/attendance/attendance-page-component.tsx</file>
    <content><![CDATA[
"use client";

import * as React from "react";
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Edit, Eye, Loader2, User, Users, CheckCircle2, XCircle, AlertCircle, Clock, MessageSquarePlus, TrendingUp, TrendingDown } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class, AttendanceHistoryEntry, Subject, StudentNote } from "@/lib/types";
import { saveAttendance, addStudentNote } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const attendanceOptions: { value: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha', label: string, icon: React.ReactNode, className: string, selectedClassName: string }[] = [
    { 
        value: 'Hadir', 
        label: 'Hadir', 
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300', 
        selectedClassName: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-md shadow-emerald-200' 
    },
    { 
        value: 'Sakit', 
        label: 'Sakit', 
        icon: <AlertCircle className="h-4 w-4" />,
        className: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300', 
        selectedClassName: 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500 shadow-md shadow-amber-200' 
    },
    { 
        value: 'Izin', 
        label: 'Izin', 
        icon: <Clock className="h-4 w-4" />,
        className: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300', 
        selectedClassName: 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500 shadow-md shadow-blue-200' 
    },
    { 
        value: 'Alpha', 
        label: 'Alpha', 
        icon: <XCircle className="h-4 w-4" />,
        className: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-300', 
        selectedClassName: 'bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-md shadow-red-200' 
    },
];


// Isolated component to prevent re-rendering the entire list on a single change
const AttendanceInput = React.memo(({ studentId, value, onChange }: { studentId: string, value: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha', onChange: (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => void }) => {
    return (
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
        {attendanceOptions.map(opt => (
            <Button
                key={opt.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(studentId, opt.value)}
                className={cn(
                    "h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ease-in-out flex-shrink-0",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current/20",
                    "active:scale-95 transform",
                    value === opt.value
                        ? `${opt.selectedClassName} scale-105`
                        : `${opt.className}`
                )}
            >
                <span className="mr-1.5">{opt.icon}</span>
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.label.charAt(0)}</span>
            </Button>
        ))}
        </div>
    );
});
AttendanceInput.displayName = 'AttendanceInput';

const AddNoteDialog = ({ student, onNoteSaved }: { student: Student | null, onNoteSaved: () => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [note, setNote] = React.useState('');
    const [noteType, setNoteType] = React.useState<StudentNote['type']>('neutral');
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleSaveNote = async () => {
        if (!student || !note) {
            toast({ title: "Gagal", description: "Isi catatan tidak boleh kosong.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const result = await addStudentNote({ studentId: student.id, note, type: noteType });
        if (result.success) {
            toast({ title: "Catatan Disimpan", description: `Catatan untuk ${student.name} telah disimpan.` });
            onNoteSaved();
            setIsOpen(false);
            setNote('');
            setNoteType('neutral');
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                    <MessageSquarePlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Catatan untuk {student.name}</DialogTitle>
                    <DialogDescription>Catatan ini akan dapat dilihat oleh wali kelas.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note-content">Isi Catatan</Label>
                        <Textarea id="note-content" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Tidak mengerjakan PR, sangat aktif di kelas, dll." />
                    </div>
                    <div className="space-y-2">
                        <Label>Jenis Catatan</Label>
                        <RadioGroup value={noteType} onValueChange={(value: StudentNote['type']) => setNoteType(value)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="r-positive" />
                                <Label htmlFor="r-positive" className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500"/> Positif</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement" id="r-improvement" />
                                <Label htmlFor="r-improvement" className="flex items-center gap-1"><TrendingDown className="h-4 w-4 text-yellow-500"/> Perbaikan</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="neutral" id="r-neutral" />
                                <Label htmlFor="r-neutral" className="flex items-center gap-1">Netral</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveNote} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Simpan Catatan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function AttendancePageComponent({
    classes,
    subjects,
    initialHistory,
    allStudents,
    activeSchoolYearName
}: {
    classes: Class[];
    subjects: Subject[];
    initialHistory: AttendanceHistoryEntry[];
    allStudents: Student[];
    activeSchoolYearName: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>(preselectedClassId || undefined);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>(preselectedSubjectId || undefined);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const [attendance, setAttendance] = React.useState<Map<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>>(new Map());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEntry, setViewingEntry] = React.useState<AttendanceHistoryEntry | null>(null);
  const { toast } = useToast();

  const selectedClass = classes.find(c => c.id === selectedClassId);
  
  React.useEffect(() => {
    if (selectedClassId) {
      setLoading(true);
      const filteredStudents = allStudents.filter(s => s.class_id === selectedClassId);
      setStudents(filteredStudents);
      if (!editingId) {
        resetForm(filteredStudents);
      }
      setLoading(false);
    } else {
      setStudents([]);
    }
  }, [selectedClassId, allStudents, editingId]);


  const resetForm = (studentList: Student[]) => {
    setEditingId(null);
    setDate(new Date());
    setMeetingNumber("");
    const newAttendance = new Map();
    studentList.forEach(student => {
      newAttendance.set(student.id, 'Hadir');
    });
    setAttendance(newAttendance);
  }

  const handleAttendanceChange = React.useCallback((studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    setAttendance(prev => new Map(prev.set(studentId, status)));
  }, []);

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId || !date || !meetingNumber) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, dan isi nomor pertemuan.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);

    const formData = new FormData();
    if (editingId) {
      formData.append('id', editingId);
    }
    formData.append('date', format(date, 'yyyy-MM-dd'));
    formData.append('class_id', selectedClassId);
    formData.append('subject_id', selectedSubjectId);
    formData.append('meeting_number', String(meetingNumber));
    formData.append('records', JSON.stringify(Array.from(attendance.entries()).map(([student_id, status]) => ({ student_id, status }))));
    
    const result = await saveAttendance(formData);

    if (result.success) {
      toast({
        title: editingId ? "Presensi Diperbarui" : "Presensi Disimpan",
        description: `Presensi telah berhasil disimpan.`,
      });
      router.refresh();
      resetForm(students);
    } else {
      toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEdit = (entry: AttendanceHistoryEntry) => {
      setLoading(true);
      if (selectedClassId !== entry.class_id) {
        setSelectedClassId(entry.class_id);
      }
      setSelectedSubjectId(entry.subject_id);
      
      const studentsForClass = allStudents.filter(s => s.class_id === entry.class_id);
      setStudents(studentsForClass);
      
      setEditingId(entry.id);
      setDate(parseISO(entry.date));
      setMeetingNumber(entry.meeting_number);

      const loadedAttendance = new Map<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>();
      // This is the fix. We need to handle the fact that entry.status is a single value, not an array.
      // The logic should populate the attendance map for all students in the class.
      studentsForClass.forEach(student => {
        // Find the record for this student. It will be in the history of all records for that day.
        const studentRecord = initialHistory.find(h => 
            h.date === entry.date && 
            h.class_id === entry.class_id && 
            h.subject_id === entry.subject_id && 
            h.meeting_number === entry.meeting_number &&
            h.student_id === student.id
        );
        loadedAttendance.set(student.id, studentRecord ? studentRecord.status : 'Hadir');
      });
      setAttendance(loadedAttendance);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleViewDetails = (entry: AttendanceHistoryEntry) => {
    setViewingEntry(entry);
    setIsDetailDialogOpen(true);
  }

  // Group history by session
  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: { entry: AttendanceHistoryEntry, records: { student_id: string, status: string }[] } } = {};
    initialHistory.forEach(item => {
      const key = `${item.date}-${item.class_id}-${item.subject_id}-${item.meeting_number}`;
      if (!groups[key]) {
        groups[key] = {
          entry: { ...item },
          records: []
        };
      }
      groups[key].records.push({ student_id: item.student_id, status: item.status });
    });
    return Object.values(groups);
  }, [initialHistory]);

  const filteredHistory = React.useMemo(() => {
      return groupedHistory.filter(h => 
        (!selectedClassId || h.entry.class_id === selectedClassId) && 
        (!selectedSubjectId || h.entry.subject_id === selectedSubjectId)
      );
  }, [groupedHistory, selectedClassId, selectedSubjectId]);
  
  const getStudentName = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)?.name || "Siswa tidak ditemukan";
  }

  const getStatusBadgeVariant = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    switch (status) {
        case 'Hadir': return "default";
        case 'Sakit': return "secondary";
        case 'Izin': return "secondary";
        case 'Alpha': return "destructive";
    }
  }
   const getStatusBadgeClass = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    switch (status) {
        case 'Hadir': return "bg-green-600 hover:bg-green-700";
        case 'Sakit': return "bg-yellow-500 hover:bg-yellow-600 text-black";
        case 'Izin': return "bg-blue-500 hover:bg-blue-600";
        case 'Alpha': return "bg-red-600 hover:bg-red-700";
    }
  }

  return (
    <div className="space-y-6 p-1">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              editingId ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {editingId ? <Edit className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-xl">{editingId ? 'Ubah Presensi' : 'Input Presensi'}</CardTitle>
              <CardDescription className="mt-1">
                {editingId ? 'Ubah detail presensi yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan pertemuan untuk mencatat presensi siswa.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="space-y-2 xl:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Tahun Ajaran Aktif</Label>
                <Input 
                  value={activeSchoolYearName} 
                  disabled 
                  className="font-semibold bg-slate-50 border-slate-200 text-slate-600"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Kelas</Label>
                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                  <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Mata Pelajaran</Label>
                 <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId}>
                    <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                <Label htmlFor="pertemuan" className="text-sm font-medium text-slate-700">Pertemuan Ke</Label>
                <Input 
                  id="pertemuan" 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={meetingNumber} 
                  onChange={(e) => setMeetingNumber(Number(e.target.value))}
                  className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Daftar Siswa - {selectedClass?.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({students.length > 0 ? `${students.length} siswa` : '...'})
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Pilih status kehadiran untuk setiap siswa. Nama siswa sudah diurutkan berdasarkan abjad.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 overflow-hidden">
            {loading ? (
                <div className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <div className="space-y-2">
                        <p className="font-medium">Memuat data siswa...</p>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                </div>
            ) : students.length > 0 ? (
                <>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {students.map((student, index) => (
                            <div key={student.id} className="group relative border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 break-words leading-tight">{student.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Status kehadiran</p>
                                      </div>
                                      <AddNoteDialog student={student} onNoteSaved={() => router.refresh()} />
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                       <AttendanceInput 
                                            studentId={student.id} 
                                            value={attendance.get(student.id) || 'Hadir'}
                                            onChange={handleAttendanceChange}
                                       />
                                    </div>
                                  </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[80px] text-center font-semibold text-slate-700">No.</TableHead>
                            <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 w-[420px]">Status Kehadiran</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {students.map((student, index) => (
                            <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                            <TableCell className="text-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-md flex items-center justify-center text-white text-xs font-semibold mx-auto">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                                <div className="flex items-center gap-2">
                                    <span>{student.name}</span>
                                    <AddNoteDialog student={student} onNoteSaved={() => router.refresh()} />
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <AttendanceInput 
                                    studentId={student.id} 
                                    value={attendance.get(student.id) || 'Hadir'}
                                    onChange={handleAttendanceChange}
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-slate-100">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-700">Belum ada siswa di kelas ini</p>
                        <p className="text-sm text-slate-500">Silakan tambahkan siswa di menu Manajemen Rombel</p>
                      </div>
                    </div>
                </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <CardFooter className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !meetingNumber}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}
                  </Button>
                  {editingId && (
                    <Button 
                      variant="outline" 
                      onClick={() => resetForm(students)} 
                      disabled={loading}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Batal Mengubah
                    </Button>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  Total siswa: <span className="font-semibold">{students.length}</span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Riwayat Presensi</CardTitle>
                <CardDescription className="mt-1">
                  Daftar presensi yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
             {filteredHistory.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {filteredHistory.map(({entry, records}) => {
                  const summary = records.reduce((acc, record) => {
                      acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] = (acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] || 0) + 1;
                      return acc;
                  }, {} as Record<'Hadir' | 'Sakit' | 'Izin' | 'Alpha', number>);
                  return (
                    <div key={entry.id} className="group border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                      <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{entry.class_name} - {entry.subject_name}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                {format(parseISO(entry.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Pertemuan ke-{entry.meeting_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <div className="text-sm">
                                <span className="font-medium text-emerald-800">Hadir</span>
                                <span className="ml-1 text-emerald-600">{summary.Hadir || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <div className="text-sm">
                                <span className="font-medium text-amber-800">Sakit</span>
                                <span className="ml-1 text-amber-600">{summary.Sakit || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <div className="text-sm">
                                <span className="font-medium text-blue-800">Izin</span>
                                <span className="ml-1 text-blue-600">{summary.Izin || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <div className="text-sm">
                                <span className="font-medium text-red-800">Alpha</span>
                                <span className="ml-1 text-red-600">{summary.Alpha || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                              <Button variant="secondary" size="sm" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => handleViewDetails(entry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detail
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-50" onClick={() => handleEdit(entry)} disabled={loading}>
                                <Edit className="mr-2 h-4 w-4" />
                                Ubah
                              </Button>
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <Table>
                      <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                              <TableHead className="font-semibold text-slate-700">Info</TableHead>
                              <TableHead className="font-semibold text-slate-700">Pertemuan</TableHead>
                              <TableHead className="font-semibold text-slate-700">Ringkasan</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredHistory.map(({entry, records}) => {
                              const summary = records.reduce((acc, record) => {
                                  acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] = (acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] || 0) + 1;
                                  return acc;
                              }, {} as Record<'Hadir' | 'Sakit' | 'Izin' | 'Alpha', number>);
                              return (
                                   <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">
                                        {format(parseISO(entry.date), 'EEEE, dd MMM yyyy', { locale: id })}
                                      </TableCell>
                                      <TableCell>
                                          <div className="font-medium text-slate-900">{entry.class_name}</div>
                                          <div className="text-sm text-slate-500">{entry.subject_name}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                          {entry.meeting_number}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              {summary.Hadir || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                                              <AlertCircle className="w-3 h-3 mr-1" />
                                              {summary.Sakit || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                              <Clock className="w-3 h-3 mr-1" />
                                              {summary.Izin || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                              <XCircle className="w-3 h-3 mr-1" />
                                              {summary.Alpha || 0}
                                            </span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleViewDetails(entry)}
                                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                          >
                                              <Eye className="mr-2 h-4 w-4" />
                                              Detail
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEdit(entry)} 
                                            disabled={loading}
                                            className="border-slate-300 hover:bg-slate-50 text-slate-700"
                                          >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Ubah
                                          </Button>
                                        </div>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              </div>
            </>
             ) : (
                  <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-slate-700">Belum ada riwayat presensi</p>
                          <p className="text-sm text-slate-500">Riwayat presensi yang sudah disimpan akan muncul di sini</p>
                        </div>
                      </div>
                  </div>
              )}
          </CardContent>
        </Card>
      )}

       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-content-mobile mobile-safe-area max-w-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Detail Presensi: {viewingEntry?.class_name}</DialogTitle>
                  <DialogDescription className="mt-1">
                      {viewingEntry?.subject_name} - {viewingEntry ? format(parseISO(viewingEntry.date), "EEEE, dd MMMM yyyy", { locale: id }) : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
                {viewingEntry && students.length > 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700">Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {groupedHistory.find(g => g.entry.id === viewingEntry.id)?.records.map(record => (
                                  <TableRow key={record.student_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">{getStudentName(record.student_id)}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge 
                                            variant={getStatusBadgeVariant(record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha')} 
                                            className={cn(
                                              getStatusBadgeClass(record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'),
                                              "px-3 py-1 text-sm font-medium"
                                            )}
                                          >
                                              {record.status}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                    </div>
                ) : (
                     <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-slate-100">
                            <Users className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-slate-700">Memuat data...</p>
                            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
                          </div>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
