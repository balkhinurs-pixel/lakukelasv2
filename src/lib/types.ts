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
  score: number;
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
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
}
