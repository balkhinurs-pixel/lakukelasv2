import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get student with NIS 24027 (we know this student exists from our tests)
    const { data: student } = await supabase
      .from('students')
      .select('id, name, nis')
      .eq('nis', '24027')
      .single();
      
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Call the RPC function directly
    const { data: grades, error } = await supabase
      .rpc('get_student_grades_ledger', { p_student_id: student.id });
    
    return NextResponse.json({
      student: student,
      grades: grades || [],
      gradesCount: grades?.length || 0,
      error: error?.message || null,
      success: !error
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 });
  }
}