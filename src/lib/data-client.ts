
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
        console.error("Error fetching students:", error);
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

    // In a real app, this would make multiple parallel RPC calls to a Supabase database function
    // For now, we simulate this with dummy data.
    console.log(`Fetching ledger data for student: ${studentId}`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

    const DUMMY_SUBJECTS_LEDGER = [
        { id: 'subject-1', name: 'Matematika', kkm: 75 },
        { id: 'subject-2', name: 'Bahasa Indonesia', kkm: 70 },
        { id: 'subject-3', name: 'Fisika', kkm: 78 },
    ];

    // Dummy Grades
    const grades: StudentLedgerGradeEntry[] = DUMMY_SUBJECTS_LEDGER.map((subject, i) => ({
        id: `grade-${studentId}-${subject.id}-${i}`,
        subjectName: subject.name,
        assessment_type: ["Ulangan Harian 1", "Tugas Mandiri", "UTS Ganjil"][i],
        date: `2024-03-${10 + i * 5}`,
        score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        kkm: subject.kkm,
    }));

    // Dummy Attendance
    const attendance: StudentLedgerAttendanceEntry[] = DUMMY_SUBJECTS_LEDGER.flatMap((subject, i) => 
        Array.from({length: 2}).map((_, j) => ({
             id: `att-${studentId}-${subject.id}-${j}`,
            subjectName: subject.name,
            date: `2024-03-${10 + i * 5 + j}`,
            meeting_number: j + 1,
            status: ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Sakit', 'Izin', 'Alpha'][Math.floor(Math.random() * 7)] as any,
        }))
    );
    
    // Dummy Notes
    const notes: StudentNote[] = [
        {
            id: 'note-1',
            date: '2024-03-15T10:30:00Z',
            teacher_name: 'Ahmad Fauzi, S.Pd.',
            note: 'Siswa menunjukkan peningkatan yang signifikan dalam pemecahan masalah aljabar. Sangat aktif bertanya di kelas.',
            type: 'positive' as const,
        },
        {
            id: 'note-2',
            date: '2024-03-12T11:00:00Z',
            teacher_name: 'Citra Lestari, S.S.',
            note: 'Perlu lebih fokus saat praktikum. Terkadang mengobrol dengan teman sebangku.',
            type: 'improvement' as const,
        },
        {
            id: 'note-3',
            date: '2024-02-28T09:00:00Z',
            teacher_name: 'Budi Santoso, M.Kom.',
            note: 'Menyerahkan tugas tepat waktu.',
            type: 'neutral' as const,
        }
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return { grades, attendance, notes };
}
