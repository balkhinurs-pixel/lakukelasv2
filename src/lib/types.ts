
export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  nip?: string;
  pangkat?: string;
  jabatan?: string;
  school_name?: string;
  school_address?: string;
  headmaster_name?: string;
  headmaster_nip?: string;
  school_logo_url?: string;
  account_status: 'Free' | 'Pro';
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  nisn: string;
  gender: 'Laki-laki' | 'Perempuan';
  class_id: string; // Foreign key to Class
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string; // Foreign key to User
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  kkm: number;
  teacher_id: string; // Foreign key to User
  created_at: string;
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
  date: string;
  class_id: string;
  subject_id: string;
  meeting_number?: number;
  learning_objectives: string;
  learning_activities: string;
  assessment?: string;
  reflection?: string;
  teacher_id: string; // Foreign key to User
  created_at: string;
  // Joined data from other tables
  classes: { name: string };
  subjects: { name: string };
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  start_time: string;
  end_time: string;
  subject_id: string; // Foreign key to Subject
  class_id: string; // Foreign key to Class
  teacher_id: string; // Foreign key to User
  created_at: string;
  // Joined data
  subjects: { name: string };
  classes: { name: string };
}

// --- History Types ---

export interface AttendanceHistoryEntry {
  id: string;
  date: string;
  class_id: string;
  subject_id: string;
  meeting_number: number;
  records: AttendanceRecord[];
  // Joined data
  classes: { name: string };
  subjects: { name: string };
}

export interface GradeHistoryEntry {
    id: string;
    date: string;
    class_id: string;
    subject_id: string;
    assessment_type: string;
    records: GradeRecord[];
    // Joined data
    classes: { name: string };
    subjects: { name: string, kkm: number };
}

// --- Data Fetcher Types ---
export type StudentWithClass = Student & { classes: { name: string } | null };
