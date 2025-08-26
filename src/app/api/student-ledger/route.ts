

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
    
    // Use the corrected RPC functions
    const [gradesResult, attendanceResult, notesResult] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);
    
    if (gradesResult.error || attendanceResult.error || notesResult.error) {
        console.error('Database query errors on API route:', {
          gradesError: gradesResult.error, 
          attendanceError: attendanceResult.error, 
          notesError: notesResult.error
        });
        // Even if there's an error, send back what we have. Client can handle partial data.
    }

    const ledgerData = {
        grades: gradesResult.data || [],
        attendance: attendanceResult.data || [],
        notes: notesResult.data || [],
    };
    
    return NextResponse.json(ledgerData);

  } catch (error) {
    console.error('API Error fetching ledger data:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}

