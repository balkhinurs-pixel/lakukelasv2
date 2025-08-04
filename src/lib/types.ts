export interface Student {
  id: string;
  name: string;
  nis: string;
  nisn: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
}

export interface AttendanceRecord {
  studentId: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
}

export interface GradeRecord {
  studentId: string;
  score: number | string; // Allow string for empty input
}

export interface JournalEntry {
  id: string;
  date: Date;
  class: string;
  subject: string;
  meetingNumber?: number;
  learningObjectives: string;
  learningActivities: string;
  assessment?: string;
  reflection?: string;
  material?: string;
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
}

// --- New Types for History ---

export interface AttendanceHistoryEntry {
  id: string;
  date: Date;
  classId: string;
  className: string;
  meetingNumber: number;
  records: AttendanceRecord[];
}

export interface GradeHistoryEntry {
    id: string;
    date: Date;
    classId: string;
    className: string;
    assessmentType: string;
    records: GradeRecord[];
}
