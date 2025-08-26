

import {
  getHomeroomClassDetails,
  getStudentLedgerData,
} from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import StudentLedgerClientPage from "./student-ledger-client";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLedgerPage({ searchParams }: { searchParams: { student_id?: string }}) {
  const homeroomData = await getHomeroomClassDetails();

  if (!homeroomData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Anda Bukan Wali Kelas</AlertTitle>
          <AlertDescription>
            Anda tidak ditugaskan sebagai wali kelas untuk kelas manapun. Fitur
            ini hanya tersedia untuk wali kelas. Hubungi administrator jika Anda
            merasa ini adalah kesalahan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { homeroomClass, studentsInClass, subjects } = homeroomData;

  if (studentsInClass.length === 0) {
     return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-headline">Catatan & Leger Siswa - Kelas {homeroomClass.name}</h1>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Kelas Anda Belum Memiliki Siswa</AlertTitle>
                <AlertDescription>
                    Tidak ada siswa yang terdaftar di kelas perwalian Anda. Fitur ini akan aktif setelah data siswa ditambahkan oleh administrator.
                </AlertDescription>
            </Alert>
        </div>
    )
  }
  
  const studentIdToShow = searchParams.student_id || studentsInClass[0].id;
  const initialLedgerData = await getStudentLedgerData(studentIdToShow);

  return (
    <StudentLedgerClientPage
      key={studentIdToShow} // Use key to force re-mount on student change
      homeroomClass={homeroomClass}
      studentsInClass={studentsInClass}
      subjects={subjects}
      initialLedgerData={initialLedgerData}
      initialStudentId={studentIdToShow}
    />
  );
}

