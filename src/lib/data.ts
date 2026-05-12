
'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance, Material } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianDayName, toIndonesianTime } from './timezone';
import { getActiveSchoolYearId } from './actions';

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
    if (!user) return null;
    
    const supabase = createClient();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
        const [allUsers, summaryRes, journalEntries, holidays] = await Promise.all([
            getAllUsers(),
            supabase.rpc('get_teacher_attendance_summary', { p_date: todayStr }).single(),
            getJournalEntries(),
            getHolidays()
        ]);
        
        const isTodayHoliday = holidays.some(h => h.date === todayStr);
        const teachers = allUsers.filter(u => u.role === 'teacher' || u.role === 'headmaster');
        
        // Calculate weekly attendance (simple loop for 7 days)
        const weeklyAttendance = [];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayName = dayNames[date.getDay()];
            
            const { data: daySummary } = await supabase.rpc('get_teacher_attendance_summary', { p_date: dateStr }).single();
            
            weeklyAttendance.push({
                day: dayName,
                hadir: daySummary?.total_present || 0,
                tidak_hadir: daySummary?.total_absent || 0
            });
        }
        
        const recentActivities = journalEntries.slice(0, 5).map(j => ({
            text: `Guru ${j.teacher_id.substring(0,5)}... mengisi jurnal ${j.subjectName} di ${j.className}`,
            time: format(parseISO(j.date), 'dd MMM', { locale: id })
        }));
        
        return {
            totalUsers: teachers.length,
            weeklyAttendance,
            recentActivities,
            isTodayHoliday,
            summary: summaryRes.data || { total_expected: 0, total_present: 0, total_late: 0, total_absent: 0, attendance_rate: 0 }
        };
        
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return null;
    }
}

export async function getAllUsers(): Promise<Profile[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data;
}

export async function getAllClasses(): Promise<Class[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) return [];
    return data;
}

export async function getAllSubjects(): Promise<Subject[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) return [];
    return data;
}

export async function getHolidays(): Promise<{ id: string; date: string; description: string }[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('holidays').select('*').order('date', { ascending: true });
    if (error) return [];
    return data;
}

export async function getUserProfile(): Promise<Profile | null> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) return null;
    return data;
}

export async function getAdminProfile(): Promise<Profile | null> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').limit(1).single();
    if (error) return null;
    return data;
}

export async function getClasses(): Promise<Class[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data: scheduleData } = await supabase.from('schedule').select('class_id').eq('teacher_id', user.id);
    if (!scheduleData) return [];
    const classIds = [...new Set(scheduleData.map(item => item.class_id))];
    if (classIds.length === 0) return [];
    const { data } = await supabase.from('classes').select('*').in('id', classIds).order('name');
    return data || [];
}

export async function getSubjects(): Promise<Subject[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data: scheduleData } = await supabase.from('schedule').select('subject_id').eq('teacher_id', user.id);
    if (!scheduleData) return [];
    const subjectIds = [...new Set(scheduleData.map(item => item.subject_id))];
    if (subjectIds.length === 0) return [];
    const { data } = await supabase.from('subjects').select('*').in('id', subjectIds).order('name');
    return data || [];
}

export async function getSchoolYears(): Promise<{ schoolYears: SchoolYear[], activeSchoolYearId: string | null }> {
    noStore();
    const supabase = createClient();
    const [yearsResult, settingsResult] = await Promise.all([
        supabase.from('school_years').select('*').order('name', { ascending: false }),
        supabase.from('settings').select('value').eq('key', 'active_school_year_id').single()
    ]);
    return { schoolYears: yearsResult.data || [], activeSchoolYearId: settingsResult.data?.value || null };
}

export async function getActiveSchoolYearName(): Promise<string> {
    noStore();
    const supabase = createClient();
    const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'active_school_year_id').single();
    if (!settingsData?.value) return 'Belum Diatur';
    const { data: schoolYearData } = await supabase.from('school_years').select('name').eq('id', settingsData.value).single();
    return schoolYearData?.name || 'Belum Diatur';
}

export async function getAttendanceSettings() {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('key, value').in('key', ['attendance_latitude', 'attendance_longitude', 'attendance_radius', 'attendance_check_in_start', 'attendance_check_in_deadline', 'attendance_policy']);
    if (!data) return { latitude: '', longitude: '', radius: 30, check_in_start: '06:30', check_in_deadline: '07:15', attendance_policy: 'schedule_based' };
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
        check_in_deadline: settings.check_in_deadline || '07:15',
        attendance_policy: settings.policy || 'schedule_based'
    };
}

export async function getSchedule(): Promise<ScheduleItem[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data } = await supabase.from('schedule').select('*, class:class_id(name), subject:subject_id(name)').eq('teacher_id', user.id);
    if (!data) return [];
    return data.map(item => ({ ...item, class: item.class.name, subject: item.subject.name }));
}

export async function getAllSchedules(): Promise<ScheduleItem[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('schedule').select('*, class:class_id(name), subject:subject_id(name)').order('day').order('start_time');
    if (!data) return [];
    return data.map(item => ({ ...item, class: item.class.name, subject: item.subject.name }));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'active_school_year_id').single();
    if (!settingsData?.value) return [];
    const { data } = await supabase.from('journal_entries_with_names').select('*').eq('teacher_id', user.id).eq('school_year_id', settingsData.value).order('date', { ascending: false });
    return data || [];
}

export async function getAgendas(): Promise<Agenda[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data } = await supabase.from('agendas').select('*').eq('teacher_id', user.id).order('date', { ascending: false });
    return data || [];
}

export async function getAttendanceHistory(): Promise<AttendanceHistoryEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) return [];
    const { data } = await supabase.from('attendance_history').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false });
    return data || [];
}

export async function getGradeHistory(): Promise<GradeHistoryEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) return [];
    const { data } = await supabase.from('grades_history').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false });
    return data || [];
}

export async function getActiveStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('students').select('*').eq('status', 'active').order('name');
    return data || [];
}

export async function getAlumni(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('students').select('*').neq('status', 'active').order('name');
    return data || [];
}

export async function getAllStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('students').select('id, name, class_id').eq('status', 'active').order('name');
    return data || [];
}

export async function getDashboardData(todayDay: string) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { todaySchedule: [], journalEntries: [], attendancePercentage: 0, unfilledJournalsCount: 0 };
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    const { data: schedule } = await supabase.from('schedule').select('*, class:class_id(name), subject:subject_id(name)').eq('teacher_id', user.id).eq('day', todayDay);
    const { data: journals } = await supabase.from('journal_entries_with_names').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false }).limit(5);
    const { data: attendance } = await supabase.from('attendance_records').select('status').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId);
    const todayScheduleData = schedule?.map(item => ({ ...item, class: item.class.name, subject: item.subject.name })) || [];
    const journalEntriesData = journals || [];
    const totalRecords = attendance?.length || 0;
    const hadirRecords = attendance?.filter(r => r.status === 'Hadir').length || 0;
    const attendancePercentage = totalRecords > 0 ? Math.round((hadirRecords / totalRecords) * 100) : 0;
    const unfilledJournalsCount = todayScheduleData.length - journalEntriesData.filter(j => format(parseISO(j.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;
    return { todaySchedule: todayScheduleData, journalEntries: journalEntriesData, attendancePercentage, unfilledJournalsCount };
}

export async function getReportsData(filters: { schoolYearId: string, month?: number, classId?: string, subjectId?: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
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
    if (classId) {
        attendanceQuery = attendanceQuery.eq('class_id', classId);
        gradesQuery = gradesQuery.eq('class_id', classId);
        journalQuery = journalQuery.eq('class_id', classId);
    }
    const [attendanceRes, gradesRes, journalRes, studentsRes, activeSchoolYear, teacherClassesRes] = await Promise.all([
        attendanceQuery, gradesQuery, journalQuery, getActiveStudents(), getActiveSchoolYearName(), getClasses(),
    ]);
    const attendanceHistory = attendanceRes.data || [];
    const gradeHistory = gradesRes.data || [];
    const journalEntries = journalRes.data || [];
    const hadirCount = attendanceHistory.filter(r => r.status === 'Hadir').length;
    const overallAttendanceRate = attendanceHistory.length > 0 ? Math.round((hadirCount / attendanceHistory.length) * 100) : 0;
    const allGradeScores = gradeHistory.map(r => Number(r.score));
    const overallAverageGrade = allGradeScores.length > 0 ? Math.round(allGradeScores.reduce((a, b) => a + b, 0) / allGradeScores.length) : 0;
    return {
        summaryCards: { overallAttendanceRate: String(overallAttendanceRate), overallAverageGrade: String(overallAverageGrade), totalJournals: journalEntries.length, activeSchoolYearId: schoolYearId, activeSchoolYearName: activeSchoolYear },
        attendanceByClass: teacherClassesRes.map(c => ({ name: c.name, Hadir: attendanceHistory.filter(h => h.class_id === c.id && h.status === 'Hadir').length, Sakit: attendanceHistory.filter(h => h.class_id === c.id && h.status === 'Sakit').length, Izin: attendanceHistory.filter(h => h.class_id === c.id && h.status === 'Izin').length, Alpha: attendanceHistory.filter(h => h.class_id === c.id && h.status === 'Alpha').length })),
        overallAttendanceDistribution: { Hadir: hadirCount, Sakit: attendanceHistory.filter(r => r.status === 'Sakit').length, Izin: attendanceHistory.filter(r => r.status === 'Izin').length, Alpha: attendanceHistory.filter(r => r.status === 'Alpha').length },
        journalEntries, attendanceHistory, gradeHistory, allStudents: studentsRes || []
    };
}

export async function getHomeroomStudentProgress() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { studentData: [], className: null };
    const supabase = createClient();
    const { data: homeroomClass } = await supabase.from('classes').select('*').eq('teacher_id', user.id).limit(1).single();
    if (!homeroomClass) return { studentData: [], className: null };
    const activeSchoolYearId = await getActiveSchoolYearId();
    const { data: students } = await supabase.from('students').select('id, name, nis').eq('class_id', homeroomClass.id).eq('status', 'active');
    if (!students) return { studentData: [], className: homeroomClass.name };
    const studentIds = students.map(s => s.id);
    const { data: gradesData } = await supabase.from('grade_records').select('student_id, score').in('student_id', studentIds).eq('school_year_id', activeSchoolYearId);
    const { data: attendanceData } = await supabase.from('attendance_records').select('student_id, status').in('student_id', studentIds).eq('school_year_id', activeSchoolYearId);
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
    });
    return { studentData: studentAggregates, className: homeroomClass.name };
}

export async function getHomeroomClassDetails() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    const supabase = createClient();
    const { data: homeroomClass } = await supabase.from('classes').select('*').eq('teacher_id', user.id).limit(1).single();
    if (!homeroomClass) return null;
    const [studentsInClass, subjects] = await Promise.all([
        getActiveStudents().then(students => students.filter(s => s.class_id === homeroomClass.id)),
        getSubjects()
    ]);
    return { homeroomClass, studentsInClass, subjects };
}

export async function getStudentLedgerData(studentId: string) {
    noStore();
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    const [gradesRes, attendanceRes, notesRes] = await Promise.all([
        supabase.from('grades_history').select('*').eq('student_id', studentId).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false }),
        supabase.from('attendance_history').select('*').eq('student_id', studentId).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);
    return {
        grades: (gradesRes.data || []).map(grade => ({ id: grade.id, subjectName: grade.subject_name, assessment_type: grade.assessment_type, date: grade.date, score: grade.score, kkm: grade.subject_kkm })),
        attendance: (attendanceRes.data || []).map(att => ({ id: att.id, subjectName: att.subject_name, date: att.date, meeting_number: att.meeting_number, status: att.status })),
        notes: notesRes.data || []
    };
}

export async function getTeacherAttendanceHistory(): Promise<TeacherAttendance[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('teacher_attendance').select('*, teacherName:profiles(full_name)').order('date', { ascending: false });
    if (!data) return [];
    return data.map((item: any) => ({ id: item.id, teacherId: item.teacher_id, teacherName: item.teacherName?.full_name || 'Unknown', date: item.date, checkIn: item.check_in, checkOut: item.check_out, status: item.status, reason: item.reason }));
}

export async function getTeacherActivityStats() {
    noStore();
    const supabase = createClient();
    const { data: activityData } = await supabase.rpc('get_teacher_activity_counts');
    const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('role', ['teacher', 'headmaster']).order('full_name');
    if (!teachers) return [];
    const statsMap = new Map(activityData?.map((item: any) => [item.teacher_id, item]) || []);
    return teachers.map(teacher => {
        const stats = statsMap.get(teacher.id) || { attendance_count: 0, grades_count: 0, journal_count: 0, classes_handled_count: 0 };
        return { id: teacher.id, name: teacher.full_name, attendance_count: Number(stats.attendance_count), grades_count: Number(stats.grades_count), journal_count: Number(stats.journal_count), classes_handled_count: Number(stats.classes_handled_count) };
    });
}

export async function getMaterials(): Promise<Material[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data } = await supabase.from('materials').select('*, className:classes(name), subjectName:subjects(name)').eq('teacher_id', user.id).order('created_at', { ascending: false });
    return data?.map(item => ({ ...item, className: item.className?.name, subjectName: item.subjectName?.name })) || [];
}
