





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
  role: 'admin' | 'teacher' | 'headmaster';
  email?: string;
  active_school_year_id?: string | null;
  active_school_year_name?: string | null;
  is_homeroom_teacher?: boolean;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  gender: 'Laki-laki' | 'Perempuan';
  class_id: string;
  status: 'active' | 'graduated' | 'dropout' | 'inactive';
  class_name?: string;
  avatar_url?: string;
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
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  date: string;
  meeting_number: number;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  teacher_id: string;
  school_year_id: string;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  date: string;
  assessment_type: string;
  score: number;
  teacher_id: string;
  school_year_id: string;
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

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO 8601 string
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
  status: 'Tepat Waktu' | 'Terlambat' | 'Tidak Hadir';
}

// --- History Types ---
// These types now represent the structure of the views we created
export interface AttendanceHistoryEntry {
  id: string;
  date: string;
  meeting_number: number;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  school_year_id: string | null;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  student_id: string;
  class_name: string;
  subject_name: string;
  teacher_name: string;
}

export interface GradeHistoryEntry {
    id: string;
    date: string;
    assessment_type: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    school_year_id: string | null;
    score: number;
    student_id: string;
    class_name: string;
    subject_name: string;
    subject_kkm: number;
    teacher_name: string;
}


// --- Ledger Types ---
export interface StudentLedgerGradeEntry {
    id: string;
    subjectName: string;
    assessment_type: string;
    date: string;
    score: number;
    kkm: number;
}

export interface StudentLedgerAttendanceEntry {
    id: string;
    subjectName: string;
    date: string;
    meeting_number: number;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
}

export interface StudentNote {
    id: string;
    date: string;
    teacher_name: string;
    note: string;
    type: 'positive' | 'improvement' | 'neutral';
}
