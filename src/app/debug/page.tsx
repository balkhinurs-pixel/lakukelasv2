import { createClient } from '@/lib/supabase/server';
import { getHomeroomClassDetails } from '@/lib/data';

export default async function DebugPage() {
  const supabase = createClient();
  
  // Get homeroom details
  const homeroomData = await getHomeroomClassDetails();
  
  // Get all attendance and grades data to see what's in the database
  const { data: allAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .limit(5);
    
  const { data: allGrades, error: gradesError } = await supabase
    .from('grades')
    .select('*')
    .limit(5);
    
  const { data: allStudents, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .limit(5);

  // Test RPC functions with a student ID if available
  let rpcTestResults = null;
  if (homeroomData?.studentsInClass.length > 0) {
    const testStudentId = homeroomData.studentsInClass[0].id;
    
    const [gradesRpc, attendanceRpc] = await Promise.all([
      supabase.rpc('get_student_grades_ledger', { p_student_id: testStudentId }),
      supabase.rpc('get_student_attendance_ledger', { p_student_id: testStudentId }),
    ]);
    
    rpcTestResults = {
      studentId: testStudentId,
      studentName: homeroomData.studentsInClass[0].name,
      grades: gradesRpc,
      attendance: attendanceRpc
    };
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Database - Student Ledger Data</h1>
      
      <div className="grid gap-6">
        {/* Homeroom Data */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Homeroom Data</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(homeroomData, null, 2)}
          </pre>
        </div>

        {/* Raw Database Data */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Sample Attendance Records</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            Error: {attendanceError ? JSON.stringify(attendanceError) : 'None'}
            Data: {JSON.stringify(allAttendance, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Sample Grades Records</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            Error: {gradesError ? JSON.stringify(gradesError) : 'None'}
            Data: {JSON.stringify(allGrades, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Sample Students</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            Error: {studentsError ? JSON.stringify(studentsError) : 'None'}
            Data: {JSON.stringify(allStudents, null, 2)}
          </pre>
        </div>

        {/* RPC Test Results */}
        {rpcTestResults && (
          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">RPC Function Test Results</h2>
            <p className="mb-2">Testing with student: {rpcTestResults.studentName} (ID: {rpcTestResults.studentId})</p>
            
            <div className="mb-4">
              <h3 className="font-medium">Grades RPC Result:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                Error: {rpcTestResults.grades.error ? JSON.stringify(rpcTestResults.grades.error) : 'None'}
                Data Count: {rpcTestResults.grades.data?.length || 0}
                Data: {JSON.stringify(rpcTestResults.grades.data, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Attendance RPC Result:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                Error: {rpcTestResults.attendance.error ? JSON.stringify(rpcTestResults.attendance.error) : 'None'}
                Data Count: {rpcTestResults.attendance.data?.length || 0}
                Data: {JSON.stringify(rpcTestResults.attendance.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}