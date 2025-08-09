
import type { Class, JournalEntry, ScheduleItem, Student, AttendanceHistoryEntry, GradeHistoryEntry, Subject, Profile } from './types';

// This file provides mock data for the application for demonstration purposes.

// --- USERS & PROFILES (for Admin view) ---
export const mockUsers: (Profile & { join_date: string })[] = [
    { id: 'user_2cVLj8iA1tAcrrf34oVbVuA2t65', full_name: 'Guru Tangguh', email: 'guru@sekolah.id', account_status: 'Pro', join_date: '2023-01-15' },
    { id: 'user_2cVLj8iA1tAcrrf34oVbVuA2t66', full_name: 'Andi Pratama', email: 'andi.p@email.com', account_status: 'Free', join_date: '2023-02-20' },
    { id: 'user_2cVLj8iA1tAcrrf34oVbVuA2t67', full_name: 'Siti Aminah', email: 'siti.a@email.com', account_status: 'Pro', join_date: '2023-03-10' },
    { id: 'user_2cVLj8iA1tAcrrf34oVbVuA2t68', full_name: 'Budi Setiawan', email: 'budi.s@email.com', account_status: 'Free', join_date: '2023-04-05' },
    { id: 'user_2cVLj8iA1tAcrrf34oVbVuA2t69', full_name: 'Dewi Lestari', email: 'dewi.l@email.com', account_status: 'Pro', join_date: '2023-05-21' },
];

export const activationCodes = [
    { id: 1, code: 'ALFA-BETA-GAMMA-DELTA', is_used: true, used_by: 'user_2cVLj8iA1tAcrrf34oVbVuA2t67', used_at: '2023-03-10T10:00:00Z' },
    { id: 2, code: 'EPSILON-ZETA-ETA-THETA', is_used: false, used_by: null, used_at: null },
    { id: 3, code: 'IOTA-KAPPA-LAMBDA-MU', is_used: false, used_by: null, used_at: null },
    { id: 4, code: 'ZEPHYR-PRO-2024-DEMO', is_used: false, used_by: null, used_at: null },
];


// --- ROSTER DATA ---

const TEACHER_ID = 'user_2cVLj8iA1tAcrrf34oVbVuA2t65'; // Example UUID for the current user

export const students: Student[] = [
  { id: 'S001', name: 'Budi Santoso', nis: '23241001', nisn: '0012345678', gender: 'Laki-laki', classId: 'C01' },
  { id: 'S002', name: 'Citra Lestari', nis: '23241002', nisn: '0023456789', gender: 'Perempuan', classId: 'C01' },
  { id: 'S003', name: 'Dewi Anggraini', nis: '23241003', nisn: '0034567890', gender: 'Perempuan', classId: 'C02' },
  { id: 'S004', name: 'Eko Prasetyo', nis: '23241004', nisn: '0045678901', gender: 'Laki-laki', classId: 'C01' },
  { id: 'S005', name: 'Fitriani', nis: '23241005', nisn: '0056789012', gender: 'Perempuan', classId: 'C02' },
  { id: 'S006', name: 'Gilang Ramadhan', nis: '23241006', nisn: '0067890123', gender: 'Laki-laki', classId: 'C03' },
  { id: 'S007', name: 'Hana Yulita', nis: '23241007', nisn: '0078901234', gender: 'Perempuan', classId: 'C03' },
];

export const classes: Class[] = [
  { id: 'C01', name: 'Kelas 10-A', students: students.filter(s => s.classId === 'C01'), teacherId: TEACHER_ID },
  { id: 'C02', name: 'Kelas 10-B', students: students.filter(s => s.classId === 'C02'), teacherId: TEACHER_ID },
  { id: 'C03', name: 'Kelas 11-A', students: students.filter(s => s.classId === 'C03'), teacherId: TEACHER_ID },
];

export const subjects: Subject[] = [
  { id: 'SUBJ01', name: 'Matematika Wajib', kkm: 75, teacherId: TEACHER_ID },
  { id: 'SUBJ02', name: 'Bahasa Indonesia', kkm: 70, teacherId: TEACHER_ID },
  { id: 'SUBJ03', name: 'Sejarah Indonesia', kkm: 72, teacherId: TEACHER_ID },
];

// --- SCHEDULE ---
export const schedule: ScheduleItem[] = [
  { id: 'SCH01', day: 'Senin', startTime: '07:30', endTime: '09:00', subject: 'Matematika Wajib', class: 'Kelas 10-A', subjectId: 'SUBJ01', classId: 'C01', teacherId: TEACHER_ID },
  { id: 'SCH02', day: 'Selasa', startTime: '10:00', endTime: '11:30', subject: 'Bahasa Indonesia', class: 'Kelas 10-B', subjectId: 'SUBJ02', classId: 'C02', teacherId: TEACHER_ID },
  { id: 'SCH03', day: 'Rabu', startTime: '09:00', endTime: '10:30', subject: 'Sejarah Indonesia', class: 'Kelas 11-A', subjectId: 'SUBJ03', classId: 'C03', teacherId: TEACHER_ID },
  { id: 'SCH04', day: 'Senin', startTime: '10:00', endTime: '11:30', subject: 'Bahasa Indonesia', class: 'Kelas 11-A', subjectId: 'SUBJ02', classId: 'C03', teacherId: TEACHER_ID },
];

// --- JOURNAL ENTRIES ---
export const journalEntries: JournalEntry[] = [
  {
    id: 'J01', date: new Date('2024-05-20'),
    classId: 'C01', className: 'Kelas 10-A', subjectId: 'SUBJ01', subjectName: 'Matematika Wajib',
    meetingNumber: 5, teacherId: TEACHER_ID,
    learningObjectives: 'Siswa dapat memahami konsep dasar trigonometri.',
    learningActivities: '1. Apersepsi. 2. Penjelasan materi. 3. Latihan soal. 4. Penutup.',
    assessment: 'Tanya jawab dan penugasan.',
    reflection: 'Siswa antusias, namun perlu lebih banyak latihan soal.'
  },
  {
    id: 'J02', date: new Date('2024-05-21'),
    classId: 'C02', className: 'Kelas 10-B', subjectId: 'SUBJ02', subjectName: 'Bahasa Indonesia',
    meetingNumber: 4, teacherId: TEACHER_ID,
    learningObjectives: 'Siswa mampu mengidentifikasi unsur intrinsik cerpen.',
    learningActivities: 'Membaca cerpen, diskusi kelompok, presentasi.',
    assessment: 'Keaktifan diskusi dan hasil analisis.',
    reflection: 'Diskusi berjalan lancar, semua kelompok berpartisipasi.'
  },
];

// --- ATTENDANCE & GRADE HISTORY ---
export const attendanceHistory: AttendanceHistoryEntry[] = [
  {
    id: 'AH01', date: new Date(),
    classId: 'C01', className: 'Kelas 10-A', subjectId: 'SUBJ01', subjectName: 'Matematika Wajib',
    meetingNumber: 5,
    records: [
      { studentId: 'S001', status: 'Hadir' },
      { studentId: 'S002', status: 'Sakit' },
      { studentId: 'S004', status: 'Hadir' },
    ]
  }
];

export const gradeHistory: GradeHistoryEntry[] = [
  {
    id: 'GH01', date: new Date(),
    classId: 'C01', className: 'Kelas 10-A', subjectId: 'SUBJ01', subjectName: 'Matematika Wajib',
    assessmentType: 'Ulangan Harian 1',
    records: [
      { studentId: 'S001', score: 85 },
      { studentId: 'S002', score: 90 },
      { studentId: 'S004', score: 78 },
    ]
  },
  {
    id: 'GH02', date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    classId: 'C02', className: 'Kelas 10-B', subjectId: 'SUBJ02', subjectName: 'Bahasa Indonesia',
    assessmentType: 'Tugas Mengarang Puisi',
    records: [
        { studentId: 'S003', score: 92 },
        { studentId: 'S005', score: 88 },
    ]
  }
];
