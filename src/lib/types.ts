
export interface Student {
  id: string;
  name: string;
  nis: string;
  nisn: string;
  gender: 'Laki-laki' | 'Perempuan';
  classId: string; // Foreign key to Class
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
  teacherId: string; // Foreign key to User
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string; // Foreign key to User
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
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  meetingNumber?: number;
  learningObjectives: string;
  learningActivities: string;
  assessment?: string;
  reflection?: string;
  teacherId: string; // Foreign key to User
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string;
  endTime: string;
  subject: string; // Will be mapped to subjectName
  subjectId: string; // Foreign key to Subject
  class: string; // Will be mapped to className
  classId: string; // Foreign key to Class
  teacherId: string; // Foreign key to User
}

// --- New Types for History ---

export interface AttendanceHistoryEntry {
  id: string;
  date: Date;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  meetingNumber: number;
  records: AttendanceRecord[];
}

export interface GradeHistoryEntry {
    id: string;
    date: Date;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    assessmentType: string;
    records: GradeRecord[];
}
