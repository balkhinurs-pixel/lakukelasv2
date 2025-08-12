

export interface Profile {
  id: string;
  created_at: string;
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
  role: 'admin' | 'teacher';
  email?: string;
  active_school_year_id?: string | null;
  active_school_year_name?: string | null;
}

export interface ActivationCode {
    id: string;
    code: string;
    is_used: boolean;
    used_by: string | null;
    used_at: string | null;
    created_at: string;
    used_by_email?: string | null;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  gender: 'Laki-laki' | 'Perempuan';
  class_id: string;
  class_name?: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
}

export interface Subject {
  id: string;
  name: string;
  kkm: number;
  teacher_id: string;
}

export interface SchoolYear {
  id: string;
  name: string;
  teacher_id: string;
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
  school_year_id?: string | null;
  meeting_number?: number;
  learning_objectives: string;
  learning_activities: string;
  assessment?: string;
  reflection?: string;
  teacher_id: string;
  // Joined data
  className?: string;
  subjectName?: string;
}

export interface Agenda {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    description?: string | null;
    tag?: string | null;
    color?: string | null; // Hex color code (e.g., #3b82f6)
    start_time?: string | null; // HH:mm
    end_time?: string | null; // HH:mm
    teacher_id: string;
    created_at: string;
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  start_time: string;
  end_time: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  // Joined data
  subject?: string;
  class?: string;
}

// --- History Types ---

export interface AttendanceHistoryEntry {
  id: string;
  date: string;
  class_id: string;
  subject_id: string;
  school_year_id?: string | null;
  meeting_number: number;
  records: AttendanceRecord[];
  // Joined data
  className?: string;
  subjectName?: string;
}

export interface GradeHistoryEntry {
    id: string;
    date: string;
    class_id: string;
    subject_id: string;
    school_year_id?: string | null;
    assessment_type: string;
    records: GradeRecord[];
    // Joined data
    className?: string;
    subjectName?: string;
    subjectKkm?: number;
}
