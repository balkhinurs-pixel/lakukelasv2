
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
    
    console.log('🔍 Fetching ledger data for student ID:', studentId);
    
    const [grades, attendance, notes] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    console.log('📊 Grades RPC result:', {
      data: grades.data,
      error: grades.error,
      count: grades.data?.length || 0
    });
    
    console.log('📋 Attendance RPC result:', {
      data: attendance.data,
      error: attendance.error,
      count: attendance.data?.length || 0
    });
    
    console.log('📝 Notes query result:', {
      data: notes.data,
      error: notes.error,
      count: notes.data?.length || 0
    });

    if (grades.error || attendance.error || notes.error) {
        console.error('❌ Database query errors:', {
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
    
    console.log('✅ Final ledger data counts:', {
      grades: ledgerData.grades.length,
      attendance: ledgerData.attendance.length,
      notes: ledgerData.notes.length
    });

    return NextResponse.json(ledgerData);
  } catch (error) {
    console.error('💥 API Error fetching ledger data:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}
