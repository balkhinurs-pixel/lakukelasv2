import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // First, get a student with NIS 24027 (from our diagnostic tests)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, nis')
      .eq('nis', '24027')
      .single();
      
    if (studentError || !student) {
      return NextResponse.json({ 
        error: 'Student not found', 
        studentError: studentError?.message 
      }, { status: 404 });
    }
    
    console.log('🔍 Test: Found student:', student);
    
    // Test the RPC function directly
    const { data: grades, error: gradesError } = await supabase
      .rpc('get_student_grades_ledger', { p_student_id: student.id });
      
    console.log('📊 Test: RPC result:', {
      gradesCount: grades?.length || 0,
      gradesError: gradesError?.message,
      sampleGrade: grades?.[0]
    });
    
    // Also check raw grades data for this student
    const { data: rawGrades, error: rawError } = await supabase
      .from('grades')
      .select('*')
      .filter('records', 'cs', `{"student_id": "${student.id}"}`)
      .limit(3);
      
    console.log('📋 Test: Raw grades check:', {
      rawGradesCount: rawGrades?.length || 0,
      rawError: rawError?.message,
      sampleRawGrade: rawGrades?.[0]
    });
    
    // Test active school year
    const { data: activeYear, error: yearError } = await supabase
      .rpc('get_active_school_year_id');
      
    console.log('📅 Test: Active school year:', {
      activeYear,
      yearError: yearError?.message
    });
    
    return NextResponse.json({ 
      student,
      rpcGrades: grades || [],
      rawGrades: rawGrades || [],
      activeSchoolYear: activeYear,
      debug: {
        rpcGradesCount: grades?.length || 0,
        rawGradesCount: rawGrades?.length || 0,
        gradesError: gradesError?.message,
        rawError: rawError?.message,
        yearError: yearError?.message
      }
    });
  } catch (error) {
    console.error('❌ Test API Error:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'Internal Server Error' 
    }, { status: 500 });
  }
}