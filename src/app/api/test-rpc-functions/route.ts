import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Test 1: Check if active school year exists
    const { data: schoolYear, error: schoolYearError } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_active', true)
      .single();
    
    // Test 2: Check RPC functions exist and can be called
    const { data: testClass, error: classError } = await supabase
      .from('classes')
      .select('id')
      .limit(1)
      .single();
    
    let rpcResults = {
      performance: null,
      grades: null,
      attendance: null
    };
    
    if (testClass && !classError) {
      // Test get_student_performance_for_class
      const { data: performanceData, error: performanceError } = await supabase
        .rpc('get_student_performance_for_class', { p_class_id: testClass.id });
      
      rpcResults.performance = {
        success: !performanceError,
        error: performanceError?.message,
        count: performanceData?.length || 0
      };
      
      // Test with a student if available
      const { data: testStudent } = await supabase
        .from('students')
        .select('id')
        .limit(1)
        .single();
      
      if (testStudent) {
        // Test get_student_grades_ledger
        const { data: gradesData, error: gradesError } = await supabase
          .rpc('get_student_grades_ledger', { p_student_id: testStudent.id });
        
        rpcResults.grades = {
          success: !gradesError,
          error: gradesError?.message,
          count: gradesData?.length || 0
        };
        
        // Test get_student_attendance_ledger
        const { data: attendanceData, error: attendanceError } = await supabase
          .rpc('get_student_attendance_ledger', { p_student_id: testStudent.id });
        
        rpcResults.attendance = {
          success: !attendanceError,
          error: attendanceError?.message,
          count: attendanceData?.length || 0
        };
      }
    }
    
    const testResults = {
      timestamp: new Date().toISOString(),
      activeSchoolYear: {
        found: !schoolYearError && !!schoolYear,
        data: schoolYear || null,
        error: schoolYearError?.message
      },
      rpcFunctions: rpcResults,
      status: 'Tests completed'
    };
    
    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
      status: 'Error during testing'
    }, { status: 500 });
  }
}