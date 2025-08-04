export interface Student {
  id: string;
  name: string;
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

export interface JournalEntry {
  id: string;
  date: Date;
  class: string;
  subject: string;
  material: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  class: string;
}
