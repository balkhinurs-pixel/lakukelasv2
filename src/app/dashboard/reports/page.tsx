

import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ReportsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const classId = searchParams.class as string | undefined;
    const subjectId = searchParams.subject as string | undefined;
    const month = searchParams.month ? Number(searchParams.month) : undefined;
    const schoolYearIdFromParams = searchParams.schoolYear as string | undefined;

    const [classes, subjects, profile, { schoolYears, activeSchoolYearId: defaultActiveSchoolYearId }] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getSchoolYears()
    ]);
    
    if (!profile) {
         return (
            <div className="p-4 text-center text-muted-foreground">
                Tidak dapat memuat profil Anda. Silakan coba lagi.
            </div>
        )
    }

    const schoolYearToFetch = schoolYearIdFromParams || defaultActiveSchoolYearId;

    if (!schoolYearToFetch) {
         return (
            <div className="space-y-6 max-w-xl mx-auto">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                    <p className="text-muted-foreground">Analisis komprehensif tentang kehadiran dan nilai siswa.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tahun Ajaran Belum Diatur</AlertTitle>
                    <AlertDescription>
                        Anda harus mengatur tahun ajaran aktif terlebih dahulu untuk dapat melihat laporan.
                        <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold">
                            <Link href="/dashboard/roster/school-year">Buka Pengaturan Tahun Ajaran</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    // Pass the filters to the data fetching function
    const reportsData = await getReportsData({
        schoolYearId: schoolYearToFetch,
        month,
        classId,
        subjectId,
    });
    
    // The data fetching function is now robust and will not return null
    // It will return an object with empty arrays if no data is found.
    // So the null check below is good practice but might not be strictly necessary anymore.
    if (!reportsData) {
        return (
            <div className="space-y-6 max-w-xl mx-auto">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                    <p className="text-muted-foreground">Analisis komprehensif tentang kehadiran dan nilai siswa.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat Data Laporan</AlertTitle>
                    <AlertDescription>
                        Terjadi kesalahan saat mengambil data dari database. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return <ReportsPageComponent 
        classes={classes} 
        subjects={subjects} 
        schoolYears={schoolYears}
        reportsData={reportsData}
        profile={profile}
    />;
}
