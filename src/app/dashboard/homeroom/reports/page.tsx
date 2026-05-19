
import { getHomeroomClassDetails, getHomeroomMonthlyAttendance, getAdminProfile, getUserProfile } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import HomeroomReportsClient from "./reports-client";
import { getIndonesianTime } from "@/lib/timezone";

export default async function HomeroomReportsPage(props: { 
  searchParams: Promise<{ month?: string, year?: string }> 
}) {
  const searchParams = await props.searchParams;
  const homeroomData = await getHomeroomClassDetails();

  if (!homeroomData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Anda Bukan Wali Kelas</AlertTitle>
          <AlertDescription>
            Fitur ini hanya tersedia untuk guru yang ditugaskan sebagai wali kelas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const now = getIndonesianTime();
  const currentMonth = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const currentYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

  const [monthlyAttendanceData, schoolProfile, teacherProfile] = await Promise.all([
    getHomeroomMonthlyAttendance(currentMonth, currentYear),
    getAdminProfile(),
    getUserProfile()
  ]);

  if (!monthlyAttendanceData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Data</AlertTitle>
          <AlertDescription>Terjadi kesalahan saat memproses data presensi bulanan.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <HomeroomReportsClient 
      initialData={monthlyAttendanceData}
      schoolProfile={schoolProfile}
      teacherProfile={teacherProfile}
    />
  );
}
