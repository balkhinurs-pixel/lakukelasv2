import { getHomeroomClassDetails, getReportsData } from "@/lib/data";
import { getActiveSchoolYearId } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import HomeroomReportsClient from "./reports-client";

export default async function HomeroomReportsPage() {
  const homeroomData = await getHomeroomClassDetails();

  if (!homeroomData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Anda Bukan Wali Kelas</AlertTitle>
          <AlertDescription>
            Anda tidak ditugaskan sebagai wali kelas untuk kelas manapun. Fitur ini hanya tersedia untuk wali kelas. Hubungi administrator jika Anda merasa ini adalah kesalahan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { homeroomClass, studentsInClass, subjects } = homeroomData;

  if (studentsInClass.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Laporan Kelas - {homeroomClass.name}</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Kelas Anda Belum Memiliki Siswa</AlertTitle>
          <AlertDescription>
            Tidak ada siswa yang terdaftar di kelas perwalian Anda. Fitur laporan akan aktif setelah data siswa ditambahkan oleh administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get active school year for reports data
  const activeSchoolYearId = await getActiveSchoolYearId();
  
  if (!activeSchoolYearId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Laporan Kelas - {homeroomClass.name}</h1>
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Tahun Ajaran Belum Diatur</AlertTitle>
          <AlertDescription>
            Tahun ajaran aktif belum diatur. Hubungi administrator untuk mengatur tahun ajaran aktif.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch reports data for the homeroom class
  const reportsData = await getReportsData({
    schoolYearId: activeSchoolYearId,
    classId: homeroomClass.id
  });

  if (!reportsData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Laporan Kelas - {homeroomClass.name}</h1>
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Data</AlertTitle>
          <AlertDescription>
            Terjadi kesalahan saat memuat data laporan. Silakan coba lagi nanti.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <HomeroomReportsClient 
      homeroomData={homeroomData}
      reportsData={reportsData}
    />
  );
}
