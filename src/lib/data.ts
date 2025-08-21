


'use server';

import type { Profile, Class, Subject, Student, JournalEntry, ScheduleItem, AttendanceHistoryEntry, GradeHistoryEntry, ActivationCode, AttendanceRecord, SchoolYear, Agenda, TeacherAttendance } from './types';

// --- DUMMY DATA FOR DESIGN MODE ---

const DUMMY_USER_ID = 'user-dummy-id';
const DUMMY_TEACHER_ID = 'teacher-dummy-id';
const DUMMY_ACTIVE_SCHOOL_YEAR_ID = 'school-year-1';

const DUMMY_CLASSES: Class[] = [
    { id: 'class-1', name: 'Kelas 10-A', teacher_id: DUMMY_USER_ID }, // This user is a homeroom teacher
    { id: 'class-2', name: 'Kelas 11-B', teacher_id: 'another-teacher-id' },
    { id: 'class-3', name: 'Kelas 12-C', teacher_id: 'another-teacher-id-2' },
];

const DUMMY_SUBJECTS: Subject[] = [
    { id: 'subject-1', name: 'Matematika', kkm: 75, teacher_id: DUMMY_TEACHER_ID },
    { id: 'subject-2', name: 'Bahasa Indonesia', kkm: 70, teacher_id: DUMMY_TEACHER_ID },
    { id: 'subject-3', name: 'Fisika', kkm: 78, teacher_id: DUMMY_TEACHER_ID },
];

const DUMMY_STUDENTS: Student[] = [
    ...Array.from({ length: 15 }, (_, i) => ({ id: `student-1-${i}`, name: `Siswa A-${i + 1}`, nis: `1001${i}`, gender: i % 2 ? 'Laki-laki' : 'Perempuan', class_id: 'class-1', status: 'active' as const })),
    ...Array.from({ length: 12 }, (_, i) => ({ id: `student-2-${i}`, name: `Siswa B-${i + 1}`, nis: `1002${i}`, gender: i % 2 ? 'Perempuan' : 'Laki-laki', class_id: 'class-2', status: 'active' as const })),
    ...Array.from({ length: 10 }, (_, i) => ({ id: `student-3-${i}`, name: `Siswa C-${i + 1}`, nis: `1003${i}`, gender: i % 2 ? 'Laki-laki' : 'Perempuan', class_id: 'class-3', status: 'active' as const })),
    { id: 'alumni-1', name: 'Alumni Sukses', nis: '9001', gender: 'Laki-laki', class_id: 'class-3', status: 'graduated' as const },
];

const DUMMY_SCHEDULE: ScheduleItem[] = [
    { id: 'sched-1', day: 'Senin', start_time: '07:30', end_time: '09:00', subject_id: 'subject-1', class_id: 'class-1', teacher_id: DUMMY_TEACHER_ID, class: 'Kelas 10-A', subject: 'Matematika' },
    { id: 'sched-2', day: 'Selasa', start_time: '10:00', end_time: '11:30', subject_id: 'subject-2', class_id: 'class-2', teacher_id: DUMMY_TEACHER_ID, class: 'Kelas 11-B', subject: 'Bahasa Indonesia' },
    { id: 'sched-3', day: 'Rabu', start_time: '08:00', end_time: '09:30', subject_id: 'subject-3', class_id: 'class-3', teacher_id: DUMMY_TEACHER_ID, class: 'Kelas 12-C', subject: 'Fisika' },
];

const DUMMY_JOURNALS: JournalEntry[] = [
    { id: 'journal-1', date: new Date().toISOString(), class_id: 'class-1', subject_id: 'subject-1', meeting_number: 1, learning_objectives: 'Memahami konsep dasar aljabar', learning_activities: 'Diskusi dan latihan soal', teacher_id: DUMMY_TEACHER_ID, className: 'Kelas 10-A', subjectName: 'Matematika' },
    { id: 'journal-2', date: new Date().toISOString(), class_id: 'class-2', subject_id: 'subject-2', meeting_number: 2, learning_objectives: 'Menganalisis puisi', learning_activities: 'Membaca dan menafsirkan puisi karya Chairil Anwar', teacher_id: DUMMY_TEACHER_ID, className: 'Kelas 11-B', subjectName: 'Bahasa Indonesia' },
];

const DUMMY_ATTENDANCE: AttendanceHistoryEntry[] = [
    { id: 'att-1', date: new Date().toISOString(), class_id: 'class-1', subject_id: 'subject-1', meeting_number: 1, records: DUMMY_STUDENTS.filter(s => s.class_id === 'class-1').map(s => ({ studentId: s.id, status: 'Hadir' })), className: 'Kelas 10-A', subjectName: 'Matematika' }
];

const DUMMY_GRADES: GradeHistoryEntry[] = [
    { id: 'grade-1', date: new Date().toISOString(), class_id: 'class-1', subject_id: 'subject-1', assessment_type: 'Ulangan Harian 1', records: DUMMY_STUDENTS.filter(s => s.class_id === 'class-1').map(s => ({ studentId: s.id, score: Math.floor(Math.random() * 30) + 70 })), className: 'Kelas 10-A', subjectName: 'Matematika', subjectKkm: 75 }
];

const DUMMY_AGENDAS: Agenda[] = [
    { id: 'agenda-1', date: new Date().toISOString(), title: 'Rapat Dewan Guru', start_time: '14:00', end_time: '15:30', color: '#3b82f6', tag: 'RAPAT', teacher_id: DUMMY_TEACHER_ID, created_at: new Date().toISOString() },
    { id: 'agenda-2', date: new Date().toISOString(), title: 'Batas Pengumpulan Nilai', color: '#ef4444', teacher_id: DUMMY_TEACHER_ID, created_at: new Date().toISOString() }
];

const DUMMY_SCHOOL_YEARS: SchoolYear[] = [
    { id: 'school-year-1', name: '2023/2024 - Semester Genap', teacher_id: DUMMY_TEACHER_ID },
    { id: 'school-year-2', name: '2023/2024 - Semester Ganjil', teacher_id: DUMMY_TEACHER_ID },
];

const DUMMY_TEACHER_ATTENDANCE: TeacherAttendance[] = [
    { id: 'ta-1', teacherId: '1', teacherName: 'Guru A', date: new Date().toISOString(), checkIn: '07:15', checkOut: '15:30', status: 'Tepat Waktu' },
    { id: 'ta-2', teacherId: '2', teacherName: 'Guru B', date: new Date().toISOString(), checkIn: '07:45', checkOut: '15:32', status: 'Terlambat' },
];


// --- Admin Data ---

export async function getAdminDashboardData() {
    return {
        totalUsers: 12,
        presentToday: 9,
        lateToday: 1,
        absentToday: 2,
        weeklyAttendance: [
            { day: 'Sen', hadir: 10, tidak_hadir: 2 },
            { day: 'Sel', hadir: 11, tidak_hadir: 1 },
            { day: 'Rab', hadir: 9, tidak_hadir: 3 },
            { day: 'Kam', hadir: 12, tidak_hadir: 0 },
            { day: 'Jum', hadir: 10, tidak_hadir: 2 },
            { day: 'Sab', hadir: 11, tidak_hadir: 1 },
        ],
        recentActivities: [
            { text: 'Guru A menginput nilai Matematika Kelas 10-A', time: '5 menit lalu'},
            { text: 'Guru B mengisi jurnal Fisika Kelas 12-C', time: '1 jam lalu'},
            { text: 'Guru C mengubah presensi Bahasa Indonesia Kelas 11-B', time: '3 jam lalu'},
        ]
    };
}

export async function getAllUsers(): Promise<Profile[]> {
    return [
        { id: '1', full_name: 'Ahmad Fauzi, S.Pd.', email: 'ahmad.fauzi@sekolah.id', account_status: 'Pro', role: 'teacher', created_at: new Date().toISOString() },
        { id: '2', full_name: 'Budi Santoso, M.Kom.', email: 'budi.santoso@sekolah.id', account_status: 'Pro', role: 'teacher', created_at: new Date().toISOString() },
        { id: '3', full_name: 'Citra Lestari, S.S.', email: 'citra.lestari@sekolah.id', account_status: 'Pro', role: 'teacher', created_at: new Date().toISOString() },
    ];
}

export async function getTeacherAttendanceHistory(): Promise<TeacherAttendance[]> {
    return DUMMY_TEACHER_ATTENDANCE;
}


// --- User (Teacher) Data ---

export async function getUserProfile() {
    const isHomeroomTeacher = DUMMY_CLASSES.some(c => c.teacher_id === DUMMY_USER_ID);

    return {
        id: DUMMY_USER_ID,
        full_name: 'Guru Dummy',
        email: 'guru.dummy@sekolah.id',
        avatar_url: 'https://placehold.co/100x100.png',
        account_status: 'Pro' as const,
        role: 'teacher' as const,
        active_school_year_id: DUMMY_ACTIVE_SCHOOL_YEAR_ID,
        active_school_year_name: '2023/2024 - Semester Genap',
        is_homeroom_teacher: isHomeroomTeacher,
    } as Profile;
}

export async function getClasses(): Promise<Class[]> {
    return DUMMY_CLASSES;
}

export async function getSubjects(): Promise<Subject[]> {
    return DUMMY_SUBJECTS;
}

export async function getSchoolYears(): Promise<{ schoolYears: SchoolYear[], activeSchoolYearId: string | null }> {
    return { schoolYears: DUMMY_SCHOOL_YEARS, activeSchoolYearId: DUMMY_ACTIVE_SCHOOL_YEAR_ID };
}

export async function getSchedule(): Promise<ScheduleItem[]> {
    return DUMMY_SCHEDULE;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    return DUMMY_JOURNALS;
}

export async function getAgendas(): Promise<Agenda[]> {
    return DUMMY_AGENDAS;
}

export async function getAttendanceHistory(): Promise<AttendanceHistoryEntry[]> {
    return DUMMY_ATTENDANCE;
}

export async function getGradeHistory(): Promise<GradeHistoryEntry[]> {
    return DUMMY_GRADES;
}

export async function getActiveStudents(): Promise<Student[]> {
    return DUMMY_STUDENTS.filter(s => s.status === 'active');
}

export async function getAlumni(): Promise<Student[]> {
    return DUMMY_STUDENTS.filter(s => s.status !== 'active');
}

export async function getAllStudents(): Promise<Student[]> {
    return DUMMY_STUDENTS;
}

export async function getDashboardData(todayDay: string) {
    const todaySchedule = DUMMY_SCHEDULE.filter(s => s.day.toLowerCase() === todayDay.toLowerCase());
    return {
        todaySchedule,
        journalEntries: DUMMY_JOURNALS.slice(0, 5),
        attendancePercentage: 95,
        unfilledJournalsCount: 1,
    };
}

export async function getReportsData(filters: { schoolYearId: string, month?: number, classId?: string, subjectId?: string }) {
    return {
        summaryCards: { overallAttendanceRate: 95, overallAverageGrade: 88, totalJournals: DUMMY_JOURNALS.length },
        studentPerformance: DUMMY_STUDENTS.slice(0, 5).map(s => ({
            id: s.id,
            name: s.name,
            class: DUMMY_CLASSES.find(c => c.id === s.class_id)?.name || '-',
            average_grade: Math.floor(Math.random() * 20) + 75,
            attendance: Math.floor(Math.random() * 10) + 90,
            status: 'Sangat Baik' as const
        })),
        attendanceByClass: DUMMY_CLASSES.map(c => ({
            name: c.name,
            Hadir: Math.floor(Math.random() * 100),
            Sakit: Math.floor(Math.random() * 10),
            Izin: Math.floor(Math.random() * 10),
            Alpha: Math.floor(Math.random() * 5),
        })),
        overallAttendanceDistribution: { Hadir: 300, Sakit: 20, Izin: 15, Alpha: 5 },
        journalEntries: DUMMY_JOURNALS,
        attendanceHistory: DUMMY_ATTENDANCE,
        gradeHistory: DUMMY_GRADES,
        allStudents: DUMMY_STUDENTS,
    };
}

export async function getHomeroomStudentProgress() {
    // In a real app, this would get the logged-in teacher's ID.
    const homeroomClass = DUMMY_CLASSES.find(c => c.teacher_id === DUMMY_USER_ID);

    if (!homeroomClass) {
        return { studentData: [], className: null };
    }

    const studentsInClass = DUMMY_STUDENTS.filter(s => s.class_id === homeroomClass.id && s.status === 'active');

    const studentData = studentsInClass.map(student => {
        // Dummy data generation for progress
        const average_grade = Math.floor(Math.random() * (95 - 70 + 1) + 70); // 70-95
        const attendance_percentage = Math.floor(Math.random() * (100 - 85 + 1) + 85); // 85-100
        
        let status = "Stabil";
        if (average_grade >= 85 && attendance_percentage >= 95) {
            status = "Sangat Baik";
        } else if (average_grade < 75 && attendance_percentage < 90) {
            status = "Berisiko";
        } else if (average_grade < 78 || attendance_percentage < 92) {
            status = "Butuh Perhatian";
        }

        return {
            id: student.id,
            name: student.name,
            nis: student.nis,
            average_grade,
            attendance_percentage,
            status,
        };
    }).sort((a, b) => {
        // Sort by status priority
        const statusOrder = { "Berisiko": 0, "Butuh Perhatian": 1, "Stabil": 2, "Sangat Baik": 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });

    return { studentData, className: homeroomClass.name };
}
