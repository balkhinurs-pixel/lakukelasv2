'use server';

import { createClient } from './supabase/server';
import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, SchoolYear, Agenda, TeacherAttendance, Material, Holiday, GoogleDriveIntegration } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
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

// --- Dashboard & Monitoring ---

/**
 * Mengambil data untuk Dashboard Admin/Kepala Sekolah.
 * Menampilkan ringkasan kehadiran hari ini secara akurat.
 */
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
            supabase.from('settings').select('value').eq('key', 'attendance_policy').maybeSingle(),
            supabase.from('holidays').select('*').eq('date', todayStr).maybeSingle(),
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
        
        return {
            summary: summaryData,
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

/**
 * Mengambil data tren kehadiran guru untuk rentang hari tertentu.
 * Dioptimalkan: Menangani 'Future Dates' agar tidak muncul Alpha fiktif.
 */
export async function getAttendanceTrendData(range: string = "7") {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    
    const supabase = createClient();
    const nowIndo = getIndonesianTime();
    const todayDateOnly = new Date(nowIndo).setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date = new Date(nowIndo);

    if (range.startsWith('month-')) {
        const monthNum = parseInt(range.split('-')[1]);
        const targetYear = nowIndo.getFullYear();
        startDate = startOfMonth(new Date(targetYear, monthNum - 1));
        endDate = endOfMonth(new Date(targetYear, monthNum - 1));
    } else if (range === 'semester') {
        const currentMonth = nowIndo.getMonth() + 1;
        startDate = currentMonth >= 7 
            ? new Date(nowIndo.getFullYear(), 6, 1) 
            : new Date(nowIndo.getFullYear(), 0, 1);
        endDate = endOfMonth(nowIndo);
    } else {
        const daysCount = parseInt(range) || 7;
        startDate = new Date(nowIndo);
        startDate.setDate(startDate.getDate() - (daysCount - 1));
    }
    
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const [attendanceRes, holidaysRes, schedulesRes, settingsRes, staffRes] = await Promise.all([
        supabase.from('teacher_attendance').select('date, status, teacher_id').gte('date', startDateStr).lte('date', endDateStr),
        supabase.from('holidays').select('date, description, type').gte('date', startDateStr).lte('date', endDateStr),
        supabase.from('schedule').select('teacher_id, day'),
        supabase.from('settings').select('value').eq('key', 'attendance_policy').maybeSingle(),
        supabase.from('profiles').select('id').in('role', ['teacher', 'headmaster']).eq('is_activated', true)
    ]);

    const attendanceRecords = attendanceRes.data || [];
    const holidays = holidaysRes.data || [];
    const schedules = schedulesRes.data || [];
    const attendancePolicy = settingsRes.data?.value || 'schedule_based';
    const totalStaffCount = staffRes.data?.length || 0;

    const scheduleByDay: Record<string, Set<string>> = {};
    const dayNamesFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    dayNamesFull.forEach(day => {
        scheduleByDay[day] = new Set(schedules.filter(s => s.day === day).map(s => s.teacher_id));
    });

    const daysList = eachDayOfInterval({ start: startDate, end: endDate });
    const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return daysList.map(d => {
        const dStr = format(d, 'yyyy-MM-dd');
        const dDateOnly = new Date(d).setHours(0, 0, 0, 0);
        const dayIdx = d.getDay();
        const dayName = dayNamesFull[dayIdx];
        const isFuture = dDateOnly > todayDateOnly;
        
        const holiday = holidays.find(h => h.date === dStr);
        const isHoliday = !!holiday || dayIdx === 0;

        let expected = 0;
        // Jika hari ini libur ATAU hari ini adalah masa depan, maka tidak ada kewajiban absen (expected = 0)
        if (!isHoliday && !isFuture) {
            expected = attendancePolicy === 'daily_based' ? totalStaffCount : (scheduleByDay[dayName]?.size || 0);
        }

        const dayRecords = attendanceRecords.filter(r => r.date === dStr);
        const berangkat = dayRecords.filter(r => ['Tepat Waktu', 'Terlambat'].includes(r.status)).length;
        const izinSakit = dayRecords.filter(r => ['Sakit', 'Izin'].includes(r.status)).length;
        
        // Tidak Absen (Alpha) hanya dihitung untuk hari yang SUDAH LEWAT/SEDANG BERJALAN
        const tidakAbsen = (expected > 0 && !isFuture) ? Math.max(0, expected - berangkat - izinSakit) : 0;

        return {
            day: dayNamesShort[dayIdx],
            tanggal: format(d, 'dd/MM'),
            tanggal_full: format(d, 'dd MMM yyyy', { locale: id }),
            full_date: dStr,
            berangkat,
            tidakAbsen,
            izinSakit,
            isHoliday,
            isFuture,
            holidayName: holiday?.description || (dayIdx === 0 ? 'Hari Minggu' : null)
        };
    });
}

// --- Bulk Fetchers for Optimization ---

/**
 * Mengambil seluruh data yang dibutuhkan halaman Presensi dalam 1 request gabungan.
 */
export async function getAttendancePageData() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();

    const [profileRes, schoolYearRes, scheduleRes, studentsRes, holidaysRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('school_years').select('name').eq('id', activeSchoolYearId || '').maybeSingle(),
        supabase.from('schedule').select('*, class:classes(id, name), subject:subjects(id, name)').eq('teacher_id', user.id),
        supabase.from('students').select('*').eq('status', 'active').order('name'),
        supabase.from('holidays').select('*').order('date'),
        supabase.from('attendance_history').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId || '').order('date', { ascending: false }).limit(20)
    ]);

    const rawSchedules = scheduleRes.data || [];
    const classesMap = new Map();
    const subjectsMap = new Map();
    
    rawSchedules.forEach((s: any) => {
        if (s.class) classesMap.set(s.class.id, s.class);
        if (s.subject) subjectsMap.set(s.subject.id, s.subject);
    });

    return {
        profile: profileRes.data,
        activeSchoolYearName: schoolYearRes.data?.name || 'Belum Diatur',
        classes: Array.from(classesMap.values()),
        subjects: Array.from(subjectsMap.values()),
        schedule: rawSchedules.map((s: any) => ({ ...s, class: s.class.name, subject: s.subject.name })),
        allStudents: studentsRes.data || [],
        holidays: holidaysRes.data || [],
        history: historyRes.data || []
    };
}

/**
 * Mengambil seluruh data yang dibutuhkan halaman Nilai dalam 1 request gabungan.
 */
export async function getGradesPageData() {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();

    const [schoolYearRes, scheduleRes, studentsRes, historyRes] = await Promise.all([
        supabase.from('school_years').select('name').eq('id', activeSchoolYearId || '').maybeSingle(),
        supabase.from('schedule').select('*, class:classes(id, name), subject:subjects(id, name, kkm)').eq('teacher_id', user.id),
        supabase.from('students').select('*').eq('status', 'active').order('name'),
        supabase.from('grades_history').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId || '').order('date', { ascending: false }).limit(30)
    ]);

    const rawSchedules = scheduleRes.data || [];
    const classesMap = new Map();
    const subjectsMap = new Map();
    
    rawSchedules.forEach((s: any) => {
        if (s.class) classesMap.set(s.class.id, s.class);
        if (s.subject) subjectsMap.set(s.subject.id, s.subject);
    });

    return {
        activeSchoolYearName: schoolYearRes.data?.name || 'Belum Diatur',
        classes: Array.from(classesMap.values()),
        subjects: Array.from(subjectsMap.values()),
        allStudents: studentsRes.data || [],
        history: historyRes.data || []
    };
}

// --- Data Master & Profil ---

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
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .not('school_name', 'is', null)
        .limit(1)
        .maybeSingle();
        
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
    const { data: classes } = await supabase.from('schedule').select('classes(*)').eq('teacher_id', user.id);
    if (!classes) return [];
    const uniqueClasses = Array.from(new Map(classes.map((item: any) => [item.classes.id, item.classes])).values());
    return uniqueClasses.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSubjects(): Promise<Subject[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const { data: subjects } = await supabase.from('schedule').select('subjects(*)').eq('teacher_id', user.id);
    if (!subjects) return [];
    const uniqueSubjects = Array.from(new Map(subjects.map((item: any) => [item.subjects.id, item.subjects])).values());
    return uniqueSubjects.sort((a, b) => a.name.localeCompare(b.name));
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
    const { data } = await supabase.from('schedule').select('*, class:classes(name), subject:subjects(name)').eq('teacher_id', user.id);
    if (!data) return [];
    return data.map(item => ({ ...item, class: item.class.name, subject: item.subject.name }));
}

export async function getAllSchedules(): Promise<ScheduleItem[]> {
    noStore();
    const supabase = createClient();
    const { data } = await supabase.from('schedule').select('*, class:classes(name), subject:subjects(name)').order('day').order('start_time');
    if (!data) return [];
    return data.map(item => ({ ...item, class: item.class.name, subject: item.subject.name }));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return [];
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) return [];
    const { data } = await supabase.from('journal_entries_with_names').select('*').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId).order('date', { ascending: false });
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
    const { data = [] } = await supabase.from('students').select('id, name, nis, class_id').eq('status', 'active').order('name');
    return data || [];
}

export async function getDashboardData(todayDay: string) {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return { todaySchedule: [], agendas: [], attendancePercentage: 0, unfilledJournalsCount: 0, todayHoliday: null, driveIntegration: null };
    const supabase = createClient();
    const activeSchoolYearId = await getActiveSchoolYearId();
    const todayStr = format(getIndonesianTime(), 'yyyy-MM-dd');
    
    const [scheduleRes, agendasRes, attendanceRes, journalsRes, holidayRes, driveRes] = await Promise.all([
        supabase.from('schedule').select('*, class:classes(name), subject:subjects(name)').eq('teacher_id', user.id).eq('day', todayDay),
        supabase.from('agendas').select('*').eq('teacher_id', user.id).gte('date', todayStr).order('date', { ascending: true }).order('start_time', { ascending: true }).limit(5),
        supabase.from('attendance_records').select('status').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId || ''),
        supabase.from('journal_entries').select('date').eq('teacher_id', user.id).eq('school_year_id', activeSchoolYearId || ''),
        supabase.from('holidays').select('*').eq('date', todayStr).maybeSingle(),
        supabase.from('google_drive_integrations').select('*').eq('user_id', user.id).maybeSingle()
    ]);

    const todayScheduleData = scheduleRes.data?.map(item => ({ ...item, class: item.class.name, subject: item.subject.name })) || [];
    const agendasData = agendasRes.data || [];
    
    const totalRecords = attendanceRes.data?.length || 0;
    const hadirCount = attendanceRes.data?.filter(r => r.status === 'Hadir').length || 0;
    const attendancePercentage = totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : 0;
    
    const unfilledJournalsCount = todayScheduleData.length - (journalsRes.data?.filter(j => format(parseISO(j.date), 'yyyy-MM-dd') === todayStr).length || 0);

    return { 
        todaySchedule: todayScheduleData, 
        agendas: agendasData, 
        attendancePercentage, 
        unfilledJournalsCount,
        todayHoliday: holidayRes.data || null,
        driveIntegration: driveRes.data || null
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

    let journalKpiQuery = supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId);

    if (classId) journalKpiQuery = journalKpiQuery.eq('class_id', classId);
    if (subjectId) journalKpiQuery = journalKpiQuery.eq('subject_id', subjectId);

    const { count: totalJournals } = await journalKpiQuery;

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

    const { data: students } = await supabase
        .from('students')
        .select('id, name, gender, nis')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('name');
    
    if (!students) return null;

    const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, status, meeting_number')
        .eq('teacher_id', user.id)
        .eq('school_year_id', schoolYearId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .order('meeting_number', { ascending: true });

    if (!records) return { students, attendanceMap: {}, maxMeeting: 0 };

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
    const { data: gradesData } = await supabase.from('grade_records').select('student_id, score').in('student_id', studentIds).eq('school_year_id', activeSchoolYearId || '');
    const { data: attendanceData = [] } = await supabase.from('attendance_records').select('student_id, status').in('student_id', studentIds).eq('school_year_id', activeSchoolYearId || '');
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
        supabase.from('grades_history').select('*').eq('student_id', studentId).eq('school_year_id', activeSchoolYearId || '').order('date', { ascending: false }),
        supabase.from('attendance_history').select('*').eq('student_id', studentId).eq('school_year_id', activeSchoolYearId || '').order('date', { ascending: false }),
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

    const { data: homeroomClass } = await supabase.from('classes').select('id, name').eq('teacher_id', user.id).limit(1).single();
    if (!homeroomClass) return null;

    const { data: students } = await supabase.from('students').select('id, name, gender, nis').eq('class_id', homeroomClass.id).eq('status', 'active').order('name');
    if (!students) return null;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .eq('class_id', homeroomClass.id)
        .gte('date', startDate)
        .lte('date', endDate);

    const { data: holidays } = await supabase.from('holidays').select('date').gte('date', startDate).lte('date', endDate);
    const holidayDates = new Set(holidays?.map(h => h.date) || []);

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

export async function getGoogleDriveIntegration(): Promise<GoogleDriveIntegration | null> {
    noStore();
    const user = await getAuthenticatedUser();
    if (!user) return null;
    const supabase = createClient();
    const { data, error } = await supabase.from('google_drive_integrations').select('*').eq('user_id', user.id).maybeSingle();
    if (error) {
        console.error("Error fetching drive integration:", error);
        return null;
    }
    return data as GoogleDriveIntegration | null;
}
