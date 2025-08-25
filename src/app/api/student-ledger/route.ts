
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    console.log('🔍 API: Fetching ledger data for student ID:', studentId);
    
    const [grades, attendance, notes] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    console.log('📊 API: RPC Results:', {
      gradesCount: grades.data?.length || 0,
      attendanceCount: attendance.data?.length || 0,
      notesCount: notes.data?.length || 0,
      gradesError: grades.error,
      attendanceError: attendance.error,
      notesError: notes.error
    });
    
    if (grades.data?.length > 0) {
      console.log('✅ API: Sample grade data:', grades.data[0]);
    } else {
      console.log('❌ API: No grades data returned');
    }

    if (grades.error || attendance.error || notes.error) {
        console.error('Database query errors:', {
          gradesError: grades.error, 
          attendanceError: attendance.error, 
          notesError: notes.error
        });
        throw new Error('Failed to fetch ledger data');
    }

    const ledgerData = {
        grades: grades.data || [],
        attendance: attendance.data || [],
        notes: notes.data || [],
    };
    
    console.log('📤 API: Returning ledger data:', {
      gradesCount: ledgerData.grades.length,
      attendanceCount: ledgerData.attendance.length,
      notesCount: ledgerData.notes.length
    });

    return NextResponse.json(ledgerData);
  } catch (error) {
    console.error('API Error fetching ledger data:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}
