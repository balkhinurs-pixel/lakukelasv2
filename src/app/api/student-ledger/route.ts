
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
    
    // Use the corrected RPC functions
    const [gradesResult, attendanceResult, notesResult] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    console.log('📊 API: Direct query results:', {
      gradesCount: gradesResult.data?.length || 0,
      attendanceCount: attendanceResult.data?.length || 0,
      notesCount: notesResult.data?.length || 0,
      gradesError: gradesResult.error,
      attendanceError: attendanceResult.error,
      notesError: notesResult.error
    });
    
    if (gradesResult.data?.length > 0) {
      console.log('✅ API: Sample grade data:', gradesResult.data[0]);
    } else {
      console.log('❌ API: No grades data returned');
    }

    if (gradesResult.error || attendanceResult.error || notesResult.error) {
        console.error('Database query errors:', {
          gradesError: gradesResult.error, 
          attendanceError: attendanceResult.error, 
          notesError: notesResult.error
        });
        throw new Error('Failed to fetch ledger data');
    }

    const ledgerData = {
        grades: gradesResult.data || [],
        attendance: attendanceResult.data || [],
        notes: notesResult.data || [],
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
