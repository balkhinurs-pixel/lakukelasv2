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
    
    console.log('=== DEBUGGING STUDENT LEDGER DATA ===');
    console.log('Student ID:', studentId);
    
    // First, let's check what raw data exists in the tables
    const { data: rawGrades, error: rawGradesError } = await supabase
      .from('grades')
      .select('*')
      .limit(10);
    
    const { data: rawAttendance, error: rawAttendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(10);
    
    // Check if there are any grades/attendance records at all
    console.log('Raw grades records:', rawGrades?.length || 0);
    console.log('Raw attendance records:', rawAttendance?.length || 0);
    
    if (rawGrades && rawGrades.length > 0) {
      console.log('Sample grade record:', JSON.stringify(rawGrades[0], null, 2));
    }
    
    if (rawAttendance && rawAttendance.length > 0) {
      console.log('Sample attendance record:', JSON.stringify(rawAttendance[0], null, 2));
    }
    
    // Now test the RPC functions
    const [grades, attendance, notes] = await Promise.all([
        supabase.rpc('get_student_grades_ledger', { p_student_id: studentId }),
        supabase.rpc('get_student_attendance_ledger', { p_student_id: studentId }),
        supabase.from('student_notes_with_teacher').select('*').eq('student_id', studentId).order('date', {ascending: false})
    ]);

    console.log('=== RPC RESULTS ===');
    console.log('Grades RPC error:', grades.error);
    console.log('Grades RPC data length:', grades.data?.length || 0);
    console.log('Attendance RPC error:', attendance.error);
    console.log('Attendance RPC data length:', attendance.data?.length || 0);
    console.log('Notes query error:', notes.error);
    console.log('Notes data length:', notes.data?.length || 0);

    if (grades.data && grades.data.length > 0) {
      console.log('Sample grade ledger entry:', JSON.stringify(grades.data[0], null, 2));
    }
    
    if (attendance.data && attendance.data.length > 0) {
      console.log('Sample attendance ledger entry:', JSON.stringify(attendance.data[0], null, 2));
    }

    // Let's also check if there are any records that contain this student ID in the JSONB
    const { data: gradesWithStudent, error: gradesWithStudentError } = await supabase
      .from('grades')
      .select('*')
      .contains('records', [{ student_id: studentId }]);
    
    const { data: attendanceWithStudent, error: attendanceWithStudentError } = await supabase
      .from('attendance')
      .select('*')
      .contains('records', [{ student_id: studentId }]);

    console.log('=== DIRECT JSONB SEARCH ===');
    console.log('Grades containing student:', gradesWithStudent?.length || 0);
    console.log('Attendance containing student:', attendanceWithStudent?.length || 0);

    if (gradesWithStudent && gradesWithStudent.length > 0) {
      console.log('Grade record containing student:', JSON.stringify(gradesWithStudent[0], null, 2));
    }
    
    if (attendanceWithStudent && attendanceWithStudent.length > 0) {
      console.log('Attendance record containing student:', JSON.stringify(attendanceWithStudent[0], null, 2));
    }

    const debugData = {
      studentId,
      rawCounts: {
        totalGrades: rawGrades?.length || 0,
        totalAttendance: rawAttendance?.length || 0
      },
      rpcResults: {
        grades: {
          error: grades.error,
          count: grades.data?.length || 0,
          data: grades.data || []
        },
        attendance: {
          error: attendance.error,
          count: attendance.data?.length || 0,
          data: attendance.data || []
        },
        notes: {
          error: notes.error,
          count: notes.data?.length || 0,
          data: notes.data || []
        }
      },
      directSearch: {
        gradesWithStudent: gradesWithStudent?.length || 0,
        attendanceWithStudent: attendanceWithStudent?.length || 0,
        sampleGradeRecord: gradesWithStudent?.[0] || null,
        sampleAttendanceRecord: attendanceWithStudent?.[0] || null
      },
      sampleRawData: {
        sampleGrade: rawGrades?.[0] || null,
        sampleAttendance: rawAttendance?.[0] || null
      }
    };

    return NextResponse.json(debugData);
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'Internal Server Error',
      stack: (error as Error).stack 
    }, { status: 500 });
  }
}