
import type { Class, JournalEntry, ScheduleItem, Student, AttendanceHistoryEntry, GradeHistoryEntry, AttendanceRecord, Subject } from './types';

export const students: Student[] = [
  { id: 'S001', name: 'Budi Santoso', nis: '23241001', nisn: '0012345678', gender: 'Laki-laki' },
  { id: 'S002', name: 'Citra Lestari', nis: '23241002', nisn: '0023456789', gender: 'Perempuan' },
  { id: 'S003', name: 'Dewi Anggraini', nis: '23241003', nisn: '0034567890', gender: 'Perempuan' },
  { id: 'S004', name: 'Eko Prasetyo', nis: '23241004', nisn: '0045678901', gender: 'Laki-laki' },
  { id: 'S005', name: 'Fitriani', nis: '23241005', nisn: '0056789012', gender: 'Perempuan' },
  { id: 'S006', name: 'Gilang Ramadhan', nis: '23241006', nisn: '0067890123', gender: 'Laki-laki' },
  { id: 'S007', name: 'Hana Yulita', nis: '23241007', nisn: '0078901234', gender: 'Perempuan' },
  { id: 'S008', name: 'Indra Wijaya', nis: '23241008', nisn: '0089012345', gender: 'Laki-laki' },
  { id: 'S009', name: 'Joko Susilo', nis: '23241009', nisn: '0090123456', gender: 'Laki-laki' },
  { id: 'S010', name: 'Kartika Sari', nis: '23241010', nisn: '0001234567', gender: 'Perempuan' },
];

export const classes: Class[] = [
  { id: 'C01', name: 'Kelas 10-A', students: students.slice(0, 5) },
  { id: 'C02', name: 'Kelas 10-B', students: students.slice(5, 10) },
  { id: 'C03', name: 'Kelas 11-A', students: students.slice(2, 7) },
  { id: 'C04', name: 'Kelas 11-B', students: students.slice(0, 3).concat(students.slice(8, 10))},
];

export const subjects: Subject[] = [
    { id: 'SUBJ01', name: 'Matematika' },
    { id: 'SUBJ02', name: 'Fisika' },
    { id: 'SUBJ03', name: 'Biologi' },
    { id: 'SUBJ04', name: 'Bahasa Indonesia' },
    { id: 'SUBJ05', name: 'Bahasa Inggris' },
    { id: 'SUBJ06', name: 'Kimia' },
    { id: 'SUBJ07', name: 'Sejarah' },
];

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
  },
  {
    id: 'J02',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    classId: 'C04',
    className: 'Kelas 11-B',
    subjectId: 'SUBJ02',
    subjectName: 'Fisika',
    meetingNumber: 8,
    learningObjectives: 'Siswa dapat mendemonstrasikan Hukum Newton II melalui percobaan sederhana.',
    learningActivities: 'Praktikum kelompok menggunakan troli dan beban. Dilanjutkan dengan analisis data dan penyusunan laporan sederhana.',
    assessment: 'Penilaian kinerja saat praktikum dan penilaian laporan.',
  },
  {
    id: 'J03',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    classId: 'C01',
    className: 'Kelas 10-A',
    subjectId: 'SUBJ04',
    subjectName: 'Bahasa Indonesia',
    meetingNumber: 4,
    learningObjectives: 'Siswa dapat mengidentifikasi unsur intrinsik (tema, amanat, tokoh) dari sebuah cerpen.',
    learningActivities: 'Membaca cerpen "Robohnya Surau Kami", diskusi kelas, dan mengerjakan lembar kerja secara individu.',
    reflection: 'Beberapa siswa masih tertukar antara tema dan amanat. Perlu penguatan konsep di pertemuan berikutnya.',
  },
];

export const schedule: ScheduleItem[] = [
    { id: 'SCH01', day: 'Senin', startTime: '07:30', endTime: '09:00', subject: 'Matematika', class: 'Kelas 10-A' },
    { id: 'SCH02', day: 'Senin', startTime: '09:30', endTime: '11:00', subject: 'Fisika', class: 'Kelas 11-B' },
    { id: 'SCH03', day: 'Selasa', startTime: '11:00', endTime: '12:30', subject: 'Biologi', class: 'Kelas 10-A' },
    { id: 'SCH04', day: 'Rabu', startTime: '13:30', endTime: '15:00', subject: 'Bahasa Inggris', class: 'Kelas 11-B' },
    { id: 'SCH05', day: 'Kamis', startTime: '08:00', endTime: '09:30', subject: 'Kimia', class: 'Kelas 11-A' },
    { id: 'SCH06', day: 'Jumat', startTime: '10:00', endTime: '11:30', subject: 'Sejarah', class: 'Kelas 10-B' },
];

// --- New Placeholder History Data ---

const generateAttendanceRecords = (students: Student[]): AttendanceRecord[] => {
    const statuses: AttendanceRecord['status'][] = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Sakit', 'Izin', 'Alpha'];
    return students.map((student, index) => ({
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
    {
        id: 'AH03',
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        classId: 'C02',
        className: 'Kelas 10-B',
        subjectId: 'SUBJ07',
        subjectName: 'Sejarah',
        meetingNumber: 3,
        records: generateAttendanceRecords(classes[1].students)
    }
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
        records: classes[0].students.map(s => ({ studentId: s.id, score: Math.floor(Math.random() * 30) + 70 }))
    },
    {
        id: 'GH02',
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        classId: 'C01',
        className: 'Kelas 10-A',
        subjectId: 'SUBJ01',
        subjectName: 'Matematika',
        assessmentType: 'Tugas Proyek - Fungsi Kuadrat',
        records: classes[0].students.map(s => ({ studentId: s.id, score: Math.floor(Math.random() * 20) + 75 }))
    },
     {
        id: 'GH03',
        date: new Date(new Date().setDate(new Date().getDate() - 4)),
        classId: 'C02',
        className: 'Kelas 10-B',
        subjectId: 'SUBJ04',
        subjectName: 'Bahasa Indonesia',
        assessmentType: 'Ulangan Harian 1 - Teks Prosedur',
        records: classes[1].students.map(s => ({ studentId: s.id, score: Math.floor(Math.random() * 25) + 72 }))
    }
];
