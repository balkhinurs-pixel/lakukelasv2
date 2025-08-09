
import type { Class, JournalEntry, ScheduleItem, Student, AttendanceHistoryEntry, GradeHistoryEntry, AttendanceRecord, Subject } from './types';

// THIS FILE IS NOW DEPRECATED AND WILL BE REMOVED.
// All data is now fetched from Supabase.

// --- Hardcoded Teacher ID for placeholder data ---
const TEACHER_ID = 'user_2cVLj8iA1tAcrrf34oVbVuA2t65'; // Example UUID

// --- STUDENTS ---
export const students: Student[] = [];

// --- CLASSES ---
export const classes: Class[] = [];

// --- SUBJECTS ---
export const subjects: Subject[] = [];

// --- SCHEDULE ---
export const schedule: ScheduleItem[] = [];


// --- JOURNAL ENTRIES ---
export const journalEntries: JournalEntry[] = [];


// --- ATTENDANCE & GRADE HISTORY ---

const generateAttendanceRecords = (studentsForClass: Student[]): AttendanceRecord[] => {
  const statuses: AttendanceRecord['status'][] = ['Hadir', 'Hadir', 'Sakit', 'Hadir', 'Izin', 'Alpha', 'Hadir'];
  return studentsForClass.map((student, index) => ({
    studentId: student.id,
    status: statuses[index % statuses.length]
  }));
};

export const attendanceHistory: AttendanceHistoryEntry[] = [];

export const gradeHistory: GradeHistoryEntry[] = [];
