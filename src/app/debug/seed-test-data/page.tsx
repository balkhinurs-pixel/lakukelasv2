"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';

export default function SeedTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const createTestData = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/debug/seed-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to create test data: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"p-8 space-y-6\">
      <div className=\"flex items-center gap-4\">
        <div className=\"p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg\">
          <Database className=\"h-6 w-6\" />
        </div>
        <div>
          <h1 className=\"text-2xl font-bold font-headline text-slate-900\">
            Seed Test Data - Student Ledger
          </h1>
          <p className=\"text-slate-600 mt-1\">
            Create sample grades and attendance data to test the student ledger synchronization.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Data</CardTitle>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <p className=\"text-sm text-muted-foreground\">
            This will create sample attendance and grade records for students in your homeroom class. 
            This data will help test the student ledger functionality and show how teacher inputs sync with the ledger.
          </p>
          
          <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-4\">
            <p className=\"text-sm text-yellow-800\">
              <strong>⚠️ Note:</strong> This is for testing purposes only. The created data is sample data 
              and should be used to understand how the system works.
            </p>
          </div>

          <Button 
            onClick={createTestData} 
            disabled={loading}
            className=\"w-full\"
          >
            {loading && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
            {loading ? 'Creating Test Data...' : 'Create Test Data'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center gap-2\">
              {results.success ? (
                <CheckCircle className=\"h-5 w-5 text-green-600\" />
              ) : (
                <XCircle className=\"h-5 w-5 text-red-600\" />
              )}
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.success ? (
              <div className=\"space-y-4\">
                <div className=\"grid gap-4 md:grid-cols-2\">
                  <div className=\"space-y-2\">
                    <h4 className=\"font-medium flex items-center gap-2\">
                      <Badge variant=\"secondary\">Grades</Badge>
                      Created
                    </h4>
                    <div className=\"text-sm text-muted-foreground\">
                      {results.data?.gradesCreated || 0} grade records created
                    </div>
                  </div>
                  
                  <div className=\"space-y-2\">
                    <h4 className=\"font-medium flex items-center gap-2\">
                      <Badge variant=\"secondary\">Attendance</Badge>
                      Created
                    </h4>
                    <div className=\"text-sm text-muted-foreground\">
                      {results.data?.attendanceCreated || 0} attendance records created
                    </div>
                  </div>
                </div>
                
                <div className=\"bg-green-50 border border-green-200 rounded-lg p-4\">
                  <p className=\"text-sm text-green-800\">
                    ✅ Test data created successfully! You can now visit the <strong>Catatan & Leger Siswa</strong> 
                    page to see how the data appears in the student ledger.
                  </p>
                </div>
                
                {results.details && (
                  <details className=\"mt-4\">
                    <summary className=\"cursor-pointer text-sm font-medium mb-2\">View Details</summary>
                    <pre className=\"text-xs bg-gray-100 p-3 rounded overflow-auto\">
                      {JSON.stringify(results.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className=\"space-y-4\">
                <div className=\"bg-red-50 border border-red-200 rounded-lg p-4\">
                  <p className=\"text-sm text-red-800\">
                    ❌ <strong>Error:</strong> {results.error}
                  </p>
                </div>
                
                {results.details && (
                  <details>
                    <summary className=\"cursor-pointer text-sm font-medium mb-2\">Error Details</summary>
                    <pre className=\"text-xs bg-gray-100 p-3 rounded overflow-auto\">
                      {JSON.stringify(results.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}"