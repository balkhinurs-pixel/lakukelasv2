import type { Class, JournalEntry, ScheduleItem, Student, AttendanceHistoryEntry, GradeHistoryEntry, AttendanceRecord, Subject } from './types';

// --- Hardcoded Teacher ID for placeholder data ---
const TEACHER_ID = 'user_2cVLj8iA1tAcrrf34oVbVuA2t65'; // Example UUID

// --- STUDENTS ---
export const students: Student[] = [
  { id: 'S001', name: 'Budi Santoso', nis: '23241001', nisn: '0012345678', gender: 'Laki-laki', classId: 'C01' },
  { id: 'S002', name: 'Citra Lestari', nis: '23241002', nisn: '0023456789', gender: 'Perempuan', classId: 'C01' },
  { id: 'S003', name: 'Dewi Anggraini', nis: '23241003', nisn: '0034567890', gender: 'Perempuan', classId: 'C01' },
  { id: 'S004', name: 'Eko Prasetyo', nis: '23241004', nisn: '0045678901', gender: 'Laki-laki', classId: 'C01' },
  { id: 'S005', name: 'Fitriani', nis: '23241005', nisn: '0056789012', gender: 'Perempuan', classId: 'C01' },
  { id: 'S006', name: 'Gilang Ramadhan', nis: '23241006', nisn: '0067890123', gender: 'Laki-laki', classId: 'C02' },
  { id: 'S007', name: 'Hana Yulita', nis: '23241007', nisn: '0078901234', gender: 'Perempuan', classId: 'C02' },
  { id: 'S008', name: 'Indra Wijaya', nis: '23241008', nisn: '0089012345', gender: 'Laki-laki', classId: 'C02' },
  { id: 'S009', name: 'Joko Susilo', nis: '23241009', nisn: '0090123456', gender: 'Laki-laki', classId: 'C02' },
  { id: 'S010', name: 'Kartika Sari', nis: '23241010', nisn: '0001234567', gender: 'Perempuan', classId: 'C02' },
];

// --- CLASSES ---
export const classes: Class[] = [
  { id: 'C01', name: 'Kelas 10-A', students: students.filter(s => s.classId === 'C01'), teacherId: TEACHER_ID },
  { id: 'C02', name: 'Kelas 10-B', students: students.filter(s => s.classId === 'C02'), teacherId: TEACHER_ID },
  // These classes are empty for demonstration purposes
  { id: 'C03', name: 'Kelas 11-A', students: [], teacherId: TEACHER_ID },
  { id: 'C04', name: 'Kelas 11-B', students: [], teacherId: TEACHER_ID },
];

// --- SUBJECTS ---
export const subjects: Subject[] = [
    { id: 'SUBJ01', name: 'Matematika', teacherId: TEACHER_ID },
    { id: 'SUBJ02', name: 'Fisika', teacherId: TEACHER_ID },
    { id: 'SUBJ03', name: 'Biologi', teacherId: TEACHER_ID },
    { id: 'SUBJ04', name: 'Bahasa Indonesia', teacherId: TEACHER_ID },
    { id: 'SUBJ05', name: 'Bahasa Inggris', teacherId: TEACHER_ID },
    { id: 'SUBJ06', name: 'Kimia', teacherId: TEACHER_ID },
    { id: 'SUBJ07', name: 'Sejarah', teacherId: TEACHER_ID },
];

// --- SCHEDULE ---
export const schedule: ScheduleItem[] = [
    { id: 'SCH01', day: 'Senin', startTime: '07:30', endTime: '09:00', subjectId: 'SUBJ01', subject: 'Matematika', classId: 'C01', class: 'Kelas 10-A', teacherId: TEACHER_ID },
    { id: 'SCH02', day: 'Senin', startTime: '09:30', endTime: '11:00', subjectId: 'SUBJ02', subject: 'Fisika', classId: 'C02', class: 'Kelas 10-B', teacherId: TEACHER_ID },
    { id: 'SCH03', day: 'Selasa', startTime: '11:00', endTime: '12:30', subjectId: 'SUBJ03', subject: 'Biologi', classId: 'C01', class: 'Kelas 10-A', teacherId: TEACHER_ID },
];


// --- JOURNAL ENTRIES ---
export const journalEntries: JournalEntry[] = [
  {
    id: 'J01',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    classId: 'C01',
    className: 'Kelas 10-A',
    subjectId: 'SUBJ01',
    subjectName: 'Matematika',
    meetingNumber: 5,
    learningObjectives: 'Siswa dapat menjelaskan konsep persamaan linear dua variabel dan memberikan contoh dalam kehidupan sehari-hari.',
    learningActivities: '1. Pembukaan: Doa, apersepsi tentang penggunaan aljabar.\n2. Inti: Penjelasan materi, diskusi kelompok memecahkan soal cerita, presentasi hasil.\n3. Penutup: Kesimpulan dan tugas mandiri.',
    assessment: 'Formatif: Keaktifan dalam diskusi kelompok. Sumatif: Kuis singkat di akhir pelajaran.',
    reflection: 'Sebagian besar siswa aktif, namun 2 siswa di baris belakang perlu perhatian lebih karena kurang fokus. Perlu menggunakan media ajar yang lebih visual di pertemuan selanjutnya.',
    teacherId: TEACHER_ID,
  },
  {
    id: 'J02',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    classId: 'C02',
    className: 'Kelas 10-B',
    subjectId: 'SUBJ02',
    subjectName: 'Fisika',
    meetingNumber: 8,
    learningObjectives: 'Siswa dapat mendemonstrasikan Hukum Newton II melalui percobaan sederhana.',
    learningActivities: 'Praktikum kelompok menggunakan troli dan beban. Dilanjutkan dengan analisis data dan penyusunan laporan sederhana.',
    assessment: 'Penilaian kinerja saat praktikum dan penilaian laporan.',
    teacherId: TEACHER_ID,
  },
];


// --- ATTENDANCE & GRADE HISTORY ---

const generateAttendanceRecords = (studentsForClass: Student[]): AttendanceRecord[] => {
  const statuses: AttendanceRecord['status'][] = ['Hadir', 'Hadir', 'Sakit', 'Hadir', 'Izin', 'Alpha', 'Hadir'];
  return studentsForClass.map((student, index) => ({
    studentId: student.id,
    status: statuses[index % statuses.length]
  }));
};

export const attendanceHistory: AttendanceHistoryEntry[] = [
    {
        id: 'AH01',
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        classId: 'C01',
        className: 'Kelas 10-A',
        subjectId: 'SUBJ01',
        subjectName: 'Matematika',
        meetingNumber: 5,
        records: generateAttendanceRecords(classes[0].students)
    },
    {
        id: 'AH02',
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        classId: 'C01',
        className: 'Kelas 10-A',
        subjectId: 'SUBJ04',
        subjectName: 'Bahasa Indonesia',
        meetingNumber: 4,
        records: generateAttendanceRecords(classes[0].students)
    },
];

export const gradeHistory: GradeHistoryEntry[] = [
    {
        id: 'GH01',
        date: new Date(new Date().setDate(new Date().getDate() - 3)),
        classId: 'C01',
        className: 'Kelas 10-A',
        subjectId: 'SUBJ01',
        subjectName: 'Matematika',
        assessmentType: 'Ulangan Harian 1 - Aljabar',
        records: classes[0].students.map(s => ({ studentId: s.id, score: (s.name.length * 5 + 40) % 100 })) // Consistent scoring
    },
    {
        id: 'GH02',
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        classId: 'C01',
        className: 'Kelas 10-A',
        subjectId: 'SUBJ01',
        subjectName: 'Matematika',
        assessmentType: 'Tugas Proyek - Fungsi Kuadrat',
        records: classes[0].students.map(s => ({ studentId: s.id, score: (s.name.length * 6 + 35) % 100 }))
    },
];
