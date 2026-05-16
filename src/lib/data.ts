
'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance, Material, Holiday } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianDayName, getIndonesianTime } from './timezone';
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
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');
    const dayNameIndo = getIndonesianDayName();

    try {
        const [summaryRes, settingsRes, holidaysRes, allStaffRes, todayAttendanceRes, todaySchedulesRes] = await Promise.all([
            supabase.rpc('get_teacher_attendance_summary', { p_date: todayStr }),
            supabase.from('settings').select('value').eq('key', 'attendance_policy').single(),
            supabase.from('holidays').select('*').eq('date', todayStr).maybeSingle(),
            // HANYA ambil staff yang SUDAH AKTIF untuk statistik
            supabase.from('profiles').select('id, full_name, avatar_url').in('role', ['teacher', 'headmaster']).eq('is_activated', true).order('full_name'),
            supabase.from('teacher_attendance').select('*').eq('date', todayStr),
            supabase.from('schedule').select('teacher_id').eq('day', dayNameIndo)
        ]);

        const rawData = summaryRes.data;
        const todayHoliday = holidaysRes.data as Holiday | null;
        const isTodayHoliday = !!todayHoliday;
        
        let summaryData = { 
            total_expected: 0, 
            total_present: 0, 
            total_late: 0, 
            total_absent: 0, 
            attendance_rate: 0 
        };

        if (Array.isArray(rawData) && rawData.length > 0) {
            const firstRow = rawData[0];
            summaryData = {
                total_expected: Number(firstRow.total_expected || 0),
                total_present: Number(firstRow.total_present || 0),
                total_late: Number(firstRow.total_late || 0),
                total_absent: Number(firstRow.total_absent || 0),
                attendance_rate: Number(firstRow.attendance_rate || 0)
            };
        }

        if (isTodayHoliday) {
            summaryData.total_expected = 0;
            summaryData.total_absent = 0;
            summaryData.attendance_rate = 100;
        }

        const activePolicy = settingsRes.data?.value || 'schedule_based';

        const expectedTeacherIds = isTodayHoliday 
            ? new Set<string>() 
            : new Set(
                activePolicy === 'daily_based' 
                ? allStaffRes.data?.map(s => s.id) 
                : todaySchedulesRes.data?.map(s => s.teacher_id)
            );

        const todayAttendanceList = (allStaffRes.data || [])
            .filter(staff => expectedTeacherIds.has(staff.id))
            .map(staff => {
                const record = todayAttendanceRes.data?.find(a => a.teacher_id === staff.id);
                return {
                    id: staff.id,
                    name: staff.full_name,
                    avatar_url: staff.avatar_url,
                    status: record ? record.status : 'Belum Absen',
                    time: record?.check_in ? record.check_in.substring(0, 5) : '--:--',
                };
            });
        
        const weeklyAttendance = [];
        const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(nowIndo);
            date.setDate(date.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayIdx = date.getDay();
            
            const { data: holidayCheck } = await supabase.from('holidays').select('id').eq('date', dateStr).limit(1);
            const wasHoliday = (holidayCheck || []).length > 0;

            const { data: daySummaryArr } = await supabase.rpc('get_teacher_attendance_summary', { p_date: dateStr });
            const daySummary = (Array.isArray(daySummaryArr) && daySummaryArr.length > 0) ? daySummaryArr[0] : null;
            
            weeklyAttendance.push({
                day: dayNamesShort[dayIdx],
                hadir: Number(daySummary?.total_present || 0),
                tidak_hadir: wasHoliday ? 0 : Number(daySummary?.total_absent || 0)
            });
        }
        
        return {
            summary: summaryData,
            weeklyAttendance,
            todayAttendanceList,
            todayHoliday,
            isTodayHoliday,
            activePolicy
        };
        
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return null;
    }
}

export async function getAllUsers(): Promise<Profile[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
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

export async function getHolidays(): Promise<Holiday[]> {
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
        attendance_policy: settings.attendance_policy || 'schedule_based'
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
    const { data = [] } = await supabase.from('agendas').select('*').eq('teacher_id', user.id).order('date', { ascending: false });
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
    const { data, error } = await supabase.from('students').select('*').neq('status', 'active').order('name');
    return data || [];
}

export async function getAllStudents(): Promise<Student[]> {
    noStore();
    const supabase = createClient();
    const { data = [] } = await supabase.from('students').select('id, name, nis').eq('status', 'active').order('name');
    return data || [];
}

export async function getDashboardData(todayDay: string) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { todaySchedule: [], agendas: [], attendancePercentage: 0, unfilledJournalsCount: 0, todayHoliday: null };
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    const todayStr = format(getIndonesianTime(), 'yyyy-MM-dd');
    
    const [scheduleRes, agendasRes, attendanceRes, journalsRes, holidayRes] = await Promise.all([
        supabase.from('schedule').select('*, class:class_id(name), subject:subject_id(name)').eq('teacher_id', user.id).eq('day', todayDay),
        supabase.from('agendas').select('*').eq('teacher_id', user.id).gte('date', todayStr).order('date', { ascending: true }).order('start_time', { ascending: true }).limit(5),
        supabase.from('attendance_records').select('status').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId),
        supabase.from('journal_entries').select('date').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId),
        supabase.from('holidays').select('*').eq('date', todayStr).maybeSingle()
    ]);

    const todayScheduleData = scheduleRes.data?.map(item => ({ ...item, class: item.class.name, subject: item.subject.name })) || [];
    const agendasData = agendasRes.data || [];
    
    const totalRecords = attendanceRes.data?.length || 0;
    const hadirRecords = attendanceRes.data?.filter(r => r.status === 'Hadir').length || 0;
    const attendancePercentage = totalRecords > 0 ? Math.round((hadirRecords / totalRecords) * 100) : 0;
    
    const unfilledJournalsCount = todayScheduleData.length - (journalsRes.data?.filter(j => format(parseISO(j.date), 'yyyy-MM-dd') === todayStr).length || 0);

    return { 
        todaySchedule: todayScheduleData, 
        agendas: agendasData, 
        attendancePercentage, 
        unfilledJournalsCount,
        todayHoliday: holidayRes.data || null
    };
}

export async function getLatestClassPresence(classId: string, date: string): Promise<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>> {
    noStore();
    const supabase = createClient();
    
    const { data } = await supabase
        .from('attendance_records')
        .select('student_id, status, meeting_number')
        .eq('class_id', classId)
        .eq('date', date)
        .order('meeting_number', { ascending: false });
    
    if (!data) return {};
    
    const result: Record<string, any> = {};
    const seen = new Set();
    data.forEach(r => {
        if (!seen.has(r.student_id)) {
            result[r.student_id] = r.status;
            seen.add(r.student_id);
        }
    });
    return result;
}

export async function getReportsData(filters: { schoolYearId: string, classId?: string, subjectId?: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    const supabase = createClient();
    const { schoolYearId, classId, subjectId } = filters;

    const [activeSchoolYearName] = await Promise.all([
        getActiveSchoolYearName()
    ]);

    // KPI Attendance (Semester-based)
    let attendanceKpiQuery = supabase
        .from('attendance_records')
        .select('status', { count: 'exact' })
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId);
    
    if (classId) attendanceKpiQuery = attendanceKpiQuery.eq('class_id', classId);
    if (subjectId) attendanceKpiQuery = attendanceKpiQuery.eq('subject_id', subjectId);

    const { data: attendanceData, count: totalAttendance } = await attendanceKpiQuery;
    const hadirCount = attendanceData?.filter(r => r.status === 'Hadir').length || 0;
    const overallAttendanceRate = totalAttendance ? Math.round((hadirCount / totalAttendance) * 100) : 0;

    // KPI Grades (Semester-based)
    let gradesKpiQuery = supabase
        .from('grade_records')
        .select('score')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId);

    if (classId) gradesKpiQuery = gradesKpiQuery.eq('class_id', classId);
    if (subjectId) gradesKpiQuery = gradesKpiQuery.eq('subject_id', subjectId);

    const { data: gradesData } = await gradesKpiQuery;
    const totalGrades = gradesData?.length || 0;
    const overallAverageGrade = totalGrades > 0 
        ? Math.round(gradesData!.reduce((a, b) => a + Number(b.score), 0) / totalGrades) 
        : 0;

    // KPI Journal (Semester-based)
    let journalKpiQuery = supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId);

    if (classId) journalKpiQuery = journalKpiQuery.eq('class_id', classId);
    if (subjectId) journalKpiQuery = journalKpiQuery.eq('subject_id', subjectId);

    const { count: totalJournals } = await journalKpiQuery;

    // Unique Assessments for the Filter
    let assessmentQuery = supabase
        .from('grade_records')
        .select('assessment_type')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId);
    if (classId) assessmentQuery = assessmentQuery.eq('class_id', classId);
    if (subjectId) assessmentQuery = assessmentQuery.eq('subject_id', subjectId);
    
    const { data: assessmentData } = await assessmentQuery;
    const uniqueAssessments = Array.from(new Set((assessmentData || []).map(a => a.assessment_type))).sort();

    return {
        summaryCards: { 
            overallAttendanceRate: String(overallAttendanceRate), 
            overallAverageGrade: String(overallAverageGrade), 
            totalJournals: totalJournals || 0, 
            activeSchoolYearId: schoolYearId, 
            activeSchoolYearName 
        },
        uniqueAssessments
    };
}

export async function getAttendanceSemesterMatrix(filters: { schoolYearId: string, classId: string, subjectId: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    const supabase = createClient();
    const { schoolYearId, classId, subjectId } = filters;

    // 1. Get all students in the class
    const { data: students } = await supabase
        .from('students')
        .select('id, name, gender, nis')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('name');
    
    if (!students) return null;

    // 2. Get all attendance records for this subject/class/year
    const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, status, meeting_number')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .order('meeting_number', { ascending: true });

    if (!records) return { students, attendanceMap: {}, maxMeeting: 0 };

    // 3. Build a matrix: [student_id][meeting_number] = status
    const attendanceMap: Record<string, Record<number, string>> = {};
    let maxMeeting = 0;

    records.forEach(r => {
        if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = {};
        attendanceMap[r.student_id][r.meeting_number] = r.status;
        if (r.meeting_number > maxMeeting) maxMeeting = r.meeting_number;
    });

    return {
        students,
        attendanceMap,
        maxMeeting
    };
}

export async function getGradesReportList(filters: { schoolYearId: string, classId: string, subjectId: string, assessmentType?: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { schoolYearId, classId, subjectId, assessmentType } = filters;

    let query = supabase
        .from('grade_records')
        .select('*, students(name), classes(name), subjects(name, kkm)')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId);
    
    if (assessmentType && assessmentType !== 'all') {
        query = query.eq('assessment_type', assessmentType);
    }

    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) {
        console.error("Error fetching grades for report:", error);
        return [];
    }

    return (data || []).map((g: any) => ({
        id: g.id,
        date: g.date,
        assessment_type: g.assessment_type,
        score: g.score,
        student_name: g.students?.name || "Siswa",
        class_name: g.classes?.name || "Kelas",
        subject_name: g.subjects?.name || "Mapel",
        subject_kkm: g.subjects?.kkm || 75
    }));
}

export async function getJournalReportList(filters: { schoolYearId: string, classId: string, subjectId: string }) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { schoolYearId, classId, subjectId } = filters;

    const { data, error } = await supabase
        .from('journal_entries_with_names')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching journals for report:", error);
        return [];
    }

    return data || [];
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
    const { data: attendanceData = [] } = await supabase.from('attendance_records').select('student_id, status').in('student_id', studentIds).eq('school_year_id', activeSchoolYearId);
    const studentAggregates = students.map(student => {
        const studentGrades = (gradesData || []).filter(r => r.student_id === student.id).map(r => Number(r.score));
        const studentAttendance = (attendanceData || []).filter(r => r.status !== 'Alpha' && r.student_id === student.id);
        const totalAttendancePossible = (attendanceData || []).filter(r => r.student_id === student.id).length;
        const hadirCount = studentAttendance.length;
        const average_grade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) : 0;
        const attendance_percentage = totalAttendancePossible > 0 ? Math.round((hadirCount / totalAttendancePossible) * 100) : 0;
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
    const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('role', ['teacher', 'headmaster', 'admin']).eq('is_activated', true).order('full_name');
    if (!teachers) return [];
    
    // Gunakan Map untuk mempercepat pencarian, tangani kemungkinan nama kolom id atau teacher_id
    const statsMap = new Map(activityData?.map((item: any) => [item.teacher_id || item.id, item]) || []);
    
    return teachers.map(teacher => {
        const stats = statsMap.get(teacher.id) || { attendance_count: 0, grades_count: 0, journal_count: 0, classes_handled_count: 0 };
        return { 
            id: teacher.id, 
            name: teacher.full_name, 
            attendance_count: Number(stats.attendance_count), 
            grades_count: Number(stats.grades_count), 
            journal_count: Number(stats.journal_count), 
            classes_handled_count: Number(stats.classes_handled_count) 
        };
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

export async function getHomeroomMonthlyAttendance(month: number, year: number) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    const supabase = createClient();

    // 1. Dapatkan kelas perwalian
    const { data: homeroomClass } = await supabase.from('classes').select('id, name').eq('teacher_id', user.id).limit(1).single();
    if (!homeroomClass) return null;

    // 2. Dapatkan daftar siswa aktif di kelas tersebut
    const { data: students } = await supabase.from('students').select('id, name, gender, nis').eq('class_id', homeroomClass.id).eq('status', 'active').order('name');
    if (!students) return null;

    // 3. Tentukan rentang tanggal bulan tersebut
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    // 4. Ambil data presensi
    const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .eq('class_id', homeroomClass.id)
        .gte('date', startDate)
        .lte('date', endDate);

    // 5. Ambil data libur
    const { data: holidays } = await supabase.from('holidays').select('date').gte('date', startDate).lte('date', endDate);
    const holidayDates = new Set(holidays?.map(h => h.date) || []);

    // 6. Bangun matriks presensi [student_id][date] = status
    // Gunakan hierarki status: Hadir > Izin > Sakit > Alpha (sesuai V8.0 PRD)
    const attendanceMap: Record<string, Record<string, string>> = {};
    const priority: Record<string, number> = { "Hadir": 4, "Izin": 3, "Sakit": 2, "Alpha": 1 };

    records?.forEach(r => {
        if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = {};
        const currentStatus = attendanceMap[r.student_id][r.date];
        if (!currentStatus || priority[r.status] > priority[currentStatus]) {
            attendanceMap[r.student_id][r.date] = r.status;
        }
    });

    return {
        className: homeroomClass.name,
        students,
        attendanceMap,
        holidayDates,
        daysInMonth: lastDay,
        month,
        year
    };
}
