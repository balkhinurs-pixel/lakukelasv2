

'use server';

import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears, getAdminProfile } from "@/lib/data";
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

    // Fetch all data in parallel, including the admin profile for school data
    const [classes, subjects, profile, { schoolYears, activeSchoolYearId: defaultActiveSchoolYearId }, adminProfile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getSchoolYears(),
        getAdminProfile() // Explicitly fetch admin profile
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
                            <Link href="/admin/roster/school-year">Buka Pengaturan Tahun Ajaran (Admin)</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const reportsData = await getReportsData({
        schoolYearId: schoolYearToFetch,
        month,
        classId,
        subjectId,
    });
    
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
        schoolProfile={adminProfile} // Pass admin profile to the client component
    />;
}
