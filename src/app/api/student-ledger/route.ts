
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
    
    // DIRECT DATABASE APPROACH: Bypass RPC functions and query directly
    // This approach is more reliable when RPC functions have issues
    
    const [gradesResult, attendanceResult, notesResult] = await Promise.all([
        // Direct grades query based on successful bypass test
        supabase
            .from('grades')
            .select(`
                id,
                assessment_type,
                date,
                records,
                subjects!inner(name, kkm)
            `)
            .then(async (response) => {
                if (response.error) return { data: [], error: response.error };
                
                // Process JSONB records to extract student's grades
                const studentGrades = [];
                for (const grade of response.data || []) {
                    if (grade.records && Array.isArray(grade.records)) {
                        for (const record of grade.records) {
                            if (record.student_id === studentId) {
                                studentGrades.push({
                                    id: grade.id,
                                    subjectName: grade.subjects.name,
                                    assessment_type: grade.assessment_type,
                                    date: grade.date,
                                    score: parseFloat(record.score) || 0,
                                    kkm: grade.subjects.kkm
                                });
                            }
                        }
                    }
                }
                return { data: studentGrades, error: null };
            }),
        
        // Direct attendance query
        supabase
            .from('attendance')
            .select(`
                id,
                date,
                meeting_number,
                records,
                subjects!inner(name)
            `)
            .then(async (response) => {
                if (response.error) return { data: [], error: response.error };
                
                // Process JSONB records to extract student's attendance
                const studentAttendance = [];
                for (const attendance of response.data || []) {
                    if (attendance.records && Array.isArray(attendance.records)) {
                        for (const record of attendance.records) {
                            if (record.student_id === studentId) {
                                studentAttendance.push({
                                    id: attendance.id,
                                    subjectName: attendance.subjects.name,
                                    date: attendance.date,
                                    meeting_number: attendance.meeting_number,
                                    status: record.status
                                });
                            }
                        }
                    }
                }
                return { data: studentAttendance, error: null };
            }),
        
        // Notes query (this was working)
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
