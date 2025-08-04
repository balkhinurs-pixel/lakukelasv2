import type { Class, JournalEntry, ScheduleItem, Student } from './types';

export const students: Student[] = [
  { id: 'S001', name: 'Budi Santoso' },
  { id: 'S002', name: 'Citra Lestari' },
  { id: 'S003', name: 'Dewi Anggraini' },
  { id: 'S004', name: 'Eko Prasetyo' },
  { id: 'S005', name: 'Fitriani' },
  { id: 'S006', name: 'Gilang Ramadhan' },
  { id: 'S007', name: 'Hana Yulita' },
  { id: 'S008', name: 'Indra Wijaya' },
  { id: 'S009', name: 'Joko Susilo' },
  { id: 'S010', name: 'Kartika Sari' },
];

export const classes: Class[] = [
  { id: 'C01', name: 'Kelas 10-A', students: students.slice(0, 5) },
  { id: 'C02', name: 'Kelas 10-B', students: students.slice(5, 10) },
  { id: 'C03', name: 'Kelas 11-A', students: students.slice(2, 7) },
  { id: 'C04', name: 'Kelas 11-B', students: students.slice(0, 3).concat(students.slice(8, 10))},
];

export const journalEntries: JournalEntry[] = [
  {
    id: 'J01',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    class: 'Kelas 10-A',
    subject: 'Matematika',
    material: 'Aljabar Linier',
    notes: 'Siswa cukup aktif bertanya.',
  },
  {
    id: 'J02',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    class: 'Kelas 11-B',
    subject: 'Fisika',
    material: 'Hukum Newton',
  },
  {
    id: 'J03',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    class: 'Kelas 10-A',
    subject: 'Bahasa Indonesia',
    material: 'Membedah Puisi',
    notes: 'Beberapa siswa kesulitan interpretasi.',
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
