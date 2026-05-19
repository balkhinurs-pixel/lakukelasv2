
'use server';

import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears, getAdminProfile } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function ReportsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    
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

    if (!defaultActiveSchoolYearId) {
         return (
            <div className="space-y-6 max-w-xl mx-auto p-4">
                 <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Laporan Akademik</h1>
                    <p className="text-muted-foreground">Pusat dokumentasi dan pencetakan laporan.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tahun Ajaran Belum Diatur</AlertTitle>
                    <AlertDescription>
                        Administrator harus mengatur tahun ajaran aktif terlebih dahulu.
                        <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold">
                            <Link href="/admin/roster/school-year">Buka Pengaturan Tahun Ajaran (Admin)</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    // Penanganan Redirect jika filter belum lengkap (Defaulting)
    const classId = searchParams.class as string | undefined;
    const subjectId = searchParams.subject as string | undefined;

    const defaultClassId = classId || (classes.length > 0 ? classes[0].id : undefined);
    const defaultSubjectId = subjectId || (subjects.length > 0 ? subjects[0].id : undefined);

    // Jika param tidak ada di URL, redirect dengan param default
    if (!classId || !subjectId) {
        const query = new URLSearchParams();
        if (defaultClassId) query.set('class', defaultClassId);
        if (defaultSubjectId) query.set('subject', defaultSubjectId);
        redirect(`/dashboard/reports?${query.toString()}`);
    }

    // Ambil data laporan berdasarkan filter yang sudah valid
    const reportsData = await getReportsData({
        schoolYearId: defaultActiveSchoolYearId,
        classId: defaultClassId,
        subjectId: defaultSubjectId,
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
