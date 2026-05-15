'use server';

import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears, getAdminProfile } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getIndonesianTime } from "@/lib/timezone";

export default async function ReportsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const classId = searchParams.class as string | undefined;
    const subjectId = searchParams.subject as string | undefined;
    
    // Tentukan bulan default (bulan saat ini dalam zona waktu Indonesia)
    const nowIndo = getIndonesianTime();
    const currentMonthDefault = nowIndo.getMonth() + 1;
    const month = searchParams.month ? Number(searchParams.month) : currentMonthDefault;

    const schoolYearIdFromParams = searchParams.schoolYear as string | undefined;

    // Ambil data dasar
    const [classes, subjects, profile, { schoolYears, activeSchoolYearId: defaultActiveSchoolYearId }, adminProfile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getSchoolYears(),
        getAdminProfile()
    ]);
    
    if (!profile) {
         return (
            <div className="p-4 text-center text-muted-foreground">
                Tidak dapat memuat profil Anda. Silakan coba lagi.
            </div>
        )
    }

    // Gunakan Tahun Ajaran Aktif sebagai default wajib jika tidak ada di params
    const schoolYearToFetch = schoolYearIdFromParams || defaultActiveSchoolYearId;

    if (!schoolYearToFetch) {
         return (
            <div className="space-y-6 max-w-xl mx-auto p-4">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                    <p className="text-muted-foreground">Pusat dokumentasi dan pencetakan laporan.</p>
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

    // Ambil data laporan berdasarkan filter
    const reportsData = await getReportsData({
        schoolYearId: schoolYearToFetch,
        month: month,
        classId,
        subjectId,
    });
    
    if (!reportsData) {
        return (
            <div className="space-y-6 max-w-xl mx-auto p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat Data</AlertTitle>
                    <AlertDescription>
                        Terjadi kesalahan saat mengambil data dari database.
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
        schoolProfile={adminProfile}
    />;
}
