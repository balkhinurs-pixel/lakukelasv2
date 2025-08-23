

'use client';

import { createClient } from '@/lib/supabase/client';
import type { Student, StudentLedgerGradeEntry, StudentLedgerAttendanceEntry, StudentNote } from './types';

// This file contains data fetching functions that are meant to be used on the client side.

export async function getStudentsByClass(classId: string): Promise<Student[]> {
    if (!classId) return [];
    const supabase = createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'active') // Only fetch active students
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching students:", error.message);
        return [];
    }
    return data;
}

export async function getStudentLedgerData(studentId: string): Promise<{
    grades: StudentLedgerGradeEntry[],
    attendance: StudentLedgerAttendanceEntry[],
    notes: StudentNote[]
}> {
    if (!studentId) {
        return { grades: [], attendance: [], notes: [] };
    }
    const supabase = createClient();
    if (!supabase) return { grades: [], attendance: [], notes: [] };

    const [grades, attendance, notes] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);
    
    if (grades.error) console.error("Error fetching grades ledger:", grades.error);
    if (attendance.error) console.error("Error fetching attendance ledger:", attendance.error);
    if (notes.error) console.error("Error fetching notes:", notes.error);
    
    return {
        grades: grades.data || [],
        attendance: attendance.data || [],
        notes: (notes.data as StudentNote[]) || [],
    };
}
