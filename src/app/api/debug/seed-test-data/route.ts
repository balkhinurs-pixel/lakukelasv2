import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSchoolYearId, getAuthenticatedUser } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get homeroom class for the current user
    const { data: homeroomClass, error: homeroomError } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .limit(1)
      .single();
    
    if (homeroomError || !homeroomClass) {
      return NextResponse.json({ 
        success: false, 
        error: 'You are not assigned as a homeroom teacher for any class.' 
      }, { status: 400 });
    }

    // Get students in the homeroom class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', homeroomClass.id)
      .eq('status', 'active');
    
    if (studentsError || !students || students.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active students found in your homeroom class.' 
      }, { status: 400 });
    }

    // Get subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(5); // Limit to 5 subjects for test data
    
    if (subjectsError || !subjects || subjects.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No subjects found in the system.' 
      }, { status: 400 });
    }

    // Get active school year
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active school year found.' 
      }, { status: 400 });
    }

    let gradesCreated = 0;
    let attendanceCreated = 0;
    const details: any = {
      homeroomClass: homeroomClass.name,
      studentsCount: students.length,
      subjectsCount: subjects.length,
      createdGrades: [],
      createdAttendance: []
    };

    // Create sample grades for each subject and student
    for (const subject of subjects.slice(0, 3)) { // Use first 3 subjects
      const assessmentTypes = ['Tugas Harian', 'Ulangan Harian', 'UTS'];
      
      for (const assessmentType of assessmentTypes) {
        const gradeRecords = students.map(student => ({
          student_id: student.id,
          score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
        }));

        const { data: gradeData, error: gradeError } = await supabase
          .from('grades')
          .insert({
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
            class_id: homeroomClass.id,
            subject_id: subject.id,
            assessment_type: assessmentType,
            records: gradeRecords,
            teacher_id: user.id,
            school_year_id: activeSchoolYearId
          })
          .select()
          .single();

        if (!gradeError && gradeData) {
          gradesCreated++;
          details.createdGrades.push({
            subject: subject.name,
            assessmentType,
            studentsCount: gradeRecords.length
          });
        }
      }
    }

    // Create sample attendance for each subject
    for (const subject of subjects.slice(0, 3)) { // Use first 3 subjects
      for (let meeting = 1; meeting <= 5; meeting++) {
        const attendanceRecords = students.map(student => ({
          student_id: student.id,
          status: Math.random() > 0.2 ? 'Hadir' : (Math.random() > 0.5 ? 'Sakit' : 'Izin') // 80% Hadir, 10% Sakit, 10% Izin
        }));

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
            class_id: homeroomClass.id,
            subject_id: subject.id,
            meeting_number: meeting,
            records: attendanceRecords,
            teacher_id: user.id,
            school_year_id: activeSchoolYearId
          })
          .select()
          .single();

        if (!attendanceError && attendanceData) {
          attendanceCreated++;
          details.createdAttendance.push({
            subject: subject.name,
            meeting,
            studentsCount: attendanceRecords.length
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${gradesCreated} grade records and ${attendanceCreated} attendance records`,
      data: {
        gradesCreated,
        attendanceCreated
      },
      details
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + (error as Error).message,
      details: error
    }, { status: 500 });
  }
}"