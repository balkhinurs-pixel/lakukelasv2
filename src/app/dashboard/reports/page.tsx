import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";

export default async function ReportsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const month = searchParams.month ? Number(searchParams.month) : undefined;
    const schoolYearId = searchParams.schoolYear as string | undefined;

    const [classes, subjects, profile, { schoolYears }] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getSchoolYears()
    ]);
    
    // Initial data load for the active school year
    const reportsData = await getReportsData(schoolYearId || profile?.active_school_year_id, month);

    if (!reportsData || !profile) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Tidak dapat memuat data laporan. Pastikan Anda sudah login dan profil Anda ada.
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
